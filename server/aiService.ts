import { invokeLLM } from "./_core/llm";
import { Artifact, QuestionnaireResponse, Assumption } from "../drizzle/schema";
import { TOGAF_ARTIFACTS } from "../shared/togafArtifacts";

interface GenerateArtifactInput {
  artifactId: string;
  projectName: string;
  projectDescription: string;
  questionnaireResponses: QuestionnaireResponse[];
  relatedArtifacts?: Artifact[];
}

interface GenerateArtifactOutput {
  content: string;
  assumptions: Array<{
    description: string;
    rationale: string;
    impact: "low" | "medium" | "high";
  }>;
}

/**
 * Generate TOGAF artifact content using AI
 */
export async function generateArtifact(
  input: GenerateArtifactInput
): Promise<GenerateArtifactOutput> {
  const artifactDef = TOGAF_ARTIFACTS[input.artifactId];
  
  if (!artifactDef) {
    throw new Error(`Unknown artifact: ${input.artifactId}`);
  }

  // Build context from questionnaire responses
  const questionnaireContext = input.questionnaireResponses
    .map((r) => `**${r.question}**\n${r.answer}`)
    .join("\n\n");

  // Build context from related artifacts
  const relatedContext = input.relatedArtifacts
    ?.map((a) => {
      return `### ${a.name}\n${a.content || a.content || "No content available"}`;
    })
    .join("\n\n") || "No related artifacts available yet.";

  const prompt = buildArtifactPrompt(
    artifactDef.name,
    artifactDef.description,
    input.projectName,
    input.projectDescription,
    questionnaireContext,
    relatedContext
  );

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: SYSTEM_PROMPT,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "artifact_generation",
        strict: true,
        schema: {
          type: "object",
          properties: {
            content: {
              type: "string",
              description: "The generated artifact content in markdown format",
            },
            assumptions: {
              type: "array",
              description: "List of assumptions made during generation",
              items: {
                type: "object",
                properties: {
                  description: {
                    type: "string",
                    description: "Description of the assumption",
                  },
                  rationale: {
                    type: "string",
                    description: "Why this assumption was made",
                  },
                  impact: {
                    type: "string",
                    enum: ["low", "medium", "high"],
                    description: "Impact level of this assumption",
                  },
                },
                required: ["description", "rationale", "impact"],
                additionalProperties: false,
              },
            },
          },
          required: ["content", "assumptions"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (!content || typeof content !== "string") {
    throw new Error("No content generated");
  }

  const result = JSON.parse(content) as GenerateArtifactOutput;
  return result;
}

/**
 * Provide domain expertise and suggestions
 */
export async function provideDomainExpertise(
  question: string,
  context: {
    artifactName: string;
    phase: string;
    projectDescription?: string;
  }
): Promise<string> {
  const prompt = `You are a TOGAF expert providing guidance to an enterprise architect.

**Question:** ${question}

**Context:**
- Artifact: ${context.artifactName}
- ADM Phase: ${context.phase}
${context.projectDescription ? `- Project: ${context.projectDescription}` : ""}

Provide:
1. Clear explanation
2. Best practice recommendation
3. Example or template (if applicable)
4. Common pitfalls to avoid

Keep your response concise and actionable.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are an expert TOGAF enterprise architect with 20+ years of experience. Provide practical, professional guidance.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  });

  const content = response.choices[0].message.content;
  return typeof content === "string" ? content : "Unable to provide guidance at this time.";
}

/**
 * Generate suggestions for questionnaire answers
 */
export async function generateQuestionSuggestions(
  question: string,
  context: {
    artifactName: string;
    projectDescription: string;
    previousAnswers?: Record<string, string>;
    relatedArtifacts?: Artifact[];
  }
): Promise<string[]> {
  const previousContext = context.previousAnswers
    ? Object.entries(context.previousAnswers)
        .map(([q, a]) => `${q}: ${a}`)
        .join("\n")
    : "No previous answers";

  const relatedContext = context.relatedArtifacts
    ?.map((a) => `${a.name}: ${a.content?.substring(0, 200)}...`)
    .join("\n") || "No related artifacts";

  const prompt = `Generate 3 relevant suggestions for the following question in a TOGAF artifact questionnaire.

**Artifact:** ${context.artifactName}
**Project:** ${context.projectDescription}
**Question:** ${question}

**Previous Answers:**
${previousContext}

**Related Artifacts:**
${relatedContext}

Provide 3 concise, relevant suggestions that the user can choose from or use as inspiration.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: "You are a TOGAF expert helping users fill out architecture questionnaires. Provide practical, context-aware suggestions.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "suggestions",
        strict: true,
        schema: {
          type: "object",
          properties: {
            suggestions: {
              type: "array",
              items: {
                type: "string",
              },
              description: "Array of 3 suggestion strings",
            },
          },
          required: ["suggestions"],
          additionalProperties: false,
        },
      },
    },
  });

  const content = response.choices[0].message.content;
  if (!content || typeof content !== "string") return [];

  const result = JSON.parse(content) as { suggestions: string[] };
  return result.suggestions;
}

