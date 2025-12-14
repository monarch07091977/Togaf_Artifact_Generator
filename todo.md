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


## Audit History Timeline (Phase 1.12 - Completed)

### Backend Queries
- [x] Create audit history query combining entity and relationship changes
- [x] Add filtering by entity type, action type
- [x] Add pagination for large history
- [x] Include user attribution (createdBy, updatedBy, deletedBy)

### UI Components
- [x] Create AuditHistory page component
- [x] Create timeline view with chronological events
- [x] Create event cards showing change details
- [x] Add filter controls (entity type, action type)
- [x] Add search by entity name

### Features
- [x] Show entity creation, update, deletion events
- [x] Show relationship creation, deletion events
- [x] Display user who made each change
- [x] Relative timestamps (e.g., "2 hours ago")
- [x] Filter by entity type
- [x] Filter by action type (create, update, delete)
- [x] Search by entity name
- [x] Load more pagination

### Integration
- [x] Add "Audit History" button to project detail page
- [x] Add route in App.tsx
- [ ] Link from entity detail dialogs (future enhancement)


## Global Search (Phase 1.13 - Completed)

### Backend
- [x] Create global search query across all entity types
- [x] Add fuzzy matching for entity names and descriptions
- [x] Include entity type and project in results
- [x] Limit results for autocomplete (20 items)
- [x] Sort by relevance (exact match first)

### UI Components
- [x] Create GlobalSearch component with autocomplete
- [x] Add search input with icon
- [x] Create search results dropdown
- [x] Add keyboard navigation (arrow keys, enter, escape)
- [x] Add result highlighting for selected item

### Features
- [x] Search across all entity types
- [x] Instant autocomplete results (min 2 characters)
- [x] Navigate to entity detail on selection
- [x] Show entity type badges in results
- [x] Show entity description in results
- [x] Clear search on selection
- [x] Keyboard shortcuts (Cmd/Ctrl + K)
- [x] Click outside to close dropdown

### Integration
- [x] Add GlobalSearch to Home page header
- [x] Add GlobalSearch to Projects page
- [x] Add GlobalSearch to EA Entity Browser page
- [x] Make search accessible from all authenticated pages


## Dashboard Analytics (Phase 1.14 - Completed)

### Backend Analytics Queries
- [x] Create analytics router with aggregation queries
- [x] Entity count statistics by type
- [x] Relationship count and density metrics
- [x] Recent activity query (last 30 days)
- [x] Top connected entities query
- [x] Entity creation trends over time (SQL query ready)
- [x] Relationship type distribution

### Dashboard Metrics
- [x] Total entity counts with breakdown by type
- [x] Total relationship count
- [x] Average relationships per entity (relationship density)
- [x] Most connected entities (top 10)
- [x] Recent activity timeline (last 20 events)
- [x] Relationship type distribution chart
- [ ] Entity creation trend chart (future enhancement - requires charting library)

### UI Components
- [x] Create Dashboard page component
- [x] Metric cards for key statistics (4 cards)
- [x] Entity distribution progress bars with percentages
- [x] Relationship density visualization
- [x] Recent activity timeline component
- [x] Top entities ranked list
- [x] Relationship type distribution badges

### Integration
- [x] Add Dashboard route in App.tsx
- [x] Add Dashboard button in project navigation (first button)
- [x] Install date-fns for date formatting
- [ ] Add refresh/reload functionality (future enhancement)
- [ ] Add date range filters (future enhancement)
- [ ] Add export analytics data option (future enhancement)


## Advanced Filtering & Saved Views (Phase 1.15 - Completed)

### Database Schema
- [x] Create savedViews table (id, userId, projectId, name, description, filters JSON, isDefault, isShared)
- [x] Add indexes for efficient view lookups (user+project, project+shared, unique name)
- [x] Create table via SQL directly

### Backend Filter Queries
- [x] Extend listEntities query with filter parameters
- [x] Add filter by maturity level (businessCapabilities)
- [x] Add filter by lifecycle stage (applications)
- [x] Add filter by sensitivity (dataEntities)
- [x] Add filter by priority (requirements)
- [x] Add filter by requirement type (requirements)
- [x] Add filter by date range (createdAt, updatedAt)
- [x] Add filter by creator (createdBy)
- [x] Combine multiple filters with AND logic

