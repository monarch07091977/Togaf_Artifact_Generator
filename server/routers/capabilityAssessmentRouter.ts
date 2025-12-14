import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  capabilityAssessments,
  assessmentQuestions,
  assessmentResponses,
  capabilityCatalog,
  maturityModels,
} from "../../drizzle/schema";

export const capabilityAssessmentRouter = router({
  // Create a new assessment
  createAssessment: protectedProcedure
    .input(
      z.object({
        projectId: z.number(),
        capabilityId: z.number(),
        assessmentName: z.string().optional(),
        assessmentDescription: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get capability details
      const capability = await db
        .select()
        .from(capabilityCatalog)
        .where(eq(capabilityCatalog.id, input.capabilityId))
        .limit(1);

      if (!capability[0]) {
        throw new Error("Capability not found");
      }

      const cap = capability[0];

      // Create assessment record
      const result = await db.insert(capabilityAssessments).values({
        projectId: input.projectId,
        capabilityId: input.capabilityId,
        catalogReferenceId: cap.referenceId,
        maturityModelId: "TOGAF-5-Level",
        assessedBy: ctx.user.id,
      });

      const insertId = (result as any).insertId;
      return {
        id: Number(insertId),
        capabilityName: cap.name,
      };
    }),

  // Get assessment by ID
  getAssessment: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const result = await db
        .select({
          assessment: capabilityAssessments,
          capability: capabilityCatalog,
        })
        .from(capabilityAssessments)
        .leftJoin(
          capabilityCatalog,
          eq(capabilityAssessments.capabilityId, capabilityCatalog.id)
        )
        .where(eq(capabilityAssessments.id, input.assessmentId))
        .limit(1);

      if (!result[0]) {
        throw new Error("Assessment not found");
      }

      return {
        ...result[0].assessment,
        capability: result[0].capability,
      };
    }),

  // List assessments for a project
  listAssessments: protectedProcedure
    .input(z.object({ projectId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const result = await db
        .select({
          assessment: capabilityAssessments,
          capability: capabilityCatalog,
        })
        .from(capabilityAssessments)
        .leftJoin(
          capabilityCatalog,
          eq(capabilityAssessments.capabilityId, capabilityCatalog.id)
        )
        .where(eq(capabilityAssessments.projectId, input.projectId))
        .orderBy(desc(capabilityAssessments.createdAt));

      return result.map((r) => ({
        ...r.assessment,
        capability: r.capability,
      }));
    }),

  // Generate assessment questions using AI
  generateQuestions: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get assessment and capability
      const result = await db
        .select({
          assessment: capabilityAssessments,
          capability: capabilityCatalog,
        })
        .from(capabilityAssessments)
        .leftJoin(
          capabilityCatalog,
          eq(capabilityAssessments.capabilityId, capabilityCatalog.id)
        )
        .where(eq(capabilityAssessments.id, input.assessmentId))
        .limit(1);

      if (!result[0] || !result[0].capability) {
        throw new Error("Assessment or capability not found");
      }

      const { assessment, capability } = result[0];

      // Generate questions using AI service
      const { generateAssessmentQuestions } = await import(
        "../services/assessmentAIService"
      );
      const questions = await generateAssessmentQuestions(capability);

      // Insert questions into database
      const questionRecords = questions.map((q) => ({
        assessmentId: input.assessmentId,
        catalogReferenceId: capability.referenceId,
        questionId: q.questionId,
        dimensionCode: q.dimensionCode,
        dimensionLabel: q.dimensionLabel,
        questionText: q.questionText,
        answerScale: q.answerScale,
        weight: q.weight,
      }));

      await db.insert(assessmentQuestions).values(questionRecords);

      // Update assessment status
      await db
        .update(capabilityAssessments)
        .set({ assessmentCompletedAt: null })
        .where(eq(capabilityAssessments.id, input.assessmentId));

      return {
        success: true,
        questionCount: questions.length,
      };
    }),

  // Get questions for an assessment
  getQuestions: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const questions = await db
        .select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.assessmentId, input.assessmentId))
        .orderBy(assessmentQuestions.questionId);

      return questions;
    }),

  // Submit responses to assessment questions
  submitResponses: protectedProcedure
    .input(
      z.object({
        assessmentId: z.number(),
        responses: z.array(
          z.object({
            questionId: z.number(),
            answerValue: z.number().min(1).max(5),
            answerLabel: z.string().optional(),
          })
        ),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Insert or update responses
      const responseRecords = input.responses.map((r) => ({
        assessmentId: input.assessmentId,
        questionId: r.questionId,
        answerValue: r.answerValue,
        answerLabel: r.answerLabel,
        answeredBy: ctx.user.id,
      }));

      // Delete existing responses for these questions
      const questionIds = input.responses.map((r) => r.questionId);
      for (const qid of questionIds) {
        await db
          .delete(assessmentResponses)
          .where(
            and(
              eq(assessmentResponses.assessmentId, input.assessmentId),
              eq(assessmentResponses.questionId, qid)
            )
          );
      }

      // Insert new responses
      await db.insert(assessmentResponses).values(responseRecords);

      return { success: true };
    }),

  // Get responses for an assessment
  getResponses: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      const responses = await db
        .select()
        .from(assessmentResponses)
        .where(eq(assessmentResponses.assessmentId, input.assessmentId))
        .orderBy(assessmentResponses.questionId);

      return responses;
    }),

  // Calculate maturity score
  calculateMaturity: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Calculate maturity using scoring service
      const { calculateMaturityScore } = await import(
        "../services/maturityScoringService"
      );
      const result = await calculateMaturityScore(input.assessmentId);

      // Update assessment with scores
      await db
        .update(capabilityAssessments)
        .set({
          maturityScore: result.overallScore.toString(),
          maturityLevel: result.maturityLevel,
          dimensionScores: result.dimensionScores,
        })
        .where(eq(capabilityAssessments.id, input.assessmentId));

      return result;
    }),

  // Generate narrative using AI
  generateNarrative: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get assessment data
      const assessmentData = await db
        .select({
          assessment: capabilityAssessments,
          capability: capabilityCatalog,
        })
        .from(capabilityAssessments)
        .leftJoin(
          capabilityCatalog,
          eq(capabilityAssessments.capabilityId, capabilityCatalog.id)
        )
        .where(eq(capabilityAssessments.id, input.assessmentId))
        .limit(1);

      if (!assessmentData[0] || !assessmentData[0].capability) {
        throw new Error("Assessment or capability not found");
      }

      const { assessment, capability } = assessmentData[0];

      // Get questions and responses
      const questions = await db
        .select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.assessmentId, input.assessmentId));

      const responses = await db
        .select()
        .from(assessmentResponses)
        .where(eq(assessmentResponses.assessmentId, input.assessmentId));

      // Generate narrative using AI service
      const { generateMaturityNarrative } = await import(
        "../services/assessmentAIService"
      );
      const narrative = await generateMaturityNarrative(
        capability,
        assessment,
        questions,
        responses
      );

      // Update assessment with narrative
      await db
        .update(capabilityAssessments)
        .set({
          maturityNarrative: narrative.narrative,
          keyStrengths: narrative.strengths,
          keyGaps: narrative.gaps,
          recommendations: narrative.recommendations,
          assessmentCompletedAt: new Date(),
        })
        .where(eq(capabilityAssessments.id, input.assessmentId));

      return narrative;
    }),

  // Get complete assessment results
  getAssessmentResults: protectedProcedure
    .input(z.object({ assessmentId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) {
        throw new Error("Database not available");
      }

      // Get assessment with capability
      const assessmentData = await db
        .select({
          assessment: capabilityAssessments,
          capability: capabilityCatalog,
        })
        .from(capabilityAssessments)
        .leftJoin(
          capabilityCatalog,
          eq(capabilityAssessments.capabilityId, capabilityCatalog.id)
        )
        .where(eq(capabilityAssessments.id, input.assessmentId))
        .limit(1);

      if (!assessmentData[0]) {
        throw new Error("Assessment not found");
      }

      const { assessment, capability } = assessmentData[0];

      // Get maturity model
      const maturityModel = await db
        .select()
        .from(maturityModels)
        .where(eq(maturityModels.modelId, "TOGAF-5-Level"))
        .limit(1);

      // Get questions
      const questions = await db
        .select()
        .from(assessmentQuestions)
        .where(eq(assessmentQuestions.assessmentId, input.assessmentId))
        .orderBy(assessmentQuestions.questionId);

      // Get responses
      const responses = await db
        .select()
        .from(assessmentResponses)
        .where(eq(assessmentResponses.assessmentId, input.assessmentId));

      return {
        assessment,
        capability,
        maturityModel: maturityModel[0] || null,
        questions,
        responses,
        dimensionScores: assessment.dimensionScores
          ? JSON.parse(assessment.dimensionScores as string)
          : null,
      };
    }),
});
