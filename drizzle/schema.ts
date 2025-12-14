import { relations } from "drizzle-orm";
import { decimal, index, int, json, mysqlEnum, mysqlTable, text, timestamp, unique, varchar } from "drizzle-orm/mysql-core";
// ============================================================================
// ENUM DEFINITIONS (Real ENUMs instead of VARCHAR for data quality)
// ============================================================================

/**
 * Entity types in the EA meta-model
 */
export const entityTypeEnum = mysqlEnum("entityType", [
  "businessCapability",
  "application",
  "businessProcess",
  "dataEntity",
  "requirement",
  "stakeholder",
  "organizationUnit",
]);

/**
 * Artifact-entity link usage types
 */
export const usageTypeEnum = mysqlEnum("usageType", [
  "primary-subject",  // Artifact is primarily about this entity
  "mentioned",        // Entity is mentioned in passing
  "example",          // Entity used as an example
  "source",           // Entity is a source/input
  "output",           // Entity is an output/result
  "stakeholder",      // Entity is a stakeholder for this artifact
  "dependency",       // Entity is a dependency
  "related",          // Generic related entity
]);

/**
 * EA relationship types (simplified, production-ready)
 * FLOWS_TO: data moves from source → target
 * ORIGINATES_FROM: source is responsible for creating/being the system of record for this data entity
 */
export const relationshipTypeEnum = mysqlEnum("relationshipType", [
  "SUPPORTS",           // Generic support relationship
  "USES",              // Generic usage relationship
  "REALIZES",          // Implements/realizes (logical → physical)
  "IMPLEMENTS",        // Implements (requirement → solution)
  "DEPENDS_ON",        // Dependency relationship
  "OWNS",              // Ownership relationship
  "MANAGES",           // Management relationship
  "TRIGGERS",          // Event/trigger relationship
  "FLOWS_TO",          // Data/information flow (replaces PROVIDES_DATA_TO)
  "ORIGINATES_FROM",   // Data origin (replaces CONSUMES_DATA_FROM)
]);

/**
 * Link creation method for AI traceability
 */
export const createdViaEnum = mysqlEnum("createdVia", [
  "manual",
  "ai-suggestion",
  "bulk-import",
]);

// ============================================================================
// CORE TABLES
// ============================================================================

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * TOGAF Projects - Enterprise Architecture projects following ADM methodology
 */
