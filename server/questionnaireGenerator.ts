import { invokeLLM } from "./_core/llm";
import { TOGAF_ARTIFACTS } from "../shared/togafArtifacts";

interface QuestionnaireQuestion {
  id: string;
  text: string;
  placeholder: string;
  context: string;
  example: string;
}

/**
 * Generate TOGAF-specific questionnaire for an artifact type
 * Uses the official TOGAF Standard documentation to ensure questions are relevant
 * and help generate accurate, standards-compliant artifact content.
 */
export async function generateTogafQuestionnaire(
  artifactDefId: string,
  projectDescription?: string
): Promise<QuestionnaireQuestion[]> {
  const artifactDef = TOGAF_ARTIFACTS[artifactDefId];
  
  if (!artifactDef) {
    throw new Error(`Unknown artifact: ${artifactDefId}`);
  }

  const prompt = `Generate a comprehensive questionnaire for creating a TOGAF **${artifactDef.name}** artifact.

## Artifact Context
**Name:** ${artifactDef.name}
**Type:** ${artifactDef.type}
**Phases:** ${artifactDef.phases.join(", ")}
**Description:** ${artifactDef.description}
**Purpose:** ${artifactDef.purpose}

## TOGAF Standard Requirements
Reference TOGAF 10 Standard Part 4 (Architecture Content) for this artifact type.
The questionnaire must gather information needed to populate the artifact's typical contents as specified in the TOGAF Content Framework.

## Typical Contents (from TOGAF)
${artifactDef.typicalContents.join("\n")}

## ADM Usage
${artifactDef.admUsage}

${projectDescription ? `## Project Context\n${projectDescription}\n` : ""}

## Requirements
Generate 6-8 focused questions that:
1. **Align with TOGAF metamodel** - Ask about relevant entities, attributes, and relationships
2. **Cover typical contents** - Ensure all key sections of the artifact can be populated
3. **Support ADM phase objectives** - Help achieve the goals of the relevant ADM phase(s)
4. **Enable traceability** - Connect to Architecture Vision, principles, and requirements
5. **Are specific and actionable** - Avoid generic questions; tailor to this artifact type
6. **Follow TOGAF terminology** - Use standard TOGAF terms and concepts
7. **Support stakeholder needs** - Address concerns of relevant stakeholders
8. **Enable quality content** - Gather sufficient detail for professional output
9. **Support ADM phases** - Address requirements for ${artifactDef.phases.join(" and ")} phase(s)

## Question Structure
For each question provide:
- **id**: Short kebab-case identifier (e.g., "business-drivers", "capability-gaps")
- **text**: Clear, specific question aligned with TOGAF requirements
- **placeholder**: Helpful placeholder text showing expected format
- **context**: Why this question matters and how it relates to TOGAF
- **example**: Concrete example answer demonstrating the expected detail level

Generate the questionnaire now.`;

  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a TOGAF 10 expert creating artifact-specific questionnaires.
Your questionnaires must be based on the official TOGAF Standard documentation (Parts 0-5).
Focus on gathering information that directly supports creating standards-compliant artifacts.
Each question should map to specific TOGAF Content Framework elements and typical contents.`,
      },
      {
        role: "user",
        content: prompt,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "questionnaire",
        strict: true,
        schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              description: "Array of questionnaire questions",
              items: {
                type: "object",
                properties: {
                  id: {
                    type: "string",
                    description: "Unique identifier in kebab-case",
                  },
                  text: {
                    type: "string",
                    description: "The question text",
                  },
                  placeholder: {
                    type: "string",
                    description: "Placeholder text for the input field",
                  },
                  context: {
                    type: "string",
                    description: "Explanation of why this question matters",
                  },
                  example: {
                    type: "string",
                    description: "Example answer demonstrating expected detail",
                  },
                },
                required: ["id", "text", "placeholder", "context", "example"],
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
  if (!content || typeof content !== "string") {
    throw new Error("Failed to generate questionnaire");
  }

  const result = JSON.parse(content) as { questions: QuestionnaireQuestion[] };
  return result.questions;
}
