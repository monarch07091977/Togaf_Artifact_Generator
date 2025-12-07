/**
 * Validation Engine
 * 
 * Executes validation rules against EA entities and relationships
 * to ensure repository quality and compliance with business rules.
 */

import { getDb } from "./db";
import {
  validationRules,
  validationViolations,
  businessCapabilities,
  applications,
  businessProcesses,
  dataEntities,
  requirements,
  eaRelationships,
  type ValidationRule,
  type InsertValidationViolation,
} from "../drizzle/schema";
import { eq, and, isNull, inArray, sql } from "drizzle-orm";

type EntityType = 'businessCapability' | 'application' | 'businessProcess' | 'dataEntity' | 'requirement';

interface ViolationResult {
  entityType: EntityType;
  entityId: number;
  entityName: string;
  message: string;
  expected: string;
  actual: string;
  suggestions: string[];
}

const TABLE_MAP = {
  businessCapability: businessCapabilities,
  application: applications,
  businessProcess: businessProcesses,
  dataEntity: dataEntities,
  requirement: requirements,
};

/**
 * Get all entities of a specific type for a project
 */
async function getEntities(projectId: number, entityType: EntityType) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const table = TABLE_MAP[entityType];
  return await db
    .select()
    .from(table)
    .where(and(eq(table.projectId, projectId), isNull(table.deletedAt)));
}

/**
 * Get relationship count for an entity
 */
async function getRelationshipCount(
  projectId: number,
  entityType: EntityType,
  entityId: number,
  relationshipType?: string
): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const conditions: any[] = [
    eq(eaRelationships.projectId, projectId),
    isNull(eaRelationships.deletedAt),
  ];

  // Entity can be either source or target
  conditions.push(
    sql`(
      (${eaRelationships.sourceEntityType} = ${entityType} AND ${eaRelationships.sourceEntityId} = ${entityId})
      OR
      (${eaRelationships.targetEntityType} = ${entityType} AND ${eaRelationships.targetEntityId} = ${entityId})
    )`
  );

  if (relationshipType) {
    conditions.push(eq(eaRelationships.relationshipType, relationshipType));
  }

  const result = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(eaRelationships)
    .where(and(...conditions));

  return result[0]?.count || 0;
}

/**
 * Check for circular dependencies starting from an entity
 */
async function hasCircularDependency(
  projectId: number,
  entityType: EntityType,
  entityId: number,
  visited: Set<string> = new Set()
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const key = `${entityType}:${entityId}`;
  if (visited.has(key)) return true; // Found a cycle
  
  visited.add(key);

  // Get all outgoing relationships
  const relationships = await db
    .select()
    .from(eaRelationships)
    .where(
      and(
        eq(eaRelationships.projectId, projectId),
        eq(eaRelationships.sourceEntityType, entityType),
        eq(eaRelationships.sourceEntityId, entityId),
        isNull(eaRelationships.deletedAt)
      )
    );

  // Recursively check each target
  for (const rel of relationships) {
    if (await hasCircularDependency(projectId, rel.targetEntityType as EntityType, rel.targetEntityId, new Set(visited))) {
      return true;
    }
  }

  return false;
}

/**
 * Validate minimum relationship count rule
 */
async function validateMinRelationships(
  projectId: number,
  rule: ValidationRule
): Promise<ViolationResult[]> {
  const config = rule.config as any;
  const { entityType, minCount, relationshipType } = config;

  const entities = await getEntities(projectId, entityType);
  const violations: ViolationResult[] = [];

  for (const entity of entities) {
    const count = await getRelationshipCount(
      projectId,
      entityType,
      entity.id,
      relationshipType
    );

    if (count < minCount) {
      violations.push({
        entityType,
        entityId: entity.id,
        entityName: entity.name,
        message: `${entity.name} has only ${count} relationship(s), expected at least ${minCount}`,
        expected: `At least ${minCount} ${relationshipType || 'relationship(s)'}`,
        actual: `${count} relationship(s)`,
        suggestions: [
          `Add ${minCount - count} more relationship(s) to meet the minimum requirement`,
          `Review similar entities to identify potential relationships`,
        ],
      });
    }
  }

  return violations;
}