export const projects = mysqlTable("projects", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  currentPhase: varchar("currentPhase", { length: 100 }).default("Preliminary"),
  status: mysqlEnum("status", ["active", "completed", "on_hold"]).default("active"),
  notionPageUrl: text("notionPageUrl"),
  canvaDesignUrl: text("canvaDesignUrl"),
  notionSyncedAt: timestamp("notionSyncedAt"),
  canvaSyncedAt: timestamp("canvaSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * TOGAF Artifacts - Individual artifacts (catalogs, matrices, diagrams)
 */
export const artifacts = mysqlTable("artifacts", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  type: varchar("type", { length: 100 }).notNull(), // Catalog, Matrix, Diagram
  admPhase: varchar("admPhase", { length: 100 }).notNull(), // Preliminary, A, B, C, D, E, F, G, H
  description: text("description"),
  content: text("content"), // Generated artifact content
  status: mysqlEnum("status", ["draft", "in_progress", "review", "approved"]).default("draft"),
  generatedAt: timestamp("generatedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = typeof artifacts.$inferInsert;

/**
 * Questionnaire Responses - Stores user answers to artifact generation questions
 */
export const questionnaireResponses = mysqlTable("questionnaireResponses", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  question: text("question").notNull(),
  answer: text("answer").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
export type InsertQuestionnaireResponse = typeof questionnaireResponses.$inferInsert;

/**
 * Assumptions - Track assumptions made during artifact generation
 */
export const assumptions = mysqlTable("assumptions", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  assumption: text("assumption").notNull(),
  rationale: text("rationale"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Assumption = typeof assumptions.$inferSelect;
export type InsertAssumption = typeof assumptions.$inferInsert;

// ============================================================================
// EA META-MODEL TABLES (Production-Ready)
// ============================================================================

/**
 * Organization Units - Organizational structure for stakeholder assignment
 * Supports hierarchy and future org-level merge via externalKey
 */
export const organizationUnits = mysqlTable(
  "organizationUnits",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "restrict" }), // RESTRICT instead of CASCADE
    
    name: varchar("name", { length: 255 }).notNull(),
    normalizedName: varchar("normalizedName", { length: 255 }).notNull(),
    description: text("description"),
    
    // Optional: External system reference for future org-level merge
    externalKey: varchar("externalKey", { length: 255 }),
    
    // Hierarchy support
    parentUnitId: int("parentUnitId"),
    
    // Audit fields
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    
    // Soft delete
    deletedAt: timestamp("deletedAt"),
    deletedBy: int("deletedBy").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => ({
    // Unique constraint on normalized name per project
    uniqueNormalizedName: unique("org_units_normalized_name_unique").on(
      table.projectId,
      table.normalizedName
    ),
    
    // Indexes
    projectIdx: index("org_units_project_idx").on(table.projectId),
    projectDeletedIdx: index("org_units_project_deleted_idx").on(
      table.projectId,
      table.deletedAt
    ),
    parentUnitIdx: index("org_units_parent_idx").on(table.parentUnitId),
    externalKeyIdx: index("org_units_external_key_idx").on(table.externalKey),
  })
);

export type OrganizationUnit = typeof organizationUnits.$inferSelect;
export type InsertOrganizationUnit = typeof organizationUnits.$inferInsert;

/**
 * Stakeholders - People and organizations involved in EA
 */
export const stakeholders = mysqlTable("stakeholders", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "restrict" }), // Changed to RESTRICT
  name: varchar("name", { length: 255 }).notNull(),
  normalizedName: varchar("normalizedName", { length: 255 }).notNull(),
  role: varchar("role", { length: 255 }),
  email: varchar("email", { length: 320 }),
  
  // Organization unit FK
  organizationUnitId: int("organizationUnitId").references(() => organizationUnits.id, { onDelete: "set null" }),
  
  concerns: text("concerns"),
  influence: mysqlEnum("influence", ["low", "medium", "high"]),
  metadata: json("metadata"), // Changed from TEXT to JSON
  createdBy: int("createdBy").notNull(),
  deletedAt: timestamp("deletedAt"), // Soft delete
  deletedBy: int("deletedBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueName: unique("stakeholders_name_unique").on(table.projectId, table.name),
  uniqueNormalizedName: unique("stakeholders_normalized_name_unique").on(table.projectId, table.normalizedName),
  uniqueEmail: unique("stakeholders_email_unique").on(table.projectId, table.email),
  projectIdx: index("stakeholders_project_idx").on(table.projectId),
  projectDeletedIdx: index("stakeholders_project_deleted_idx").on(table.projectId, table.deletedAt),
  orgUnitIdx: index("stakeholders_org_unit_idx").on(table.organizationUnitId),
}));

export type Stakeholder = typeof stakeholders.$inferSelect;
export type InsertStakeholder = typeof stakeholders.$inferInsert;

/**
 * Business Capabilities - What the business does (stable, outcome-focused)
 */
export const businessCapabilities = mysqlTable("businessCapabilities", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "restrict" }), // Changed to RESTRICT
  name: varchar("name", { length: 255 }).notNull(),
  normalizedName: varchar("normalizedName", { length: 255 }).notNull(),
  description: text("description"),
  level: int("level").notNull(), // 1, 2, 3 for L1/L2/L3
  parentId: int("parentId"), // Self-reference for hierarchy
  maturityLevel: varchar("maturityLevel", { length: 50 }), // initial, developing, defined, managed, optimizing
  ownerStakeholderId: int("ownerStakeholderId").references(() => stakeholders.id, { onDelete: "set null" }),
  metadata: json("metadata"), // Changed from TEXT to JSON
  createdBy: int("createdBy").notNull(),
  deletedAt: timestamp("deletedAt"), // Soft delete
  deletedBy: int("deletedBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueName: unique("capabilities_name_unique").on(table.projectId, table.name),
  uniqueNormalizedName: unique("capabilities_normalized_name_unique").on(table.projectId, table.normalizedName),
  projectIdx: index("capabilities_project_idx").on(table.projectId),
  projectDeletedIdx: index("capabilities_project_deleted_idx").on(table.projectId, table.deletedAt),
  parentCapabilityIdx: index("capabilities_parent_idx").on(table.parentId),
}));

