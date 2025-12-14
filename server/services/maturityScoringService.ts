import { getDb } from "../db";
import { assessmentQuestions, assessmentResponses } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Maturity scoring result
 */
interface MaturityScoreResult {
  overallScore: string; // decimal as string (e.g., "2.45")
  maturityLevel: "initial" | "developing" | "defined" | "managed" | "optimizing";
  dimensionScores: {
    process: number;
    people: number;
    technology: number;
    data: number;
    governance: number;
  };
}

/**
 * Calculate maturity score for an assessment using weighted algorithm
 * 
 * Algorithm:
 * 1. For each dimension (process, people, technology, data, governance):
 *    - Get all questions for that dimension
 *    - Get all responses for those questions
 *    - Calculate weighted average: Σ(answer_value * weight) / Σ(weight)
 * 
 * 2. Calculate overall score:
 *    - Average of all dimension scores
 * 
 * 3. Map overall score to maturity level:
 *    - 1.0-1.5: Initial
 *    - 1.5-2.5: Developing
 *    - 2.5-3.5: Defined
 *    - 3.5-4.5: Managed
 *    - 4.5-5.0: Optimizing
 */
export async function calculateMaturityScore(
  assessmentId: number
): Promise<MaturityScoreResult> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get all questions for this assessment
  const questions = await db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, assessmentId));

  if (questions.length === 0) {
    throw new Error("No questions found for this assessment");
  }

  // Get all responses for this assessment
  const responses = await db
    .select()
    .from(assessmentResponses)
    .where(eq(assessmentResponses.assessmentId, assessmentId));

  if (responses.length === 0) {
    throw new Error("No responses found for this assessment");
  }

  // Create a map of questionId -> response
  const responseMap = new Map(
    responses.map((r) => [r.questionId, r])
  );

  // Calculate dimension scores
  const dimensionScores = {
    process: 0,
    people: 0,
    technology: 0,
    data: 0,
    governance: 0,
  };

  const dimensionWeights = {
    process: 0,
    people: 0,
    technology: 0,
    data: 0,
    governance: 0,
  };

  // Group questions by dimension and calculate weighted scores
  for (const question of questions) {
    const response = responseMap.get(question.id);
    if (!response) {
      continue; // Skip unanswered questions
    }

    const dimension = question.dimensionCode;
    const weight = parseFloat(question.weight as string);
    const answerValue = response.answerValue;

    dimensionScores[dimension] += answerValue * weight;
    dimensionWeights[dimension] += weight;
  }

  // Calculate final dimension scores (weighted average)
  const finalDimensionScores = {
    process: dimensionWeights.process > 0
      ? dimensionScores.process / dimensionWeights.process
      : 0,
    people: dimensionWeights.people > 0
      ? dimensionScores.people / dimensionWeights.people
      : 0,
    technology: dimensionWeights.technology > 0
      ? dimensionScores.technology / dimensionWeights.technology
      : 0,
    data: dimensionWeights.data > 0
      ? dimensionScores.data / dimensionWeights.data
      : 0,
    governance: dimensionWeights.governance > 0
      ? dimensionScores.governance / dimensionWeights.governance
      : 0,
  };

  // Calculate overall score (average of dimension scores)
  const dimensionValues = Object.values(finalDimensionScores).filter((v) => v > 0);
  const overallScore = dimensionValues.length > 0
    ? dimensionValues.reduce((sum, val) => sum + val, 0) / dimensionValues.length
    : 0;

  // Map overall score to maturity level
  const maturityLevel = getMaturityLevel(overallScore);

  return {
    overallScore: overallScore.toFixed(2),
    maturityLevel,
    dimensionScores: {
      process: parseFloat(finalDimensionScores.process.toFixed(2)),
      people: parseFloat(finalDimensionScores.people.toFixed(2)),
      technology: parseFloat(finalDimensionScores.technology.toFixed(2)),
      data: parseFloat(finalDimensionScores.data.toFixed(2)),
      governance: parseFloat(finalDimensionScores.governance.toFixed(2)),
    },
  };
}

/**
 * Map numeric score to TOGAF maturity level
 */
function getMaturityLevel(
  score: number
): "initial" | "developing" | "defined" | "managed" | "optimizing" {
  if (score < 1.5) {
    return "initial";
  } else if (score < 2.5) {
    return "developing";
  } else if (score < 3.5) {
    return "defined";
  } else if (score < 4.5) {
    return "managed";
  } else {
    return "optimizing";
  }
}

/**
 * Calculate completion percentage for an assessment
 */
export async function calculateCompletionPercentage(
  assessmentId: number
): Promise<number> {
  const db = await getDb();
  if (!db) {
    throw new Error("Database not available");
  }

  // Get total questions
  const questions = await db
    .select()
    .from(assessmentQuestions)
    .where(eq(assessmentQuestions.assessmentId, assessmentId));

  const totalQuestions = questions.length;
  if (totalQuestions === 0) {
    return 0;
  }

  // Get answered questions
  const responses = await db
    .select()
    .from(assessmentResponses)
    .where(eq(assessmentResponses.assessmentId, assessmentId));

  const answeredQuestions = responses.length;

  return Math.round((answeredQuestions / totalQuestions) * 100);
}
