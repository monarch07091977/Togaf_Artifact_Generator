import { integer, pgEnum, pgTable, text, timestamp, varchar } from "drizzle-orm/pg-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */

// Define enums for PostgreSQL
const roleEnum = pgEnum("role", ["user", "admin"]);
const projectStatusEnum = pgEnum("project_status", ["active", "completed", "on_hold"]);
const artifactStatusEnum = pgEnum("artifact_status", ["not_started", "in_progress", "completed", "reviewed"]);
const impactEnum = pgEnum("impact", ["low", "medium", "high"]);
const assumptionStatusEnum = pgEnum("assumption_status", ["active", "validated", "invalidated"]);
const deliverableStatusEnum = pgEnum("deliverable_status", ["draft", "in_progress", "completed"]);

export const users = pgTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: roleEnum("role").default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * TOGAF Projects - Enterprise Architecture projects following ADM methodology
 */
export const projects = pgTable("projects", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  userId: integer("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  currentPhase: varchar("currentPhase", { length: 100 }).default("Preliminary"),
  status: projectStatusEnum("status").default("active"),
  notionPageUrl: text("notionPageUrl"),
  canvaDesignUrl: text("canvaDesignUrl"),
  notionSyncedAt: timestamp("notionSyncedAt"),
  canvaSyncedAt: timestamp("canvaSyncedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Project = typeof projects.$inferSelect;
export type InsertProject = typeof projects.$inferInsert;

/**
 * TOGAF Artifacts - Individual artifacts (catalogs, matrices, diagrams)
 */
export const artifacts = pgTable("artifacts", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  type: varchar("type", { length: 50 }).notNull(), // catalog, matrix, diagram
  name: varchar("name", { length: 255 }).notNull(),
  phase: varchar("phase", { length: 50 }).notNull(),
  status: artifactStatusEnum("status").default("not_started").notNull(),
  content: text("content"), // JSON string for structured data
  generatedContent: text("generatedContent"), // AI-generated markdown content
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Artifact = typeof artifacts.$inferSelect;
export type InsertArtifact = typeof artifacts.$inferInsert;

/**
 * Artifact Relationships - Input/output dependencies between artifacts
 */
export const artifactRelationships = pgTable("artifactRelationships", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  sourceArtifactId: integer("sourceArtifactId").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  targetArtifactId: integer("targetArtifactId").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  relationshipType: varchar("relationshipType", { length: 50 }).notNull(), // input_to, output_from, references
  mappingRules: text("mappingRules"), // JSON string for mapping configuration
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type ArtifactRelationship = typeof artifactRelationships.$inferSelect;
export type InsertArtifactRelationship = typeof artifactRelationships.$inferInsert;

/**
 * Questionnaire Responses - User answers to artifact questionnaires
 */
export const questionnaireResponses = pgTable("questionnaireResponses", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  artifactId: integer("artifactId").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  questionId: varchar("questionId", { length: 100 }).notNull(),
  questionText: text("questionText").notNull(),
  answer: text("answer"), // JSON string for complex answers
  source: varchar("source", { length: 50 }).notNull(), // user_input, auto_populated, ai_suggested
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type QuestionnaireResponse = typeof questionnaireResponses.$inferSelect;
export type InsertQuestionnaireResponse = typeof questionnaireResponses.$inferInsert;

/**
 * Assumptions - Track assumptions made during artifact generation
 */
export const assumptions = pgTable("assumptions", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  artifactId: integer("artifactId").notNull().references(() => artifacts.id, { onDelete: "cascade" }),
  description: text("description").notNull(),
  rationale: text("rationale"),
  impact: impactEnum("impact").default("medium").notNull(),
  status: assumptionStatusEnum("status").default("active").notNull(),
  createdBy: varchar("createdBy", { length: 50 }).notNull(), // ai, user
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Assumption = typeof assumptions.$inferSelect;
export type InsertAssumption = typeof assumptions.$inferInsert;

/**
 * Deliverables - Groupings of artifacts into formal deliverables
 */
export const deliverables = pgTable("deliverables", {
  id: integer("id").primaryKey().generatedAlwaysAsIdentity(),
  projectId: integer("projectId").notNull().references(() => projects.id, { onDelete: "cascade" }),
  name: varchar("name", { length: 255 }).notNull(),
  phase: varchar("phase", { length: 50 }).notNull(),
  artifactIds: text("artifactIds"), // JSON array of artifact IDs
  status: deliverableStatusEnum("status").default("draft").notNull(),
  generatedDocument: text("generatedDocument"), // Final compiled document
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().notNull(),
});

export type Deliverable = typeof deliverables.$inferSelect;
export type InsertDeliverable = typeof deliverables.$inferInsert;