export type BusinessCapability = typeof businessCapabilities.$inferSelect;
export type InsertBusinessCapability = typeof businessCapabilities.$inferInsert;

/**
 * Applications - Software systems supporting business operations
 */
export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "restrict" }), // Changed to RESTRICT
  name: varchar("name", { length: 255 }).notNull(),
  normalizedName: varchar("normalizedName", { length: 255 }).notNull(),
  description: text("description"),
  vendor: varchar("vendor", { length: 255 }),
  version: varchar("version", { length: 50 }),
  lifecycle: mysqlEnum("lifecycle", ["plan", "build", "run", "retire"]).default("run").notNull(),
  category: varchar("category", { length: 100 }), // ERP, CRM, custom, etc.
  criticality: mysqlEnum("criticality", ["low", "medium", "high", "critical"]).default("medium"),
  ownerStakeholderId: int("ownerStakeholderId").references(() => stakeholders.id, { onDelete: "set null" }),
  metadata: json("metadata"), // Changed from TEXT to JSON
  createdBy: int("createdBy").notNull(),
  deletedAt: timestamp("deletedAt"), // Soft delete
  deletedBy: int("deletedBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueName: unique("applications_name_unique").on(table.projectId, table.name),
  uniqueNormalizedName: unique("applications_normalized_name_unique").on(table.projectId, table.normalizedName),
  projectIdx: index("applications_project_idx").on(table.projectId),
  projectDeletedIdx: index("applications_project_deleted_idx").on(table.projectId, table.deletedAt),
}));

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

/**
 * Business Processes - How the business operates (dynamic, activity-focused)
 */
export const businessProcesses = mysqlTable("businessProcesses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "restrict" }), // Changed to RESTRICT
  name: varchar("name", { length: 255 }).notNull(),
  normalizedName: varchar("normalizedName", { length: 255 }).notNull(),
  description: text("description"),
  processType: varchar("processType", { length: 100 }), // core, support, management
  ownerStakeholderId: int("ownerStakeholderId").references(() => stakeholders.id, { onDelete: "set null" }),
  automationLevel: varchar("automationLevel", { length: 50 }), // manual, semi-automated, automated
  metadata: json("metadata"), // Changed from TEXT to JSON
  createdBy: int("createdBy").notNull(),
  deletedAt: timestamp("deletedAt"), // Soft delete
  deletedBy: int("deletedBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueName: unique("processes_name_unique").on(table.projectId, table.name),
  uniqueNormalizedName: unique("processes_normalized_name_unique").on(table.projectId, table.normalizedName),
  projectIdx: index("processes_project_idx").on(table.projectId),
  projectDeletedIdx: index("processes_project_deleted_idx").on(table.projectId, table.deletedAt),
}));

export type BusinessProcess = typeof businessProcesses.$inferSelect;
export type InsertBusinessProcess = typeof businessProcesses.$inferInsert;

/**
 * Data Entities - Business information concepts
 */
export const dataEntities = mysqlTable("dataEntities", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "restrict" }), // Changed to RESTRICT
  name: varchar("name", { length: 255 }).notNull(),
  normalizedName: varchar("normalizedName", { length: 255 }).notNull(),
  description: text("description"),
  classification: varchar("classification", { length: 100 }), // master, transactional, reference
  sensitivity: mysqlEnum("sensitivity", ["public", "internal", "confidential", "restricted"]).default("internal"),
  ownerStakeholderId: int("ownerStakeholderId").references(() => stakeholders.id, { onDelete: "set null" }),
  metadata: json("metadata"), // Changed from TEXT to JSON
  createdBy: int("createdBy").notNull(),
  deletedAt: timestamp("deletedAt"), // Soft delete
  deletedBy: int("deletedBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueName: unique("data_entities_name_unique").on(table.projectId, table.name),
  uniqueNormalizedName: unique("data_entities_normalized_name_unique").on(table.projectId, table.normalizedName),
  projectIdx: index("data_entities_project_idx").on(table.projectId),
  projectDeletedIdx: index("data_entities_project_deleted_idx").on(table.projectId, table.deletedAt),
}));

