/**
 * EA Model Service
 * 
 * Provides CRUD operations and relationship management for EA meta-model entities.
 * This service transforms the application from document-centric to model-centric architecture.
 */

import { eq, and } from "drizzle-orm";
import { getDb } from "./db";
import {
  businessCapabilities,
  applications,
  businessProcesses,
  dataEntities,
  requirements,
  eaRelationships,
  artifactEntityLinks,
  type BusinessCapability,
  type InsertBusinessCapability,
  type Application,
  type InsertApplication,
  type BusinessProcess,
  type InsertBusinessProcess,
  type DataEntity,
  type InsertDataEntity,
  type Requirement,
  type InsertRequirement,
  type EARelationship,
  type InsertEARelationship,
  type ArtifactEntityLink,
  type InsertArtifactEntityLink,
} from "../drizzle/schema";

// ============================================================================
// BUSINESS CAPABILITIES
// ============================================================================

export async function createBusinessCapability(data: InsertBusinessCapability): Promise<BusinessCapability> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(businessCapabilities).values(data);
  const [capability] = await db
    .select()
    .from(businessCapabilities)
    .where(eq(businessCapabilities.id, Number((result as any).insertId)));
  
  return capability;
}

export async function getBusinessCapabilitiesByProject(projectId: number): Promise<BusinessCapability[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(businessCapabilities)
    .where(eq(businessCapabilities.projectId, projectId));
}

export async function getBusinessCapabilityById(id: number): Promise<BusinessCapability | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [capability] = await db
    .select()
    .from(businessCapabilities)
    .where(eq(businessCapabilities.id, id));
  
  return capability;
}

export async function updateBusinessCapability(
  id: number,
  data: Partial<InsertBusinessCapability>
): Promise<BusinessCapability> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(businessCapabilities)
    .set(data)
    .where(eq(businessCapabilities.id, id));
  
  const updated = await getBusinessCapabilityById(id);
  if (!updated) throw new Error("Capability not found after update");
  
  return updated;
}

export async function deleteBusinessCapability(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(businessCapabilities)
    .where(eq(businessCapabilities.id, id));
}

// ============================================================================
// APPLICATIONS
// ============================================================================

export async function createApplication(data: InsertApplication): Promise<Application> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(applications).values(data);
  const [application] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, Number((result as any).insertId)));
  
  return application;
}

export async function getApplicationsByProject(projectId: number): Promise<Application[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(applications)
    .where(eq(applications.projectId, projectId));
}

export async function getApplicationById(id: number): Promise<Application | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [application] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, id));
  
  return application;
}

export async function updateApplication(
  id: number,
  data: Partial<InsertApplication>
): Promise<Application> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(applications)
    .set(data)
    .where(eq(applications.id, id));
  
  const updated = await getApplicationById(id);
  if (!updated) throw new Error("Application not found after update");
  
  return updated;
}

export async function deleteApplication(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(applications)
    .where(eq(applications.id, id));
}

// ============================================================================
// BUSINESS PROCESSES
// ============================================================================

export async function createBusinessProcess(data: InsertBusinessProcess): Promise<BusinessProcess> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(businessProcesses).values(data);
  const [process] = await db
    .select()
    .from(businessProcesses)
    .where(eq(businessProcesses.id, Number((result as any).insertId)));
  
  return process;
}

export async function getBusinessProcessesByProject(projectId: number): Promise<BusinessProcess[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(businessProcesses)
    .where(eq(businessProcesses.projectId, projectId));
}

export async function getBusinessProcessById(id: number): Promise<BusinessProcess | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [process] = await db
    .select()
    .from(businessProcesses)
    .where(eq(businessProcesses.id, id));
  
  return process;
}

export async function updateBusinessProcess(
  id: number,
  data: Partial<InsertBusinessProcess>
): Promise<BusinessProcess> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(businessProcesses)
    .set(data)
    .where(eq(businessProcesses.id, id));
  
  const updated = await getBusinessProcessById(id);
  if (!updated) throw new Error("Process not found after update");
  
  return updated;
}

export async function deleteBusinessProcess(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(businessProcesses)
    .where(eq(businessProcesses.id, id));
}

// ============================================================================
// DATA ENTITIES
// ============================================================================

export async function createDataEntity(data: InsertDataEntity): Promise<DataEntity> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(dataEntities).values(data);
  const [entity] = await db
    .select()
    .from(dataEntities)
    .where(eq(dataEntities.id, Number((result as any).insertId)));
  
  return entity;
}

export async function getDataEntitiesByProject(projectId: number): Promise<DataEntity[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(dataEntities)
    .where(eq(dataEntities.projectId, projectId));
}

export async function getDataEntityById(id: number): Promise<DataEntity | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [entity] = await db
    .select()
    .from(dataEntities)
    .where(eq(dataEntities.id, id));
  
  return entity;
}

export async function updateDataEntity(
  id: number,
  data: Partial<InsertDataEntity>
): Promise<DataEntity> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(dataEntities)
    .set(data)
    .where(eq(dataEntities.id, id));
  
  const updated = await getDataEntityById(id);
  if (!updated) throw new Error("Data entity not found after update");
  
  return updated;
}

export async function deleteDataEntity(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(dataEntities)
    .where(eq(dataEntities.id, id));
}

// ============================================================================
// REQUIREMENTS
// ============================================================================

