import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  businessCapabilities,
  applications,
  businessProcesses,
  dataEntities,
  requirements,
  eaRelationships,
} from "../../drizzle/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// Entity type to table mapping
const entityTables = {
  businessCapability: businessCapabilities,
  application: applications,
  businessProcess: businessProcesses,
  dataEntity: dataEntities,
  requirement: requirements,
} as const;

type EntityType = keyof typeof entityTables;

export const bulkOperationsRouter = router({
  /**
   * Bulk delete entities (soft delete)
   */
  bulkDelete: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        entityType: z.enum([
          "businessCapability",
          "application",
          "businessProcess",
          "dataEntity",
          "requirement",
        ]),
        entityIds: z.array(z.number()).min(1).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { projectId, entityType, entityIds } = input;
      const table = entityTables[entityType];

      try {
        // Soft delete entities
        await db
          .update(table)
          .set({ deletedAt: new Date() })
          .where(and(eq(table.projectId, projectId), inArray(table.id, entityIds)));

        // Soft delete associated relationships
        await db
          .update(eaRelationships)
          .set({ deletedAt: new Date() })
          .where(
            and(
              eq(eaRelationships.projectId, projectId),
              sql`(${eaRelationships.sourceEntityType} = ${entityType} AND ${eaRelationships.sourceEntityId} IN (${sql.join(entityIds, sql`, `)}))
                  OR (${eaRelationships.targetEntityType} = ${entityType} AND ${eaRelationships.targetEntityId} IN (${sql.join(entityIds, sql`, `)}))`
            )
          );

        return {
          success: true,
          deletedCount: entityIds.length,
        };
      } catch (error) {
        console.error("[BulkOperations] Delete failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete entities",
        });
      }
    }),

  /**
   * Bulk update common entity fields
   */
  bulkUpdate: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        entityType: z.enum([
          "businessCapability",
          "application",
          "businessProcess",
          "dataEntity",
          "requirement",
        ]),
        entityIds: z.array(z.number()).min(1).max(100),
        updates: z.object({
          // Business Capability fields
          maturityLevel: z.enum(["initial", "developing", "defined", "managed", "optimizing"]).optional(),
          // Application fields
          lifecycle: z.enum(["plan", "develop", "active", "retire", "retired"]).optional(),
          // Data Entity fields
          sensitivity: z.enum(["public", "internal", "confidential", "restricted"]).optional(),
          // Requirement fields
          priority: z.enum(["low", "medium", "high", "critical"]).optional(),
          requirementType: z.enum(["functional", "non_functional", "constraint", "assumption"]).optional(),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { projectId, entityType, entityIds, updates } = input;
      const table = entityTables[entityType];

      // Filter updates to only include fields relevant to this entity type
      const relevantUpdates: Record<string, any> = {};
      
      if (entityType === "businessCapability" && updates.maturityLevel) {
        relevantUpdates.maturityLevel = updates.maturityLevel;
      }
      if (entityType === "application" && updates.lifecycle) {
        relevantUpdates.lifecycle = updates.lifecycle;
      }
      if (entityType === "dataEntity" && updates.sensitivity) {
        relevantUpdates.sensitivity = updates.sensitivity;
      }
      if (entityType === "requirement") {
        if (updates.priority) relevantUpdates.priority = updates.priority;
        if (updates.requirementType) relevantUpdates.requirementType = updates.requirementType;
      }

      if (Object.keys(relevantUpdates).length === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No valid updates provided for this entity type",
        });
      }

      try {
        await db
          .update(table)
          .set({ ...relevantUpdates, updatedAt: new Date() })
          .where(and(eq(table.projectId, projectId), inArray(table.id, entityIds)));

        return {
          success: true,
          updatedCount: entityIds.length,
          updates: relevantUpdates,
        };
      } catch (error) {
        console.error("[BulkOperations] Update failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update entities",
        });
      }
    }),

  /**
   * Bulk create relationships (same type, multiple targets)
   */
  bulkCreateRelationships: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        sourceEntityType: z.enum([
          "businessCapability",
          "application",
          "businessProcess",
          "dataEntity",
          "requirement",
        ]),
        sourceEntityId: z.number(),
        targetEntityType: z.enum([
          "businessCapability",
          "application",
          "businessProcess",
          "dataEntity",
          "requirement",
        ]),
        targetEntityIds: z.array(z.number()).min(1).max(50),
        relationshipType: z.string(),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const {
        projectId,
        sourceEntityType,
        sourceEntityId,
        targetEntityType,
        targetEntityIds,
        relationshipType,
        description,
      } = input;

      try {
        const relationships = targetEntityIds.map((targetId) => ({
          projectId,
          sourceEntityType,
          sourceEntityId,
          targetEntityType,
          targetEntityId: targetId,
          relationshipType,
          description: description || null,
          createdAt: new Date(),
          updatedAt: new Date(),
        }));

        await db.insert(eaRelationships).values(relationships);

        return {
          success: true,
          createdCount: relationships.length,
        };
      } catch (error) {
        console.error("[BulkOperations] Relationship creation failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to create relationships",
        });
      }
    }),

  /**
   * Bulk delete relationships
   */
  bulkDeleteRelationships: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        relationshipIds: z.array(z.number()).min(1).max(100),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { projectId, relationshipIds } = input;

      try {
        await db
          .update(eaRelationships)
          .set({ deletedAt: new Date() })
          .where(and(eq(eaRelationships.projectId, projectId), inArray(eaRelationships.id, relationshipIds)));

        return {
          success: true,
          deletedCount: relationshipIds.length,
        };
      } catch (error) {
        console.error("[BulkOperations] Relationship deletion failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete relationships",
        });
      }
    }),

  /**
   * Export selected entities to CSV
   */
  exportToCSV: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        entityType: z.enum([
          "businessCapability",
          "application",
          "businessProcess",
          "dataEntity",
          "requirement",
        ]),
        entityIds: z.array(z.number()).min(1).max(1000),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const { projectId, entityType, entityIds } = input;
      const table = entityTables[entityType];

      try {
        const entities = await db
          .select()
          .from(table)
          .where(and(eq(table.projectId, projectId), inArray(table.id, entityIds)));

        return {
          success: true,
          entities,
          count: entities.length,
        };
      } catch (error) {
        console.error("[BulkOperations] Export failed:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to export entities",
        });
      }
    }),
});