export type DataEntity = typeof dataEntities.$inferSelect;
export type InsertDataEntity = typeof dataEntities.$inferInsert;

/**
 * Requirements - Functional and non-functional requirements
 */
export const requirements = mysqlTable("requirements", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "restrict" }), // Changed to RESTRICT
  name: varchar("name", { length: 255 }).notNull(),
  normalizedName: varchar("normalizedName", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // functional, performance, security, usability, etc.
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium"),
  status: mysqlEnum("status", ["proposed", "approved", "implemented", "verified"]).default("proposed"),
  source: varchar("source", { length: 255 }), // stakeholder, regulation, etc.
  ownerStakeholderId: int("ownerStakeholderId").references(() => stakeholders.id, { onDelete: "set null" }),
  metadata: json("metadata"), // Changed from TEXT to JSON
  createdBy: int("createdBy").notNull(),
  deletedAt: timestamp("deletedAt"), // Soft delete
  deletedBy: int("deletedBy").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  uniqueName: unique("requirements_name_unique").on(table.projectId, table.name),
  uniqueNormalizedName: unique("requirements_normalized_name_unique").on(table.projectId, table.normalizedName),
  projectIdx: index("requirements_project_idx").on(table.projectId),
  projectDeletedIdx: index("requirements_project_deleted_idx").on(table.projectId, table.deletedAt),
}));

export type Requirement = typeof requirements.$inferSelect;
export type InsertRequirement = typeof requirements.$inferInsert;

/**
 * EA Relationships - Polymorphic relationship table for all entity connections
 * Production-ready with projectId in unique constraint, optimized indexes, soft deletes
 */
export const eaRelationships = mysqlTable(
  "eaRelationships",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "restrict" }), // Changed to RESTRICT
    
    // Source entity (VARCHAR for now, will convert to ENUM in migration)
    sourceEntityType: varchar("sourceEntityType", { length: 50 }).notNull(),
    sourceEntityId: int("sourceEntityId").notNull(),
    
    // Relationship type (VARCHAR for now, will convert to ENUM in migration)
    relationshipType: varchar("relationshipType", { length: 100 }).notNull(),
    
    // Target entity (VARCHAR for now, will convert to ENUM in migration)
    targetEntityType: varchar("targetEntityType", { length: 50 }).notNull(),
    targetEntityId: int("targetEntityId").notNull(),
    
    // Optional metadata (JSON instead of TEXT)
    metadata: json("metadata"),
    
    // Audit fields
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    
    // Soft delete (NEW)
    deletedAt: timestamp("deletedAt"),
    deletedBy: int("deletedBy").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => ({
    // FIXED: Include projectId in unique constraint
    uniqueRelationship: unique("relationships_unique").on(
      table.projectId,
      table.sourceEntityType,
      table.sourceEntityId,
      table.relationshipType,
      table.targetEntityType,
      table.targetEntityId
    ),
    
    // OPTIMIZED: Compound indexes with projectId first
    sourceIdx: index("relationships_source_idx").on(
      table.projectId,
      table.sourceEntityType,
      table.sourceEntityId
    ),
    targetIdx: index("relationships_target_idx").on(
      table.projectId,
      table.targetEntityType,
      table.targetEntityId
    ),
    typeIdx: index("relationships_type_idx").on(
      table.projectId,
      table.relationshipType
    ),
    
    // NEW: Soft delete index
    projectDeletedIdx: index("relationships_project_deleted_idx").on(
      table.projectId,
      table.deletedAt
    ),
  })
);

export type EARelationship = typeof eaRelationships.$inferSelect;
export type InsertEARelationship = typeof eaRelationships.$inferInsert;

/**
 * Artifact Entity Links - Bridge table connecting artifacts to model entities
 * Production-ready with unique constraint, soft deletes, AI traceability
 */
