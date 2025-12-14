import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// Mock context with authenticated user
const mockContext: TrpcContext = {
  user: {
    id: 1,
    openId: "test-user",
    name: "Test User",
    email: "test@example.com",
    role: "admin",
    loginMethod: "test",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  },
  req: {} as any,
  res: {} as any,
};

describe("Capability Assessment API", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testProjectId: number;
  let testAssessmentId: number;
  let testCapabilityId: number;

  beforeAll(async () => {
    caller = appRouter.createCaller(mockContext);

    // Create a test project
    const project = await caller.projects.create({
      name: "Test Assessment Project",
      description: "Project for testing capability assessments",
    });
    testProjectId = project.id;
  });

  describe("Capability Catalog", () => {
    it("should list all capabilities", async () => {
      const capabilities = await caller.capabilityCatalog.listCapabilities({});
      
      expect(capabilities).toBeDefined();
      expect(Array.isArray(capabilities)).toBe(true);
      expect(capabilities.length).toBeGreaterThan(0);
      
      // Verify capability structure
      const firstCap = capabilities[0];
      expect(firstCap).toHaveProperty("id");
      expect(firstCap).toHaveProperty("name");
      expect(firstCap).toHaveProperty("description");
      expect(firstCap).toHaveProperty("industry");
      expect(firstCap).toHaveProperty("level");
      
      // Save a capability ID for later tests
      testCapabilityId = firstCap.id;
    });

    it("should filter capabilities by industry", async () => {
      const capabilities = await caller.capabilityCatalog.listCapabilities({
        industry: "Oil & Gas",
      });
      
      expect(capabilities).toBeDefined();
      expect(capabilities.every((cap) => cap.industry === "Oil & Gas")).toBe(true);
    });

    it("should search capabilities by name", async () => {
      const capabilities = await caller.capabilityCatalog.listCapabilities({
        search: "exploration",
      });
      
      expect(capabilities).toBeDefined();
      expect(capabilities.length).toBeGreaterThan(0);
      expect(
        capabilities.some((cap) =>
          cap.name.toLowerCase().includes("exploration")
        )
      ).toBe(true);
    });

    it("should get a single capability by ID", async () => {
      const capability = await caller.capabilityCatalog.getCapability({
        id: testCapabilityId,
      });
      
      expect(capability).toBeDefined();
      expect(capability?.id).toBe(testCapabilityId);
      expect(capability).toHaveProperty("name");
      expect(capability).toHaveProperty("description");
    });

    it("should list all industries", async () => {
      const industries = await caller.capabilityCatalog.listIndustries();
      
      expect(industries).toBeDefined();
      expect(Array.isArray(industries)).toBe(true);
      expect(industries.length).toBeGreaterThan(0);
      expect(industries).toContain("Oil & Gas");
    });

    it("should get maturity model", async () => {
      const model = await caller.capabilityCatalog.getMaturityModel({
        modelId: "TOGAF-5-Level",
      });
      
      expect(model).toBeDefined();
      expect(model?.id).toBe("TOGAF-5-Level");
      expect(model?.name).toBe("TOGAF 5-Level Maturity Model");
      expect(model?.levels).toBeDefined();
      expect(model?.levels.length).toBe(5);
    });

    it("should get capability statistics", async () => {
      const stats = await caller.capabilityCatalog.getCapabilityStats();
      
      expect(stats).toBeDefined();
      expect(stats).toHaveProperty("total");
      expect(stats).toHaveProperty("byIndustry");
      expect(stats.total).toBeGreaterThan(0);
      expect(Object.keys(stats.byIndustry).length).toBeGreaterThan(0);
    });
  });

  describe("Assessment Lifecycle", () => {
    it("should create a new assessment", async () => {
      const result = await caller.capabilityAssessment.createAssessment({
        projectId: testProjectId,
        capabilityId: testCapabilityId,
      });
      
      expect(result).toBeDefined();
      expect(result).toHaveProperty("id");
      expect(result).toHaveProperty("capabilityName");
      expect(result.id).toBeGreaterThan(0);
      
      testAssessmentId = result.id;
    });

    it("should get assessment by ID", async () => {
      const assessment = await caller.capabilityAssessment.getAssessment({
        assessmentId: testAssessmentId,
      });
      
      expect(assessment).toBeDefined();
      expect(assessment.id).toBe(testAssessmentId);
      expect(assessment.projectId).toBe(testProjectId);
      expect(assessment.capabilityId).toBe(testCapabilityId);
      expect(assessment.capability).toBeDefined();
      expect(assessment.capability?.name).toBeDefined();
    });

    it("should list assessments for a project", async () => {
      const assessments = await caller.capabilityAssessment.listAssessments({
        projectId: testProjectId,
      });
      
      expect(assessments).toBeDefined();
      expect(Array.isArray(assessments)).toBe(true);
      expect(assessments.length).toBeGreaterThan(0);
      expect(assessments.some((a) => a.id === testAssessmentId)).toBe(true);
    });

    it("should generate assessment questions", async () => {
      const result = await caller.capabilityAssessment.generateQuestions({
        assessmentId: testAssessmentId,
      });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.questionCount).toBeGreaterThanOrEqual(5);
      expect(result.questionCount).toBeLessThanOrEqual(7);
    }, 30000); // Increase timeout for AI generation

    it("should get assessment questions", async () => {
      const questions = await caller.capabilityAssessment.getQuestions({
        assessmentId: testAssessmentId,
      });
      
      expect(questions).toBeDefined();
      expect(Array.isArray(questions)).toBe(true);
      expect(questions.length).toBeGreaterThanOrEqual(5);
      
      // Verify question structure
      const firstQuestion = questions[0];
      expect(firstQuestion).toHaveProperty("id");
      expect(firstQuestion).toHaveProperty("questionText");
      expect(firstQuestion).toHaveProperty("dimensionCode");
      expect(firstQuestion).toHaveProperty("weight");
      expect(["process", "people", "technology", "data", "governance"]).toContain(
        firstQuestion.dimensionCode
      );
    });

    it("should submit assessment responses", async () => {
      // Get questions first
      const questions = await caller.capabilityAssessment.getQuestions({
        assessmentId: testAssessmentId,
      });
      
      // Create responses for all questions
      const responses = questions.map((q, index) => ({
        questionId: q.id,
        answerValue: (index % 5) + 1, // Cycle through 1-5
        answerLabel: `${(index % 5) + 1} - Test Answer`,
      }));
      
      const result = await caller.capabilityAssessment.submitResponses({
        assessmentId: testAssessmentId,
        responses,
      });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.savedCount).toBe(questions.length);
    });

    it("should get assessment responses", async () => {
      const responses = await caller.capabilityAssessment.getResponses({
        assessmentId: testAssessmentId,
      });
      
      expect(responses).toBeDefined();
      expect(Array.isArray(responses)).toBe(true);
      expect(responses.length).toBeGreaterThan(0);
      
      // Verify response structure
      const firstResponse = responses[0];
      expect(firstResponse).toHaveProperty("id");
      expect(firstResponse).toHaveProperty("questionId");
      expect(firstResponse).toHaveProperty("answerValue");
      expect(firstResponse).toHaveProperty("answerLabel");
      expect(firstResponse.answerValue).toBeGreaterThanOrEqual(1);
      expect(firstResponse.answerValue).toBeLessThanOrEqual(5);
    });

    it("should calculate maturity score", async () => {
      const result = await caller.capabilityAssessment.calculateMaturity({
        assessmentId: testAssessmentId,
      });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.overallScore).toBeDefined();
      expect(result.maturityLevel).toBeDefined();
      expect(result.dimensionScores).toBeDefined();
      
      // Verify score is in valid range
      const score = parseFloat(result.overallScore);
      expect(score).toBeGreaterThanOrEqual(0);
      expect(score).toBeLessThanOrEqual(5);
      
      // Verify maturity level is valid
      expect([
        "initial",
        "developing",
        "defined",
        "managed",
        "optimizing",
      ]).toContain(result.maturityLevel);
      
      // Verify dimension scores
      expect(result.dimensionScores).toHaveProperty("process");
      expect(result.dimensionScores).toHaveProperty("people");
      expect(result.dimensionScores).toHaveProperty("technology");
      expect(result.dimensionScores).toHaveProperty("data");
      expect(result.dimensionScores).toHaveProperty("governance");
    });

    it("should generate maturity narrative", async () => {
      const result = await caller.capabilityAssessment.generateNarrative({
        assessmentId: testAssessmentId,
      });
      
      expect(result).toBeDefined();
      expect(result.success).toBe(true);
      expect(result.narrative).toBeDefined();
      expect(result.narrative.length).toBeGreaterThan(100); // Should be substantial
      
      // Verify assessment is marked as completed
      const assessment = await caller.capabilityAssessment.getAssessment({
        assessmentId: testAssessmentId,
      });
      expect(assessment.assessmentCompletedAt).toBeDefined();
    }, 30000); // Increase timeout for AI generation

    it("should get complete assessment results", async () => {
      const results = await caller.capabilityAssessment.getAssessmentResults({
        assessmentId: testAssessmentId,
      });
      
      expect(results).toBeDefined();
      expect(results.assessment).toBeDefined();
      expect(results.capability).toBeDefined();
      expect(results.questions).toBeDefined();
      expect(results.responses).toBeDefined();
      expect(results.dimensionScores).toBeDefined();
      
      // Verify assessment has all required fields
      expect(results.assessment.maturityScore).toBeDefined();
      expect(results.assessment.maturityLevel).toBeDefined();
      expect(results.assessment.maturityNarrative).toBeDefined();
      expect(results.assessment.keyStrengths).toBeDefined();
      expect(results.assessment.keyGaps).toBeDefined();
      expect(results.assessment.recommendations).toBeDefined();
      
      // Verify arrays are populated
      expect(Array.isArray(results.assessment.keyStrengths)).toBe(true);
      expect(Array.isArray(results.assessment.keyGaps)).toBe(true);
      expect(Array.isArray(results.assessment.recommendations)).toBe(true);
    });
  });

  describe("Edge Cases and Validation", () => {
    it("should handle invalid assessment ID", async () => {
      await expect(
        caller.capabilityAssessment.getAssessment({
          assessmentId: 999999,
        })
      ).rejects.toThrow();
    });

    it("should handle invalid capability ID", async () => {
      await expect(
        caller.capabilityAssessment.createAssessment({
          projectId: testProjectId,
          capabilityId: 999999,
        })
      ).rejects.toThrow();
    });

    it("should prevent duplicate question generation", async () => {
      // Try to generate questions again for the same assessment
      await expect(
        caller.capabilityAssessment.generateQuestions({
          assessmentId: testAssessmentId,
        })
      ).rejects.toThrow();
    });

    it("should validate response values are in range", async () => {
      const questions = await caller.capabilityAssessment.getQuestions({
        assessmentId: testAssessmentId,
      });
      
      // Try to submit invalid response (value > 5)
      await expect(
        caller.capabilityAssessment.submitResponses({
          assessmentId: testAssessmentId,
          responses: [
            {
              questionId: questions[0].id,
              answerValue: 10, // Invalid
              answerLabel: "Invalid",
            },
          ],
        })
      ).rejects.toThrow();
    });
  });
});