// System prompt for artifact generation
const SYSTEM_PROMPT = `You are an expert TOGAF 10 enterprise architect with deep knowledge of the Architecture Development Method (ADM) and the official TOGAF Standard documentation.

Your role is to generate high-quality, professional TOGAF artifacts that:
1. Strictly follow TOGAF 10 Standard specifications (Parts 0-5)
2. Align with the Content Framework and Enterprise Metamodel (Part 4)
3. Apply ADM Techniques appropriately (Part 2)
4. Are comprehensive, detailed, and standards-compliant
5. Maintain consistency with related artifacts and prerequisite dependencies
6. Use clear, professional language following TOGAF terminology
7. Include practical, actionable content based on TOGAF best practices
8. Document all assumptions made during generation

When generating artifacts:
- Reference TOGAF Content Framework specifications for structure
- Follow the artifact templates and typical contents from TOGAF Part 4
- Use markdown formatting with sections matching TOGAF guidelines
- Include TOGAF metamodel entities and relationships where relevant
- Provide specific examples aligned with TOGAF patterns
- Ensure traceability to Architecture Vision, principles, and requirements
- Apply relevant ADM techniques (stakeholder management, gap analysis, etc.)
- Follow TOGAF naming conventions and terminology precisely

Always document assumptions separately with clear rationale and impact assessment.`;

function buildArtifactPrompt(
  artifactName: string,
  artifactDescription: string,
  projectName: string,
  projectDescription: string,
  questionnaireContext: string,
  relatedContext: string
): string {
  return `Generate a comprehensive **${artifactName}** for the following enterprise architecture project.

## Artifact Information
**Name:** ${artifactName}
**Description:** ${artifactDescription}

## Project Context
**Project Name:** ${projectName}
**Project Description:** ${projectDescription}

## Questionnaire Responses
${questionnaireContext}

## Related Artifacts (for reference and consistency)
${relatedContext}

## TOGAF Standard Requirements
1. **Strictly follow TOGAF 10 Standard** - Reference Part 4 (Architecture Content) for this artifact's structure and typical contents
2. **Apply Content Framework** - Include appropriate TOGAF metamodel entities, attributes, and relationships
3. **Ensure ADM alignment** - Follow the guidance for this artifact's usage in the relevant ADM phase(s)
4. **Maintain consistency** - Ensure traceability and alignment with related artifacts, especially prerequisites
5. **Use TOGAF terminology** - Follow standard TOGAF naming conventions and vocabulary
6. **Include practical content** - Provide specific, actionable content (not generic templates)
7. **Document assumptions** - List all assumptions with rationale and impact assessment

## Content Structure Guidelines
- Follow the typical contents specified in TOGAF Part 4 for this artifact type
- Include all mandatory sections and recommended elements
- Use appropriate TOGAF metamodel concepts (e.g., Capability, Function, Service, Component)
- Ensure proper relationships between architecture elements
- Provide sufficient detail for stakeholders to make informed decisions

## Output Format
Generate the artifact content in markdown format with sections matching TOGAF specifications.
List all assumptions separately with description, rationale, and impact level.

Generate the artifact now:`;
}