export const artifactEntityLinks = mysqlTable(
  "artifactEntityLinks",
  {
    id: int("id").autoincrement().primaryKey(),
    projectId: int("projectId")
      .notNull()
      .references(() => projects.id, { onDelete: "restrict" }),
    
    artifactId: int("artifactId")
      .notNull()
      .references(() => artifacts.id, { onDelete: "cascade" }), // Keep CASCADE for artifact links
    
    // Entity reference (VARCHAR for now, will convert to ENUM in migration)
    entityType: varchar("entityType", { length: 50 }).notNull(),
    entityId: int("entityId").notNull(),
    
    // Usage type (VARCHAR for now, will convert to ENUM in migration)
    usageType: varchar("usageType", { length: 50 }).notNull(),
    
    // Optional: AI traceability
    createdBy: int("createdBy").references(() => users.id, { onDelete: "set null" }),
    createdVia: varchar("createdVia", { length: 50 }).default("manual").notNull(),
    
    section: varchar("section", { length: 255 }), // which part of artifact references this entity
    context: text("context"), // surrounding text for context
    
    // Audit fields
    createdAt: timestamp("createdAt").defaultNow().notNull(),
    
    // Soft delete (NEW)
    deletedAt: timestamp("deletedAt"),
    deletedBy: int("deletedBy").references(() => users.id, { onDelete: "set null" }),
  },
  (table) => ({
    // NEW: Prevent duplicate links
    uniqueArtifactEntity: unique("artifact_entity_link_unique").on(
      table.artifactId,
      table.entityType,
      table.entityId,
      table.usageType
    ),
    
    // Indexes
    artifactIdx: index("artifact_links_artifact_idx").on(table.artifactId),
    entityIdx: index("artifact_links_entity_idx").on(
      table.projectId,
      table.entityType,
      table.entityId
    ),
    usageIdx: index("artifact_links_usage_idx").on(
      table.projectId,
      table.usageType
    ),
    
    // NEW: Soft delete index
    projectDeletedIdx: index("artifact_links_project_deleted_idx").on(
      table.projectId,
      table.deletedAt
    ),
  })
);

export type ArtifactEntityLink = typeof artifactEntityLinks.$inferSelect;
export type InsertArtifactEntityLink = typeof artifactEntityLinks.$inferInsert;

/**
 * Saved Views - User-defined filter combinations for EA Entity Browser
 */
export const savedViews = mysqlTable("savedViews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Filter configuration stored as JSON
  filters: json("filters").notNull(), // { entityTypes: [], maturityLevels: [], lifecycleStages: [], etc. }
  
  // View settings
  isDefault: int("isDefault").default(0).notNull(), // Boolean: 1 = default view for this user+project
  isShared: int("isShared").default(0).notNull(), // Boolean: 1 = visible to all project members
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  userProjectIdx: index("saved_views_user_project_idx").on(table.userId, table.projectId),
  projectSharedIdx: index("saved_views_project_shared_idx").on(table.projectId, table.isShared),
  uniqueName: unique("saved_views_name_unique").on(table.userId, table.projectId, table.name),
}));

export type SavedView = typeof savedViews.$inferSelect;
export type InsertSavedView = typeof savedViews.$inferInsert;

/**
 * Validation Rules - Configurable business rules for EA repository quality
 */
export const validationRules = mysqlTable("validationRules", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  
  // Rule type and configuration
  ruleType: mysqlEnum("ruleType", [
    "min_relationships",
    "max_relationships",
    "required_relationship",
    "no_circular_dependencies",
    "no_orphaned_entities",
    "naming_convention",
    "attribute_completeness"
  ]).notNull(),
  
  config: json("config").notNull(), // Rule-specific configuration
  
  // Rule metadata
  severity: mysqlEnum("severity", ["info", "warning", "error", "critical"]).default("warning").notNull(),
  isActive: int("isActive").default(1).notNull(), // Boolean: 1 = active, 0 = disabled
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdx: index("validation_rules_project_idx").on(table.projectId),
  activeIdx: index("validation_rules_active_idx").on(table.projectId, table.isActive),
}));

export type ValidationRule = typeof validationRules.$inferSelect;
export type InsertValidationRule = typeof validationRules.$inferInsert;

/**
 * Validation Violations - Detected rule violations in EA repository
 */
