/**
 * EA Entity Management Router
 * 
 * Handles CRUD operations for EA meta-model entities with built-in validation:
 * - Automatic normalizedName generation
 * - Relationship type matrix validation
 * - Entity type validation
 * - Duplicate detection
 */

import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { 
  businessCapabilities,
  applications,
  businessProcesses,
  dataEntities,
  requirements,
  eaRelationships,
} from "../drizzle/schema";
import { 
  normalizeName,
  validateRelationshipMatrix,
  validateEntityType,
  validateDifferentEntities,
  DuplicateNameError,
  RelationshipMatrixError,
  InvalidEntityTypeError,
  type EntityType,
  type RelationshipType,
  getTableNameFromEntityType,
} from "./validation";
import { eq, and, or, like, isNull } from "drizzle-orm";

/**
 * Base schema for entity creation
 */
const baseEntitySchema = z.object({
  projectId: z.number(),
  name: z.string().min(1, "Name is required"),
  description: z.string().nullable().optional(),
});

/**
 * Business Capability schema (level is required)
 */
const businessCapabilitySchema = baseEntitySchema.extend({
  level: z.number().min(1).max(5), // L1 to L5
  parentId: z.number().nullable().optional(),
  maturityLevel: z.string().nullable().optional(),
  ownerStakeholderId: z.number().nullable().optional(),
});

/**
 * Application schema (lifecycle is required with default)
 */
const applicationSchema = baseEntitySchema.extend({
  vendor: z.string().nullable().optional(),
  version: z.string().nullable().optional(),
  lifecycle: z.enum(["plan", "build", "run", "retire"]).optional(),
  category: z.string().nullable().optional(),
  criticality: z.enum(["low", "medium", "high", "critical"]).optional(),
  ownerStakeholderId: z.number().nullable().optional(),
});

/**
 * Business Process schema
 */
const businessProcessSchema = baseEntitySchema.extend({
  processType: z.string().nullable().optional(),
  ownerStakeholderId: z.number().nullable().optional(),
  automationLevel: z.string().nullable().optional(),
});

/**
 * Data Entity schema (sensitivity has default)
 */
const dataEntitySchema = baseEntitySchema.extend({
  classification: z.string().nullable().optional(),
  sensitivity: z.enum(["public", "internal", "confidential", "restricted"]).optional(),
  ownerStakeholderId: z.number().nullable().optional(),
});

/**
 * Requirement schema
 */
const requirementSchema = baseEntitySchema.extend({
  type: z.string().min(1, "Type is required"),
  priority: z.enum(["low", "medium", "high", "critical"]).optional(),
  status: z.enum(["proposed", "approved", "implemented", "verified"]).optional(),
  source: z.string().nullable().optional(),
  ownerStakeholderId: z.number().nullable().optional(),
});

/**
 * Relationship schema
 */
const relationshipSchema = z.object({
  projectId: z.number(),
  sourceEntityType: z.string(),
  sourceEntityId: z.number(),
  targetEntityType: z.string(),
  targetEntityId: z.number(),
  relationshipType: z.string(),
  description: z.string().nullable().optional(),
});

/**
 * Implemented entity types (subset of EntityType)
 */
type ImplementedEntityType = 'businessCapability' | 'application' | 'businessProcess' | 'dataEntity' | 'requirement';

/**
 * Helper function to get table mapping
 */
function getTableMapping() {
  return {
    businessCapability: businessCapabilities,
    application: applications,
    businessProcess: businessProcesses,
    dataEntity: dataEntities,
    requirement: requirements,
  };
}

/**
 * Helper function to check for duplicate normalized names
 */
async function checkDuplicateName(
  projectId: number,
  normalizedName: string,
  entityType: ImplementedEntityType,
  excludeId?: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

  const table = {
    businessCapability: businessCapabilities,
    application: applications,
    businessProcess: businessProcesses,
    dataEntity: dataEntities,
    requirement: requirements,
  }[entityType];

  if (!table) {
    throw new TRPCError({ code: "BAD_REQUEST", message: `Unknown entity type: ${entityType}` });
  }

  const conditions = [
    eq(table.projectId, projectId),
    eq(table.normalizedName, normalizedName),
  ];

  const existing = await db.select().from(table).where(and(...conditions)).limit(1);

  if (existing.length > 0 && (!excludeId || existing[0].id !== excludeId)) {
    throw new DuplicateNameError(normalizedName, projectId, entityType);
  }
}

