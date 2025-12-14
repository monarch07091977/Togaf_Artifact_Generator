import { invokeLLM } from "../_core/llm";
import type { CapabilityCatalogEntry, CapabilityAssessment, AssessmentQuestion, AssessmentResponse } from "../../drizzle/schema";

/**
 * Question structure for assessment generation
 */
interface GeneratedQuestion {
  questionId: string; // e.g., "OG.BC.01.Q1"
  dimensionCode: "process" | "people" | "technology" | "data" | "governance";
  dimensionLabel: string;
  questionText: string;
  answerScale: {
    type: "likert_5";
    options: string[];
  };
  weight: string; // decimal as string
}

/**
 * Narrative structure for maturity assessment
 */
interface MaturityNarrative {
  narrative: string;
  strengths: string[];
  gaps: string[];
  recommendations: string[];
}

/**
 * Generate assessment questions for a capability using AI
 * 
 * Generates 3-7 questions per capability across 5 dimensions:
 * - Process: How mature are the processes?
 * - People: Skills, roles, and organizational structure
 * - Technology: Tools, systems, and automation
 * - Data: Data quality, availability, and governance
 * - Governance: Policies, standards, and compliance
 */
export async function generateAssessmentQuestions(
  capability: CapabilityCatalogEntry
): Promise<GeneratedQuestion[]> {
  const systemPrompt = `You are a TOGAF enterprise architecture expert specializing in capability maturity assessments.

Your task is to generate assessment questions for evaluating the maturity of a business capability.

**Context:**
- Industry: ${capability.industry}
- Capability: ${capability.name}
- Description: ${capability.description}
- Level: ${capability.level}

**Requirements:**
1. Generate 5-7 questions covering the 5 maturity dimensions:
   - Process (at least 1 question)
   - People (at least 1 question)
   - Technology (at least 1 question)
   - Data (at least 1 question)
   - Governance (at least 1 question)

2. Questions should:
   - Be specific to this capability and industry
   - Use clear, professional language
   - Focus on observable behaviors and practices
   - Be answerable with a 5-point Likert scale (1=Never/None to 5=Always/Optimized)

3. Each question must have:
   - A unique ID (format: ${capability.referenceId}.Q1, ${capability.referenceId}.Q2, etc.)
   - A dimension code (process, people, technology, data, governance)
   - A dimension label (e.g., "Process Maturity")
   - Question text
   - Weight (0.8-1.0 for critical questions, 0.5-0.7 for supporting questions)

4. Answer scale is always:
   {
     "type": "likert_5",
     "options": [
       "1 - Never / Not at all",
       "2 - Rarely / Minimal",
       "3 - Sometimes / Moderate",
       "4 - Often / Substantial",
       "5 - Always / Optimized"
     ]
   }

Return a JSON array of questions following the schema.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate assessment questions for the capability: ${capability.name}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "assessment_questions",
          strict: true,
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    questionId: { type: "string" },
                    dimensionCode: {
                      type: "string",
                      enum: ["process", "people", "technology", "data", "governance"],
                    },
                    dimensionLabel: { type: "string" },
                    questionText: { type: "string" },
                    answerScale: {
                      type: "object",
                      properties: {
                        type: { type: "string" },
                        options: {
                          type: "array",
                          items: { type: "string" },
                        },
                      },
                      required: ["type", "options"],
                      additionalProperties: false,
                    },
                    weight: { type: "string" },
                  },
                  required: [
                    "questionId",
                    "dimensionCode",
                    "dimensionLabel",
                    "questionText",
                    "answerScale",
                    "weight",
                  ],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in LLM response");
    }

    const contentText = typeof content === "string" ? content : JSON.stringify(content);
    const parsed = JSON.parse(contentText);
    return parsed.questions;
  } catch (error) {
    console.error("Error generating assessment questions:", error);
    throw new Error("Failed to generate assessment questions");
  }
}

/**
 * Generate maturity narrative based on assessment results
 * 
 * Analyzes responses and scores to generate:
 * - Overall narrative explaining the maturity level
 * - Key strengths (what's working well)
 * - Key gaps (areas needing improvement)
 * - Recommendations (specific actions to improve maturity)
 */
export async function generateMaturityNarrative(
  capability: CapabilityCatalogEntry,
  assessment: CapabilityAssessment,
  questions: AssessmentQuestion[],
  responses: AssessmentResponse[]
): Promise<MaturityNarrative> {
  // Build context from questions and responses
  const qaContext = questions.map((q) => {
    const response = responses.find((r) => r.questionId === q.id);
    return {
      dimension: q.dimensionCode,
      question: q.questionText,
      answer: response ? `${response.answerValue} - ${response.answerLabel || ""}` : "Not answered",
    };
  });

  const dimensionScores = assessment.dimensionScores
    ? (typeof assessment.dimensionScores === "string"
        ? JSON.parse(assessment.dimensionScores)
        : assessment.dimensionScores)
    : {};

  const systemPrompt = `You are a TOGAF enterprise architecture expert specializing in capability maturity assessments.

Your task is to generate a comprehensive maturity assessment narrative based on the assessment results.

**Capability Context:**
- Industry: ${capability.industry}
- Capability: ${capability.name}
- Description: ${capability.description}

**Assessment Results:**
- Overall Maturity Score: ${assessment.maturityScore || "N/A"} / 5.0
- Maturity Level: ${assessment.maturityLevel || "N/A"}
- Dimension Scores: ${JSON.stringify(dimensionScores, null, 2)}

**Questions and Responses:**
${qaContext.map((qa, i) => `${i + 1}. [${qa.dimension}] ${qa.question}\n   Answer: ${qa.answer}`).join("\n\n")}

**Requirements:**
1. Generate an overall narrative (2-3 paragraphs) explaining:
   - Current maturity state
   - Key observations across dimensions
   - Overall assessment of capability readiness

2. Identify 3-5 key strengths:
   - Specific areas where the capability is performing well
   - Evidence from responses
   - Impact on business outcomes

3. Identify 3-5 key gaps:
   - Specific areas needing improvement
   - Evidence from responses
   - Risk or impact if not addressed

4. Provide 5-7 actionable recommendations:
   - Specific, measurable actions
   - Prioritized by impact
   - Aligned with TOGAF best practices
   - Realistic and achievable

Use professional, clear language. Be specific and evidence-based.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        {
          role: "user",
          content: `Generate a maturity assessment narrative for ${capability.name}.`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "maturity_narrative",
          strict: true,
          schema: {
            type: "object",
            properties: {
              narrative: { type: "string" },
              strengths: {
                type: "array",
                items: { type: "string" },
              },
              gaps: {
                type: "array",
                items: { type: "string" },
              },
              recommendations: {
                type: "array",
                items: { type: "string" },
              },
            },
            required: ["narrative", "strengths", "gaps", "recommendations"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content) {
      throw new Error("No content in LLM response");
    }

    const contentText = typeof content === "string" ? content : JSON.stringify(content);
    return JSON.parse(contentText);
  } catch (error) {
    console.error("Error generating maturity narrative:", error);
    throw new Error("Failed to generate maturity narrative");
  }
}
