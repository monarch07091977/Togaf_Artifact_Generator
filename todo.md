# TOGAF Artifact Generator - TODO

## Database Schema
- [x] Create projects table with ADM phase tracking
- [x] Create artifacts table with type, phase, and content fields
- [x] Create artifact_relationships table for input-output mapping
- [x] Create questionnaire_responses table for user inputs
- [x] Create assumptions table for tracking AI and user assumptions
- [x] Create deliverables table for grouping artifacts

## Backend API (tRPC Procedures)
- [x] Project management procedures (create, list, get, update, delete)
- [x] Artifact management procedures (create, list by project/phase, get, update, delete)
- [x] Artifact relationship procedures (create, get dependencies, get dependents)
- [x] Questionnaire response procedures (save, get by artifact, auto-populate)
- [x] Assumption management procedures (create, list, update, validate)
- [ ] Deliverable generation procedures (create, get artifacts, export)

## AI Generation Engine
- [x] Implement AI artifact generation with OpenAI integration
- [x] Create artifact-specific prompt templates for all 56 types
- [ ] Implement artifact linking logic (auto-populate from dependencies)
- [x] Build assumption extraction from AI responses
- [x] Implement domain expertise assistant for guidance
- [x] Add context management for multi-artifact generation

## Frontend UI - Core Layout
- [x] Design and implement ADM phase navigation dashboard
- [x] Create project list and project detail pages
- [x] Build artifact list view with filtering by phase/type
- [x] Implement artifact editor with rich text support
- [ ] Add visual dependency graph for artifact relationships
- [ ] Create export functionality (Markdown, PDF, Word)

## Frontend UI - Questionnaire System
- [x] Build dynamic questionnaire component with multiple question types
- [ ] Implement auto-population from linked artifacts
- [ ] Add AI suggestion display for each question
- [ ] Create validation and completeness checking
- [ ] Build progress tracking for questionnaire completion

## Domain Expertise & Assumptions
- [ ] Implement AI-powered help system for each artifact type
- [x] Create assumption review and editing interface
- [x] Build assumption impact analysis view
- [ ] Add assumption register export functionality
- [ ] Implement best practice recommendations display

## TOGAF Content Framework
- [ ] Define all 14 catalog types with templates
- [ ] Define all 10 matrix types with templates
- [ ] Define all 32 diagram types with templates
- [ ] Map artifact dependencies for each ADM phase
- [ ] Create deliverable templates (ADD, ARS, Implementation Plan)

## Testing & Polish
- [ ] Test complete workflow from project creation to deliverable export
- [ ] Verify artifact linking and auto-population works correctly
- [ ] Test AI generation for multiple artifact types
- [ ] Validate assumption tracking and editing
- [ ] Test export functionality for all formats
- [ ] Create user documentation and usage guide

## Deployment
- [ ] Create checkpoint for deployment
- [ ] Test deployed application
- [ ] Create user guide with examples


## Enhancement Phase - Auto-Population
- [x] Implement artifact relationship tracking in database
- [x] Create auto-population logic to extract data from related artifacts
- [x] Build UI to show auto-populated fields with source indication
- [x] Add manual override capability for auto-populated data
- [x] Implement consistency checking across linked artifacts

## Enhancement Phase - Export Functionality
- [x] Add Markdown export for all artifacts
- [x] Implement PDF export using markdown-to-pdf conversion
- [x] Add Word document export capability
- [x] Create deliverable bundling (export multiple artifacts together)
- [ ] Add export templates with organization branding options

## Enhancement Phase - Artifact-Specific Questionnaires
- [ ] Define detailed questionnaires for all 14 catalog types
- [ ] Define detailed questionnaires for all 10 matrix types
- [ ] Define detailed questionnaires for all 32 diagram types
- [ ] Implement dynamic questionnaire loading based on artifact type
- [ ] Add validation rules specific to each artifact type


## Enhancement Phase - Notion Integration
- [x] Set up Notion database structure for TOGAF projects
- [x] Create Notion pages for each ADM phase
- [x] Implement automatic sync of artifacts to Notion
- [ ] Build two-way sync for content updates
- [x] Add Notion export button for each artifact
- [x] Create hierarchical structure: Project → Phases → Artifacts

## Enhancement Phase - Canva Integration
- [x] Set up Canva API integration
- [x] Create Canva templates for TOGAF diagrams
- [x] Implement automatic design generation for artifacts
- [x] Add Canva editor integration for customization
- [x] Build presentation deck generation from multiple artifacts
- [x] Add export from Canva to application
