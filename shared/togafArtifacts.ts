/**
 * TOGAF Artifact Definitions
 * Complete list of all TOGAF 10 artifacts with metadata
 */

export const ADM_PHASES = [
  "Preliminary",
  "Phase A",
  "Phase B",
  "Phase C",
  "Phase D",
  "Phase E",
  "Phase F",
  "Phase G",
  "Phase H",
] as const;

export type ADMPhase = typeof ADM_PHASES[number];

export interface ArtifactDefinition {
  id: string;
  name: string;
  type: "catalog" | "matrix" | "diagram";
  category: string;
  phases: ADMPhase[];
  description: string;
  inputFrom?: string[]; // Artifact IDs that provide input
  outputTo?: string[]; // Artifact IDs that consume this output
}

export const TOGAF_ARTIFACTS: Record<string, ArtifactDefinition> = {
  // Catalogs (14 types)
  "principles-catalog": {
    id: "principles-catalog",
    name: "Principles Catalog",
    type: "catalog",
    category: "Governance",
    phases: ["Preliminary", "Phase A"],
    description: "List of architecture principles that guide decision-making",
    outputTo: ["Phase A", "Phase B", "Phase C", "Phase D"],
  },
  "organization-actor-catalog": {
    id: "organization-actor-catalog",
    name: "Organization/Actor Catalog",
    type: "catalog",
    category: "Business",
    phases: ["Preliminary", "Phase A", "Phase B"],
    description: "List of organizations and actors involved in the enterprise",
  },
  "driver-goal-objective-catalog": {
    id: "driver-goal-objective-catalog",
    name: "Driver/Goal/Objective Catalog",
    type: "catalog",
    category: "Business",
    phases: ["Preliminary", "Phase A", "Phase B"],
    description: "Business drivers, goals, and objectives",
  },
  "role-catalog": {
    id: "role-catalog",
    name: "Role Catalog",
    type: "catalog",
    category: "Business",
    phases: ["Phase B"],
    description: "List of roles within the organization",
  },
  "business-service-function-catalog": {
    id: "business-service-function-catalog",
    name: "Business Service/Function Catalog",
    type: "catalog",
    category: "Business",
    phases: ["Phase B"],
    description: "Business services and functions provided by the organization",
  },
  "location-catalog": {
    id: "location-catalog",
    name: "Location Catalog",
    type: "catalog",
    category: "Business",
    phases: ["Phase B"],
    description: "Physical locations relevant to the enterprise",
  },
  "process-event-control-product-catalog": {
    id: "process-event-control-product-catalog",
    name: "Process/Event/Control/Product Catalog",
    type: "catalog",
    category: "Business",
    phases: ["Phase B"],
    description: "Business processes, events, controls, and products",
  },
  "contract-measure-catalog": {
    id: "contract-measure-catalog",
    name: "Contract/Measure Catalog",
    type: "catalog",
    category: "Business",
    phases: ["Phase B"],
    description: "Contracts and performance measures",
  },
  "data-entity-component-catalog": {
    id: "data-entity-component-catalog",
    name: "Data Entity/Data Component Catalog",
    type: "catalog",
    category: "Data",
    phases: ["Phase C"],
    description: "Data entities and components in the information architecture",
  },
  "application-portfolio-catalog": {
    id: "application-portfolio-catalog",
    name: "Application Portfolio Catalog",
    type: "catalog",
    category: "Application",
    phases: ["Phase C"],
    description: "Complete list of applications in the enterprise",
  },
  "interface-catalog": {
    id: "interface-catalog",
    name: "Interface Catalog",
    type: "catalog",
    category: "Application",
    phases: ["Phase C"],
    description: "Application interfaces and integration points",
  },
  "technology-standards-catalog": {
    id: "technology-standards-catalog",
    name: "Technology Standards Catalog",
    type: "catalog",
    category: "Technology",
    phases: ["Phase D"],
    description: "Technology standards and guidelines",
  },
  "technology-portfolio-catalog": {
    id: "technology-portfolio-catalog",
    name: "Technology Portfolio Catalog",
    type: "catalog",
    category: "Technology",
    phases: ["Phase D"],
    description: "Technology components and infrastructure",
  },
  "requirements-catalog": {
    id: "requirements-catalog",
    name: "Requirements Catalog",
    type: "catalog",
    category: "Requirements",
    phases: ["Phase A", "Phase B", "Phase C", "Phase D", "Phase E"],
    description: "Architecture requirements (functional and non-functional)",
  },

  // Matrices (10 types)
  "stakeholder-map-matrix": {
    id: "stakeholder-map-matrix",
    name: "Stakeholder Map Matrix",
    type: "matrix",
    category: "Governance",
    phases: ["Phase A"],
    description: "Mapping of stakeholders to their concerns and influence",
  },
  "business-interaction-matrix": {
    id: "business-interaction-matrix",
    name: "Business Interaction Matrix",
    type: "matrix",
    category: "Business",
    phases: ["Phase B"],
    description: "Interactions between business functions and services",
  },
  "actor-role-matrix": {
    id: "actor-role-matrix",
    name: "Actor/Role Matrix",
    type: "matrix",
    category: "Business",
    phases: ["Phase B"],
    description: "Mapping of actors to their roles",
  },
  "data-entity-business-function-matrix": {
    id: "data-entity-business-function-matrix",
    name: "Data Entity/Business Function Matrix",
    type: "matrix",
    category: "Data",
    phases: ["Phase C"],
    description: "Relationship between data entities and business functions",
  },
  "application-data-matrix": {
    id: "application-data-matrix",
    name: "Application/Data Matrix",
    type: "matrix",
    category: "Application",
    phases: ["Phase C"],
    description: "Applications and the data they create, read, update, or delete",
  },
  "application-organization-matrix": {
    id: "application-organization-matrix",
    name: "Application/Organization Matrix",
    type: "matrix",
    category: "Application",
    phases: ["Phase C"],
    description: "Applications used by organizational units",
  },
  "role-application-matrix": {
    id: "role-application-matrix",
    name: "Role/Application Matrix",
    type: "matrix",
    category: "Application",
    phases: ["Phase C"],
    description: "Roles and the applications they use",
  },
  "application-function-matrix": {
    id: "application-function-matrix",
    name: "Application/Function Matrix",
    type: "matrix",
    category: "Application",
    phases: ["Phase C"],
    description: "Applications supporting business functions",
  },
  "application-interaction-matrix": {
    id: "application-interaction-matrix",
    name: "Application Interaction Matrix",
    type: "matrix",
    category: "Application",
    phases: ["Phase C"],
    description: "Interactions and dependencies between applications",
  },
  "application-technology-matrix": {
    id: "application-technology-matrix",
    name: "Application/Technology Matrix",
    type: "matrix",
    category: "Technology",
    phases: ["Phase D"],
    description: "Applications and their underlying technology platforms",
  },

  // Diagrams (32 types) - Key ones for MVP
  "value-chain-diagram": {
    id: "value-chain-diagram",
    name: "Value Chain Diagram",
    type: "diagram",
    category: "Business",
    phases: ["Phase B"],
    description: "Visual representation of the organization's value chain",
  },
  "solution-concept-diagram": {
    id: "solution-concept-diagram",
    name: "Solution Concept Diagram",
    type: "diagram",
    category: "Architecture",
    phases: ["Phase A", "Phase E"],
    description: "High-level solution concept and components",
  },
  "business-footprint-diagram": {
    id: "business-footprint-diagram",
    name: "Business Footprint Diagram",
    type: "diagram",
    category: "Business",
    phases: ["Phase B"],
    description: "Business functions and their geographic distribution",
  },
  "functional-decomposition-diagram": {
    id: "functional-decomposition-diagram",
    name: "Functional Decomposition Diagram",
    type: "diagram",
    category: "Business",
    phases: ["Phase B"],
    description: "Hierarchical breakdown of business functions",
  },
  "process-flow-diagram": {
    id: "process-flow-diagram",
    name: "Process Flow Diagram",
    type: "diagram",
    category: "Business",
    phases: ["Phase B"],
    description: "Business process flows and decision points",
  },
  "conceptual-data-diagram": {
    id: "conceptual-data-diagram",
    name: "Conceptual Data Diagram",
    type: "diagram",
    category: "Data",
    phases: ["Phase C"],
    description: "High-level data concepts and relationships",
  },
  "logical-data-diagram": {
    id: "logical-data-diagram",
    name: "Logical Data Diagram",
    type: "diagram",
    category: "Data",
    phases: ["Phase C"],
    description: "Detailed logical data model",
  },
  "application-communication-diagram": {
    id: "application-communication-diagram",
    name: "Application Communication Diagram",
    type: "diagram",
    category: "Application",
    phases: ["Phase C"],
    description: "Application interfaces and communication patterns",
  },
  "platform-decomposition-diagram": {
    id: "platform-decomposition-diagram",
    name: "Platform Decomposition Diagram",
    type: "diagram",
    category: "Technology",
    phases: ["Phase D"],
    description: "Technology platform components and layers",
  },
  "networked-computing-diagram": {
    id: "networked-computing-diagram",
    name: "Networked Computing/Hardware Diagram",
    type: "diagram",
    category: "Technology",
    phases: ["Phase D"],
    description: "Network topology and hardware infrastructure",
  },
  "project-context-diagram": {
    id: "project-context-diagram",
    name: "Project Context Diagram",
    type: "diagram",
    category: "Migration",
    phases: ["Phase E", "Phase F"],
    description: "Project scope and context for implementation",
  },
  "benefits-diagram": {
    id: "benefits-diagram",
    name: "Benefits Diagram",
    type: "diagram",
    category: "Migration",
    phases: ["Phase E"],
    description: "Expected benefits and their realization timeline",
  },
};

export const getArtifactsByPhase = (phase: ADMPhase): ArtifactDefinition[] => {
  return Object.values(TOGAF_ARTIFACTS).filter((artifact) =>
    artifact.phases.includes(phase)
  );
};

export const getArtifactsByType = (type: "catalog" | "matrix" | "diagram"): ArtifactDefinition[] => {
  return Object.values(TOGAF_ARTIFACTS).filter((artifact) => artifact.type === type);
};
