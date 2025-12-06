/**
 * Relationship Type Matrix Validation
 * 
 * Defines and validates which entity types can be connected with which relationship types.
 * Based on the production-ready EA schema specification v2.1.
 */

/**
 * Entity types in the EA meta-model
 */
export type EntityType =
  | 'businessCapability'
  | 'application'
  | 'businessProcess'
  | 'dataEntity'
  | 'requirement'
  | 'stakeholder'
  | 'organizationUnit';

/**
 * Relationship types (simplified, production-ready)
 */
export type RelationshipType =
  | 'SUPPORTS'
  | 'USES'
  | 'REALIZES'
  | 'IMPLEMENTS'
  | 'DEPENDS_ON'
  | 'OWNS'
  | 'MANAGES'
  | 'TRIGGERS'
  | 'FLOWS_TO'
  | 'ORIGINATES_FROM'
  | 'CONTAINS';

/**
 * Relationship matrix defining allowed combinations
 * Key: relationshipType
 * Value: { sources: allowed source entity types, targets: allowed target entity types }
 */
export const RELATIONSHIP_MATRIX: Record<
  RelationshipType,
  { sources: EntityType[]; targets: EntityType[]; description: string }
> = {
  SUPPORTS: {
    sources: ['application', 'businessProcess'],
    targets: ['businessCapability', 'requirement'],
    description: 'Source enables or implements target',
  },
  USES: {
    sources: ['application', 'businessProcess', 'businessCapability'],
    targets: ['application', 'dataEntity'],
    description: 'Source uses or consumes target',
  },
  REALIZES: {
    sources: ['application', 'businessProcess'],
    targets: ['businessCapability', 'requirement'],
    description: 'Source implements or realizes target (logical → physical)',
  },
  IMPLEMENTS: {
    sources: ['application', 'businessProcess'],
    targets: ['requirement'],
    description: 'Source implements requirement',
  },
  DEPENDS_ON: {
    sources: ['application', 'businessProcess', 'businessCapability'],
    targets: ['application', 'businessProcess', 'dataEntity'],
    description: 'Source requires target to function',
  },
  OWNS: {
    sources: ['stakeholder', 'organizationUnit'],
    targets: ['application', 'businessProcess', 'businessCapability', 'dataEntity'],
    description: 'Source owns or is responsible for target',
  },
  MANAGES: {
    sources: ['stakeholder', 'organizationUnit'],
    targets: ['application', 'businessProcess', 'businessCapability', 'dataEntity'],
    description: 'Source manages target',
  },
  TRIGGERS: {
    sources: ['businessProcess', 'application'],
    targets: ['businessProcess'],
    description: 'Source triggers or initiates target',
  },
  FLOWS_TO: {
    sources: ['application', 'businessProcess'],
    targets: ['application', 'businessProcess', 'dataEntity'],
    description: 'Data or control flows from source to target',
  },
  ORIGINATES_FROM: {
    sources: ['dataEntity'],
    targets: ['application', 'businessProcess'],
    description: 'Data entity is created/owned by source',
  },
  CONTAINS: {
    sources: ['businessCapability', 'businessProcess'],
    targets: ['businessCapability', 'businessProcess', 'application'],
    description: 'Hierarchical containment',
  },
};

/**
 * Validation error class for relationship matrix violations
 */
export class RelationshipMatrixError extends Error {
  constructor(
    public sourceType: EntityType,
    public targetType: EntityType,
    public relationshipType: RelationshipType
  ) {
    super(
      `Invalid relationship: ${sourceType} cannot ${relationshipType} ${targetType}. ` +
      `Check the relationship matrix for allowed combinations.`
    );
    this.name = 'RelationshipMatrixError';
  }
}

/**
 * Validate if a relationship type is allowed between two entity types
 * 
 * @param sourceType - Source entity type
 * @param targetType - Target entity type
 * @param relationshipType - Relationship type
 * @throws {RelationshipMatrixError} If the combination is not allowed
 */
export function validateRelationshipMatrix(
  sourceType: EntityType,
  targetType: EntityType,
  relationshipType: RelationshipType
): void {
  const rule = RELATIONSHIP_MATRIX[relationshipType];
  
  if (!rule) {
    throw new Error(`Unknown relationship type: ${relationshipType}`);
  }
  
  const isSourceAllowed = rule.sources.includes(sourceType);
  const isTargetAllowed = rule.targets.includes(targetType);
  
  if (!isSourceAllowed || !isTargetAllowed) {
    throw new RelationshipMatrixError(sourceType, targetType, relationshipType);
  }
}

/**
 * Check if a relationship type is allowed (without throwing)
 * 
 * @param sourceType - Source entity type
 * @param targetType - Target entity type
 * @param relationshipType - Relationship type
 * @returns true if allowed, false otherwise
 */
export function isRelationshipAllowed(
  sourceType: EntityType,
  targetType: EntityType,
  relationshipType: RelationshipType
): boolean {
  try {
    validateRelationshipMatrix(sourceType, targetType, relationshipType);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get all allowed relationship types for a given source and target entity type
 * 
 * @param sourceType - Source entity type
 * @param targetType - Target entity type
 * @returns Array of allowed relationship types
 */
export function getAllowedRelationshipTypes(
  sourceType: EntityType,
  targetType: EntityType
): RelationshipType[] {
  const allowed: RelationshipType[] = [];
  
  for (const [relType, rule] of Object.entries(RELATIONSHIP_MATRIX)) {
    if (rule.sources.includes(sourceType) && rule.targets.includes(targetType)) {
      allowed.push(relType as RelationshipType);
    }
  }
  
  return allowed;
}

/**
 * Get allowed target entity types for a given source type and relationship type
 * 
 * @param sourceType - Source entity type
 * @param relationshipType - Relationship type
 * @returns Array of allowed target entity types
 */
export function getAllowedTargetTypes(
  sourceType: EntityType,
  relationshipType: RelationshipType
): EntityType[] {
  const rule = RELATIONSHIP_MATRIX[relationshipType];
  
  if (!rule) {
    return [];
  }
  
  if (!rule.sources.includes(sourceType)) {
    return [];
  }
  
  return rule.targets;
}

/**
 * Get allowed source entity types for a given target type and relationship type
 * 
 * @param targetType - Target entity type
 * @param relationshipType - Relationship type
 * @returns Array of allowed source entity types
 */
export function getAllowedSourceTypes(
  targetType: EntityType,
  relationshipType: RelationshipType
): EntityType[] {
  const rule = RELATIONSHIP_MATRIX[relationshipType];
  
  if (!rule) {
    return [];
  }
  
  if (!rule.targets.includes(targetType)) {
    return [];
  }
  
  return rule.sources;
}
