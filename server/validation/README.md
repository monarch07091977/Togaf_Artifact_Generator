# EA Meta-Model Validation Specification

This document defines the validation rules for the Enterprise Architecture meta-model entities and relationships.

## 1. Relationship Type Matrix

The relationship type matrix defines which entity types can be connected with which relationship types. This ensures semantic correctness of the EA model.

### Allowed Relationships

| Relationship Type | Source Entity Types | Target Entity Types | Description |
|------------------|-------------------|-------------------|-------------|
| `FLOWS_TO` | application, businessProcess | application, businessProcess, dataEntity | Data or control flows from source to target |
| `ORIGINATES_FROM` | dataEntity | application, businessProcess | Data entity is created/owned by source |
| `SUPPORTS` | application, businessProcess | businessCapability, requirement | Source enables or implements target |
| `DEPENDS_ON` | application, businessProcess, businessCapability | application, businessProcess, dataEntity | Source requires target to function |
| `CONTAINS` | businessCapability, businessProcess | businessCapability, businessProcess, application | Hierarchical containment |

### Validation Rules

1. **Source and target must be different entities** - Cannot create a relationship from an entity to itself
2. **Entity types must match the matrix** - Only allowed combinations can be created
3. **ProjectId must match** - Source and target must belong to the same project
4. **No duplicate relationships** - Same (source, target, type) combination cannot exist twice

## 2. Normalized Name Generation

The `normalizedName` field is automatically generated from the `name` field to enable case-insensitive deduplication and future organization-level merging.

### Normalization Rules

1. **Convert to lowercase** - All characters converted to lowercase
2. **Trim whitespace** - Leading and trailing whitespace removed
3. **Collapse internal whitespace** - Multiple spaces collapsed to single space
4. **Remove special characters** - Only alphanumeric and spaces retained (optional, for strict mode)

### Example Transformations

| Original Name | Normalized Name |
|--------------|----------------|
| `Customer Management` | `customer management` |
| `  Order Processing  ` | `order processing` |
| `PAYMENT-GATEWAY` | `payment-gateway` |
| `Data   Warehouse` | `data warehouse` |

### Uniqueness Constraint

- `unique(projectId, normalizedName)` enforced at database level
- Service layer validates before insert/update to provide friendly error messages

## 3. Entity Type Validation

All entity types must match the defined enums in the schema.

### Valid Entity Types

```typescript
type EntityType = 
  | 'businessCapability'
  | 'application'
  | 'businessProcess'
  | 'dataEntity'
  | 'requirement'
  | 'stakeholder';
```

### Validation Points

1. **Relationship creation** - Validate source and target entity types
2. **Artifact linking** - Validate entity type in artifactEntityLinks
3. **API inputs** - Validate entity type parameters in tRPC procedures

## 4. Implementation Guidelines

### Validation Module Structure

```
server/validation/
├── README.md                    # This file
├── relationshipMatrix.ts        # Matrix definition and validation
├── normalizedName.ts            # Name normalization utilities
├── entityTypes.ts               # Entity type validation
└── index.ts                     # Exports all validation functions
```

### Error Handling

All validation functions should throw descriptive errors:

```typescript
throw new Error(`Invalid relationship: ${sourceType} cannot ${relationshipType} ${targetType}`);
throw new Error(`Duplicate entity name: "${normalizedName}" already exists in project ${projectId}`);
throw new Error(`Invalid entity type: "${entityType}" is not a valid type`);
```

### Integration Points

1. **Entity creation** - Generate normalizedName, validate uniqueness
2. **Entity update** - Regenerate normalizedName if name changed, validate uniqueness
3. **Relationship creation** - Validate against matrix, check projectId consistency
4. **Artifact linking** - Validate entity type

## 5. Testing Strategy

1. **Unit tests** - Test each validation function in isolation
2. **Integration tests** - Test validation through tRPC procedures
3. **Edge cases** - Test boundary conditions, special characters, unicode
4. **Error messages** - Verify error messages are clear and actionable
