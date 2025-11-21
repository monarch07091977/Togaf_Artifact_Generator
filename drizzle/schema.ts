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