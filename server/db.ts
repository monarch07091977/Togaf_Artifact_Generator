import { eq } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { InsertUser, users } from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// TOGAF Project queries
import { projects, artifacts, questionnaireResponses, assumptions, Project, Artifact, QuestionnaireResponse, Assumption, InsertProject, InsertArtifact, InsertQuestionnaireResponse, InsertAssumption } from "../drizzle/schema";
import { desc, and } from "drizzle-orm";

export async function createProject(data: Omit<InsertProject, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(projects).values(data);
  return Number(result[0].insertId);
}

export async function getProjectsByUserId(userId: number): Promise<Project[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(projects).where(eq(projects.userId, userId)).orderBy(desc(projects.updatedAt));
}

export async function getProjectById(id: number): Promise<Project | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(projects).where(eq(projects.id, id)).limit(1);
  return result[0];
}

export async function updateProject(id: number, data: Partial<Omit<InsertProject, "id" | "userId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(projects).set(data).where(eq(projects.id, id));
}

export async function deleteProject(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(projects).where(eq(projects.id, id));
}

// Artifact queries
export async function createArtifact(data: Omit<InsertArtifact, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(artifacts).values(data);
  return Number(result[0].insertId);
}

export async function getArtifactsByProjectId(projectId: number): Promise<Artifact[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(artifacts).where(eq(artifacts.projectId, projectId)).orderBy(artifacts.admPhase, artifacts.name);
}

export async function getArtifactsByPhase(projectId: number, phase: string): Promise<Artifact[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(artifacts).where(and(eq(artifacts.projectId, projectId), eq(artifacts.admPhase, phase)));
}

export async function getArtifactById(id: number): Promise<Artifact | undefined> {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(artifacts).where(eq(artifacts.id, id)).limit(1);
  return result[0];
}

export async function updateArtifact(id: number, data: Partial<Omit<InsertArtifact, "id" | "projectId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(artifacts).set(data).where(eq(artifacts.id, id));
}

export async function deleteArtifact(id: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.delete(artifacts).where(eq(artifacts.id, id));
}

// Artifact Relationship queries - DEPRECATED (old schema)
// These functions reference tables that no longer exist in production schema
// TODO: Implement using eaRelationships table if needed

// Questionnaire Response queries
export async function saveQuestionnaireResponse(data: Omit<InsertQuestionnaireResponse, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(questionnaireResponses).values(data);
  return Number(result[0].insertId);
}

export async function getQuestionnaireResponsesByArtifact(artifactId: number): Promise<QuestionnaireResponse[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(questionnaireResponses).where(eq(questionnaireResponses.artifactId, artifactId));
}

export async function updateQuestionnaireResponse(id: number, data: Partial<Omit<InsertQuestionnaireResponse, "id" | "artifactId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(questionnaireResponses).set(data).where(eq(questionnaireResponses.id, id));
}

// Assumption queries
export async function createAssumption(data: Omit<InsertAssumption, "id" | "createdAt" | "updatedAt">) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(assumptions).values(data);
  return Number(result[0].insertId);
}

export async function getAssumptionsByArtifact(artifactId: number): Promise<Assumption[]> {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(assumptions).where(eq(assumptions.artifactId, artifactId)).orderBy(desc(assumptions.createdAt));
}

export async function updateAssumption(id: number, data: Partial<Omit<InsertAssumption, "id" | "artifactId">>) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db.update(assumptions).set(data).where(eq(assumptions.id, id));
}

// Deliverable queries - DEPRECATED (old schema)
// These functions reference tables that no longer exist in production schema
