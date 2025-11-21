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
  purpose: string; // What this artifact achieves
  typicalContents: string[]; // What should be included
  admUsage: string; // How it's used in ADM
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
    description: "List of architecture principles that guide decision-making throughout the ADM",
    purpose: "Establishes the fundamental rules and guidelines that inform and support the way an organization sets about fulfilling its mission. Principles provide a framework for decision-making and help ensure consistency across the architecture.",
    typicalContents: [
      "Principle name and statement",
      "Rationale explaining why the principle is important",
      "Implications describing the impact of adhering to the principle",
      "Business principles (e.g., business continuity, service orientation)",
      "Data principles (e.g., data is an asset, data is shared)",
      "Application principles (e.g., technology independence, ease of use)",
      "Technology principles (e.g., interoperability, scalability)"
    ],
    admUsage: "Created in the Preliminary Phase and refined in Phase A. Used throughout all subsequent phases to guide architecture decisions and evaluate alternatives. Principles should be reviewed and validated with stakeholders to ensure alignment with business strategy.",
    outputTo: ["Phase A", "Phase B", "Phase C", "Phase D"],
  },
  "organization-actor-catalog": {
    id: "organization-actor-catalog",
    name: "Organization/Actor Catalog",
    type: "catalog",
    category: "Business",
    phases: ["Preliminary", "Phase A", "Phase B"],
    description: "Identifies all organizations and actors (people, systems, or organizational units) that interact with the architecture",
    purpose: "Documents the organizational structure and identifies actors who participate in business processes. Essential for understanding stakeholder relationships, responsibilities, and interactions within the enterprise ecosystem.",
    typicalContents: [
      "Organization name and description",
      "Organization type (internal department, external partner, customer, supplier)",
      "Actor name and role",
      "Actor type (person, system, organizational unit)",
      "Relationships between organizations and actors",
      "Contact information and ownership",
      "Geographic location"
    ],
    admUsage: "Developed initially in Preliminary Phase for stakeholder analysis, expanded in Phase A for Architecture Vision, and detailed in Phase B for Business Architecture. Used to identify who is affected by architecture changes and who needs to be engaged in the architecture development process.",
  },
  "driver-goal-objective-catalog": {
    id: "driver-goal-objective-catalog",
    name: "Driver/Goal/Objective Catalog",
    type: "catalog",
    category: "Business",
    phases: ["Preliminary", "Phase A", "Phase B"],
    description: "Documents the business drivers, strategic goals, and specific objectives that the architecture must support",
    purpose: "Establishes clear linkage between business strategy and architecture work. Ensures that architecture development is driven by business needs and that architecture decisions can be traced back to business objectives.",
    typicalContents: [
      "Business drivers (external factors forcing change: regulations, competition, technology)",
      "Strategic goals (high-level business ambitions)",
      "Specific objectives (measurable targets supporting goals)",
      "Key performance indicators (KPIs) for measuring success",
      "Relationships between drivers, goals, and objectives",
      "Priority and timeline for each objective",
      "Stakeholder ownership"
    ],
    admUsage: "Created in Preliminary Phase and Phase A to establish business context. Referenced throughout ADM to ensure architecture solutions address business needs. Critical input for Phase E (Opportunities and Solutions) to prioritize initiatives based on business value.",
  },
  "role-catalog": {
    id: "role-catalog",
    name: "Role Catalog",
    type: "catalog",
    category: "Business",
    phases: ["Phase B"],
    description: "Defines the roles that actors perform within the business architecture",
    purpose: "Separates the concept of 'who' (actors) from 'what they do' (roles), enabling better understanding of responsibilities, skill requirements, and organizational flexibility. Supports workforce planning and process design.",
    typicalContents: [
      "Role name and description",
      "Responsibilities and accountabilities",
      "Required skills and competencies",
      "Authority level and decision-making rights",
      "Relationships to business functions and processes",
      "Actors who can perform this role",
      "Role dependencies and hierarchies"
    ],
    admUsage: "Developed in Phase B (Business Architecture) to support business process modeling and organizational design. Used with Actor/Role Matrix to show which actors perform which roles. Essential for change management and training planning in Phase F.",
  },
  "business-service-function-catalog": {
    id: "business-service-function-catalog",
    name: "Business Service/Function Catalog",
    type: "catalog",
    category: "Business",
    phases: ["Phase B"],
    description: "Documents the business services offered to customers and the business functions that deliver them",
    purpose: "Provides a clear view of what the business does (functions) and what value it delivers (services). Enables service-oriented thinking and helps identify opportunities for shared services, outsourcing, or process improvement.",
    typicalContents: [
      "Business service name and description",
      "Service level objectives and measures",
      "Service consumers (internal/external)",
      "Business function name and description",
      "Function decomposition (parent-child relationships)",
      "Mapping between services and functions that deliver them",
      "Ownership and accountability"
    ],
    admUsage: "Core artifact of Phase B (Business Architecture). Used to create functional decomposition diagrams and understand business capabilities. Provides foundation for identifying supporting applications in Phase C and infrastructure in Phase D.",
  },
  "location-catalog": {
    id: "location-catalog",
    name: "Location Catalog",
    type: "catalog",
    category: "Business",
    phases: ["Phase B"],
    description: "Identifies all physical locations where the enterprise operates or has presence",
    purpose: "Documents geographic distribution of business operations, facilities, and resources. Critical for understanding constraints related to physical location, such as data sovereignty, network latency, disaster recovery, and regulatory compliance.",
    typicalContents: [
      "Location name and address",
      "Location type (headquarters, branch office, data center, warehouse, retail store)",
      "Geographic coordinates",
      "Time zone",
      "Regulatory jurisdiction",
      "Business functions performed at location",
      "Number of employees/users",
      "Facility characteristics (size, capabilities, hours of operation)"
    ],
    admUsage: "Developed in Phase B and used throughout Phases C and D to understand where applications and technology infrastructure must be deployed. Essential for network architecture, data residency requirements, and business continuity planning.",
  },
  "process-event-control-product-catalog": {
    id: "process-event-control-product-catalog",
    name: "Process/Event/Control/Product Catalog",
    type: "catalog",
    category: "Business",
    phases: ["Phase B"],
    description: "Comprehensive catalog of business processes, triggering events, control mechanisms, and resulting products/services",
    purpose: "Provides detailed view of how work flows through the organization, what triggers activities, how quality and compliance are ensured, and what outputs are produced. Foundation for process improvement and automation initiatives.",
    typicalContents: [
      "Process name, description, and decomposition",
      "Process inputs and outputs",
      "Process steps and sequence",
      "Events that trigger processes (time-based, data-driven, external)",
      "Controls ensuring process quality, compliance, and governance",
      "Products and services produced",
      "Process owners and performers",
      "Performance metrics and KPIs"
    ],
    admUsage: "Central to Phase B (Business Architecture) for documenting current and target business processes. Used to identify automation opportunities in Phase C (Application Architecture) and to design workflow systems. Critical input for business process reengineering initiatives.",
  },
  "contract-measure-catalog": {
    id: "contract-measure-catalog",
    name: "Contract/Measure Catalog",
    type: "catalog",
    category: "Business",
    phases: ["Phase B"],
    description: "Documents formal agreements and the metrics used to measure business and architecture performance",
    purpose: "Ensures that service levels, performance expectations, and contractual obligations are clearly defined and measurable. Enables monitoring, governance, and continuous improvement of architecture outcomes.",
    typicalContents: [
      "Contract name and parties involved",
      "Contract type (SLA, OLA, vendor contract, partnership agreement)",
      "Contract terms and conditions",
      "Performance measures and KPIs",
      "Measurement methods and frequency",
      "Target values and thresholds",
      "Consequences of non-compliance",
      "Review and renewal dates"
    ],
    admUsage: "Developed in Phase B to document service level agreements and business performance measures. Referenced in Phase E for evaluating solution options and in Phase G for implementation governance. Essential for Phase H to measure architecture effectiveness.",
  },
  "data-entity-component-catalog": {
    id: "data-entity-component-catalog",
    name: "Data Entity/Data Component Catalog",
    type: "catalog",
    category: "Data",
    phases: ["Phase C"],
    description: "Data entities and components in the information architecture",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "application-portfolio-catalog": {
    id: "application-portfolio-catalog",
    name: "Application Portfolio Catalog",
    type: "catalog",
    category: "Application",
    phases: ["Phase C"],
    description: "Complete list of applications in the enterprise",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "interface-catalog": {
    id: "interface-catalog",
    name: "Interface Catalog",
    type: "catalog",
    category: "Application",
    phases: ["Phase C"],
    description: "Application interfaces and integration points",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "technology-standards-catalog": {
    id: "technology-standards-catalog",
    name: "Technology Standards Catalog",
    type: "catalog",
    category: "Technology",
    phases: ["Phase D"],
    description: "Technology standards and guidelines",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "technology-portfolio-catalog": {
    id: "technology-portfolio-catalog",
    name: "Technology Portfolio Catalog",
    type: "catalog",
    category: "Technology",
    phases: ["Phase D"],
    description: "Technology components and infrastructure",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "requirements-catalog": {
    id: "requirements-catalog",
    name: "Requirements Catalog",
    type: "catalog",
    category: "Requirements",
    phases: ["Phase A", "Phase B", "Phase C", "Phase D", "Phase E"],
    description: "Architecture requirements (functional and non-functional)",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },

  // Matrices (10 types)
  "stakeholder-map-matrix": {
    id: "stakeholder-map-matrix",
    name: "Stakeholder Map Matrix",
    type: "matrix",
    category: "Governance",
    phases: ["Phase A"],
    description: "Mapping of stakeholders to their concerns and influence",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "business-interaction-matrix": {
    id: "business-interaction-matrix",
    name: "Business Interaction Matrix",
    type: "matrix",
    category: "Business",
    phases: ["Phase B"],
    description: "Interactions between business functions and services",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "actor-role-matrix": {
    id: "actor-role-matrix",
    name: "Actor/Role Matrix",
    type: "matrix",
    category: "Business",
    phases: ["Phase B"],
    description: "Mapping of actors to their roles",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "data-entity-business-function-matrix": {
    id: "data-entity-business-function-matrix",
    name: "Data Entity/Business Function Matrix",
    type: "matrix",
    category: "Data",
    phases: ["Phase C"],
    description: "Relationship between data entities and business functions",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "application-data-matrix": {
    id: "application-data-matrix",
    name: "Application/Data Matrix",
    type: "matrix",
    category: "Application",
    phases: ["Phase C"],
    description: "Applications and the data they create, read, update, or delete",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "application-organization-matrix": {
    id: "application-organization-matrix",
    name: "Application/Organization Matrix",
    type: "matrix",
    category: "Application",
    phases: ["Phase C"],
    description: "Applications used by organizational units",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "role-application-matrix": {
    id: "role-application-matrix",
    name: "Role/Application Matrix",
    type: "matrix",
    category: "Application",
    phases: ["Phase C"],
    description: "Roles and the applications they use",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "application-function-matrix": {
    id: "application-function-matrix",
    name: "Application/Function Matrix",
    type: "matrix",
    category: "Application",
    phases: ["Phase C"],
    description: "Applications supporting business functions",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "application-interaction-matrix": {
    id: "application-interaction-matrix",
    name: "Application Interaction Matrix",
    type: "matrix",
    category: "Application",
    phases: ["Phase C"],
    description: "Interactions and dependencies between applications",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "application-technology-matrix": {
    id: "application-technology-matrix",
    name: "Application/Technology Matrix",
    type: "matrix",
    category: "Technology",
    phases: ["Phase D"],
    description: "Applications and their underlying technology platforms",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },

  // Diagrams (32 types) - Key ones for MVP
  "value-chain-diagram": {
    id: "value-chain-diagram",
    name: "Value Chain Diagram",
    type: "diagram",
    category: "Business",
    phases: ["Phase B"],
    description: "Visual representation of the organization's value chain",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "solution-concept-diagram": {
    id: "solution-concept-diagram",
    name: "Solution Concept Diagram",
    type: "diagram",
    category: "Architecture",
    phases: ["Phase A", "Phase E"],
    description: "High-level solution concept and components",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "business-footprint-diagram": {
    id: "business-footprint-diagram",
    name: "Business Footprint Diagram",
    type: "diagram",
    category: "Business",
    phases: ["Phase B"],
    description: "Business functions and their geographic distribution",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "functional-decomposition-diagram": {
    id: "functional-decomposition-diagram",
    name: "Functional Decomposition Diagram",
    type: "diagram",
    category: "Business",
    phases: ["Phase B"],
    description: "Hierarchical breakdown of business functions",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "process-flow-diagram": {
    id: "process-flow-diagram",
    name: "Process Flow Diagram",
    type: "diagram",
    category: "Business",
    phases: ["Phase B"],
    description: "Business process flows and decision points",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "conceptual-data-diagram": {
    id: "conceptual-data-diagram",
    name: "Conceptual Data Diagram",
    type: "diagram",
    category: "Data",
    phases: ["Phase C"],
    description: "High-level data concepts and relationships",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "logical-data-diagram": {
    id: "logical-data-diagram",
    name: "Logical Data Diagram",
    type: "diagram",
    category: "Data",
    phases: ["Phase C"],
    description: "Detailed logical data model",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "application-communication-diagram": {
    id: "application-communication-diagram",
    name: "Application Communication Diagram",
    type: "diagram",
    category: "Application",
    phases: ["Phase C"],
    description: "Application interfaces and communication patterns",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "platform-decomposition-diagram": {
    id: "platform-decomposition-diagram",
    name: "Platform Decomposition Diagram",
    type: "diagram",
    category: "Technology",
    phases: ["Phase D"],
    description: "Technology platform components and layers",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "networked-computing-diagram": {
    id: "networked-computing-diagram",
    name: "Networked Computing/Hardware Diagram",
    type: "diagram",
    category: "Technology",
    phases: ["Phase D"],
    description: "Network topology and hardware infrastructure",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "project-context-diagram": {
    id: "project-context-diagram",
    name: "Project Context Diagram",
    type: "diagram",
    category: "Migration",
    phases: ["Phase E", "Phase F"],
    description: "Project scope and context for implementation",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
  },
  "benefits-diagram": {
    id: "benefits-diagram",
    name: "Benefits Diagram",
    type: "diagram",
    category: "Migration",
    phases: ["Phase E"],
    description: "Expected benefits and their realization timeline",
    purpose: "Supports architecture development by providing structured information for decision-making and documentation.",
    typicalContents: [
      "Key information relevant to this artifact type",
      "Relationships to other architecture elements",
      "Metadata and governance information"
    ],
    admUsage: "Used in relevant ADM phases to support architecture development and decision-making.",
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
