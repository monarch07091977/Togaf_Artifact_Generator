import { invokeLLM } from "./_core/llm";

/**
 * AI-Powered TOGAF Artifact Generation Service
 * 
 * This service uses LLM to generate comprehensive EA artifacts following TOGAF 10 ADM methodology.
 * It accepts project requirements and generates business capabilities, applications, data entities,
 * business processes, and requirements with appropriate relationships.
 */

export interface ProjectContext {
  name: string;
  description: string;
  industry?: string;
  scope?: string;
  businessDrivers?: string[];
  businessGoals?: string[];
  stakeholders?: string[];
  constraints?: string[];
  technicalPreferences?: string[];
  detailLevel?: "high" | "medium" | "low";
  phasesToGenerate?: string[];
}

export interface GeneratedEntity {
  name: string;
  description: string;
  normalizedName?: string;
  // Entity-specific fields
  maturityLevel?: string;
  lifecycle?: string;
  sensitivity?: string;
  priority?: string;
  requirementType?: string;
}

export interface GeneratedRelationship {
  sourceEntityName: string;
  targetEntityName: string;
  relationshipType: string;
  description?: string;
}

export interface GenerationResult {
  businessCapabilities: GeneratedEntity[];
  applications: GeneratedEntity[];
  dataEntities: GeneratedEntity[];
  businessProcesses: GeneratedEntity[];
  requirements: GeneratedEntity[];
  relationships: GeneratedRelationship[];
  metadata: {
    generatedAt: Date;
    totalEntities: number;
    totalRelationships: number;
    phases: string[];
  };
}

/**
 * Generate comprehensive TOGAF artifacts using AI
 */
