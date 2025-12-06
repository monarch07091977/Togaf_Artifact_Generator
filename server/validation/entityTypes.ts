/**
 * Entity Type Validation
 * 
 * Validates entity types against the schema enums and provides type-safe utilities.
 */

import { EntityType } from './relationshipMatrix';

/**
 * All valid entity types
 */
export const VALID_ENTITY_TYPES: readonly EntityType[] = [
  'businessCapability',
  'application',
  'businessProcess',
  'dataEntity',
  'requirement',
  'stakeholder',
  'organizationUnit',
] as const;

/**
 * Entity type display names for user-facing messages
 */
export const ENTITY_TYPE_DISPLAY_NAMES: Record<EntityType, string> = {
  businessCapability: 'Business Capability',
  application: 'Application',
  businessProcess: 'Business Process',
  dataEntity: 'Data Entity',
  requirement: 'Requirement',
  stakeholder: 'Stakeholder',
  organizationUnit: 'Organization Unit',
};

/**
 * Entity type descriptions
 */
export const ENTITY_TYPE_DESCRIPTIONS: Record<EntityType, string> = {
  businessCapability: 'A particular ability or capacity that a business may possess or exchange',
  application: 'A deployed and operational IT system that supports business functions',
  businessProcess: 'A collection of related, structured activities that produce a specific service or product',
  dataEntity: 'An encapsulation of data that is recognized by a business domain expert',
  requirement: 'A statement of need that must be met by a particular architecture or work package',
  stakeholder: 'An individual, team, or organization with interests in the outcome of the architecture',
  organizationUnit: 'An organizational unit or department within the enterprise',
};

/**
 * Validation error for invalid entity types
 */
export class InvalidEntityTypeError extends Error {
  constructor(
    public invalidType: string,
    public validTypes: readonly EntityType[] = VALID_ENTITY_TYPES
  ) {
    super(
      `Invalid entity type: "${invalidType}". ` +
      `Valid types are: ${validTypes.join(', ')}`
    );
    this.name = 'InvalidEntityTypeError';
  }
}

/**
 * Check if a string is a valid entity type
 * 
 * @param type - String to check
 * @returns true if valid entity type
 */
export function isValidEntityType(type: string): type is EntityType {
  return VALID_ENTITY_TYPES.includes(type as EntityType);
}

/**
 * Validate an entity type (throws if invalid)
 * 
 * @param type - Entity type to validate
 * @throws {InvalidEntityTypeError} If type is invalid
 */
export function validateEntityType(type: string): asserts type is EntityType {
  if (!isValidEntityType(type)) {
    throw new InvalidEntityTypeError(type);
  }
}

/**
 * Get display name for an entity type
 * 
 * @param type - Entity type
 * @returns Display name
 */
export function getEntityTypeDisplayName(type: EntityType): string {
  return ENTITY_TYPE_DISPLAY_NAMES[type];
}

/**
 * Get description for an entity type
 * 
 * @param type - Entity type
 * @returns Description
 */
export function getEntityTypeDescription(type: EntityType): string {
  return ENTITY_TYPE_DESCRIPTIONS[type];
}

/**
 * Validate that source and target entities are different
 * 
 * @param sourceType - Source entity type
 * @param sourceId - Source entity ID
 * @param targetType - Target entity type
 * @param targetId - Target entity ID
 * @throws {Error} If source and target are the same entity
 */
export function validateDifferentEntities(
  sourceType: EntityType,
  sourceId: number,
  targetType: EntityType,
  targetId: number
): void {
  if (sourceType === targetType && sourceId === targetId) {
    throw new Error(
      `Cannot create relationship from an entity to itself: ${sourceType} ${sourceId}`
    );
  }
}

/**
 * Validate that entities belong to the same project
 * 
 * @param sourceProjectId - Source entity project ID
 * @param targetProjectId - Target entity project ID
 * @throws {Error} If entities belong to different projects
 */
export function validateSameProject(
  sourceProjectId: number,
  targetProjectId: number
): void {
  if (sourceProjectId !== targetProjectId) {
    throw new Error(
      `Cannot create relationship between entities from different projects: ` +
      `${sourceProjectId} and ${targetProjectId}`
    );
  }
}

/**
 * Get entity type from table name
 * Useful for converting database table names to entity types
 * 
 * @param tableName - Database table name (e.g., "businessCapabilities")
 * @returns Entity type (e.g., "businessCapability")
 */
export function getEntityTypeFromTableName(tableName: string): EntityType | null {
  const mapping: Record<string, EntityType> = {
    businessCapabilities: 'businessCapability',
    applications: 'application',
    businessProcesses: 'businessProcess',
    dataEntities: 'dataEntity',
    requirements: 'requirement',
    stakeholders: 'stakeholder',
    organizationUnits: 'organizationUnit',
  };
  
  return mapping[tableName] || null;
}

/**
 * Get table name from entity type
 * Useful for converting entity types to database table names
 * 
 * @param entityType - Entity type (e.g., "businessCapability")
 * @returns Table name (e.g., "businessCapabilities")
 */
export function getTableNameFromEntityType(entityType: EntityType): string {
  const mapping: Record<EntityType, string> = {
    businessCapability: 'businessCapabilities',
    application: 'applications',
    businessProcess: 'businessProcesses',
    dataEntity: 'dataEntities',
    requirement: 'requirements',
    stakeholder: 'stakeholders',
    organizationUnit: 'organizationUnits',
  };
  
  return mapping[entityType];
}