export async function createRequirement(data: InsertRequirement): Promise<Requirement> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(requirements).values(data);
  const [requirement] = await db
    .select()
    .from(requirements)
    .where(eq(requirements.id, Number((result as any).insertId)));
  
  return requirement;
}

export async function getRequirementsByProject(projectId: number): Promise<Requirement[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(requirements)
    .where(eq(requirements.projectId, projectId));
}

export async function getRequirementById(id: number): Promise<Requirement | undefined> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const [requirement] = await db
    .select()
    .from(requirements)
    .where(eq(requirements.id, id));
  
  return requirement;
}

export async function updateRequirement(
  id: number,
  data: Partial<InsertRequirement>
): Promise<Requirement> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(requirements)
    .set(data)
    .where(eq(requirements.id, id));
  
  const updated = await getRequirementById(id);
  if (!updated) throw new Error("Requirement not found after update");
  
  return updated;
}

export async function deleteRequirement(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(requirements)
    .where(eq(requirements.id, id));
}

// ============================================================================
// EA RELATIONSHIPS
// ============================================================================

export async function createRelationship(data: InsertEARelationship): Promise<EARelationship> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(eaRelationships).values(data);
  const [relationship] = await db
    .select()
    .from(eaRelationships)
    .where(eq(eaRelationships.id, Number((result as any).insertId)));
  
  return relationship;
}

export async function getRelationshipsByProject(projectId: number): Promise<EARelationship[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(eaRelationships)
    .where(eq(eaRelationships.projectId, projectId));
}

export async function getRelationshipsByEntity(
  entityType: string,
  entityId: number
): Promise<EARelationship[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  // Get relationships where entity is either source or target
  const asSource = await db
    .select()
    .from(eaRelationships)
    .where(
      and(
        eq(eaRelationships.sourceEntityType, entityType),
        eq(eaRelationships.sourceEntityId, entityId)
      )
    );
  
  const asTarget = await db
    .select()
    .from(eaRelationships)
    .where(
      and(
        eq(eaRelationships.targetEntityType, entityType),
        eq(eaRelationships.targetEntityId, entityId)
      )
    );
  
  return [...asSource, ...asTarget];
}

export async function deleteRelationship(id: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(eaRelationships)
    .where(eq(eaRelationships.id, id));
}

// ============================================================================
// ARTIFACT-ENTITY LINKS
// ============================================================================

export async function linkArtifactToEntity(data: InsertArtifactEntityLink): Promise<ArtifactEntityLink> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db.insert(artifactEntityLinks).values(data);
  const [link] = await db
    .select()
    .from(artifactEntityLinks)
    .where(eq(artifactEntityLinks.id, Number((result as any).insertId)));
  
  return link;
}

export async function getEntitiesByArtifact(artifactId: number): Promise<ArtifactEntityLink[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(artifactEntityLinks)
    .where(eq(artifactEntityLinks.artifactId, artifactId));
}

export async function getArtifactsByEntity(
  entityType: string,
  entityId: number
): Promise<ArtifactEntityLink[]> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .select()
    .from(artifactEntityLinks)
    .where(
      and(
        eq(artifactEntityLinks.entityType, entityType),
        eq(artifactEntityLinks.entityId, entityId)
      )
    );
}

export async function unlinkArtifactFromEntity(linkId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .delete(artifactEntityLinks)
    .where(eq(artifactEntityLinks.id, linkId));
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get all entities of a specific type for a project
 */
export async function getEntitiesByType(
  projectId: number,
  entityType: string
): Promise<any[]> {
  switch (entityType) {
    case "capability":
      return getBusinessCapabilitiesByProject(projectId);
    case "application":
      return getApplicationsByProject(projectId);
    case "process":
      return getBusinessProcessesByProject(projectId);
    case "dataEntity":
      return getDataEntitiesByProject(projectId);
    case "requirement":
      return getRequirementsByProject(projectId);
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

/**
 * Get entity by type and ID
 */
export async function getEntityById(
  entityType: string,
  entityId: number
): Promise<any | undefined> {
  switch (entityType) {
    case "capability":
      return getBusinessCapabilityById(entityId);
    case "application":
      return getApplicationById(entityId);
    case "process":
      return getBusinessProcessById(entityId);
    case "dataEntity":
      return getDataEntityById(entityId);
    case "requirement":
      return getRequirementById(entityId);
    default:
      throw new Error(`Unknown entity type: ${entityType}`);
  }
}

/**
 * Get model summary for a project
 */
export async function getModelSummary(projectId: number) {
  const [capabilities, apps, processes, dataEnts, reqs, relationships] = await Promise.all([
    getBusinessCapabilitiesByProject(projectId),
    getApplicationsByProject(projectId),
    getBusinessProcessesByProject(projectId),
    getDataEntitiesByProject(projectId),
    getRequirementsByProject(projectId),
    getRelationshipsByProject(projectId),
  ]);
  
  return {
    entityCounts: {
      capabilities: capabilities.length,
      applications: apps.length,
      processes: processes.length,
      dataEntities: dataEnts.length,
      requirements: reqs.length,
    },
    relationshipCount: relationships.length,
    entities: {
      capabilities,
      applications,
      processes,
      dataEntities: dataEnts,
      requirements: reqs,
    },
    relationships,
  };
}