export async function generateArtifacts(context: ProjectContext): Promise<GenerationResult> {
  const systemPrompt = `You are an expert Enterprise Architect specializing in TOGAF 10 ADM methodology. 
Your task is to generate comprehensive EA artifacts based on project requirements.

Generate artifacts following these principles:
1. Follow TOGAF 10 ADM best practices
2. Create realistic, industry-appropriate entities
3. Ensure proper relationships and dependencies
4. Use clear, professional naming conventions
5. Provide detailed, contextual descriptions
6. Apply appropriate maturity levels and lifecycle stages

Output must be valid JSON matching the specified schema.`;

  const userPrompt = `Generate comprehensive EA artifacts for the following project:

**Project Name:** ${context.name}
**Description:** ${context.description}
${context.industry ? `**Industry:** ${context.industry}` : ""}
${context.scope ? `**Scope:** ${context.scope}` : ""}

${context.businessDrivers && context.businessDrivers.length > 0 ? `**Business Drivers:**
${context.businessDrivers.map((d, i) => `${i + 1}. ${d}`).join("\n")}` : ""}

${context.businessGoals && context.businessGoals.length > 0 ? `**Business Goals:**
${context.businessGoals.map((g, i) => `${i + 1}. ${g}`).join("\n")}` : ""}

${context.stakeholders && context.stakeholders.length > 0 ? `**Key Stakeholders:** ${context.stakeholders.join(", ")}` : ""}

${context.constraints && context.constraints.length > 0 ? `**Constraints:**
${context.constraints.map((c, i) => `${i + 1}. ${c}`).join("\n")}` : ""}

${context.technicalPreferences && context.technicalPreferences.length > 0 ? `**Technical Preferences:** ${context.technicalPreferences.join(", ")}` : ""}

**Detail Level:** ${context.detailLevel || "medium"}

Generate the following:
1. **Business Capabilities** (5-10): Core capabilities needed, organized hierarchically
2. **Applications** (3-8): Key application components to support capabilities
3. **Data Entities** (4-10): Critical data entities managed by the system
4. **Business Processes** (3-7): Key business processes
5. **Requirements** (5-12): Functional and non-functional requirements

For each entity, provide:
- Clear, professional name
- Detailed description with context
- Appropriate attributes (maturity, lifecycle, sensitivity, priority, type)

Also generate relationships between entities following TOGAF patterns:
- SUPPORTS: Capabilities support processes
- REALIZES: Applications realize capabilities
- USES: Applications use data entities
- TRACES_TO: Requirements trace to entities
- DEPENDS_ON: Cross-entity dependencies

Ensure all relationships reference entities by their exact names.`;

  try {
    const response = await invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "togaf_artifacts",
          strict: true,
          schema: {
            type: "object",
            properties: {
              businessCapabilities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    maturityLevel: {
                      type: "string",
                      enum: ["initial", "developing", "defined", "managed", "optimizing"],
                    },
                  },
                  required: ["name", "description", "maturityLevel"],
                  additionalProperties: false,
                },
              },
              applications: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    lifecycle: {
                      type: "string",
                      enum: ["plan", "develop", "active", "retire", "retired"],
                    },
                  },
                  required: ["name", "description", "lifecycle"],
                  additionalProperties: false,
                },
              },
              dataEntities: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    sensitivity: {
                      type: "string",
                      enum: ["public", "internal", "confidential", "restricted"],
                    },
                  },
                  required: ["name", "description", "sensitivity"],
                  additionalProperties: false,
                },
              },
              businessProcesses: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                  },
                  required: ["name", "description"],
                  additionalProperties: false,
                },
              },
              requirements: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    name: { type: "string" },
                    description: { type: "string" },
                    priority: {
                      type: "string",
                      enum: ["low", "medium", "high", "critical"],
                    },
                    requirementType: {
                      type: "string",
                      enum: ["functional", "non_functional", "constraint", "assumption"],
                    },
                  },
                  required: ["name", "description", "priority", "requirementType"],
                  additionalProperties: false,
                },
              },
              relationships: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    sourceEntityName: { type: "string" },
                    targetEntityName: { type: "string" },
                    relationshipType: {
                      type: "string",
                      enum: [
                        "SUPPORTS",
                        "DEPENDS_ON",
                        "REALIZES",
                        "USES",
                        "PROVIDES_DATA_TO",
                        "CONSUMES_DATA_FROM",
                        "TRACES_TO",
                      ],
                    },
                    description: { type: "string" },
                  },
                  required: ["sourceEntityName", "targetEntityName", "relationshipType"],
                  additionalProperties: false,
                },
              },
            },
            required: [
              "businessCapabilities",
              "applications",
              "dataEntities",
              "businessProcesses",
              "requirements",
              "relationships",
            ],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    if (!content || typeof content !== "string") {
      throw new Error("No valid content generated from LLM");
    }

    const parsedResult = JSON.parse(content);

    // Add normalized names
    const addNormalizedNames = (entities: GeneratedEntity[]) => {
      return entities.map((entity) => ({
        ...entity,
        normalizedName: entity.name
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "_")
          .replace(/^_|_$/g, ""),
      }));
    };

    const result: GenerationResult = {
      businessCapabilities: addNormalizedNames(parsedResult.businessCapabilities),
      applications: addNormalizedNames(parsedResult.applications),
      dataEntities: addNormalizedNames(parsedResult.dataEntities),
      businessProcesses: addNormalizedNames(parsedResult.businessProcesses),
      requirements: addNormalizedNames(parsedResult.requirements),
      relationships: parsedResult.relationships,
      metadata: {
        generatedAt: new Date(),
        totalEntities:
          parsedResult.businessCapabilities.length +
          parsedResult.applications.length +
          parsedResult.dataEntities.length +
          parsedResult.businessProcesses.length +
          parsedResult.requirements.length,
        totalRelationships: parsedResult.relationships.length,
        phases: context.phasesToGenerate || ["A", "B", "C"],
      },
    };

    return result;
  } catch (error) {
    console.error("[AI Generation] Failed to generate artifacts:", error);
    throw new Error(`Failed to generate artifacts: ${error instanceof Error ? error.message : "Unknown error"}`);
  }
}

/**
 * Regenerate a specific section of artifacts
 */
export async function regenerateSection(
  context: ProjectContext,
  section: "businessCapabilities" | "applications" | "dataEntities" | "businessProcesses" | "requirements"
): Promise<GeneratedEntity[]> {
  // Similar to generateArtifacts but focused on one section
  // Implementation would be similar but with a more focused prompt
  throw new Error("Not implemented yet");
}