/**
 * Validate maximum relationship count rule
 */
async function validateMaxRelationships(
  projectId: number,
  rule: ValidationRule
): Promise<ViolationResult[]> {
  const config = rule.config as any;
  const { entityType, maxCount, relationshipType } = config;

  const entities = await getEntities(projectId, entityType);
  const violations: ViolationResult[] = [];

  for (const entity of entities) {
    const count = await getRelationshipCount(
      projectId,
      entityType,
      entity.id,
      relationshipType
    );

    if (count > maxCount) {
      violations.push({
        entityType,
        entityId: entity.id,
        entityName: entity.name,
        message: `${entity.name} has ${count} relationship(s), exceeds maximum of ${maxCount}`,
        expected: `At most ${maxCount} ${relationshipType || 'relationship(s)'}`,
        actual: `${count} relationship(s)`,
        suggestions: [
          `Remove ${count - maxCount} relationship(s) to meet the maximum limit`,
          `Consider splitting this entity into multiple smaller entities`,
        ],
      });
    }
  }

  return violations;
}

/**
 * Validate required relationship type rule
 */
async function validateRequiredRelationship(
  projectId: number,
  rule: ValidationRule
): Promise<ViolationResult[]> {
  const config = rule.config as any;
  const { entityType, requiredRelationshipType } = config;

  const entities = await getEntities(projectId, entityType);
  const violations: ViolationResult[] = [];

  for (const entity of entities) {
    const count = await getRelationshipCount(
      projectId,
      entityType,
      entity.id,
      requiredRelationshipType
    );

    if (count === 0) {
      violations.push({
        entityType,
        entityId: entity.id,
        entityName: entity.name,
        message: `${entity.name} is missing required relationship type: ${requiredRelationshipType}`,
        expected: `At least one ${requiredRelationshipType} relationship`,
        actual: `No ${requiredRelationshipType} relationships`,
        suggestions: [
          `Add a ${requiredRelationshipType} relationship to this entity`,
          `Review TOGAF guidelines for required relationships`,
        ],
      });
    }
  }

  return violations;
}

/**
 * Validate no circular dependencies rule
 */
async function validateNoCircularDependencies(
  projectId: number,
  rule: ValidationRule
): Promise<ViolationResult[]> {
  const config = rule.config as any;
  const { entityTypes } = config; // Array of entity types to check

  const violations: ViolationResult[] = [];

  for (const entityType of entityTypes) {
    const entities = await getEntities(projectId, entityType);

    for (const entity of entities) {
      if (await hasCircularDependency(projectId, entityType, entity.id)) {
        violations.push({
          entityType,
          entityId: entity.id,
          entityName: entity.name,
          message: `${entity.name} is part of a circular dependency chain`,
          expected: `No circular dependencies`,
          actual: `Circular dependency detected`,
          suggestions: [
            `Review the relationship chain and remove circular references`,
            `Consider restructuring the architecture to eliminate cycles`,
          ],
        });
      }
    }
  }

  return violations;
}

/**
 * Validate no orphaned entities rule
 */
async function validateNoOrphanedEntities(
  projectId: number,
  rule: ValidationRule
): Promise<ViolationResult[]> {
  const config = rule.config as any;
  const { entityTypes } = config;

  const violations: ViolationResult[] = [];

  for (const entityType of entityTypes) {
    const entities = await getEntities(projectId, entityType);

    for (const entity of entities) {
      const count = await getRelationshipCount(projectId, entityType, entity.id);

      if (count === 0) {
        violations.push({
          entityType,
          entityId: entity.id,
          entityName: entity.name,
          message: `${entity.name} has no relationships (orphaned entity)`,
          expected: `At least one relationship`,
          actual: `No relationships`,
          suggestions: [
            `Add relationships to connect this entity to the architecture`,
            `Consider if this entity is still relevant or should be archived`,
          ],
        });
      }
    }
  }

  return violations;
}

/**
 * Validate naming convention rule
 */
