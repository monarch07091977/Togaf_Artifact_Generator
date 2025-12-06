# Enterprise Architecture Meta-Model Design

## Overview

This document defines the meta-model for the TOGAF Artifact Generator, transforming it from a document-centric system to a proper EA repository with structured entities and relationships.

## Core Principles

1. **Model-Centric Architecture** - Artifacts are views over a shared model, not self-contained documents
2. **Explicit Relationships** - All connections between entities are first-class objects with types
3. **Reusability** - Entities can be referenced across multiple artifacts and projects
4. **Traceability** - Full lineage tracking from business goals to technology components

## Entity Types

### Strategy Layer

**BusinessGoal**
- Purpose: High-level business objectives driving architecture decisions
- Attributes: name, description, priority, targetDate, measurableOutcomes
- Relationships: GOAL_DRIVES_INITIATIVE, GOAL_REQUIRES_CAPABILITY

**BusinessDriver**
- Purpose: External/internal forces compelling change
- Attributes: name, description, type (regulatory, competitive, technological), impact
- Relationships: DRIVER_MOTIVATES_GOAL, DRIVER_CREATES_REQUIREMENT

**Principle**
- Purpose: Architectural principles guiding decisions
- Attributes: name, statement, rationale, implications
- Relationships: PRINCIPLE_CONSTRAINS_DECISION, PRINCIPLE_GUIDES_DESIGN

### Business Layer

**BusinessCapability**
- Purpose: What the business does (stable, outcome-focused)
- Attributes: name, description, level (L1/L2/L3), maturityLevel
- Relationships: CAPABILITY_PARENT_OF, CAPABILITY_ENABLES_CAPABILITY, CAPABILITY_REALIZES_GOAL

**BusinessProcess**
- Purpose: How the business operates (dynamic, activity-focused)
- Attributes: name, description, owner, processType
- Relationships: PROCESS_IMPLEMENTS_CAPABILITY, PROCESS_USES_APPLICATION, PROCESS_PRODUCES_DATA

**BusinessService**
- Purpose: Externally visible business functions
- Attributes: name, description, serviceLevel, availability
- Relationships: SERVICE_REALIZES_CAPABILITY, SERVICE_CONSUMED_BY_STAKEHOLDER

**OrganizationUnit**
- Purpose: Business organizational structure
- Attributes: name, type, headcount, location
- Relationships: UNIT_OWNS_CAPABILITY, UNIT_EXECUTES_PROCESS, UNIT_USES_APPLICATION

**Stakeholder**
- Purpose: Individuals or groups with architecture interests
- Attributes: name, role, concerns, influence
- Relationships: STAKEHOLDER_OWNS_REQUIREMENT, STAKEHOLDER_APPROVES_DECISION

### Application Layer

**Application**
- Purpose: Software systems supporting business operations
- Attributes: name, description, vendor, version, lifecycle (plan/build/run/retire)
- Relationships: APPLICATION_SUPPORTS_CAPABILITY, APPLICATION_AUTOMATES_PROCESS, APPLICATION_USES_APPLICATION

**ApplicationService**
- Purpose: Externally visible application functions
- Attributes: name, description, protocol, endpoint
- Relationships: SERVICE_PROVIDED_BY_APPLICATION, SERVICE_CONSUMED_BY_APPLICATION

**ApplicationInterface**
- Purpose: Integration points between applications
- Attributes: name, protocol, dataFormat, frequency
- Relationships: INTERFACE_CONNECTS_APPLICATION, INTERFACE_TRANSFERS_DATA

**ApplicationComponent**
- Purpose: Logical application building blocks
- Attributes: name, description, componentType
- Relationships: COMPONENT_PART_OF_APPLICATION, COMPONENT_DEPENDS_ON_COMPONENT

### Data Layer

**DataEntity**
- Purpose: Business information concepts
- Attributes: name, description, classification, sensitivity
- Relationships: ENTITY_OWNED_BY_CAPABILITY, ENTITY_MANAGED_BY_APPLICATION, ENTITY_RELATED_TO_ENTITY

**DataObject**
- Purpose: Physical data structures
- Attributes: name, schema, format, volume
- Relationships: OBJECT_IMPLEMENTS_ENTITY, OBJECT_STORED_IN_TECHNOLOGY

**DataFlow**
- Purpose: Movement of data between systems
- Attributes: name, frequency, volume, latency
- Relationships: FLOW_FROM_APPLICATION, FLOW_TO_APPLICATION, FLOW_CARRIES_ENTITY

### Technology Layer

**TechnologyComponent**
- Purpose: Infrastructure and platform elements
- Attributes: name, type (server, database, middleware), vendor, version
- Relationships: TECHNOLOGY_HOSTS_APPLICATION, TECHNOLOGY_DEPENDS_ON_TECHNOLOGY

**TechnologyPlatform**
- Purpose: Standardized technology stacks
- Attributes: name, description, components, supportLevel
- Relationships: PLATFORM_INCLUDES_TECHNOLOGY, PLATFORM_SUPPORTS_APPLICATION

**Location**
- Purpose: Physical or logical deployment sites
- Attributes: name, type (datacenter, cloud, edge), region
- Relationships: LOCATION_HOSTS_TECHNOLOGY, LOCATION_SERVES_UNIT

