import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { 
  businessCapabilities, 
  applications, 
  businessProcesses, 
  dataEntities, 
  requirements,
  eaRelationships,
  projects
} from "../../drizzle/schema";
import { eq, and, isNull, gte, sql, desc } from "drizzle-orm";

/**
 * Analytics Router
 * Provides aggregated statistics and metrics for EA repository analysis
 */
export const analyticsRouter = router({
  /**
   * Get comprehensive project analytics
   * Returns entity counts, relationship metrics, and activity statistics
   */
  getProjectAnalytics: protectedProcedure
    .input(z.object({
      projectId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { projectId } = input;

      // Get entity counts by type
      const [bcCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(businessCapabilities)
        .where(and(
          eq(businessCapabilities.projectId, projectId),
          isNull(businessCapabilities.deletedAt)
        ));

      const [appCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(applications)
        .where(and(
          eq(applications.projectId, projectId),
          isNull(applications.deletedAt)
        ));

      const [bpCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(businessProcesses)
        .where(and(
          eq(businessProcesses.projectId, projectId),
          isNull(businessProcesses.deletedAt)
        ));

      const [deCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(dataEntities)
        .where(and(
          eq(dataEntities.projectId, projectId),
          isNull(dataEntities.deletedAt)
        ));

      const [reqCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(requirements)
        .where(and(
          eq(requirements.projectId, projectId),
          isNull(requirements.deletedAt)
        ));

      const entityCounts = {
        businessCapability: Number(bcCount.count) || 0,
        application: Number(appCount.count) || 0,
        businessProcess: Number(bpCount.count) || 0,
        dataEntity: Number(deCount.count) || 0,
        requirement: Number(reqCount.count) || 0,
      };

      const totalEntities = Object.values(entityCounts).reduce((sum, count) => sum + count, 0);

      // Get relationship counts
      const [relCount] = await db
        .select({ count: sql<number>`count(*)` })
        .from(eaRelationships)
        .where(and(
          eq(eaRelationships.projectId, projectId),
          isNull(eaRelationships.deletedAt)
        ));

      const totalRelationships = Number(relCount.count) || 0;

      // Get relationship type distribution
      const relationshipTypeDistribution = await db
        .select({
          relationshipType: eaRelationships.relationshipType,
          count: sql<number>`count(*)`,
        })
        .from(eaRelationships)
        .where(and(
          eq(eaRelationships.projectId, projectId),
          isNull(eaRelationships.deletedAt)
        ))
        .groupBy(eaRelationships.relationshipType);

      // Calculate relationship density (average relationships per entity)
      const relationshipDensity = totalEntities > 0 
        ? (totalRelationships / totalEntities).toFixed(2)
        : "0.00";

      return {
        entityCounts,
        totalEntities,
        totalRelationships,
        relationshipDensity: parseFloat(relationshipDensity),
        relationshipTypeDistribution: relationshipTypeDistribution.map(r => ({
          type: r.relationshipType,
          count: Number(r.count),
        })),
      };
    }),

  /**
   * Get top connected entities
   * Returns entities with the most relationships
   */
  getTopConnectedEntities: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      limit: z.number().default(10),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { projectId, limit } = input;

      // Query to get relationship counts for each entity
      // We need to count both incoming and outgoing relationships
      const topEntities = await db.execute(sql`
        SELECT 
          entity_type,
          entity_id,
          entity_name,
          COUNT(*) as relationship_count
        FROM (
          SELECT 
            sourceEntityType as entity_type,
            sourceEntityId as entity_id,
            CASE sourceEntityType
              WHEN 'businessCapability' THEN (SELECT name FROM businessCapabilities WHERE id = sourceEntityId LIMIT 1)
              WHEN 'application' THEN (SELECT name FROM applications WHERE id = sourceEntityId LIMIT 1)
              WHEN 'businessProcess' THEN (SELECT name FROM businessProcesses WHERE id = sourceEntityId LIMIT 1)
              WHEN 'dataEntity' THEN (SELECT name FROM dataEntities WHERE id = sourceEntityId LIMIT 1)
              WHEN 'requirement' THEN (SELECT name FROM requirements WHERE id = sourceEntityId LIMIT 1)
            END as entity_name
          FROM eaRelationships
          WHERE projectId = ${projectId} AND deletedAt IS NULL
          
          UNION ALL
          
          SELECT 
            targetEntityType as entity_type,
            targetEntityId as entity_id,
            CASE targetEntityType
              WHEN 'businessCapability' THEN (SELECT name FROM businessCapabilities WHERE id = targetEntityId LIMIT 1)
              WHEN 'application' THEN (SELECT name FROM applications WHERE id = targetEntityId LIMIT 1)
              WHEN 'businessProcess' THEN (SELECT name FROM businessProcesses WHERE id = targetEntityId LIMIT 1)
              WHEN 'dataEntity' THEN (SELECT name FROM dataEntities WHERE id = targetEntityId LIMIT 1)
              WHEN 'requirement' THEN (SELECT name FROM requirements WHERE id = targetEntityId LIMIT 1)
            END as entity_name
          FROM eaRelationships
          WHERE projectId = ${projectId} AND deletedAt IS NULL
        ) as all_entities
        WHERE entity_name IS NOT NULL
        GROUP BY entity_type, entity_id, entity_name
        ORDER BY relationship_count DESC
        LIMIT ${limit}
      `);

      const rows = topEntities[0] as unknown as any[];
      return rows.map((row: any) => ({
        entityType: row.entity_type,
        entityId: row.entity_id,
        entityName: row.entity_name,
        relationshipCount: Number(row.relationship_count),
      }));
    }),

  /**
   * Get recent activity
   * Returns recent entity creations and updates
   */
  getRecentActivity: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      limit: z.number().default(20),
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { projectId, limit, days } = input;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Get recent entities from all tables
      const activities: Array<{
        entityType: string;
        entityId: number;
        entityName: string;
        action: string;
        timestamp: Date;
        userId: number;
      }> = [];

      // Business Capabilities
      const recentBc = await db
        .select({
          id: businessCapabilities.id,
          name: businessCapabilities.name,
          createdAt: businessCapabilities.createdAt,
          updatedAt: businessCapabilities.updatedAt,
          createdBy: businessCapabilities.createdBy,
          deletedAt: businessCapabilities.deletedAt,
        })
        .from(businessCapabilities)
        .where(and(
          eq(businessCapabilities.projectId, projectId),
          gte(businessCapabilities.createdAt, cutoffDate)
        ))
        .orderBy(desc(businessCapabilities.createdAt))
        .limit(limit);

      recentBc.forEach(bc => {
        activities.push({
          entityType: 'businessCapability',
          entityId: bc.id,
          entityName: bc.name,
          action: bc.deletedAt ? 'deleted' : 'created',
          timestamp: bc.createdAt,
          userId: bc.createdBy,
        });
      });

      // Applications
      const recentApp = await db
        .select({
          id: applications.id,
          name: applications.name,
          createdAt: applications.createdAt,
          updatedAt: applications.updatedAt,
          createdBy: applications.createdBy,
          deletedAt: applications.deletedAt,
        })
        .from(applications)
        .where(and(
          eq(applications.projectId, projectId),
          gte(applications.createdAt, cutoffDate)
        ))
        .orderBy(desc(applications.createdAt))
        .limit(limit);

      recentApp.forEach(app => {
        activities.push({
          entityType: 'application',
          entityId: app.id,
          entityName: app.name,
          action: app.deletedAt ? 'deleted' : 'created',
          timestamp: app.createdAt,
          userId: app.createdBy,
        });
      });

      // Business Processes
      const recentBp = await db
        .select({
          id: businessProcesses.id,
          name: businessProcesses.name,
          createdAt: businessProcesses.createdAt,
          updatedAt: businessProcesses.updatedAt,
          createdBy: businessProcesses.createdBy,
          deletedAt: businessProcesses.deletedAt,
        })
        .from(businessProcesses)
        .where(and(
          eq(businessProcesses.projectId, projectId),
          gte(businessProcesses.createdAt, cutoffDate)
        ))
        .orderBy(desc(businessProcesses.createdAt))
        .limit(limit);

      recentBp.forEach(bp => {
        activities.push({
          entityType: 'businessProcess',
          entityId: bp.id,
          entityName: bp.name,
          action: bp.deletedAt ? 'deleted' : 'created',
          timestamp: bp.createdAt,
          userId: bp.createdBy,
        });
      });

      // Data Entities
      const recentDe = await db
        .select({
          id: dataEntities.id,
          name: dataEntities.name,
          createdAt: dataEntities.createdAt,
          updatedAt: dataEntities.updatedAt,
          createdBy: dataEntities.createdBy,
          deletedAt: dataEntities.deletedAt,
        })
        .from(dataEntities)
        .where(and(
          eq(dataEntities.projectId, projectId),
          gte(dataEntities.createdAt, cutoffDate)
        ))
        .orderBy(desc(dataEntities.createdAt))
        .limit(limit);

      recentDe.forEach(de => {
        activities.push({
          entityType: 'dataEntity',
          entityId: de.id,
          entityName: de.name,
          action: de.deletedAt ? 'deleted' : 'created',
          timestamp: de.createdAt,
          userId: de.createdBy,
        });
      });

      // Requirements
      const recentReq = await db
        .select({
          id: requirements.id,
          name: requirements.name,
          createdAt: requirements.createdAt,
          updatedAt: requirements.updatedAt,
          createdBy: requirements.createdBy,
          deletedAt: requirements.deletedAt,
        })
        .from(requirements)
        .where(and(
          eq(requirements.projectId, projectId),
          gte(requirements.createdAt, cutoffDate)
        ))
        .orderBy(desc(requirements.createdAt))
        .limit(limit);

      recentReq.forEach(req => {
        activities.push({
          entityType: 'requirement',
          entityId: req.id,
          entityName: req.name,
          action: req.deletedAt ? 'deleted' : 'created',
          timestamp: req.createdAt,
          userId: req.createdBy,
        });
      });

      // Sort by timestamp and limit
      activities.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      return activities.slice(0, limit);
    }),

  /**
   * Get entity creation trends
   * Returns entity creation counts grouped by date
   */
  getEntityCreationTrends: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      days: z.number().default(30),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const { projectId, days } = input;
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);

      // Query to get daily entity creation counts
      const trends = await db.execute(sql`
        SELECT 
          DATE(created_at) as date,
          entity_type,
          COUNT(*) as count
        FROM (
          SELECT createdAt as created_at, 'businessCapability' as entity_type
          FROM businessCapabilities
          WHERE projectId = ${projectId} AND createdAt >= ${cutoffDate} AND deletedAt IS NULL
          
          UNION ALL
          
          SELECT createdAt as created_at, 'application' as entity_type
          FROM applications
          WHERE projectId = ${projectId} AND createdAt >= ${cutoffDate} AND deletedAt IS NULL
          
          UNION ALL
          
          SELECT createdAt as created_at, 'businessProcess' as entity_type
          FROM businessProcesses
          WHERE projectId = ${projectId} AND createdAt >= ${cutoffDate} AND deletedAt IS NULL
          
          UNION ALL
          
          SELECT createdAt as created_at, 'dataEntity' as entity_type
          FROM dataEntities
          WHERE projectId = ${projectId} AND createdAt >= ${cutoffDate} AND deletedAt IS NULL
          
          UNION ALL
          
          SELECT createdAt as created_at, 'requirement' as entity_type
          FROM requirements
          WHERE projectId = ${projectId} AND createdAt >= ${cutoffDate} AND deletedAt IS NULL
        ) as all_entities
        GROUP BY DATE(created_at), entity_type
        ORDER BY date DESC
      `);

      const rows = trends[0] as unknown as any[];
      return rows.map((row: any) => ({
        date: row.date,
        entityType: row.entity_type,
        count: Number(row.count),
      }));
    }),
});
