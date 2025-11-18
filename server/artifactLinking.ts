import { Artifact, QuestionnaireResponse } from "../drizzle/schema";
import { TOGAF_ARTIFACTS } from "../shared/togafArtifacts";

/**
 * Extract relevant data from source artifacts for auto-population
 */
export function extractDataForAutoPopulation(
  targetArtifactId: string,
  sourceArtifacts: Artifact[],
  sourceResponses: Map<number, QuestionnaireResponse[]>
): Record<string, { value: string; source: string }> {
  const targetDef = TOGAF_ARTIFACTS[targetArtifactId];
  if (!targetDef) return {};

  const autoPopulatedData: Record<string, { value: string; source: string }> = {};

  // Check if target artifact has defined input dependencies
  if (!targetDef.inputFrom || targetDef.inputFrom.length === 0) {
    return autoPopulatedData;
  }

  // Extract data based on artifact type and relationships
  for (const sourceArtifact of sourceArtifacts) {
    const sourceArtifactDefId = Object.keys(TOGAF_ARTIFACTS).find(
      (key) => TOGAF_ARTIFACTS[key].name === sourceArtifact.name
    );

    if (!sourceArtifactDefId) continue;

    // Check if this source is relevant for the target
    const isRelevantSource =
      targetDef.inputFrom.includes(sourceArtifactDefId) ||
      targetDef.inputFrom.includes(sourceArtifact.phase);

    if (!isRelevantSource) continue;

    const responses = sourceResponses.get(sourceArtifact.id) || [];

    // Extract stakeholders
    const stakeholderResponse = responses.find((r) => r.questionId === "stakeholders");
    if (stakeholderResponse && stakeholderResponse.answer) {
      if (!autoPopulatedData["stakeholders"]) {
        autoPopulatedData["stakeholders"] = {
          value: stakeholderResponse.answer,
          source: `${sourceArtifact.name} (${sourceArtifact.phase})`,
        };
      }
    }

    // Extract objectives
    const objectivesResponse = responses.find((r) => r.questionId === "objectives");
    if (objectivesResponse && objectivesResponse.answer) {
      if (!autoPopulatedData["objectives"]) {
        autoPopulatedData["objectives"] = {
          value: objectivesResponse.answer,
          source: `${sourceArtifact.name} (${sourceArtifact.phase})`,
        };
      }
    }

    // Extract constraints
    const constraintsResponse = responses.find((r) => r.questionId === "constraints");
    if (constraintsResponse && constraintsResponse.answer) {
      if (!autoPopulatedData["constraints"]) {
        autoPopulatedData["constraints"] = {
          value: constraintsResponse.answer,
          source: `${sourceArtifact.name} (${sourceArtifact.phase})`,
        };
      }
    }

    // Extract scope
    const scopeResponse = responses.find((r) => r.questionId === "scope");
    if (scopeResponse && scopeResponse.answer) {
      if (!autoPopulatedData["scope"]) {
        autoPopulatedData["scope"] = {
          value: scopeResponse.answer,
          source: `${sourceArtifact.name} (${sourceArtifact.phase})`,
        };
      }
    }

    // Extract from generated content for more specific data
    if (sourceArtifact.generatedContent) {
      const content = sourceArtifact.generatedContent;

      // Extract business drivers (common in early phases)
      if (sourceArtifact.phase === "Phase A" || sourceArtifact.phase === "Preliminary") {
        const driversMatch = content.match(/(?:business drivers?|drivers?)[:\s]+(.*?)(?:\n\n|$)/i);
        if (driversMatch && !autoPopulatedData["business_drivers"]) {
          autoPopulatedData["business_drivers"] = {
            value: driversMatch[1].trim(),
            source: `${sourceArtifact.name} (${sourceArtifact.phase})`,
          };
        }
      }

      // Extract principles (from Preliminary phase)
      if (sourceArtifact.phase === "Preliminary" && sourceArtifact.name.includes("Principles")) {
        const principlesMatch = content.match(/(?:principles?)[:\s]+(.*?)(?:\n\n|$)/i);
        if (principlesMatch && !autoPopulatedData["principles"]) {
          autoPopulatedData["principles"] = {
            value: principlesMatch[1].trim(),
            source: `${sourceArtifact.name} (${sourceArtifact.phase})`,
          };
        }
      }
    }
  }

  return autoPopulatedData;
}

/**
 * Get all artifacts that could provide input to the target artifact
 */
export function getRelevantSourceArtifacts(
  targetArtifactId: string,
  targetPhase: string,
  allArtifacts: Artifact[]
): Artifact[] {
  const targetDef = TOGAF_ARTIFACTS[targetArtifactId];
  if (!targetDef) return [];

  const phaseOrder = [
    "Preliminary",
    "Phase A",
    "Phase B",
    "Phase C",
    "Phase D",
    "Phase E",
    "Phase F",
    "Phase G",
    "Phase H",
  ];

  const targetPhaseIndex = phaseOrder.indexOf(targetPhase);

  // Get artifacts from earlier phases that could provide input
  return allArtifacts.filter((artifact) => {
    const artifactPhaseIndex = phaseOrder.indexOf(artifact.phase);

    // Only consider artifacts from earlier or same phase
    if (artifactPhaseIndex > targetPhaseIndex) return false;

    // Check if explicitly defined as input source
    if (targetDef.inputFrom) {
      const artifactDefId = Object.keys(TOGAF_ARTIFACTS).find(
        (key) => TOGAF_ARTIFACTS[key].name === artifact.name
      );
      if (artifactDefId && targetDef.inputFrom.includes(artifactDefId)) {
        return true;
      }
      if (targetDef.inputFrom.includes(artifact.phase)) {
        return true;
      }
    }

    // Include key foundational artifacts
    if (
      artifact.phase === "Preliminary" ||
      artifact.phase === "Phase A" ||
      artifact.name.includes("Principles") ||
      artifact.name.includes("Vision") ||
      artifact.name.includes("Stakeholder")
    ) {
      return true;
    }

    return false;
  });
}

/**
 * Merge auto-populated data with user responses
 * User responses take precedence
 */
export function mergeWithUserResponses(
  autoPopulatedData: Record<string, { value: string; source: string }>,
  userResponses: QuestionnaireResponse[]
): Record<string, { value: string; source: string; isUserProvided: boolean }> {
  const merged: Record<string, { value: string; source: string; isUserProvided: boolean }> = {};

  // Add auto-populated data
  for (const [key, data] of Object.entries(autoPopulatedData)) {
    merged[key] = { ...data, isUserProvided: false };
  }

  // Override with user responses
  for (const response of userResponses) {
    if (response.answer && response.answer.trim()) {
      merged[response.questionId] = {
        value: response.answer,
        source: "User input",
        isUserProvided: true,
      };
    }
  }

  return merged;
}
