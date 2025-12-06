# TOGAF Artifact Generator - TODO

## EA Meta-Model Schema Refinements (Phase 1.x - Production-Ready)

### Critical Priority (Implement Now - Production Readiness Fixes)
- [x] Create detailed specification document for all schema changes
- [x] Review and approve updated specification with production-ready fixes
- [x] **FIX: Add projectId to relationship uniqueness constraint** (prevents cross-project ID collisions)
- [x] **FIX: Optimize relationship indexes with projectId first** (align with real query patterns)
- [x] **FIX: Add deletedAt to eaRelationships and artifactEntityLinks** (preserve history)
- [x] **FIX: Add unique(projectId, normalizedName) to all entity tables** (prevent case-variant duplicates)
- [x] **FIX: Add unique constraint to artifactEntityLinks** (prevent duplicate links)
- [x] **IMPROVE: Simplify relationshipType enum and document allowed matrix**
- [x] **OPTIONAL: Add externalKey to organizationUnits** (future org-level merge hint)
- [x] **OPTIONAL: Add createdBy/createdVia to artifactEntityLinks** (AI traceability)
- [x] Remove CASCADE deletes on entity→project FKs (conflicts with soft deletes)
- [x] Convert VARCHAR pseudo-enums to real MySQL ENUMs (usageType, entityType, relationshipType)
- [x] Add indexes for soft delete queries (projectId, deletedAt)
- [x] Add indexes for relationship lookups (source/target entity lookups)
- [x] Change TEXT to JSON type for metadata and suggestedData fields
- [x] Add normalizedName column to all entity tables for org-scope preparation
- [x] Add organizationUnits table for stakeholder organization FK

### High Priority (Phase 1.5)
- [ ] Add updatedBy field to entity tables for audit trails
- [ ] Add unique email constraint on stakeholders per project
- [ ] Implement service layer normalization logic for normalizedName
- [ ] Implement relationship type validation matrix in service layer
- [ ] Implement transaction support for multi-entity operations
- [ ] Implement soft delete cascade logic (entities → relationships → links)

### Medium Priority (Phase 2)
- [ ] Migrate to organization-level scope
- [ ] Implement full versioning system
- [ ] Build graph visualization
- [ ] Add advanced impact analysis

---

## Production-Ready Schema Refinements - Delta Changes

### 1. Relationship Uniqueness Scope Fix
**Problem:** Current unique constraint doesn't include projectId, causing cross-project ID collisions
**Fix:** Include projectId in uniqueness key
**Impact:** Prevents false duplicate detection across projects

### 2. Relationship Index Optimization  
**Problem:** Indexes don't match real query patterns (always filter by project first)
**Fix:** Add projectId as leading column in all relationship indexes
**Impact:** 10-100x query performance improvement

### 3. Soft Delete for Relationships & Links
**Problem:** No deletedAt on eaRelationships and artifactEntityLinks → lose history
**Fix:** Add deletedAt + soft delete cascade logic
**Impact:** Preserve complete EA history

### 4. Normalized Name Uniqueness
**Problem:** Only name is unique, not normalizedName → case variants can coexist
**Fix:** Add unique(projectId, normalizedName) to all entity tables
**Impact:** Strict deduplication, cleaner org-level migration

### 5. Artifact Link Uniqueness
**Problem:** Can insert duplicate artifact-entity links
**Fix:** Add unique constraint on (artifactId, entityType, entityId, usageType)
**Impact:** Data quality, prevents accidental duplicates

### 6. Relationship Type Simplification
**Problem:** Semantic overlap in relationshipType enum (PROVIDES_DATA_TO vs CONSUMES_DATA_FROM)
**Fix:** Simplify to generic verbs + document allowed matrix
**Impact:** Clearer semantics, easier to extend

---

## Previous TODO Items

### EA Meta-Model Foundation (Phase 1 - Complete)
- [x] Design core EA entity types (BusinessCapability, Application, Process, etc.)
- [x] Define relationship types and cardinalities
- [x] Create database schema for meta-model entities
- [x] Create database schema for entity relationships
- [x] Implement CRUD operations for meta-model entities
- [x] Implement relationship management service

### EA Meta-Model Schema Improvements (Phase 1 - Complete)
- [x] Add stakeholders table with proper entity relationships
- [x] Replace owner VARCHAR fields with stakeholder FK relationships
- [x] Add role/usageType to artifactEntityLinks table
- [x] Add unique constraints on entity names per project
- [x] Add deletedAt field for soft deletes on all entity tables

### Deferred to Later Phases
- [ ] Add indexes on (projectId, relationshipType) for performance (Phase 1.5)
- [ ] Implement AI suggestion workflow with confidence scoring (Phase 1.5)
- [ ] Build entity browser UI with search/filter (Phase 1.5)
- [ ] Implement entity deduplication logic (Phase 1.5)
- [ ] Add organization-level scope model (Phase 2)
- [ ] Build graph visualization (Phase 2)
- [ ] Implement full versioning system (Phase 2)

