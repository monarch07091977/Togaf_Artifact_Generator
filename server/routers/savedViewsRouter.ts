import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { savedViews } from "../../drizzle/schema";
import { eq, and, or, isNull } from "drizzle-orm";

/**
 * Filter schema for saved views
 * Supports all entity-specific fields and common filters
 */
const filterSchema = z.object({
  // Entity type filter (multi-select)
  entityTypes: z.array(z.enum([
    "businessCapability",
    "application",
    "businessProcess",
    "dataEntity",
    "requirement",
  ])).optional(),
  
  // Business Capability specific filters
  maturityLevels: z.array(z.string()).optional(),
  
  // Application specific filters
  lifecycleStages: z.array(z.string()).optional(),
  
  // Data Entity specific filters
  sensitivityLevels: z.array(z.string()).optional(),
  
  // Requirement specific filters
  priorities: z.array(z.string()).optional(),
  requirementTypes: z.array(z.string()).optional(),
  
  // Common filters
  createdBy: z.number().optional(), // Filter by creator user ID
  dateRange: z.object({
    start: z.string().datetime().optional(),
    end: z.string().datetime().optional(),
  }).optional(),
  
  // Search query
  searchQuery: z.string().optional(),
});

export type FilterConfig = z.infer<typeof filterSchema>;

/**
 * Saved Views Router
 * Manages user-defined filter combinations for EA Entity Browser
 */
export const savedViewsRouter = router({
  /**
   * List all views accessible to the user
   * Includes user's own views + shared views in the project
   */
  list: protectedProcedure
    .input(z.object({
      projectId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get user's own views + shared views
      const views = await db
        .select()
        .from(savedViews)
        .where(
          and(
            eq(savedViews.projectId, input.projectId),
            or(
              eq(savedViews.userId, ctx.user.id), // User's own views
              eq(savedViews.isShared, 1) // Shared views
            )
          )
        )
        .orderBy(savedViews.createdAt);

      return views.map(view => ({
        ...view,
        isDefault: view.isDefault === 1,
        isShared: view.isShared === 1,
        isOwner: view.userId === ctx.user.id,
      }));
    }),

  /**
   * Get a specific view by ID
   */
  get: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [view] = await db
        .select()
        .from(savedViews)
        .where(eq(savedViews.id, input.id))
        .limit(1);

      if (!view) throw new Error("View not found");

      // Check access: must be owner or view must be shared
      if (view.userId !== ctx.user.id && view.isShared !== 1) {
        throw new Error("Access denied");
      }

      return {
        ...view,
        isDefault: view.isDefault === 1,
        isShared: view.isShared === 1,
        isOwner: view.userId === ctx.user.id,
      };
    }),

  /**
   * Create a new saved view
   */
  create: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      filters: filterSchema,
      isDefault: z.boolean().default(false),
      isShared: z.boolean().default(false),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // If setting as default, unset other defaults for this user+project
      if (input.isDefault) {
        await db
          .update(savedViews)
          .set({ isDefault: 0 })
          .where(
            and(
              eq(savedViews.userId, ctx.user.id),
              eq(savedViews.projectId, input.projectId)
            )
          );
      }

      const [result] = await db.insert(savedViews).values({
        userId: ctx.user.id,
        projectId: input.projectId,
        name: input.name,
        description: input.description || null,
        filters: input.filters as any,
        isDefault: input.isDefault ? 1 : 0,
        isShared: input.isShared ? 1 : 0,
      });

      return { id: result.insertId };
    }),

  /**
   * Update an existing saved view
   */
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      filters: filterSchema.optional(),
      isDefault: z.boolean().optional(),
      isShared: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check ownership
      const [view] = await db
        .select()
        .from(savedViews)
        .where(eq(savedViews.id, input.id))
        .limit(1);

      if (!view) throw new Error("View not found");
      if (view.userId !== ctx.user.id) throw new Error("Access denied");

      // If setting as default, unset other defaults
      if (input.isDefault) {
        await db
          .update(savedViews)
          .set({ isDefault: 0 })
          .where(
            and(
              eq(savedViews.userId, ctx.user.id),
              eq(savedViews.projectId, view.projectId),
            )
          );
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.filters !== undefined) updateData.filters = input.filters;
      if (input.isDefault !== undefined) updateData.isDefault = input.isDefault ? 1 : 0;
      if (input.isShared !== undefined) updateData.isShared = input.isShared ? 1 : 0;

      await db
        .update(savedViews)
        .set(updateData)
        .where(eq(savedViews.id, input.id));

      return { success: true };
    }),

  /**
   * Delete a saved view
   */
  delete: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check ownership
      const [view] = await db
        .select()
        .from(savedViews)
        .where(eq(savedViews.id, input.id))
        .limit(1);

      if (!view) throw new Error("View not found");
      if (view.userId !== ctx.user.id) throw new Error("Access denied");

      await db
        .delete(savedViews)
        .where(eq(savedViews.id, input.id));

      return { success: true };
    }),

  /**
   * Set a view as default
   */
  setDefault: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check ownership
      const [view] = await db
        .select()
        .from(savedViews)
        .where(eq(savedViews.id, input.id))
        .limit(1);

      if (!view) throw new Error("View not found");
      if (view.userId !== ctx.user.id) throw new Error("Access denied");

      // Unset other defaults for this user+project
      await db
        .update(savedViews)
        .set({ isDefault: 0 })
        .where(
          and(
            eq(savedViews.userId, ctx.user.id),
            eq(savedViews.projectId, view.projectId)
          )
        );

      // Set this view as default
      await db
        .update(savedViews)
        .set({ isDefault: 1 })
        .where(eq(savedViews.id, input.id));

      return { success: true };
    }),
});