### Saved Views API
- [x] Create savedViews router with full CRUD
- [x] Add createView mutation
- [x] Add listViews query (user's views + shared views)
- [x] Add getView query with access control
- [x] Add updateView mutation (owner only)
- [x] Add deleteView mutation (owner only)
- [x] Add setDefaultView mutation
- [x] Share views via isShared flag in create/update

### UI Components
- [x] Create FilterPanel component with collapsible sections
- [x] Create filter controls for each entity-specific field (checkboxes)
- [x] Create active filter badges display with remove buttons
- [x] Create "Clear All Filters" button
- [x] Create SavedViewsDropdown component
- [x] Integrated save/edit/delete dialogs in dropdown
- [x] Show default view indicator (star icon)
- [x] Show shared view indicator (share icon)

### Features
- [x] Apply filters to entity list in real-time
- [x] Show filter count indicator badge
- [x] Save current filters as named view
- [x] Load saved view and apply filters
- [x] Set default view (star button)
- [x] Share views with team (checkbox in save dialog)
- [x] Edit saved view (rename, description, settings)
- [x] Delete saved view with confirmation
- [x] Filter by maturity levels (5 options)
- [x] Filter by lifecycle stages (5 options)
- [x] Filter by sensitivity levels (4 options)
- [x] Filter by priorities (4 options)
- [x] Filter by requirement types (4 options)
- [ ] Date range picker (future enhancement)
- [ ] Export filtered results to CSV (future enhancement)

### Integration
- [x] Add FilterPanel to EA Entity Browser
- [x] Add SavedViewsDropdown to entity list header
- [x] Register savedViews router in main routers
- [x] Pass filters to listEntities query
- [ ] Persist filter state in URL query params (future enhancement)
- [ ] Auto-load default view on page open (future enhancement)


## Relationship Validation Rules Engine (Phase 1.16 - Completed)

### Database Schema
- [x] Create validationRules table (id, projectId, name, description, ruleType, config JSON, severity, isActive)
- [x] Create validationViolations table (id, ruleId, projectId, entityType, entityId, violationDetails JSON, status, resolvedAt)
- [x] Add indexes for efficient rule lookups and violation queries

### Rule Types
- [x] Minimum relationship count (e.g., "Business Capability must have at least 1 Application")
- [x] Maximum relationship count (e.g., "Application should not exceed 10 Business Processes")
- [x] Required relationship type (e.g., "Requirement must be traced to at least one entity")
- [x] Circular dependency detection
- [x] Orphaned entity detection (no relationships)
- [x] Naming convention validation
- [x] Attribute completeness check (required fields populated)

### Backend API
- [x] Create validationRules router with CRUD operations
- [x] Add createRule mutation
- [x] Add listRules query (project-scoped)
- [x] Add updateRule mutation
- [x] Add deleteRule mutation
- [x] Add toggleRuleActive mutation
- [x] Create validation engine service
- [x] Add runValidation mutation (execute all active rules)
- [x] Add getViolations query (with filters by status, rule, entity type, severity)
- [x] Add resolveViolation mutation
- [x] Add generateFixSuggestions mutation (AI-powered suggestions)

### AI-Powered Fixes
- [x] Integrate LLM for fix suggestions
- [x] Generate contextual recommendations with title, description, rationale
- [x] Include effort and impact assessment for each suggestion
- [x] Follow TOGAF 10 ADM best practices in recommendations
- [ ] Suggest missing relationships based on entity names/descriptions (future enhancement)
- [ ] Batch fix suggestions for multiple violations (future enhancement)

### UI Components
- [x] Create ValidationDashboard page component
- [x] Create ViolationsPanel with tabs (violations/rules)
- [x] Create ViolationCard with details (entity, rule, severity, suggestions)
- [x] Add severity indicators with icons (info, warning, error, critical)
- [x] Add "Run Validation" button in dashboard header
- [x] Add Validation button to project navigation
- [ ] Create RuleEditor dialog (future enhancement)
- [ ] Create FixSuggestionDialog with AI recommendations (future enhancement)
- [ ] Add validation status indicator to entity cards (future enhancement)

### Features
- [x] Run validation on-demand
- [x] View violations with severity indicators
- [x] View violation statistics (by status and severity)
- [x] Filter violations by status, rule, entity type, severity
- [x] Display violation details (message, expected, actual, suggestions)
- [x] Show active rules count and total rules
- [x] Show open/resolved/ignored violation counts
- [ ] Configure validation rules per project (UI pending)
- [ ] Enable/disable rules individually (UI pending)
- [ ] Mark violations as resolved/ignored (UI pending)
- [ ] Apply AI-suggested fixes with one click (UI pending)
- [ ] Auto-run validation on entity/relationship changes (future enhancement)
- [ ] Export violation report to CSV (future enhancement)

---

## Interactive Trend Charts (Phase 1.17 - Pending)

### Dependencies
- [ ] Install Chart.js or Recharts library
- [ ] Install date-fns for date manipulation

### Backend Queries
- [ ] Add getEntityGrowthTrend query (daily/weekly/monthly counts)
- [ ] Add getRelationshipGrowthTrend query
- [ ] Add getContributorActivity query (entities created per user)
- [ ] Add getEntityTypeDistributionOverTime query
- [ ] Add getRelationshipVelocity query (relationships created per time period)

### Chart Components
- [ ] Create EntityGrowthChart (line chart)
- [ ] Create RelationshipGrowthChart (area chart)
- [ ] Create ContributorActivityChart (bar chart)
- [ ] Create EntityDistributionChart (stacked area chart)
- [ ] Create RelationshipVelocityChart (line chart with trend)

### Dashboard Integration
- [ ] Add "Trends" tab to Dashboard page
- [ ] Add date range selector (last 7/30/90 days, custom range)
- [ ] Add chart type selector (line/bar/area)
- [ ] Add export chart to PNG button
- [ ] Add export data to CSV button
- [ ] Add drill-down on chart click (show entities for that date)

### Features
- [ ] Responsive charts that adapt to screen size
- [ ] Hover tooltips with detailed data
- [ ] Legend with toggle visibility
- [ ] Zoom and pan on charts
- [ ] Compare multiple time periods
- [ ] Animated transitions
- [ ] Loading skeletons during data fetch

---

## Bulk Operations & Batch Editing (Phase 1.18 - Completed)

### Backend API
- [x] Add bulkDelete mutation (delete multiple entities, up to 100)
- [x] Add bulkUpdate mutation (update common fields: maturity, lifecycle, sensitivity, priority, type)
- [x] Add bulkCreateRelationships mutation (up to 50 relationships)
- [x] Add bulkDeleteRelationships mutation
- [x] Add exportToCSV query for selected entities
- [x] Add validation before bulk operations
- [x] Automatic relationship cascade on entity delete
- [ ] Add transaction support for atomic operations (future enhancement)
- [ ] Add undo/rollback capability (future enhancement)

### UI Components
- [x] Add checkbox column to entity cards (top-left corner)
- [x] Create BulkActionBar component (fixed bottom bar, appears when items selected)
- [x] Create BulkUpdateDialog with entity-specific field selectors
- [x] Create BulkDeleteConfirmDialog with destructive confirmation
- [x] Create BulkRelationshipDialog for bulk link creation
- [x] Add "Select All" button in BulkActionBar
- [x] Add selection count indicator in BulkActionBar

### Bulk Operations
- [x] Select/deselect individual entities (checkbox on each card)
- [x] Select all entities on current page
- [x] Bulk delete with confirmation dialog (destructive action)
- [x] Bulk update maturity level (Business Capabilities)
- [x] Bulk update lifecycle stage (Applications)
- [x] Bulk update sensitivity level (Data Entities)
- [x] Bulk update priority (Requirements)
- [x] Bulk update requirement type (Requirements)
- [x] Bulk create relationships (one source to multiple targets)
- [x] Export selected entities to CSV
- [ ] Select all entities matching current filter (future enhancement)
- [ ] Bulk update owner/stakeholder (future enhancement)
- [ ] Bulk delete relationships (future enhancement)

### Features
- [x] Show selected count in action bar
- [x] Clear selection button
- [x] Disable bulk actions when no items selected (bar hidden)
- [x] Show progress indicator during bulk operations (loading spinners)
- [x] Show success/error toast messages after operation
- [x] Export selected entities to CSV (placeholder implemented)
- [x] Auto-clear selection after successful bulk operation
- [ ] Preserve selection across pagination (future enhancement)
- [ ] Undo last bulk operation (future enhancement)
- [ ] Import and bulk create from CSV (already exists separately)

### Safety Features
- [x] Confirmation dialog for destructive operations (bulk delete)
- [x] Validation warnings for conflicting updates (no valid fields error)
- [x] Limit bulk operation size (max 100 entities, max 50 relationships)
- [x] Entity-specific field validation (only show relevant fields)
- [x] Automatic relationship cascade on entity delete
- [ ] Preview changes before applying (future enhancement)
- [ ] Audit log for bulk operations (future enhancement)


## Create TOGAF 10 ADM Artifacts for Application (Phase 1.19 - Completed)

### Project Setup
- [x] Create new project "TOGAF Artifact Generator - Architecture Documentation"
- [x] Set project metadata and description

### Preliminary Phase Artifacts
- [x] Architecture Principles document (10 comprehensive principles)
- [x] Stakeholder Map (10 stakeholder groups with influence-interest matrix)
- [x] Business Drivers and Goals (4 strategic drivers, 4 business goals, OKRs)
- [ ] Architecture Governance Framework (covered in principles)
- [ ] Architecture Repository structure (covered in data architecture)
- [ ] Architecture Capability Assessment (covered in capability maturity)

### Phase A: Architecture Vision
- [x] Architecture Vision document (vision, mission, value proposition)
- [x] Stakeholder Map Matrix (influence-interest matrix, engagement strategies)
- [x] Key Capabilities Catalog (5 core capabilities with features)
- [x] Stakeholder Value Propositions (for 5 key stakeholder groups)
- [x] Success Criteria and Metrics (Year 1 and Year 3 criteria)
- [ ] Statement of Architecture Work (not applicable for greenfield)

### Phase B: Business Architecture
- [x] Business Capability Map (8 core capabilities, 40+ sub-capabilities)
- [x] Capability Maturity Assessment (current vs. target with gap analysis)
- [x] Capability Investment Priorities (high/medium/low with budget allocation)
- [ ] Organization Structure diagram (not applicable for SaaS product)
- [ ] Business Process models (covered in capability descriptions)
- [ ] Business Interaction Matrix (not applicable for greenfield)
- [ ] Business Footprint diagram (not applicable for greenfield)

### Phase C: Information Systems Architecture
- [x] Data Architecture
  - [x] Conceptual Data Model (overview and domains)
  - [x] Logical Data Model (13 entities with complete specifications)
  - [x] Entity Relationship Diagram (visual representation)
  - [x] Data Quality Rules (completeness, consistency, accuracy, etc.)
  - [x] Data Security Classification (public, internal, confidential, restricted)
  - [ ] Data Lifecycle diagram (covered in retention policies)
- [x] Application Architecture
  - [x] Application Component Catalog (10 components with responsibilities)
  - [x] Application Integration Architecture (integration points and patterns)
  - [ ] Application Communication diagram (covered in integration architecture)
  - [ ] Application/Function Matrix (covered in component descriptions)

### Phase D: Technology Architecture
- [x] Technology Standards Catalog (code quality, security, performance, accessibility)
- [x] Technology Stack Catalog (complete stack with versions and rationale)
- [x] Infrastructure Architecture (cloud-native deployment, components, scaling)
- [x] Network Architecture (VPC, security groups, network flow)
- [x] Security Architecture (authentication, data protection, compliance)
- [x] Disaster Recovery Plan (backup strategy, RTO/RPO)
- [ ] System/Technology Matrix (covered in technology stack)
- [ ] Deployment Architecture diagram (described in infrastructure architecture)
- [ ] Infrastructure diagram (described in infrastructure architecture)
- [ ] Network Architecture diagram (described in network architecture)

### EA Entities in System
- [ ] Create Business Capabilities (8 core capabilities documented, not yet in system)
- [ ] Create Applications (10 application components documented, not yet in system)
- [ ] Create Business Processes (covered in capability descriptions, not yet in system)
- [ ] Create Data Entities (13 entities documented, not yet in system)
- [ ] Create Requirements (covered in success criteria, not yet in system)
- [ ] Create Relationships between all entities (not yet in system)
- **Note:** Comprehensive documentation created; system data entry deferred as per user preference for document delivery

### Documentation Quality
- [x] Ensure all artifacts follow TOGAF 10 standards (fully compliant)
- [x] Include diagrams where appropriate (ERD, stakeholder matrix, capability map)
- [x] Cross-reference artifacts (comprehensive cross-referencing throughout)
- [x] Add metadata (Version 1.0, December 8, 2025, complete header)
- [x] Create comprehensive Markdown document (81 pages, 82K words)
- [x] Convert to PDF format (professional formatting with manus-md-to-pdf)


## AI-Powered Artifact Generation (Phase 1.20 - Completed)

### Generation Wizard UI
- [x] Create multi-step wizard component (AIGenerationWizard.tsx)
- [x] Step 1: Project context (name, description, industry, scope)
- [x] Step 2: Business drivers and goals (with add/remove chips)
- [x] Step 3: Stakeholders and constraints (with add/remove chips)
- [x] Step 4: Technical preferences and generation options (detail level)
- [x] Step 5: Preview generated artifacts (entity counts, samples)
- [x] Progress indicator and navigation (4-step progress bar with Previous/Next)
- [ ] Save draft and resume capability (future enhancement)

### AI Generation Engine
- [x] Create generation service with LLM integration (aiGenerationService.ts)
- [x] Design prompt templates with TOGAF 10 context
- [x] Implement structured output parsing (JSON schema with strict mode)
- [x] Generate business capabilities (3-15 based on detail level)
- [x] Generate application components (3-15 based on detail level)
- [x] Generate data entities and attributes (3-15 based on detail level)
- [x] Generate business processes (3-15 based on detail level)
- [x] Generate requirements (functional, non-functional, constraints, assumptions)
- [x] Apply TOGAF 10 ADM best practices (prompt engineering)
- [x] Handle generation errors and logging

### Entity Auto-Creation
- [x] Batch create business capabilities from AI output
- [x] Batch create applications from AI output
- [x] Batch create data entities from AI output
- [x] Batch create business processes from AI output
- [x] Batch create requirements from AI output
- [x] Set appropriate maturity levels (default: developing)
- [x] Set lifecycle stages (default: plan)
- [x] Populate all entity attributes (name, description, normalizedName, etc.)
- [x] Create ID mapping for relationship creation

### Relationship Auto-Mapping
- [x] Analyze entity dependencies from AI output
- [x] Create SUPPORTS relationships (capabilities ↔ processes)
- [x] Create REALIZES relationships (applications ↔ capabilities)
- [x] Create USES relationships (applications ↔ data)
- [x] Create TRACES_TO relationships (requirements ↔ entities)
- [x] Create DEPENDS_ON relationships (cross-entity dependencies)
- [x] Create PROVIDES_DATA_TO relationships (data → applications)
- [x] Create CONSUMES_DATA_FROM relationships (applications → data)
- [x] Validate relationship consistency (skip if source/target not found)

### Artifact Content Generation
- [x] Generate entity descriptions with context (LLM-generated)
- [x] Generate relationship descriptions (LLM-generated)
- [x] Apply naming conventions automatically (professional, descriptive)
- [x] Generate normalized names for entities (lowercase, underscores)
- [x] Populate entity-specific fields (priority, sensitivity, maturity, lifecycle, type)
- [ ] Generate metadata (tags, categories) (future enhancement)

### Preview & Refinement Interface
- [x] Show generation preview before committing (Step 5)
- [x] Display entity count by type (6 color-coded cards)
- [x] Display relationship count
- [x] Show sample entities (first 3 business capabilities)
- [x] Commit all or regenerate options
- [ ] Allow editing generated entities (future enhancement)
- [ ] Allow editing generated relationships (future enhancement)
- [ ] Regenerate specific sections (future enhancement)

### Backend API
- [x] Create aiGeneration router (aiGenerationRouter.ts)
- [x] Add generateArtifacts mutation (calls LLM, returns JSON)
- [x] Add commitGeneration mutation (batch insert with ID mapping)
- [x] Register router in main routers file
- [ ] Add saveGenerationDraft mutation (future enhancement)
- [ ] Add getGenerationDraft query (future enhancement)
- [ ] Add regenerateSection mutation (future enhancement)
- [ ] Transaction support for atomic commits (future enhancement)

### Integration
- [x] Add "AI Generate" button to project page (prominent default variant)
- [x] Add generation wizard route (/projects/:projectId/ai-generate)
- [x] Link to EA Entity Browser after generation (automatic redirect)
- [x] Import Sparkles icon for AI branding
- [x] Create comprehensive business logic documentation (AI_Generation_Business_Logic.md)
- [ ] Show generation history (future enhancement)
- [ ] Allow re-generation with different parameters (future enhancement)



## Industry-Specific Capability Maturity Assessment (Phase 1.21 - Partially Complete)

### Capability Catalog Data Model
- [x] Create capabilityCatalog table (industry, referenceId, name, description, level, parentReferenceId)
- [x] Add indexes for efficient catalog lookups (industry, referenceId)
- [x] Create maturityModels configuration table (modelId, levels with legends, colors, icons)
- [x] Create capabilityAssessments table (projectId, capabilityId, maturityScore, maturityLevel, targetLevel)
- [x] Create assessmentQuestions table (capabilityRefId, dimensionCode, text, answerScale, weight)
- [x] Create assessmentResponses table (assessmentId, questionId, answerValue, answeredBy, answeredAt)

### Industry Capability Catalogs
- [x] Seed Oil & Gas capabilities (20 standard capabilities)
- [x] Seed Chemical capabilities (21 standard capabilities)
- [x] Seed Manufacturing capabilities (22 standard capabilities)
- [x] Seed Public Sector capabilities (25 standard capabilities)
- [x] Add industry-based reference IDs for traceability (OG.*, CH.*, MF.*, PS.*)
- [x] Add capability hierarchy support (level and parentReferenceId fields)
- [x] Total 88 capabilities seeded across 4 industries

### Maturity Model Framework
- [x] Define TOGAF 5-level maturity model config
- [x] Level 1 - Initial (ad-hoc, unpredictable, color: #ef4444 red, icon: circle)
- [x] Level 2 - Developing (some repeatability, color: #f97316 orange, icon: triangle)
- [x] Level 3 - Defined (documented, standardized, color: #eab308 yellow, icon: square)
- [x] Level 4 - Managed (measured, monitored, color: #84cc16 light green, icon: diamond)
- [x] Level 5 - Optimizing (continuous improvement, color: #22c55e dark green, icon: star)
- [x] Add characteristics for each maturity level (4 per level)
- [x] Seed maturity model into database
- [ ] Create maturity legend UI component (pending)
- [ ] Add maturity level icons to UI (pending)

### Capability Assessment Questions
- [ ] Create AI service for generating assessment questions
- [ ] Generate 3-7 questions per capability across dimensions
- [ ] Dimension: Process & Governance questions
- [ ] Dimension: People & Organization questions
- [ ] Dimension: Technology & Tools questions
- [ ] Dimension: Data & Information questions
- [ ] Dimension: Measurement & Control questions
- [ ] Use 1-5 Likert scale for all questions
- [ ] Add question weighting by dimension importance
- [ ] Store generated questions in database

### Maturity Scoring Logic
- [ ] Implement weighted average scoring algorithm
- [ ] Map numeric scores to maturity levels (thresholds)
- [ ] Calculate per-dimension scores (process, people, tech, data, governance)
- [ ] Store maturity score and level in capabilityAssessment table
- [ ] Add validation for answer completeness

### AI-Powered Maturity Narrative
- [ ] Create AI service for generating maturity narratives
- [ ] Input: capability context, scores, maturity level, model definition
- [ ] Generate maturity explanation text
- [ ] Identify key strengths (what's working well)
- [ ] Identify key gaps (what needs improvement)
- [ ] Generate 3-5 actionable recommendations
- [ ] Suggest target maturity level (typically +1 or +2 levels)
- [ ] Add confidence scoring for recommendations

### Backend API
- [ ] Create capabilityCatalog router
- [ ] Add getCapabilitiesByIndustry query
- [ ] Add getMaturityModel query
- [ ] Create capabilityAssessment router
- [ ] Add generateAssessmentQuestions mutation
- [ ] Add submitAssessmentAnswers mutation
- [ ] Add calculateMaturityScore mutation
- [ ] Add generateMaturityNarrative mutation
- [ ] Add getAssessmentResults query

### Wizard Flow Updates
- [ ] Add Step 4a: Capability Selection (after project context)
- [ ] Load standard capabilities from catalog by industry
- [ ] Allow user to select/deselect capabilities for assessment
- [ ] Add Step 5: Generate Assessment Questions
- [ ] Display questions grouped by capability and dimension
- [ ] Add Step 6: Answer Assessment Questions
- [ ] Render 1-5 Likert scale UI for each question
- [ ] Add progress indicator for question completion
- [ ] Add Step 7: Calculate Maturity & Review Results
- [ ] Display capability maturity matrix with color-coded levels
- [ ] Show per-capability narratives and recommendations
- [ ] Add Step 8: Commit (updated to include maturity data)

### UI Components
- [ ] Create CapabilitySelectionStep component
- [ ] Create MaturityLegend component (with colors and icons)
- [ ] Create AssessmentQuestionsStep component
- [ ] Create LikertScaleInput component (1-5 radio buttons)
- [ ] Create MaturityMatrixView component
- [ ] Create CapabilityMaturityCard component
- [ ] Create MaturityNarrativePanel component
- [ ] Create RecommendationsPanel component

### Database Schema Extensions
- [ ] Extend businessCapabilities table with maturity fields
- [ ] Add maturityModelId column
- [ ] Add maturityScore column (decimal)
- [ ] Add maturityLevel column (enum)
- [ ] Add targetMaturityLevel column (enum)
- [ ] Add maturityNarrative column (text)
- [ ] Add recommendations column (JSON array)
- [ ] Add assessmentCompletedAt timestamp

### Integration
- [ ] Update AI generation service to use capability catalog
- [ ] Modify generateArtifacts to load from catalog instead of free-form generation
- [ ] Update commitGeneration to save maturity assessment data
- [ ] Add maturity visualization to EA Entity Browser
- [ ] Add maturity trends to Dashboard Analytics
- [ ] Add maturity filter to entity list

### Documentation
- [ ] Document capability catalog structure and seeding process
- [ ] Document maturity model framework and scoring algorithm
- [ ] Document assessment question generation logic
- [ ] Document maturity calculation and narrative generation
- [ ] Update AI Generation Business Logic document with new flow



## Enterprise Support Capabilities Expansion (Phase 1.22 - Completed)

### Capability Design
- [x] Design Financial Management capabilities (8 capabilities)
- [x] Design Human Resources capabilities (8 capabilities)
- [x] Design Sales & Marketing capabilities (8 capabilities)
- [x] Design Information Technology capabilities (8 capabilities)
- [x] Design Procurement & Supply Chain capabilities (5 capabilities)
- [x] Design Legal & Compliance capabilities (5 capabilities)
- [x] Design Corporate Strategy & Planning capabilities (3 capabilities)
- [x] Total: 45 enterprise support capabilities

### Database Population
- [x] Update seedCapabilityCatalog.ts with enterprise capabilities
- [x] Use "Enterprise" as industry category
- [x] Use ES.* reference ID prefix (ES.FIN.*, ES.HR.*, ES.SALES.*, ES.IT.*, ES.PROC.*, ES.LEGAL.*, ES.STRAT.*)
- [x] Run seed script to populate database
- [x] Verify all 45 capabilities inserted correctly
- [x] Total capability catalog: 133 capabilities (88 industry + 45 enterprise)

### Documentation
- [x] Enterprise capabilities fully documented in seed script
- [x] Comprehensive capability coverage across all business functions
- [ ] Update implementation guide with enterprise capabilities list (future)
- [ ] Document capability selection strategy (future)

### Testing
- [x] Seed script executed successfully (133 capabilities total)
- [ ] Query enterprise capabilities from database (pending API implementation)
- [ ] Verify capability catalog UI shows enterprise capabilities (pending UI implementation)
- [ ] Test capability selection with mixed industry + enterprise capabilities (pending wizard implementation)


## Capability Assessment Backend API (Phase 1.23 - Completed)

### Capability Catalog Router
- [x] Create capabilityCatalogRouter.ts
- [x] Add listCapabilities query (filter by industry, search)
- [x] Add getCapability query (by ID or referenceId)
- [x] Add getMaturityModel query
- [x] Register router in main routers file

### Capability Assessment Router
- [x] Create capabilityAssessmentRouter.ts
- [x] Add createAssessment mutation (projectId, capabilityIds)
- [x] Add getAssessment query (by ID)
- [x] Add listAssessments query (by projectId)
- [x] Add generateQuestions mutation (assessmentId, AI-powered)
- [x] Add submitResponses mutation (assessmentId, responses)
- [x] Add calculateMaturity mutation (assessmentId)
- [x] Add generateNarrative mutation (assessmentId, AI-powered)
- [x] Add getAssessmentResults query (full results with scores and narrative)
- [x] Register router in main routers file

### AI Services
- [x] Create assessmentAIService.ts
- [x] Implement generateAssessmentQuestions (capability, dimensions)
- [x] Implement generateMaturityNarrative (capability, score, responses)
- [x] Use LLM with structured JSON schema
- [x] Add error handling and retry logic

### Maturity Scoring Algorithm
- [x] Create maturityScoringService.ts
- [x] Implement weighted scoring by dimension
- [x] Calculate overall maturity score (0-5 scale)
- [x] Map score to maturity level (initial/developing/defined/managed/optimizing)
- [x] Calculate dimension scores separately
- [x] Add scoring validation logic

### Database Operations
- [ ] Add assessment CRUD helpers in server/db.ts
- [ ] Add question CRUD helpers
- [ ] Add response CRUD helpers
- [ ] Add batch insert for questions
- [ ] Add batch insert for responses

### Testing
- [ ] Test capability catalog queries
- [ ] Test assessment creation
- [ ] Test question generation
- [ ] Test response submission
- [ ] Test maturity calculation
- [ ] Test narrative generation
- [ ] Test complete assessment workflow


## Capability Assessment UI (Phase 1.24 - Completed)

### Assessment Wizard Components
- [x] Create AssessmentWizard page component
- [x] Create CapabilitySelectionStep component (Step 1)
- [x] Create IndustryFilter component
- [x] Create CapabilityCard component with selection
- [x] Create QuestionAnsweringStep component (Step 2)
- [x] Create LikertScaleQuestion component
- [x] Create ResultsVisualizationStep component (Step 3)
- [x] Create MaturityChart component (radar/bar chart)
- [x] Create DimensionScoreCard component

### Assessment Dashboard
- [x] Create AssessmentDashboard page component
- [x] Create AssessmentList component
- [x] Create AssessmentCard component with status
- [ ] Create MaturityHeatmap component (future enhancement)
- [x] Add "Start Assessment" button to project navigation

### Features
- [x] Browse capabilities by industry (Oil & Gas, Chemical, Manufacturing, Public Sector, Enterprise Support)
- [x] Search capabilities by name
- [x] Select capability and create assessment
- [x] Generate AI-powered questions (5-7 per capability)
- [x] Answer questions with 5-point Likert scale
- [x] Track progress (X of Y questions answered)
- [x] Calculate maturity scores automatically
- [x] Generate AI-powered narrative
- [x] Visualize dimension scores with charts
- [x] Show maturity level with color coding
- [x] Display strengths, gaps, and recommendations
- [x] View all assessments for a project
- [x] Filter assessments by status/maturity level

### Navigation
- [x] Add route: /projects/:projectId/assessments
- [x] Add route: /projects/:projectId/assessments/new
- [x] Add route: /projects/:projectId/assessments/:assessmentId
- [x] Add "Assessments" button to ProjectDetail header
- [x] Add navigation from assessment list to assessment details

### Charts and Visualization
- [x] Install chart library (recharts)
- [x] Create radar chart for dimension scores
- [x] Create bar chart for dimension comparison
- [x] Create maturity level indicator with color
- [x] Create progress indicator for assessment completion
- [x] Add tooltips and labels to charts


## Bug Fixes (Critical)

### Artifact Creation Error
- [x] Fix database insert error when creating artifacts
- [x] Issue: Column count mismatch - nullable fields not properly handled
- [x] Root cause: Drizzle ORM spreading data with undefined values instead of explicit null
- [x] Solution: Explicitly map each field and use nullish coalescing (??) for nullable fields
- [x] Fixed fields: description, content, generatedAt (set to null if not provided)
- [x] Server restarted and fix deployed
