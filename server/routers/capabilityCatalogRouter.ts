import { z } from "zod";
import { eq, like, or, and } from "drizzle-orm";
import { publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { capabilityCatalog, maturityModels } from "../../drizzle/schema";

export const capabilityCatalogRouter = router({
  // List capabilities with optional filtering
  listCapabilities: publicProcedure
    .input(
      z.object({
        industry: z.string().optional(),
        search: z.string().optional(),
        level: z.number().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const conditions = [];
      
      if (input.industry) {
        conditions.push(eq(capabilityCatalog.industry, input.industry));
      }
      
      if (input.search) {
        conditions.push(
          or(
            like(capabilityCatalog.name, `%${input.search}%`),
            like(capabilityCatalog.description, `%${input.search}%`)
          )
        );
      }
      
      if (input.level !== undefined) {
        conditions.push(eq(capabilityCatalog.level, input.level));
      }

      const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

      const capabilities = await db
        .select()
        .from(capabilityCatalog)
        .where(whereClause)
        .orderBy(capabilityCatalog.industry, capabilityCatalog.referenceId);

      return capabilities;
    }),

  // Get single capability by ID or referenceId
  getCapability: publicProcedure
    .input(
      z.object({
        id: z.number().optional(),
        referenceId: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      if (!input.id && !input.referenceId) {
        throw new Error("Either id or referenceId must be provided");
      }

      const condition = input.id
        ? eq(capabilityCatalog.id, input.id)
        : eq(capabilityCatalog.referenceId, input.referenceId!);

      const result = await db
        .select()
        .from(capabilityCatalog)
        .where(condition)
        .limit(1);

      return result[0] || null;
    }),

  // Get list of unique industries
  listIndustries: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const result = await db
      .selectDistinct({ industry: capabilityCatalog.industry })
      .from(capabilityCatalog)
      .orderBy(capabilityCatalog.industry);

    return result.map((r) => r.industry);
  }),

  // Get maturity model configuration
  getMaturityModel: publicProcedure
    .input(
      z.object({
        modelId: z.string().default("TOGAF-5-Level"),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const result = await db
        .select()
        .from(maturityModels)
        .where(eq(maturityModels.modelId, input.modelId))
        .limit(1);

      return result[0] || null;
    }),

  // Get capability count by industry
  getCapabilityStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) {
      throw new Error("Database not available");
    }

    const capabilities = await db.select().from(capabilityCatalog);

    const stats = capabilities.reduce((acc, cap) => {
      acc[cap.industry] = (acc[cap.industry] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      total: capabilities.length,
      byIndustry: stats,
    };
  }),
});
