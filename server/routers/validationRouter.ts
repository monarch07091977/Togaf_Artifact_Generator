import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";
import { validationRules, validationViolations } from "../../drizzle/schema";
import { eq, and, or, isNull, desc, sql } from "drizzle-orm";
import { runValidation } from "../validationEngine";
import { invokeLLM } from "../_core/llm";

/**
 * Validation Rules & Violations Router
 * 
 * Manages validation rules configuration and violation tracking
 */
export const validationRouter = router({
  // ============================================================================
  // Validation Rules Management
  // ============================================================================

  /**
   * List all validation rules for a project
   */
  listRules: protectedProcedure
    .input(z.object({
      projectId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const rules = await db
        .select()
        .from(validationRules)
        .where(eq(validationRules.projectId, input.projectId))
        .orderBy(desc(validationRules.createdAt));

      return rules.map(rule => ({
        ...rule,
        isActive: rule.isActive === 1,
      }));
    }),

  /**
   * Get a specific validation rule
   */
  getRule: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [rule] = await db
        .select()
        .from(validationRules)
        .where(eq(validationRules.id, input.id))
        .limit(1);

      if (!rule) throw new Error("Rule not found");

      return {
        ...rule,
        isActive: rule.isActive === 1,
      };
    }),

  /**
   * Create a new validation rule
   */
  createRule: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      ruleType: z.enum([
        "min_relationships",
        "max_relationships",
        "required_relationship",
        "no_circular_dependencies",
        "no_orphaned_entities",
        "naming_convention",
        "attribute_completeness"
      ]),
      config: z.record(z.string(), z.any()),
      severity: z.enum(["info", "warning", "error", "critical"]).default("warning"),
      isActive: z.boolean().default(true),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(validationRules).values({
        projectId: input.projectId,
        name: input.name,
        description: input.description || null,
        ruleType: input.ruleType,
        config: input.config as any,
        severity: input.severity,
        isActive: input.isActive ? 1 : 0,
      });

      // Get the last inserted ID
      const [lastId] = await db.execute(sql`SELECT LAST_INSERT_ID() as id`);
      return { id: (lastId as any).id };
    }),

  /**
   * Update an existing validation rule
   */
  updateRule: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      config: z.record(z.string(), z.any()).optional(),
      severity: z.enum(["info", "warning", "error", "critical"]).optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.config !== undefined) updateData.config = input.config;
      if (input.severity !== undefined) updateData.severity = input.severity;
      if (input.isActive !== undefined) updateData.isActive = input.isActive ? 1 : 0;

      if (Object.keys(updateData).length > 0) {
        await db
          .update(validationRules)
          .set(updateData)
          .where(eq(validationRules.id, input.id));
      }

      return { success: true };
    }),

  /**
   * Delete a validation rule
   */
  deleteRule: protectedProcedure
    .input(z.object({
      id: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .delete(validationRules)
        .where(eq(validationRules.id, input.id));

      return { success: true };
    }),

  /**
   * Toggle rule active status
   */
  toggleRuleActive: protectedProcedure
    .input(z.object({
      id: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(validationRules)
        .set({ isActive: input.isActive ? 1 : 0 })
        .where(eq(validationRules.id, input.id));

      return { success: true };
    }),

  // ============================================================================
  // Validation Execution
  // ============================================================================

  /**
   * Run validation for a project
   */
  runValidation: protectedProcedure
    .input(z.object({
      projectId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const result = await runValidation(input.projectId);
      return result;
    }),

  // ============================================================================
  // Violations Management
  // ============================================================================

  /**
   * List violations for a project
   */
  listViolations: protectedProcedure
    .input(z.object({
      projectId: z.number(),
      status: z.enum(["open", "resolved", "ignored"]).optional(),
      ruleId: z.number().optional(),
      entityType: z.enum(["businessCapability", "application", "businessProcess", "dataEntity", "requirement"]).optional(),
      severity: z.enum(["info", "warning", "error", "critical"]).optional(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const conditions: any[] = [
        eq(validationViolations.projectId, input.projectId),
      ];

      if (input.status) {
        conditions.push(eq(validationViolations.status, input.status));
      }

      if (input.ruleId) {
        conditions.push(eq(validationViolations.ruleId, input.ruleId));
      }

      if (input.entityType) {
        conditions.push(eq(validationViolations.entityType, input.entityType));
      }

      // Join with rules to get severity
      const violations = await db
        .select({
          violation: validationViolations,
          rule: validationRules,
        })
        .from(validationViolations)
        .leftJoin(validationRules, eq(validationViolations.ruleId, validationRules.id))
        .where(and(...conditions))
        .orderBy(desc(validationViolations.createdAt));

      // Filter by severity if provided
      let filteredViolations = violations;
      if (input.severity) {
        filteredViolations = violations.filter(v => v.rule?.severity === input.severity);
      }

      return filteredViolations.map(v => ({
        ...v.violation,
        ruleName: v.rule?.name || "Unknown Rule",
        severity: v.rule?.severity || "warning",
      }));
    }),

  /**
   * Get violation statistics
   */
  getViolationStats: protectedProcedure
    .input(z.object({
      projectId: z.number(),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get counts by status
      const statusCounts = await db
        .select({
          status: validationViolations.status,
          count: sql<number>`COUNT(*)`,
        })
        .from(validationViolations)
        .where(eq(validationViolations.projectId, input.projectId))
        .groupBy(validationViolations.status);

      // Get counts by severity (join with rules)
      const severityCounts = await db
        .select({
          severity: validationRules.severity,
          count: sql<number>`COUNT(*)`,
        })
        .from(validationViolations)
        .leftJoin(validationRules, eq(validationViolations.ruleId, validationRules.id))
        .where(
          and(
            eq(validationViolations.projectId, input.projectId),
            eq(validationViolations.status, "open")
          )
        )
        .groupBy(validationRules.severity);

      return {
        byStatus: statusCounts.reduce((acc, row) => {
          acc[row.status] = row.count;
          return acc;
        }, {} as Record<string, number>),
        bySeverity: severityCounts.reduce((acc, row) => {
          if (row.severity) acc[row.severity] = row.count;
          return acc;
        }, {} as Record<string, number>),
      };
    }),

  /**
   * Resolve a violation
   */
  resolveViolation: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["resolved", "ignored"]),
      resolutionNotes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(validationViolations)
        .set({
          status: input.status,
          resolvedAt: new Date(),
          resolvedBy: ctx.user.id,
          resolutionNotes: input.resolutionNotes || null,
        })
        .where(eq(validationViolations.id, input.id));

      return { success: true };
    }),

  /**
   * Generate AI-powered fix suggestions for a violation
   */
  generateFixSuggestions: protectedProcedure
    .input(z.object({
      violationId: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get violation details
      const [violation] = await db
        .select({
          violation: validationViolations,
          rule: validationRules,
        })
        .from(validationViolations)
        .leftJoin(validationRules, eq(validationViolations.ruleId, validationRules.id))
        .where(eq(validationViolations.id, input.violationId))
        .limit(1);

      if (!violation) throw new Error("Violation not found");

      const details = violation.violation.violationDetails as any;

      // Use LLM to generate contextual fix suggestions
      const prompt = `You are an enterprise architecture expert helping to resolve a TOGAF validation violation.

**Violation Details:**
- Entity: ${violation.violation.entityName} (${violation.violation.entityType})
- Rule: ${violation.rule?.name}
- Description: ${violation.rule?.description || "N/A"}
- Issue: ${details.message}
- Expected: ${details.expected}
- Actual: ${details.actual}

**Task:**
Generate 3-5 specific, actionable recommendations to resolve this violation. Each recommendation should:
1. Be concrete and immediately implementable
2. Follow TOGAF 10 ADM best practices
3. Consider the entity type and context
4. Include rationale for why this fix is appropriate

Format your response as a JSON array of objects with this structure:
{
  "suggestions": [
    {
      "title": "Short title of the fix",
      "description": "Detailed explanation of what to do",
      "rationale": "Why this fix is recommended",
      "effort": "low|medium|high",
      "impact": "low|medium|high"
    }
  ]
}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are an enterprise architecture expert specializing in TOGAF 10 ADM methodology." },
            { role: "user", content: prompt },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "fix_suggestions",
              strict: true,
              schema: {
                type: "object",
                properties: {
                  suggestions: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        title: { type: "string" },
                        description: { type: "string" },
                        rationale: { type: "string" },
                        effort: { type: "string", enum: ["low", "medium", "high"] },
                        impact: { type: "string", enum: ["low", "medium", "high"] },
                      },
                      required: ["title", "description", "rationale", "effort", "impact"],
                      additionalProperties: false,
                    },
                  },
                },
                required: ["suggestions"],
                additionalProperties: false,
              },
            },
          },
        });

        const content = response.choices[0].message.content;
        const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
        const parsed = JSON.parse(contentStr || "{}");

        return {
          suggestions: parsed.suggestions || [],
        };
      } catch (error) {
        console.error("Failed to generate AI fix suggestions:", error);
        // Return basic suggestions from violation details
        return {
          suggestions: details.suggestions?.map((s: string, i: number) => ({
            title: `Suggestion ${i + 1}`,
            description: s,
            rationale: "Based on validation rule requirements",
            effort: "medium",
            impact: "medium",
          })) || [],
        };
      }
    }),
});