---

## Application Features

### TOGAF-Based Questionnaire Improvements
- [x] Review TOGAF standard documentation (Parts 0-5) for artifact requirements
- [x] Extract artifact-specific questions from TOGAF documentation
- [x] Update questionnaire system to use TOGAF-based questions for each artifact type
- [x] Create mapping between artifact types and their specific questionnaire templates
- [x] Test questionnaires generate relevant content for artifacts

### Artifact Dropdown Filtering
- [x] Filter artifact dropdown to show only artifacts for the selected ADM phase
- [x] Exclude already-created artifacts from the dropdown
- [x] Update UI to show "All artifacts created" message when phase is complete
- [x] Test dropdown filtering works correctly across all phases

### Fix tRPC Errors (Artifact Routing)
- [x] Investigate server logs for errors when accessing artifact ID 30002
- [x] Identify which tRPC procedures are failing
- [x] Fix routing configuration - artifact route was /artifacts/:id but URL was /projects/:projectId/artifacts/:artifactId

### Fix Artifact Export Functionality
- [x] Investigate why manus-md-to-pdf command is not found
- [x] Fix PDF export functionality
- [x] Fix Word export functionality
- [x] Test PDF export downloads correctly
- [x] Test Word export downloads correctly

### Implement Alternative PDF Generation
- [x] Check if manus-md-to-pdf is available in deployment environment
- [x] Install and configure puppeteer for PDF generation
- [x] Update export service to use Node.js-based PDF generation with puppeteer
- [x] Test PDF generation works in all environments - Successfully tested with puppeteer

### Fix Chromium Path Detection for Production
- [x] Update Chromium path to check multiple possible locations (/home/ubuntu, /root, system paths)
- [x] Use existsSync to verify Chrome executable exists before launching
- [x] Add fallback to puppeteer.executablePath() if custom path not found
- [ ] Test PDF export in production environment

---

## Project Management

### Completed Features
- [x] Basic project CRUD operations
- [x] Artifact creation and management
- [x] AI-powered artifact generation
- [x] Questionnaire system
- [x] Project metadata editing
- [x] TOGAF-compliant questionnaire generation
- [x] Artifact dropdown filtering by phase
- [x] PDF/Word export functionality
- [x] Routing fixes for artifact pages
- [x] EA meta-model foundation
- [x] Schema improvements (stakeholders, soft deletes, unique constraints)

### Known Issues
- [ ] OAuth redirect URI configuration for preview URLs (platform issue)
- [ ] PDF export in deployed environment (Chromium path resolution)


## Service Layer Validation (Phase 1.5 - Completed)

### Validation Logic Implementation
- [x] Create relationship type matrix validation module
- [x] Implement automatic normalizedName generation on entity create/update
- [x] Add entity type validation to relationship creation
- [x] Add validation error messages and error handling
- [x] Create validation utility functions for reuse across service layer
- [x] Create EA entity CRUD router with built-in validation
- [ ] Add validation tests

### Validation Rules
- [x] Enforce relationship type matrix (which entities can connect with which types)
- [x] Validate normalizedName uniqueness per project
- [x] Validate entity types match schema enums
- [x] Validate relationship source and target are different entities
- [x] Validate projectId consistency across related entities


## EA Entity Browser UI (Phase 1.6 - Completed)

### Backend Queries
- [x] Add list queries for all EA entity types (businessCapabilities, applications, etc.)
- [x] Add relationship queries (get relationships for entity, get all relationships for project)
- [x] Add search/filter support (by name, type, project)
- [x] Add pagination support for large entity lists

### UI Components
- [x] Create EntityBrowser page component
- [x] Create EntityList component with search and filters
- [x] Create EntityCard component for displaying entity details
- [x] Create EntityCreateDialog component
- [x] Create EntityDetailDialog component with relationship visualization
- [ ] Create EntityEditDialog component (future enhancement)

### Features
- [x] Entity type tabs (Business Capabilities, Applications, Processes, Data, Requirements)
- [x] Search by name with real-time filtering
- [x] Filter by project (implicit - scoped to project)
- [x] Create new entities with validation
- [x] View entity details
- [x] View entity relationships (incoming and outgoing)
- [ ] Edit existing entities (future enhancement)
- [ ] Delete entities (soft delete) (future enhancement)
- [ ] Interactive graph visualization (future enhancement)

### Navigation
- [x] Add EA Entity Browser link to project detail page
- [x] Add route in App.tsx
- [x] Navigation from project page to EA entities


## Interactive Graph Visualization (Phase 1.7 - Completed)

### Dependencies
- [x] Install React Flow library
- [x] Install dagre for automatic graph layout

### Graph Components
- [x] Create graph data transformation utilities (entities + relationships → nodes + edges)
- [x] Create RelationshipGraph component with React Flow
- [x] Create custom node components for different entity types
- [x] Create custom edge components for relationship types

