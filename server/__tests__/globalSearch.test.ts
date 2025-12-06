import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from '../db';
import { 
  businessCapabilities, 
  applications, 
  businessProcesses, 
  dataEntities, 
  requirements,
  projects 
} from '../../drizzle/schema';
import { eq, and, isNull, like, or } from 'drizzle-orm';

describe('Global Search', () => {
  let testProjectId: number;
  let testEntities: {
    bc: number;
    app: number;
    bp: number;
    de: number;
    req: number;
  };

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create test project
    const [project] = await db.insert(projects).values({
      name: 'Test Search Project',
      description: 'Project for testing global search',
      status: 'active',
      userId: 1,
    }).$returningId();
    testProjectId = project.id;

    // Create test entities - minimal fields only
    const [bc] = await db.insert(businessCapabilities).values({
      projectId: testProjectId,
      name: 'Customer Management',
      normalizedName: 'customer management',
      description: 'Capability to manage customer data',
      level: 1,
      createdBy: 1,
    }).$returningId();

    const [app] = await db.insert(applications).values({
      projectId: testProjectId,
      name: 'CRM System',
      normalizedName: 'crm system',
      description: 'Customer relationship management application',
      createdBy: 1,
    }).$returningId();

    const [bp] = await db.insert(businessProcesses).values({
      projectId: testProjectId,
      name: 'Order Processing',
      normalizedName: 'order processing',
      description: 'Process for handling customer orders',
      createdBy: 1,
    }).$returningId();

    const [de] = await db.insert(dataEntities).values({
      projectId: testProjectId,
      name: 'Customer Data',
      normalizedName: 'customer data',
      description: 'Entity containing customer information',
      createdBy: 1,
    }).$returningId();

    const [req] = await db.insert(requirements).values({
      projectId: testProjectId,
      name: 'Security Requirement',
      normalizedName: 'security requirement',
      description: 'Requirement for data encryption',
      createdBy: 1,
    }).$returningId();

    testEntities = {
      bc: bc.id,
      app: app.id,
      bp: bp.id,
      de: de.id,
      req: req.id,
    };
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(businessCapabilities).where(eq(businessCapabilities.id, testEntities.bc));
    await db.delete(applications).where(eq(applications.id, testEntities.app));
    await db.delete(businessProcesses).where(eq(businessProcesses.id, testEntities.bp));
    await db.delete(dataEntities).where(eq(dataEntities.id, testEntities.de));
    await db.delete(requirements).where(eq(requirements.id, testEntities.req));
    await db.delete(projects).where(eq(projects.id, testProjectId));
  });

  it('should search across all entity types', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Search for "customer" - should find BC, APP, BP, and DE
    const searchTerm = '%customer%';
    
    const bcResults = await db.select()
      .from(businessCapabilities)
      .where(
        and(
          eq(businessCapabilities.projectId, testProjectId),
          isNull(businessCapabilities.deletedAt),
          or(
            like(businessCapabilities.name, searchTerm),
            like(businessCapabilities.description, searchTerm)
          )
        )
      );

    const appResults = await db.select()
      .from(applications)
      .where(
        and(
          eq(applications.projectId, testProjectId),
          isNull(applications.deletedAt),
          or(
            like(applications.name, searchTerm),
            like(applications.description, searchTerm)
          )
        )
      );

    const bpResults = await db.select()
      .from(businessProcesses)
      .where(
        and(
          eq(businessProcesses.projectId, testProjectId),
          isNull(businessProcesses.deletedAt),
          or(
            like(businessProcesses.name, searchTerm),
            like(businessProcesses.description, searchTerm)
          )
        )
      );

    const deResults = await db.select()
      .from(dataEntities)
      .where(
        and(
          eq(dataEntities.projectId, testProjectId),
          isNull(dataEntities.deletedAt),
          or(
            like(dataEntities.name, searchTerm),
            like(dataEntities.description, searchTerm)
          )
        )
      );

    const totalResults = bcResults.length + appResults.length + bpResults.length + deResults.length;
    expect(totalResults).toBeGreaterThanOrEqual(4); // BC, APP, BP, DE all contain "customer"
  });

  it('should find exact name matches', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const result = await db.select()
      .from(applications)
      .where(
        and(
          eq(applications.projectId, testProjectId),
          eq(applications.normalizedName, 'crm system'),
          isNull(applications.deletedAt)
        )
      );

    expect(result.length).toBe(1);
    expect(result[0].name).toBe('CRM System');
  });

  it('should find partial matches in descriptions', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const result = await db.select()
      .from(requirements)
      .where(
        and(
          eq(requirements.projectId, testProjectId),
          like(requirements.description, '%encryption%'),
          isNull(requirements.deletedAt)
        )
      );

    expect(result.length).toBeGreaterThan(0);
    expect(result[0].description).toContain('encryption');
  });

  it('should be case-insensitive', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const searchTerms = ['%CUSTOMER%', '%Customer%', '%customer%'];
    
    for (const term of searchTerms) {
      const result = await db.select()
        .from(businessCapabilities)
        .where(
          and(
            eq(businessCapabilities.projectId, testProjectId),
            like(businessCapabilities.name, term),
            isNull(businessCapabilities.deletedAt)
          )
        );

      expect(result.length).toBeGreaterThan(0);
      expect(result[0].name).toBe('Customer Management');
    }
  });

  it('should only return entities from the specified project', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create another project with similar entity
    const [otherProject] = await db.insert(projects).values({
      name: 'Other Project',
      description: 'Another project',
      status: 'active',
      userId: 1,
    }).$returningId();

    const [otherBc] = await db.insert(businessCapabilities).values({
      projectId: otherProject.id,
      name: 'Customer Service',
      normalizedName: 'customer service',
      description: 'Different customer capability',
      level: 1,
      createdBy: 1,
    }).$returningId();

    // Search in test project only
    const results = await db.select()
      .from(businessCapabilities)
      .where(
        and(
          eq(businessCapabilities.projectId, testProjectId),
          isNull(businessCapabilities.deletedAt)
        )
      );

    expect(results.length).toBe(1);
    expect(results[0].id).toBe(testEntities.bc);
    expect(results[0].id).not.toBe(otherBc.id);

    // Clean up
    await db.delete(businessCapabilities).where(eq(businessCapabilities.id, otherBc.id));
    await db.delete(projects).where(eq(projects.id, otherProject.id));
  });

  it('should not return soft-deleted entities', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create and soft-delete an entity
    const [deletedApp] = await db.insert(applications).values({
      projectId: testProjectId,
      name: 'Deleted App',
      normalizedName: 'deleted app',
      description: 'This should not appear in search',
      createdBy: 1,
      deletedAt: new Date(),
      deletedBy: 1,
    }).$returningId();

    // Search should not include soft-deleted entities
    const results = await db.select()
      .from(applications)
      .where(
        and(
          eq(applications.projectId, testProjectId),
          isNull(applications.deletedAt)
        )
      );

    const deletedFound = results.some(r => r.id === deletedApp.id);
    expect(deletedFound).toBe(false);

    // Clean up
    await db.delete(applications).where(eq(applications.id, deletedApp.id));
  });

  it('should handle empty search results gracefully', async () => {
    const db = await getDb();
    if (!db) throw new Error('Database not available');

    const results = await db.select()
      .from(businessCapabilities)
      .where(
        and(
          eq(businessCapabilities.projectId, testProjectId),
          like(businessCapabilities.name, '%nonexistentxyz123%'),
          isNull(businessCapabilities.deletedAt)
        )
      );

    expect(results).toHaveLength(0);
  });
});