export const validationViolations = mysqlTable("validationViolations", {
  id: int("id").autoincrement().primaryKey(),
  ruleId: int("ruleId").notNull().references(() => validationRules.id, { onDelete: "cascade" }),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  
  // Entity that violated the rule
  entityType: mysqlEnum("entityType", [
    "businessCapability",
    "application",
    "businessProcess",
    "dataEntity",
    "requirement"
  ]).notNull(),
  entityId: int("entityId").notNull(),
  entityName: varchar("entityName", { length: 500 }).notNull(), // Cached for display
  
  // Violation details
  violationDetails: json("violationDetails").notNull(), // { message, expected, actual, suggestions }
  
  // Resolution tracking
  status: mysqlEnum("status", ["open", "resolved", "ignored"]).default("open").notNull(),
  resolvedAt: timestamp("resolvedAt"),
  resolvedBy: int("resolvedBy").references(() => users.id),
  resolutionNotes: text("resolutionNotes"),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  ruleIdx: index("validation_violations_rule_idx").on(table.ruleId),
  projectIdx: index("validation_violations_project_idx").on(table.projectId),
  entityIdx: index("validation_violations_entity_idx").on(table.entityType, table.entityId),
  statusIdx: index("validation_violations_status_idx").on(table.projectId, table.status),
}));

export type ValidationViolation = typeof validationViolations.$inferSelect;
export type InsertValidationViolation = typeof validationViolations.$inferInsert;

/**
 * Capability Catalog - Industry-specific standard business capabilities
 */
export const capabilityCatalog = mysqlTable("capabilityCatalog", {
  id: int("id").autoincrement().primaryKey(),
  industry: varchar("industry", { length: 100 }).notNull(), // Financial Services, Healthcare, Retail, etc.
  referenceId: varchar("referenceId", { length: 50 }).notNull(), // e.g., "FS.BC.01", "HC.BC.02"
  name: varchar("name", { length: 500 }).notNull(),
  description: text("description").notNull(),
  level: int("level").notNull(), // Hierarchy level (1 = top level, 2 = sub-capability, etc.)
  parentReferenceId: varchar("parentReferenceId", { length: 50 }), // For hierarchical capabilities
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  industryIdx: index("capability_catalog_industry_idx").on(table.industry),
  referenceIdx: index("capability_catalog_reference_idx").on(table.referenceId),
  uniqueRef: unique("capability_catalog_unique_ref").on(table.industry, table.referenceId),
}));

export type CapabilityCatalogEntry = typeof capabilityCatalog.$inferSelect;
export type InsertCapabilityCatalogEntry = typeof capabilityCatalog.$inferInsert;

/**
 * Maturity Model - Configuration for capability maturity assessment
 */
export const maturityModels = mysqlTable("maturityModels", {
  id: int("id").autoincrement().primaryKey(),
  modelId: varchar("modelId", { length: 50 }).notNull().unique(), // e.g., "TOGAF_5_LEVEL"
  name: varchar("name", { length: 200 }).notNull(),
  description: text("description"),
  levels: json("levels").notNull(), // Array of level definitions with code, label, description, color, icon
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type MaturityModel = typeof maturityModels.$inferSelect;
export type InsertMaturityModel = typeof maturityModels.$inferInsert;

/**
 * Capability Assessment - Maturity assessment results for project capabilities
 */
export const capabilityAssessments = mysqlTable("capabilityAssessments", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  capabilityId: int("capabilityId").notNull().references(() => businessCapabilities.id, { onDelete: "cascade" }),
  catalogReferenceId: varchar("catalogReferenceId", { length: 50 }), // Link to catalog entry
  
  // Maturity scoring
  maturityModelId: varchar("maturityModelId", { length: 50 }).notNull(),
  maturityScore: decimal("maturityScore", { precision: 3, scale: 2 }), // e.g., 2.45
  maturityLevel: mysqlEnum("maturityLevel", ["initial", "developing", "defined", "managed", "optimizing"]),
  targetMaturityLevel: mysqlEnum("targetMaturityLevel", ["initial", "developing", "defined", "managed", "optimizing"]),
  
  // Dimension scores (JSON: { process: 2.5, people: 3.0, technology: 2.0, data: 2.5, governance: 3.0 })
  dimensionScores: json("dimensionScores"),
  
  // AI-generated narrative and recommendations
  maturityNarrative: text("maturityNarrative"),
  keyStrengths: json("keyStrengths"), // Array of strings
  keyGaps: json("keyGaps"), // Array of strings
  recommendations: json("recommendations"), // Array of strings
  
  // Assessment metadata
  assessmentCompletedAt: timestamp("assessmentCompletedAt"),
  assessedBy: int("assessedBy").references(() => users.id),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  projectIdx: index("capability_assessments_project_idx").on(table.projectId),
  capabilityIdx: index("capability_assessments_capability_idx").on(table.capabilityId),
  uniqueAssessment: unique("capability_assessments_unique").on(table.projectId, table.capabilityId),
}));

