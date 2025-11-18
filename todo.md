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