/**
 * EA Entity Router
 */
export const eaEntityRouter = router({
  // ============================================================================
  // List and Search Queries
  // ============================================================================

  listEntities: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      entityType: z.enum(['businessCapability', 'application', 'businessProcess', 'dataEntity', 'requirement']),
      search: z.string().optional(),
      limit: z.number().min(1).max(100).optional().default(50),
      offset: z.number().min(0).optional().default(0),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const table: any = {
        businessCapability: businessCapabilities,
        application: applications,
        businessProcess: businessProcesses,
        dataEntity: dataEntities,
        requirement: requirements,
      }[input.entityType];

      const conditions: any[] = [
        eq(table.projectId, input.projectId),
        isNull(table.deletedAt)
      ];

      if (input.search) {
        const searchPattern = `%${input.search}%`;
        conditions.push(
          or(
            like(table.name, searchPattern),
            like(table.description, searchPattern)
          )
        );
      }

      const results = await db.select().from(table)
        .where(and(...conditions))
        .limit(input.limit)
        .offset(input.offset)
        .orderBy(table.name);

      return results;
    }),

  getEntity: protectedProcedure
    .input(z.object({
      entityType: z.enum(['businessCapability', 'application', 'businessProcess', 'dataEntity', 'requirement']),
      id: z.number(),
      projectId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const table: any = {
        businessCapability: businessCapabilities,
        application: applications,
        businessProcess: businessProcesses,
        dataEntity: dataEntities,
        requirement: requirements,
      }[input.entityType];

      const result = await db.select().from(table)
        .where(and(
          eq(table.id, input.id),
          eq(table.projectId, input.projectId),
          isNull(table.deletedAt)
        ))
        .limit(1);

      if (result.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Entity not found" });
      }

      return result[0];
    }),

  listRelationships: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      entityType: z.string().optional(),
      entityId: z.number().optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const conditions: any[] = [
        eq(eaRelationships.projectId, input.projectId),
        isNull(eaRelationships.deletedAt)
      ];

      if (input.entityType && input.entityId) {
        conditions.push(
          or(
            and(
              eq(eaRelationships.sourceEntityType, input.entityType),
              eq(eaRelationships.sourceEntityId, input.entityId)
            ),
            and(
              eq(eaRelationships.targetEntityType, input.entityType),
              eq(eaRelationships.targetEntityId, input.entityId)
            )
          )
        );
      }

      const results = await db.select().from(eaRelationships)
        .where(and(...conditions))
        .orderBy(eaRelationships.createdAt);

      return results;
    }),

  // ============================================================================
  // Business Capabilities
  // ============================================================================
  
  createBusinessCapability: protectedProcedure
    .input(businessCapabilitySchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const normalizedName = normalizeName(input.name);
      await checkDuplicateName(input.projectId, normalizedName, 'businessCapability');

      const result = await db.insert(businessCapabilities).values({
        ...input,
        normalizedName,
        createdBy: ctx.user.id,
      });

      return { id: Number(result[0].insertId), normalizedName };
    }),

  // ============================================================================
  // Applications
  // ============================================================================

  createApplication: protectedProcedure
    .input(applicationSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const normalizedName = normalizeName(input.name);
      await checkDuplicateName(input.projectId, normalizedName, 'application');

      const result = await db.insert(applications).values({
        ...input,
        normalizedName,
        createdBy: ctx.user.id,
      });

      return { id: Number(result[0].insertId), normalizedName };
    }),

  // ============================================================================
  // Business Processes
  // ============================================================================

  createBusinessProcess: protectedProcedure
    .input(businessProcessSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const normalizedName = normalizeName(input.name);
      await checkDuplicateName(input.projectId, normalizedName, 'businessProcess');

      const result = await db.insert(businessProcesses).values({
        ...input,
        normalizedName,
        createdBy: ctx.user.id,
      });

      return { id: Number(result[0].insertId), normalizedName };
    }),

  // ============================================================================
  // Data Entities
  // ============================================================================

  createDataEntity: protectedProcedure
    .input(dataEntitySchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const normalizedName = normalizeName(input.name);
      await checkDuplicateName(input.projectId, normalizedName, 'dataEntity');

      const result = await db.insert(dataEntities).values({
        ...input,
        normalizedName,
        createdBy: ctx.user.id,
      });

      return { id: Number(result[0].insertId), normalizedName };
    }),

  // ============================================================================
  // Requirements
  // ============================================================================

  createRequirement: protectedProcedure
    .input(requirementSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const normalizedName = normalizeName(input.name);
      await checkDuplicateName(input.projectId, normalizedName, 'requirement');

      const result = await db.insert(requirements).values({
        ...input,
        normalizedName,
        createdBy: ctx.user.id,
      });

      return { id: Number(result[0].insertId), normalizedName };
    }),

  // ============================================================================
  // Relationships
  // ============================================================================

  createRelationship: protectedProcedure
    .input(relationshipSchema)
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      try {
        // Validate entity types
        validateEntityType(input.sourceEntityType);
        validateEntityType(input.targetEntityType);

        // Validate different entities
        validateDifferentEntities(
          input.sourceEntityType as EntityType,
          input.sourceEntityId,
          input.targetEntityType as EntityType,
          input.targetEntityId
        );

        // Validate relationship matrix
        validateRelationshipMatrix(
          input.sourceEntityType as EntityType,
          input.targetEntityType as EntityType,
          input.relationshipType as RelationshipType
        );

        // Create relationship
        const result = await db.insert(eaRelationships).values({
          ...input,
          createdBy: ctx.user.id,
        });

        return { id: Number(result[0].insertId) };
      } catch (error) {
        if (error instanceof RelationshipMatrixError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        if (error instanceof InvalidEntityTypeError) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: error.message,
          });
        }
        throw error;
      }
    }),

  deleteRelationship: protectedProcedure
    .input(z.object({
      id: z.number(),
      projectId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Soft delete
      await db.update(eaRelationships)
        .set({ 
          deletedAt: new Date(),
          deletedBy: ctx.user.id,
        })
        .where(and(
          eq(eaRelationships.id, input.id),
          eq(eaRelationships.projectId, input.projectId)
        ));

      return { success: true };
    }),

  // ============================================================================
  // Entity Updates
  // ============================================================================

  updateEntity: protectedProcedure
    .input(z.object({
      entityType: z.enum(['businessCapability', 'application', 'businessProcess', 'dataEntity', 'requirement']),
      entityId: z.number(),
      projectId: z.number(),
      data: z.object({
        name: z.string().min(1).optional(),
        description: z.string().nullable().optional(),
        // Business Capability fields
        level: z.number().min(1).max(5).optional(),
        // Application fields
        lifecycle: z.string().optional(),
        // Data Entity fields
        sensitivity: z.string().optional(),
        // Requirement fields
        type: z.string().optional(),
        priority: z.string().optional(),
      }),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const table = getTableMapping()[input.entityType];
      const updateData: any = {
        ...input.data,
        updatedAt: new Date(),
      };

      // Generate normalized name if name is being updated
      if (input.data.name) {
        const normalizedName = normalizeName(input.data.name);
        // Check for duplicates (excluding current entity)
        const existing = await db.select()
          .from(table)
          .where(and(
            eq(table.projectId, input.projectId),
            eq(table.normalizedName, normalizedName),
            isNull(table.deletedAt)
          ))
          .limit(1);
        
        if (existing.length > 0 && existing[0].id !== input.entityId) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: `An entity with name "${input.data.name}" already exists in this project`,
          });
        }
        updateData.normalizedName = normalizedName;
      }

      await db.update(table)
        .set(updateData)
        .where(and(
          eq(table.id, input.entityId),
          eq(table.projectId, input.projectId)
        ));

      return { success: true };
    }),

  deleteEntity: protectedProcedure
    .input(z.object({
      entityType: z.enum(['businessCapability', 'application', 'businessProcess', 'dataEntity', 'requirement']),
      entityId: z.number(),
      projectId: z.number(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const table = getTableMapping()[input.entityType];

      // Soft delete the entity
      await db.update(table)
        .set({ 
          deletedAt: new Date(),
          deletedBy: ctx.user.id,
        })
        .where(and(
          eq(table.id, input.entityId),
          eq(table.projectId, input.projectId)
        ));

      // Also soft delete all relationships involving this entity
      await db.update(eaRelationships)
        .set({ 
          deletedAt: new Date(),
          deletedBy: ctx.user.id,
        })
        .where(and(
          eq(eaRelationships.projectId, input.projectId),
          or(
            and(
              eq(eaRelationships.sourceEntityType, input.entityType),
              eq(eaRelationships.sourceEntityId, input.entityId)
            ),
            and(
              eq(eaRelationships.targetEntityType, input.entityType),
              eq(eaRelationships.targetEntityId, input.entityId)
            )
          )
        ));

      return { success: true };
    }),

  // ============================================================================
  // Bulk Import
  // ============================================================================

  bulkImport: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      entityType: z.enum(['businessCapability', 'application', 'businessProcess', 'dataEntity', 'requirement']),
      entities: z.array(z.object({
        name: z.string().min(1),
        description: z.string().nullable().optional(),
        level: z.number().min(1).max(5).optional(), // Business Capability
        lifecycle: z.string().optional(), // Application
        sensitivity: z.string().optional(), // Data Entity
        type: z.string().optional(), // Requirement
        priority: z.string().optional(), // Requirement
      })),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      const table = getTableMapping()[input.entityType];
      const results = {
        success: 0,
        failed: 0,
        errors: [] as Array<{ row: number; name: string; error: string }>,
      };

      // Process each entity
      for (let i = 0; i < input.entities.length; i++) {
        const entity = input.entities[i];
        try {
          const normalizedName = normalizeName(entity.name);

          // Check for duplicates
          const existing = await db.select()
            .from(table)
            .where(and(
              eq(table.projectId, input.projectId),
              eq(table.normalizedName, normalizedName),
              isNull(table.deletedAt)
            ))
            .limit(1);

          if (existing.length > 0) {
            results.failed++;
            results.errors.push({
              row: i + 1,
              name: entity.name,
              error: `Duplicate name: "${entity.name}" already exists`,
            });
            continue;
          }

          // Prepare entity data
          const entityData: any = {
            projectId: input.projectId,
            name: entity.name,
            normalizedName,
            description: entity.description || null,
            createdBy: ctx.user.id,
          };

          // Add entity-specific fields
          if (input.entityType === 'businessCapability') {
            if (!entity.level) {
              results.failed++;
              results.errors.push({
                row: i + 1,
                name: entity.name,
                error: 'Missing required field: level',
              });
              continue;
            }
            entityData.level = entity.level;
          }
          if (input.entityType === 'application' && entity.lifecycle) {
            entityData.lifecycle = entity.lifecycle;
          }
          if (input.entityType === 'dataEntity' && entity.sensitivity) {
            entityData.sensitivity = entity.sensitivity;
          }
          if (input.entityType === 'requirement') {
            if (!entity.type) {
              results.failed++;
              results.errors.push({
                row: i + 1,
                name: entity.name,
                error: 'Missing required field: type',
              });
              continue;
            }
            entityData.type = entity.type;
            if (entity.priority) entityData.priority = entity.priority;
          }

          // Insert entity
          await db.insert(table).values(entityData);
          results.success++;
        } catch (error: any) {
          results.failed++;
          results.errors.push({
            row: i + 1,
            name: entity.name,
            error: error.message || 'Unknown error',
          });
        }
      }

      return results;
    }),

  /**
   * Get audit history for a project
   * Returns chronological list of all entity and relationship changes
   */
  getAuditHistory: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      entityType: z.enum(['businessCapability', 'application', 'businessProcess', 'dataEntity', 'requirement', 'all']).optional(),
      actionType: z.enum(['create', 'update', 'delete', 'all']).optional(),
      searchTerm: z.string().optional(),
      limit: z.number().min(1).max(100).default(50),
      offset: z.number().min(0).default(0),
    }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Database not available' });

      const events: any[] = [];

      // Helper to add entity events
      const addEntityEvents = async (table: any, entityType: string) => {
        if (input.entityType && input.entityType !== 'all' && input.entityType !== entityType) return;

        const conditions = [eq(table.projectId, input.projectId)];
        if (input.searchTerm) {
          conditions.push(like(table.name, `%${input.searchTerm}%`));
        }

        const entities = await db.select().from(table).where(and(...conditions));

        entities.forEach((entity: any) => {
          // Creation event
          if (!input.actionType || input.actionType === 'all' || input.actionType === 'create') {
            events.push({
              id: `${entityType}-${entity.id}-create`,
              type: 'entity',
              action: 'create',
              entityType,
              entityId: entity.id,
              entityName: entity.name,
              timestamp: entity.createdAt,
              user: entity.createdBy || 'System',
              details: { name: entity.name, description: entity.description },
            });
          }

          // Update event (if updatedAt differs from createdAt)
          if (entity.updatedAt && entity.updatedAt.getTime() !== entity.createdAt.getTime()) {
            if (!input.actionType || input.actionType === 'all' || input.actionType === 'update') {
              events.push({
                id: `${entityType}-${entity.id}-update`,
                type: 'entity',
                action: 'update',
                entityType,
                entityId: entity.id,
                entityName: entity.name,
                timestamp: entity.updatedAt,
                user: entity.updatedBy || entity.createdBy || 'System',
                details: { name: entity.name },
              });
            }
          }

          // Deletion event
          if (entity.deletedAt) {
            if (!input.actionType || input.actionType === 'all' || input.actionType === 'delete') {
              events.push({
                id: `${entityType}-${entity.id}-delete`,
                type: 'entity',
                action: 'delete',
                entityType,
                entityId: entity.id,
                entityName: entity.name,
                timestamp: entity.deletedAt,
                user: entity.deletedBy || 'System',
                details: { name: entity.name },
              });
            }
          }
        });
      };

      // Add events from all entity tables
      await addEntityEvents(businessCapabilities, 'businessCapability');
      await addEntityEvents(applications, 'application');
      await addEntityEvents(businessProcesses, 'businessProcess');
      await addEntityEvents(dataEntities, 'dataEntity');
      await addEntityEvents(requirements, 'requirement');

      // Add relationship events
      if (!input.entityType || input.entityType === 'all') {
        const relationships = await db.select().from(eaRelationships)
          .where(eq(eaRelationships.projectId, input.projectId));

        relationships.forEach((rel: any) => {
          // Creation event
          if (!input.actionType || input.actionType === 'all' || input.actionType === 'create') {
            events.push({
              id: `relationship-${rel.id}-create`,
              type: 'relationship',
              action: 'create',
              relationshipType: rel.relationshipType,
              sourceEntityType: rel.sourceEntityType,
              sourceEntityId: rel.sourceEntityId,
              targetEntityType: rel.targetEntityType,
              targetEntityId: rel.targetEntityId,
              timestamp: rel.createdAt,
              user: rel.createdBy || 'System',
              details: { relationshipType: rel.relationshipType },
            });
          }

          // Deletion event
          if (rel.deletedAt) {
            if (!input.actionType || input.actionType === 'all' || input.actionType === 'delete') {
              events.push({
                id: `relationship-${rel.id}-delete`,
                type: 'relationship',
                action: 'delete',
                relationshipType: rel.relationshipType,
                sourceEntityType: rel.sourceEntityType,
                sourceEntityId: rel.sourceEntityId,
                targetEntityType: rel.targetEntityType,
                targetEntityId: rel.targetEntityId,
                timestamp: rel.deletedAt,
                user: rel.deletedBy || 'System',
                details: { relationshipType: rel.relationshipType },
              });
            }
          }
        });
      }

      // Sort by timestamp descending (most recent first)
      events.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

      // Apply pagination
      const paginatedEvents = events.slice(input.offset, input.offset + input.limit);

      return {
        events: paginatedEvents,
        total: events.length,
        hasMore: events.length > input.offset + input.limit,
      };
    }),
});