export type CapabilityAssessment = typeof capabilityAssessments.$inferSelect;
export type InsertCapabilityAssessment = typeof capabilityAssessments.$inferInsert;

/**
 * Assessment Questions - Questions for capability maturity assessment
 */
export const assessmentQuestions = mysqlTable("assessmentQuestions", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull().references(() => capabilityAssessments.id, { onDelete: "cascade" }),
  catalogReferenceId: varchar("catalogReferenceId", { length: 50 }), // Link to capability catalog
  
  // Question details
  questionId: varchar("questionId", { length: 100 }).notNull(), // e.g., "FS.BC.01.Q1"
  dimensionCode: mysqlEnum("dimensionCode", ["process", "people", "technology", "data", "governance"]).notNull(),
  dimensionLabel: varchar("dimensionLabel", { length: 100 }).notNull(),
  questionText: text("questionText").notNull(),
  
  // Answer scale (JSON: { type: "likert_5", options: ["1 - Never", ...] })
  answerScale: json("answerScale").notNull(),
  weight: decimal("weight", { precision: 3, scale: 2 }).notNull(), // Importance weight (0.0 - 1.0)
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
}, (table) => ({
  assessmentIdx: index("assessment_questions_assessment_idx").on(table.assessmentId),
  dimensionIdx: index("assessment_questions_dimension_idx").on(table.assessmentId, table.dimensionCode),
}));

export type AssessmentQuestion = typeof assessmentQuestions.$inferSelect;
export type InsertAssessmentQuestion = typeof assessmentQuestions.$inferInsert;

/**
 * Assessment Responses - User answers to assessment questions
 */
export const assessmentResponses = mysqlTable("assessmentResponses", {
  id: int("id").autoincrement().primaryKey(),
  assessmentId: int("assessmentId").notNull().references(() => capabilityAssessments.id, { onDelete: "cascade" }),
  questionId: int("questionId").notNull().references(() => assessmentQuestions.id, { onDelete: "cascade" }),
  
  // Answer value (1-5 for Likert scale)
  answerValue: int("answerValue").notNull(),
  answerLabel: varchar("answerLabel", { length: 100 }), // e.g., "4 - Often"
  
  // Response metadata
  answeredBy: int("answeredBy").notNull().references(() => users.id),
  answeredAt: timestamp("answeredAt").defaultNow().notNull(),
  
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
}, (table) => ({
  assessmentIdx: index("assessment_responses_assessment_idx").on(table.assessmentId),
  questionIdx: index("assessment_responses_question_idx").on(table.questionId),
  uniqueResponse: unique("assessment_responses_unique").on(table.assessmentId, table.questionId),
}));

export type AssessmentResponse = typeof assessmentResponses.$inferSelect;
export type InsertAssessmentResponse = typeof assessmentResponses.$inferInsert;

// ============================================================================
// RELATIONS (for Drizzle ORM query builder)
// ============================================================================

export const organizationUnitsRelations = relations(organizationUnits, ({ one, many }) => ({
  project: one(projects, {
    fields: [organizationUnits.projectId],
    references: [projects.id],
  }),
  parentUnit: one(organizationUnits, {
    fields: [organizationUnits.parentUnitId],
    references: [organizationUnits.id],
  }),
  childUnits: many(organizationUnits),
  stakeholders: many(stakeholders),
}));