async function validateNamingConvention(
  projectId: number,
  rule: ValidationRule
): Promise<ViolationResult[]> {
  const config = rule.config as any;
  const { entityType, pattern, description } = config;

  const entities = await getEntities(projectId, entityType);
  const violations: ViolationResult[] = [];
  const regex = new RegExp(pattern);

  for (const entity of entities) {
    if (!regex.test(entity.name)) {
      violations.push({
        entityType,
        entityId: entity.id,
        entityName: entity.name,
        message: `${entity.name} does not match naming convention: ${description}`,
        expected: `Name matching pattern: ${pattern}`,
        actual: `Current name: ${entity.name}`,
        suggestions: [
          `Rename to follow the convention: ${description}`,
          `Example: Use PascalCase or add required prefix/suffix`,
        ],
      });
    }
  }

  return violations;
}

/**
 * Validate attribute completeness rule
 */
async function validateAttributeCompleteness(
  projectId: number,
  rule: ValidationRule
): Promise<ViolationResult[]> {
  const config = rule.config as any;
  const { entityType, requiredFields } = config; // Array of field names

  const entities = await getEntities(projectId, entityType);
  const violations: ViolationResult[] = [];

  for (const entity of entities) {
    const missingFields: string[] = [];

    for (const field of requiredFields) {
      const value = (entity as any)[field];
      if (value === null || value === undefined || value === '') {
        missingFields.push(field);
      }
    }

    if (missingFields.length > 0) {
      violations.push({
        entityType,
        entityId: entity.id,
        entityName: entity.name,
        message: `${entity.name} is missing required fields: ${missingFields.join(', ')}`,
        expected: `All required fields populated: ${requiredFields.join(', ')}`,
        actual: `Missing: ${missingFields.join(', ')}`,
        suggestions: [
          `Fill in the missing fields: ${missingFields.join(', ')}`,
          `Review entity details and add complete information`,
        ],
      });
    }
  }

  return violations;
}

/**
 * Execute a single validation rule
 */
export async function executeRule(
  projectId: number,
  rule: ValidationRule
): Promise<ViolationResult[]> {
  switch (rule.ruleType) {
    case 'min_relationships':
      return await validateMinRelationships(projectId, rule);
    case 'max_relationships':
      return await validateMaxRelationships(projectId, rule);
    case 'required_relationship':
      return await validateRequiredRelationship(projectId, rule);
    case 'no_circular_dependencies':
      return await validateNoCircularDependencies(projectId, rule);
    case 'no_orphaned_entities':
      return await validateNoOrphanedEntities(projectId, rule);
    case 'naming_convention':
      return await validateNamingConvention(projectId, rule);
    case 'attribute_completeness':
      return await validateAttributeCompleteness(projectId, rule);
    default:
      return [];
  }
}

/**
 * Run all active validation rules for a project
 */
export async function runValidation(projectId: number): Promise<{
  totalRules: number;
  totalViolations: number;
  violationsByRule: Record<number, number>;
}> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Get all active rules for the project
  const rules = await db
    .select()
    .from(validationRules)
    .where(
      and(
        eq(validationRules.projectId, projectId),
        eq(validationRules.isActive, 1)
      )
    );

  // Clear existing violations for this project
  await db
    .delete(validationViolations)
    .where(eq(validationViolations.projectId, projectId));

  let totalViolations = 0;
  const violationsByRule: Record<number, number> = {};

  // Execute each rule
  for (const rule of rules) {
    const violations = await executeRule(projectId, rule);
    violationsByRule[rule.id] = violations.length;
    totalViolations += violations.length;

    // Insert violations into database
    for (const violation of violations) {
      await db.insert(validationViolations).values({
        ruleId: rule.id,
        projectId,
        entityType: violation.entityType,
        entityId: violation.entityId,
        entityName: violation.entityName,
        violationDetails: {
          message: violation.message,
          expected: violation.expected,
          actual: violation.actual,
          suggestions: violation.suggestions,
        } as any,
        status: 'open',
      });
    }
  }

  return {
    totalRules: rules.length,
    totalViolations,
    violationsByRule,
  };
}
