/**
 * TOGAF Artifact Prerequisites
 * Defines which artifacts should be completed before creating each artifact
 * Based on TOGAF ADM information flow and dependencies
 */

export const ARTIFACT_PREREQUISITES: Record<string, string[]> = {
  // Preliminary Phase - Foundation artifacts (no prerequisites)
  "principles-catalog": [],
  "organization-actor-catalog": [],
  
  // Phase A - Architecture Vision (depends on Preliminary)
  "driver-goal-objective-catalog": ["principles-catalog", "organization-actor-catalog"],
  "stakeholder-map-matrix": ["organization-actor-catalog"],
  "value-chain-diagram": ["driver-goal-objective-catalog"],
  "solution-concept-diagram": ["driver-goal-objective-catalog", "principles-catalog"],
  
  // Phase B - Business Architecture (depends on Phase A)
  "role-catalog": ["organization-actor-catalog"],
  "business-service-function-catalog": ["driver-goal-objective-catalog"],
  "location-catalog": [],
  "process-event-catalog": ["business-service-function-catalog"],
  "contract-agreement-catalog": ["organization-actor-catalog"],
  "business-interaction-matrix": ["organization-actor-catalog", "business-service-function-catalog"],
  "actor-role-matrix": ["organization-actor-catalog", "role-catalog"],
  "business-footprint-diagram": ["business-service-function-catalog", "organization-actor-catalog"],
  "business-service-information-diagram": ["business-service-function-catalog", "data-entity-catalog"],
  "functional-decomposition-diagram": ["business-service-function-catalog"],
  "product-lifecycle-diagram": ["business-service-function-catalog"],
  "goal-objective-service-diagram": ["driver-goal-objective-catalog", "business-service-function-catalog"],
  "business-use-case-diagram": ["organization-actor-catalog", "business-service-function-catalog"],
  "organization-decomposition-diagram": ["organization-actor-catalog"],
  "process-flow-diagram": ["process-event-catalog", "organization-actor-catalog"],
  "event-diagram": ["process-event-catalog"],
  
  // Phase C - Information Systems Architecture - Data
  "data-entity-catalog": ["business-service-function-catalog"],
  "data-entity-data-component-catalog": ["data-entity-catalog"],
  "data-entity-business-function-matrix": ["data-entity-catalog", "business-service-function-catalog"],
  "system-data-matrix": ["data-entity-catalog", "application-portfolio-catalog"],
  "conceptual-data-diagram": ["data-entity-catalog"],
  "logical-data-diagram": ["data-entity-catalog"],
  "data-dissemination-diagram": ["data-entity-catalog", "location-catalog"],
  "data-lifecycle-diagram": ["data-entity-catalog"],
  "data-security-diagram": ["data-entity-catalog"],
  "data-migration-diagram": ["data-entity-catalog"],
  
  // Phase C - Information Systems Architecture - Application
  "application-portfolio-catalog": ["business-service-function-catalog"],
  "interface-catalog": ["application-portfolio-catalog"],
  "application-function-matrix": ["application-portfolio-catalog", "business-service-function-catalog"],
  "role-application-matrix": ["role-catalog", "application-portfolio-catalog"],
  "application-interaction-matrix": ["application-portfolio-catalog", "interface-catalog"],
  "application-communication-diagram": ["application-portfolio-catalog", "interface-catalog"],
  "application-and-user-location-diagram": ["application-portfolio-catalog", "location-catalog"],
  "application-use-case-diagram": ["application-portfolio-catalog", "organization-actor-catalog"],
  "enterprise-manageability-diagram": ["application-portfolio-catalog"],
  "process-application-realization-diagram": ["process-event-catalog", "application-portfolio-catalog"],
  "software-engineering-diagram": ["application-portfolio-catalog"],
  "application-migration-diagram": ["application-portfolio-catalog"],
  "software-distribution-diagram": ["application-portfolio-catalog", "location-catalog"],
  
  // Phase D - Technology Architecture (depends on Phase C)
  "technology-standards-catalog": ["principles-catalog"],
  "technology-portfolio-catalog": ["application-portfolio-catalog"],
  "system-technology-matrix": ["application-portfolio-catalog", "technology-portfolio-catalog"],
  "application-technology-matrix": ["application-portfolio-catalog", "technology-portfolio-catalog"],
  "environments-and-locations-diagram": ["location-catalog", "technology-portfolio-catalog"],
  "platform-decomposition-diagram": ["technology-portfolio-catalog"],
  "processing-diagram": ["technology-portfolio-catalog", "application-portfolio-catalog"],
  "networked-computing-hardware-diagram": ["technology-portfolio-catalog", "location-catalog"],
  "communications-engineering-diagram": ["technology-portfolio-catalog", "location-catalog"],
  
  // Phase E - Opportunities and Solutions (depends on B, C, D)
  "project-context-diagram": ["driver-goal-objective-catalog"],
  "benefits-diagram": ["driver-goal-objective-catalog"],
  
  // Phase F - Migration Planning (depends on E)
  "implementation-factor-assessment-matrix": ["project-context-diagram"],
  "consolidated-gaps-solutions-requirements-matrix": ["application-portfolio-catalog", "technology-portfolio-catalog"],
  
  // Phase G - Implementation Governance (depends on F)
  "requirements-catalog": ["driver-goal-objective-catalog"],
  
  // Phase H - Architecture Change Management (depends on all phases)
  // Most Phase H artifacts depend on having a baseline architecture from previous phases
};

/**
 * Get prerequisite artifacts for a given artifact ID
 */
export function getPrerequisites(artifactId: string): string[] {
  return ARTIFACT_PREREQUISITES[artifactId] || [];
}

/**
 * Check if all prerequisites for an artifact are completed
 */
export function arePrerequisitesComplete(
  artifactId: string,
  completedArtifacts: Set<string>
): { complete: boolean; missing: string[] } {
  const prerequisites = getPrerequisites(artifactId);
  const missing = prerequisites.filter(prereq => !completedArtifacts.has(prereq));
  
  return {
    complete: missing.length === 0,
    missing
  };
}