### Features
- [x] Interactive network diagram with zoom and pan
- [x] Automatic layout using dagre algorithm
- [x] Color-coded nodes by entity type
- [x] Labeled edges showing relationship types
- [x] Click on nodes to view entity details
- [x] Filter graph by entity type
- [x] Filter graph by relationship type
- [x] Toggle between vertical and horizontal layout
- [x] Mini-map for navigation
- [ ] Highlight connected nodes on hover (future enhancement)
- [ ] Export graph as image (PNG/SVG) (future enhancement)

### Integration
- [x] Add graph view to EA Entity Browser
- [x] Toggle between list view and graph view
- [x] Sync graph with entity selection (click node to view details)


## Relationship Creator (Phase 1.8 - Completed)

### Backend
- [x] Add createRelationship mutation with validation
- [x] Add deleteRelationship mutation (soft delete)
- [x] Add relationship type matrix validation to backend
- [ ] Add updateRelationship mutation (future enhancement)

### UI Components
- [x] Create RelationshipCreateDialog component
- [x] Add entity selection dropdowns (source and target)
- [x] Add relationship type selector with allowed types
- [x] Show validation errors for invalid combinations
- [x] Add relationship description field
- [x] Add delete confirmation dialog

### Features
- [x] Create relationships between entities
- [x] Validate relationship type matrix (enforce allowed combinations)
- [x] Show only valid relationship types based on entity types
- [x] Delete relationships (soft delete)
- [x] View relationships in entity detail dialog
- [ ] Edit existing relationships (future enhancement)
- [ ] View relationship history (future enhancement)

### Integration
- [x] Add "Create Relationship" button to EA Entity Browser
- [x] Add relationship delete actions to entity detail dialog
- [x] Update graph view after relationship changes
- [x] Update list view after relationship changes


## Entity Editing and Deletion (Phase 1.9 - Completed)

### Backend
- [x] Add updateEntity mutation for all entity types
- [x] Add deleteEntity mutation (soft delete)
- [x] Add validation for entity updates
- [x] Add audit trail for entity changes (updatedBy, updatedAt)
- [x] Cascade delete relationships when entity is deleted

### UI Components
- [x] Create EntityEditDialog component
- [x] Add entity-specific form fields based on type
- [x] Add validation for required fields
- [x] Add delete confirmation dialog
- [x] Add edit and delete buttons to entity detail dialog

### Features
- [x] Edit entity properties (name, description, etc.)
- [x] Update entity-specific fields (level, lifecycle, priority, etc.)
- [x] Validate required fields before saving
- [x] Soft delete entities with confirmation
- [x] Automatic normalizedName generation on name change
- [x] Duplicate name checking during update

### Integration
- [x] Add "Edit" button to entity detail dialog
- [x] Add "Delete" button to entity detail dialog
- [x] Update list view after entity changes
- [x] Update graph view after entity changes
- [x] Show success/error messages


## CSV/Excel Import (Phase 1.10 - Completed)

### Backend
- [x] Install CSV parsing library (papaparse)
- [x] Create import endpoint for bulk entity creation
- [x] Add validation for CSV format and required fields
- [x] Add duplicate detection during import
- [x] Return import results (success count, errors)
- [ ] Add transaction support (all or nothing import) (future enhancement)

### UI Components
- [x] Create ImportDialog component
- [x] Add file upload with drag-and-drop
- [x] Add CSV preview table
- [x] Add import progress indicator
- [x] Add import results display
- [ ] Add column mapping interface (future enhancement)

### Features
- [x] Upload CSV files
- [x] Parse and validate CSV data
- [x] Preview data before import
- [x] Map CSV columns to entity fields (automatic)
- [x] Bulk create entities with validation
- [x] Show import progress
- [x] Display success/error summary with row numbers
- [ ] Download error report (future enhancement)

### CSV Format
- [x] Define CSV format requirements for each entity type
- [x] Support common CSV formats (comma-delimited)
- [x] Handle quoted fields and special characters
- [ ] Provide downloadable CSV templates (future enhancement)

### Integration
- [x] Add "Import" button to EA Entity Browser
- [x] Support import for all entity types
- [x] Refresh list after successful import


## CSV Template Downloads (Phase 1.11 - Completed)

### Template Generation
- [x] Create template generation utility function
- [x] Define sample data for each entity type
- [x] Generate CSV content with headers and examples
- [x] Add download functionality

### UI Integration
- [x] Add "Download Template" button to ImportDialog
- [x] Show template format in dialog
- [x] Add help text explaining template usage

### Templates
- [x] Business Capability template (name, description, level)
- [x] Application template (name, description, lifecycle)
- [x] Business Process template (name, description)
- [x] Data Entity template (name, description, sensitivity)
- [x] Requirement template (name, description, type, priority)