### Cross-Cutting

**Requirement**
- Purpose: Functional and non-functional requirements
- Attributes: name, description, type, priority, status
- Relationships: REQUIREMENT_TRACES_TO_GOAL, REQUIREMENT_SATISFIED_BY_APPLICATION

**Risk**
- Purpose: Threats to architecture objectives
- Attributes: name, description, probability, impact, mitigation
- Relationships: RISK_THREATENS_GOAL, RISK_MITIGATED_BY_CONTROL

**Decision**
- Purpose: Architectural decisions and rationale
- Attributes: name, decision, rationale, alternatives, consequences
- Relationships: DECISION_ADDRESSES_REQUIREMENT, DECISION_GUIDED_BY_PRINCIPLE

**Project**
- Purpose: Initiatives implementing architecture changes
- Attributes: name, description, budget, timeline, status
- Relationships: PROJECT_DELIVERS_CAPABILITY, PROJECT_IMPLEMENTS_APPLICATION

## Relationship Types

### Structural Relationships
- PARENT_OF / CHILD_OF - Hierarchical decomposition
- PART_OF / CONTAINS - Composition
- DEPENDS_ON / DEPENDED_ON_BY - Dependencies

### Functional Relationships
- SUPPORTS / SUPPORTED_BY - Support relationships
- USES / USED_BY - Usage relationships
- IMPLEMENTS / IMPLEMENTED_BY - Realization

### Traceability Relationships
- REALIZES / REALIZED_BY - Goal to capability
- SATISFIES / SATISFIED_BY - Requirement to solution
- MOTIVATES / MOTIVATED_BY - Driver to goal

### Temporal Relationships
- PRECEDES / FOLLOWS - Sequence
- REPLACES / REPLACED_BY - Evolution
- MIGRATES_TO / MIGRATES_FROM - Transition

## Database Schema Design

### Entity Tables

Each entity type gets its own table with common fields:
- id (primary key)
- projectId (foreign key) - scopes entities to projects
- name
- description
- type (enum specific to entity)
- metadata (JSON for extensibility)
- createdAt, updatedAt, createdBy

### Relationship Table

Single polymorphic relationship table:
- id (primary key)
- projectId (foreign key)
- sourceEntityType (enum)
- sourceEntityId (integer)
- relationshipType (enum)
- targetEntityType (enum)
- targetEntityId (integer)
- properties (JSON for relationship-specific attributes)
- createdAt, createdBy

### Artifact-Entity Links

Bridge table connecting artifacts to model entities:
- artifactId (foreign key)
- entityType (enum)
- entityId (integer)
- section (text) - which part of artifact references this entity
- context (text) - surrounding text for context

## Implementation Strategy

### Phase 1: Core Entities (MVP)
- BusinessCapability
- Application
- BusinessProcess
- DataEntity
- Requirement

### Phase 2: Extended Model
- ApplicationInterface
- TechnologyComponent
- Stakeholder
- Risk
- Decision

### Phase 3: Advanced Features
- ApplicationComponent
- DataFlow
- TechnologyPlatform
- Location
- Full relationship graph

## AI Integration Changes

### Current Approach (Document-Centric)
```
Input: Project context + Questionnaire responses
Output: Markdown document with embedded content
```

### New Approach (Model-Centric)
```
Input: Project context + Existing model entities + Questionnaire responses
Output: {
  narrative: "Markdown document with entity references",
  entities: [
    { type: "BusinessCapability", name: "...", attributes: {...} }
  ],
  relationships: [
    { source: "cap-1", type: "REALIZES", target: "goal-1" }
  ],
  suggestions: [
    { confidence: 0.8, entity: "...", relationship: "..." }
  ]
}
```

## UI Changes

### Entity Browser
- Searchable list of all entities by type
- Filter by project, lifecycle, status
- Quick actions: view, edit, delete, link

### Relationship Visualizer
- Graph view showing entity connections
- Filter by relationship type
- Navigate from entity to entity

### Artifact Editor Enhancements
- Inline entity picker (typeahead search)
- Entity tags in content (clickable, navigable)
- Relationship panel showing connected entities
- AI suggestions for missing relationships

### Model Repository View
- Dashboard showing entity counts by type
- Health metrics (orphaned entities, missing relationships)
- Impact analysis (what depends on this entity?)
- Reuse metrics (which entities are most referenced?)

## Benefits

1. **Reusability** - Define a capability once, reference everywhere
2. **Consistency** - Same entity has same definition across artifacts
3. **Traceability** - Follow relationships from goal to implementation
4. **Impact Analysis** - Understand ripple effects of changes
5. **Gap Analysis** - Find capabilities without applications
6. **Dependency Management** - Visualize application dependencies
7. **Portfolio Management** - Aggregate view of all applications/projects
8. **Compliance** - Track requirements to implementations

## Migration Path

1. Keep existing artifacts table for backward compatibility
2. Add new meta-model tables alongside
3. Provide migration tool to extract entities from existing artifacts
4. New artifacts automatically create/link entities
5. Gradually enrich model through AI suggestions and user curation
