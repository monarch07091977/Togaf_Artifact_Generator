/**
 * EA Meta-Model Validation
 * 
 * Centralized validation logic for the Enterprise Architecture meta-model.
 * 
 * Usage:
 * ```typescript
 * import { validateRelationshipMatrix, normalizeName, validateEntityType } from './validation';
 * 
 * // Validate relationship
 * validateRelationshipMatrix('application', 'businessCapability', 'SUPPORTS');
 * 
 * // Generate normalized name
 * const normalized = normalizeName('Customer Management');
 * 
 * // Validate entity type
 * validateEntityType('application');
 * ```
 */

// Re-export all validation functions and types
export * from './relationshipMatrix';
export * from './normalizedName';
export * from './entityTypes';

// Re-export commonly used types
export type { EntityType, RelationshipType } from './relationshipMatrix';
