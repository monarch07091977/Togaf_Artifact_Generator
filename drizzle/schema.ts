import { int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

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
  type: varchar("type", { length: 50 }).notNull(), // catalog, matrix, diagram
  name: varchar("name", { length: 255 }).notNull(),
  phase: varchar("phase", { length: 50 }).notNull(),
  status: mysqlEnum("status", ["not_started", "in_progress", "completed", "reviewed"]).default("not_started").notNull(),
  content: text("content"), // JSON string for structured data
  generatedContent: text("generatedContent"), // AI-generated markdown content
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = typeof artifacts.$inferInsert;

/**
 * Artifact Relationships - Input/output dependencies between artifacts
 */
export const artifactRelationships = mysqlTable("artifactRelationships", {
  id: int("id").autoincrement().primaryKey(),
  sourceArtifactId: int("sourceArtifactId").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  targetArtifactId: int("targetArtifactId").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  relationshipType: varchar("relationshipType", { length: 50 }).notNull(), // input_to, output_from, references
  mappingRules: text("mappingRules"), // JSON string for mapping configuration
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArtifactRelationship = typeof artifactRelationships.$inferSelect;
export type InsertArtifactRelationship = typeof artifactRelationships.$inferInsert;

/**
 * Questionnaire Responses - User answers to artifact questionnaires
 */
export const questionnaireResponses = mysqlTable("questionnaireResponses", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  questionId: varchar("questionId", { length: 100 }).notNull(),
  questionText: text("questionText").notNull(),
  answer: text("answer"), // JSON string for complex answers
  source: varchar("source", { length: 50 }).notNull(), // user_input, auto_populated, ai_suggested
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
export type InsertQuestionnaireResponse = typeof questionnaireResponses.$inferInsert;

/**
 * Assumptions - Track assumptions made during artifact generation
 */
export const assumptions = mysqlTable("assumptions", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  rationale: text("rationale"),
  impact: mysqlEnum("impact", ["low", "medium", "high"]).default("medium").notNull(),
  status: mysqlEnum("status", ["active", "validated", "invalidated"]).default("active").notNull(),
  createdBy: varchar("createdBy", { length: 50 }).notNull(), // ai, user
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Assumption = typeof assumptions.$inferSelect;
export type InsertAssumption = typeof assumptions.$inferInsert;

/**
 * Deliverables - Groupings of artifacts into formal deliverables
 */
export const deliverables = mysqlTable("deliverables", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  phase: varchar("phase", { length: 50 }).notNull(),
  artifactIds: text("artifactIds"), // JSON array of artifact IDs
  status: mysqlEnum("status", ["draft", "in_progress", "completed"]).default("draft").notNull(),
  generatedDocument: text("generatedDocument"), // Final compiled document
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = typeof deliverables.$inferInsert;

// ============================================================================
// EA META-MODEL ENTITIES
// ============================================================================

/**
 * Business Capabilities - What the business does (stable, outcome-focused)
 */
export const businessCapabilities = mysqlTable("businessCapabilities", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  level: int("level").notNull(), // 1, 2, 3 for L1/L2/L3
  parentId: int("parentId"), // Self-reference for hierarchy
  maturityLevel: varchar("maturityLevel", { length: 50 }), // initial, developing, defined, managed, optimizing
  owner: varchar("owner", { length: 255 }),
  metadata: text("metadata"), // JSON for extensibility
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessCapability = typeof businessCapabilities.$inferSelect;
export type InsertBusinessCapability = typeof businessCapabilities.$inferInsert;

/**
 * Applications - Software systems supporting business operations
 */
export const applications = mysqlTable("applications", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  vendor: varchar("vendor", { length: 255 }),
  version: varchar("version", { length: 50 }),
  lifecycle: mysqlEnum("lifecycle", ["plan", "build", "run", "retire"]).default("run").notNull(),
  category: varchar("category", { length: 100 }), // ERP, CRM, custom, etc.
  criticality: mysqlEnum("criticality", ["low", "medium", "high", "critical"]).default("medium"),
  owner: varchar("owner", { length: 255 }),
  metadata: text("metadata"), // JSON for extensibility
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Application = typeof applications.$inferSelect;
export type InsertApplication = typeof applications.$inferInsert;

/**
 * Business Processes - How the business operates (dynamic, activity-focused)
 */
export const businessProcesses = mysqlTable("businessProcesses", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  processType: varchar("processType", { length: 100 }), // core, support, management
  owner: varchar("owner", { length: 255 }),
  automationLevel: varchar("automationLevel", { length: 50 }), // manual, semi-automated, automated
  metadata: text("metadata"), // JSON for extensibility
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type BusinessProcess = typeof businessProcesses.$inferSelect;
export type InsertBusinessProcess = typeof businessProcesses.$inferInsert;

/**
 * Data Entities - Business information concepts
 */
export const dataEntities = mysqlTable("dataEntities", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  classification: varchar("classification", { length: 100 }), // master, transactional, reference
  sensitivity: mysqlEnum("sensitivity", ["public", "internal", "confidential", "restricted"]).default("internal"),
  owner: varchar("owner", { length: 255 }),
  metadata: text("metadata"), // JSON for extensibility
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type DataEntity = typeof dataEntities.$inferSelect;
export type InsertDataEntity = typeof dataEntities.$inferInsert;

/**
 * Requirements - Functional and non-functional requirements
 */
export const requirements = mysqlTable("requirements", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  type: varchar("type", { length: 50 }).notNull(), // functional, performance, security, usability, etc.
  priority: mysqlEnum("priority", ["low", "medium", "high", "critical"]).default("medium"),
  status: mysqlEnum("status", ["proposed", "approved", "implemented", "verified"]).default("proposed"),
  source: varchar("source", { length: 255 }), // stakeholder, regulation, etc.
  metadata: text("metadata"), // JSON for extensibility
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Requirement = typeof requirements.$inferSelect;
export type InsertRequirement = typeof requirements.$inferInsert;

/**
 * EA Relationships - Polymorphic relationship table for all entity connections
 */
export const eaRelationships = mysqlTable("eaRelationships", {
  id: int("id").autoincrement().primaryKey(),
  projectId: int("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  sourceEntityType: varchar("sourceEntityType", { length: 50 }).notNull(), // capability, application, process, etc.
  sourceEntityId: int("sourceEntityId").notNull(),
  relationshipType: varchar("relationshipType", { length: 100 }).notNull(), // SUPPORTS, USES, REALIZES, etc.
  targetEntityType: varchar("targetEntityType", { length: 50 }).notNull(),
  targetEntityId: int("targetEntityId").notNull(),
  properties: text("properties"), // JSON for relationship-specific attributes
  confidence: int("confidence"), // 0-100 for AI-suggested relationships
  createdBy: int("createdBy").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type EARelationship = typeof eaRelationships.$inferSelect;
export type InsertEARelationship = typeof eaRelationships.$inferInsert;

/**
 * Artifact Entity Links - Bridge table connecting artifacts to model entities
 */
export const artifactEntityLinks = mysqlTable("artifactEntityLinks", {
  id: int("id").autoincrement().primaryKey(),
  artifactId: int("artifactId").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  entityType: varchar("entityType", { length: 50 }).notNull(),
  entityId: int("entityId").notNull(),
  section: varchar("section", { length: 255 }), // which part of artifact references this entity
  context: text("context"), // surrounding text for context
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArtifactEntityLink = typeof artifactEntityLinks.$inferSelect;
export type InsertArtifactEntityLink = typeof artifactEntityLinks.$inferInsert;