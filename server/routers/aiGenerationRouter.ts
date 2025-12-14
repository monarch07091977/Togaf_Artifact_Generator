import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { generateArtifacts, type ProjectContext, type GenerationResult } from "../aiGenerationService";
import { getDb } from "../db";
import {
  businessCapabilities,
  applications,
  dataEntities,
  businessProcesses,
  requirements,
  eaRelationships,
} from "../../drizzle/schema";

const projectContextSchema = z.object({
  name: z.string(),
  description: z.string(),
  industry: z.string().optional(),
  scope: z.string().optional(),
  businessDrivers: z.array(z.string()).optional(),
  businessGoals: z.array(z.string()).optional(),
  stakeholders: z.array(z.string()).optional(),
  constraints: z.array(z.string()).optional(),
  technicalPreferences: z.array(z.string()).optional(),
  detailLevel: z.enum(["high", "medium", "low"]).optional(),
  phasesToGenerate: z.array(z.string()).optional(),
});

export const aiGenerationRouter = router({
  /**
   * Generate TOGAF artifacts using AI
   */
  generateArtifacts: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        context: projectContextSchema,
      })
    )
    .mutation(async ({ input, ctx }) => {
      const result = await generateArtifacts(input.context);
      return result;
    }),

  /**
   * Commit generated artifacts to the database
   */
  commitGeneration: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        generationResult: z.object({
          businessCapabilities: z.array(
            z.object({
              name: z.string(),
              description: z.string(),
              normalizedName: z.string().optional(),
              maturityLevel: z.string().optional(),
            })
          ),
          applications: z.array(
            z.object({
              name: z.string(),
              description: z.string(),
              normalizedName: z.string().optional(),
              lifecycle: z.string().optional(),
            })
          ),
          dataEntities: z.array(
            z.object({
              name: z.string(),
              description: z.string(),
              normalizedName: z.string().optional(),
              sensitivity: z.string().optional(),
            })
          ),
          businessProcesses: z.array(
            z.object({
              name: z.string(),
              description: z.string(),
              normalizedName: z.string().optional(),
            })
          ),
          requirements: z.array(
            z.object({
              name: z.string(),
              description: z.string(),
              normalizedName: z.string().optional(),
              priority: z.string().optional(),
              requirementType: z.string().optional(),
            })
          ),
          relationships: z.array(
            z.object({
              sourceEntityName: z.string(),
              targetEntityName: z.string(),
              relationshipType: z.string(),
              description: z.string().optional(),
            })
          ),
        }),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const { projectId, generationResult } = input;
      const createdBy = ctx.user.id;

      // Track entity name to ID mapping for relationship creation
      const entityNameToId: Record<string, { id: number; type: string }> = {};

      try {
        // 1. Create Business Capabilities
        for (const entity of generationResult.businessCapabilities) {
          const [inserted] = await db.insert(businessCapabilities).values({
            projectId,
            name: entity.name,
            description: entity.description,
            normalizedName: entity.normalizedName || entity.name.toLowerCase().replace(/\s+/g, "_"),
            level: 1, // Default to L1 for AI-generated capabilities
            maturityLevel: entity.maturityLevel || "developing",
            createdBy,
          });

          entityNameToId[entity.name] = {
            id: inserted.insertId,
            type: "businessCapability",
          };
        }

        // 2. Create Applications
        for (const entity of generationResult.applications) {
          const [inserted] = await db.insert(applications).values({
            projectId,
            name: entity.name,
            description: entity.description,
            normalizedName: entity.normalizedName || entity.name.toLowerCase().replace(/\s+/g, "_"),
            lifecycle: (entity.lifecycle as "plan" | "build" | "run" | "retire") || "plan",
            createdBy,
          });

          entityNameToId[entity.name] = {
            id: inserted.insertId,
            type: "application",
          };
        }

        // 3. Create Data Entities
        for (const entity of generationResult.dataEntities) {
          const [inserted] = await db.insert(dataEntities).values({
            projectId,
            name: entity.name,
            description: entity.description,
            normalizedName: entity.normalizedName || entity.name.toLowerCase().replace(/\s+/g, "_"),
            sensitivity: (entity.sensitivity as "public" | "internal" | "confidential" | "restricted") || "internal",
            createdBy,
          });

          entityNameToId[entity.name] = {
            id: inserted.insertId,
            type: "dataEntity",
          };
        }

        // 4. Create Business Processes
        for (const entity of generationResult.businessProcesses) {
          const [inserted] = await db.insert(businessProcesses).values({
            projectId,
            name: entity.name,
            description: entity.description,
            normalizedName: entity.normalizedName || entity.name.toLowerCase().replace(/\s+/g, "_"),
            createdBy,
          });

          entityNameToId[entity.name] = {
            id: inserted.insertId,
            type: "businessProcess",
          };
        }

        // 5. Create Requirements
        for (const entity of generationResult.requirements) {
          const [inserted] = await db.insert(requirements).values({
            projectId,
            name: entity.name,
            description: entity.description,
            normalizedName: entity.normalizedName || entity.name.toLowerCase().replace(/\s+/g, "_"),
            priority: (entity.priority as "low" | "medium" | "high" | "critical") || "medium",
            type: entity.requirementType || "functional",
            createdBy,
          });

          entityNameToId[entity.name] = {
            id: inserted.insertId,
            type: "requirement",
          };
        }

        // 6. Create Relationships
        let createdRelationships = 0;
        for (const rel of generationResult.relationships) {
          const source = entityNameToId[rel.sourceEntityName];
          const target = entityNameToId[rel.targetEntityName];

          if (!source || !target) {
            console.warn(
              `[AI Generation] Skipping relationship: source="${rel.sourceEntityName}" or target="${rel.targetEntityName}" not found`
            );
            continue;
          }

          await db.insert(eaRelationships).values({
            projectId,
            sourceEntityType: source.type,
            sourceEntityId: source.id,
            targetEntityType: target.type,
            targetEntityId: target.id,
            relationshipType: rel.relationshipType,
            createdBy,
          });

          createdRelationships++;
        }

        return {
          success: true,
          entitiesCreated: Object.keys(entityNameToId).length,
          relationshipsCreated: createdRelationships,
          entityBreakdown: {
            businessCapabilities: generationResult.businessCapabilities.length,
            applications: generationResult.applications.length,
            dataEntities: generationResult.dataEntities.length,
            businessProcesses: generationResult.businessProcesses.length,
            requirements: generationResult.requirements.length,
          },
        };
      } catch (error) {
        console.error("[AI Generation] Failed to commit generation:", error);
        throw new Error(
          `Failed to commit generation: ${error instanceof Error ? error.message : "Unknown error"}`
        );
      }
    }),
});
