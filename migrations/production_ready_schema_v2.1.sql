-- ============================================
-- EA Meta-Model Schema Migration v2.1
-- Production-Ready Refinements
-- Date: December 6, 2025
-- ============================================

-- This script implements all production-ready schema changes
-- from the approved specification v2.1

-- Phase 1: Add New Columns to Existing Tables
-- ============================================

-- Add normalizedName to all entity tables
ALTER TABLE stakeholders 
ADD COLUMN IF NOT EXISTS normalizedName VARCHAR(255) NOT NULL DEFAULT '' AFTER name;

ALTER TABLE businessCapabilities 
ADD COLUMN IF NOT EXISTS normalizedName VARCHAR(255) NOT NULL DEFAULT '' AFTER name;

ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS normalizedName VARCHAR(255) NOT NULL DEFAULT '' AFTER name;

ALTER TABLE businessProcesses 
ADD COLUMN IF NOT EXISTS normalizedName VARCHAR(255) NOT NULL DEFAULT '' AFTER name;

ALTER TABLE dataEntities 
ADD COLUMN IF NOT EXISTS normalizedName VARCHAR(255) NOT NULL DEFAULT '' AFTER name;

ALTER TABLE requirements 
ADD COLUMN IF NOT EXISTS normalizedName VARCHAR(255) NOT NULL DEFAULT '' AFTER name;

-- Populate normalizedName from name (lowercase and trimmed)
UPDATE stakeholders SET normalizedName = LOWER(TRIM(name)) WHERE normalizedName = '';
UPDATE businessCapabilities SET normalizedName = LOWER(TRIM(name)) WHERE normalizedName = '';
UPDATE applications SET normalizedName = LOWER(TRIM(name)) WHERE normalizedName = '';
UPDATE businessProcesses SET normalizedName = LOWER(TRIM(name)) WHERE normalizedName = '';
UPDATE dataEntities SET normalizedName = LOWER(TRIM(name)) WHERE normalizedName = '';
UPDATE requirements SET normalizedName = LOWER(TRIM(name)) WHERE normalizedName = '';

-- Add deletedBy to all entity tables
ALTER TABLE stakeholders 
ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt,
ADD CONSTRAINT IF NOT EXISTS fk_stakeholders_deletedBy FOREIGN KEY (deletedBy) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE businessCapabilities 
ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt,
ADD CONSTRAINT IF NOT EXISTS fk_capabilities_deletedBy FOREIGN KEY (deletedBy) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE applications 
ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt,
ADD CONSTRAINT IF NOT EXISTS fk_applications_deletedBy FOREIGN KEY (deletedBy) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE businessProcesses 
ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt,
ADD CONSTRAINT IF NOT EXISTS fk_processes_deletedBy FOREIGN KEY (deletedBy) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE dataEntities 
ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt,
ADD CONSTRAINT IF NOT EXISTS fk_dataEntities_deletedBy FOREIGN KEY (deletedBy) REFERENCES users(id) ON DELETE SET NULL;

ALTER TABLE requirements 
ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt,
ADD CONSTRAINT IF NOT EXISTS fk_requirements_deletedBy FOREIGN KEY (deletedBy) REFERENCES users(id) ON DELETE SET NULL;

-- Add soft delete to eaRelationships
ALTER TABLE eaRelationships 
ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt,
ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL AFTER updatedAt,
ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt,
ADD CONSTRAINT IF NOT EXISTS fk_relationships_deletedBy FOREIGN KEY (deletedBy) REFERENCES users(id) ON DELETE SET NULL;

-- Add soft delete and AI traceability to artifactEntityLinks
ALTER TABLE artifactEntityLinks 
ADD COLUMN IF NOT EXISTS projectId INT NOT NULL AFTER id,
ADD COLUMN IF NOT EXISTS createdBy INT NULL AFTER usageType,
ADD COLUMN IF NOT EXISTS createdVia VARCHAR(50) NOT NULL DEFAULT 'manual' AFTER createdBy,
ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL AFTER createdAt,
ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt,
ADD CONSTRAINT IF NOT EXISTS fk_artifactLinks_projectId FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE RESTRICT,
ADD CONSTRAINT IF NOT EXISTS fk_artifactLinks_createdBy FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
ADD CONSTRAINT IF NOT EXISTS fk_artifactLinks_deletedBy FOREIGN KEY (deletedBy) REFERENCES users(id) ON DELETE SET NULL;

-- Populate projectId in artifactEntityLinks from artifacts table
UPDATE artifactEntityLinks ael
INNER JOIN artifacts a ON ael.artifactId = a.id
SET ael.projectId = a.projectId
WHERE ael.projectId = 0 OR ael.projectId IS NULL;

-- Phase 2: Create organizationUnits Table
-- ============================================

CREATE TABLE IF NOT EXISTS organizationUnits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  normalizedName VARCHAR(255) NOT NULL,
  description TEXT,
  externalKey VARCHAR(255),
  parentUnitId INT,
  createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  createdBy INT,
  deletedAt TIMESTAMP NULL,
  deletedBy INT,
  
  CONSTRAINT fk_orgUnits_project FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE RESTRICT,
  CONSTRAINT fk_orgUnits_parent FOREIGN KEY (parentUnitId) REFERENCES organizationUnits(id) ON DELETE SET NULL,
  CONSTRAINT fk_orgUnits_createdBy FOREIGN KEY (createdBy) REFERENCES users(id) ON DELETE SET NULL,
  CONSTRAINT fk_orgUnits_deletedBy FOREIGN KEY (deletedBy) REFERENCES users(id) ON DELETE SET NULL,
  
  UNIQUE KEY org_units_normalized_name_unique (projectId, normalizedName),
  INDEX org_units_project_idx (projectId),
  INDEX org_units_project_deleted_idx (projectId, deletedAt),
  INDEX org_units_parent_idx (parentUnitId),
  INDEX org_units_external_key_idx (externalKey)
);

-- Add organizationUnitId to stakeholders
ALTER TABLE stakeholders 
ADD COLUMN IF NOT EXISTS organizationUnitId INT NULL AFTER email,
ADD CONSTRAINT IF NOT EXISTS fk_stakeholders_orgUnit FOREIGN KEY (organizationUnitId) REFERENCES organizationUnits(id) ON DELETE SET NULL,
ADD INDEX IF NOT EXISTS stakeholders_org_unit_idx (organizationUnitId);

-- Phase 3: Update Indexes
-- ============================================

-- Add soft delete indexes to entity tables
ALTER TABLE stakeholders 
ADD INDEX IF NOT EXISTS stakeholders_project_deleted_idx (projectId, deletedAt);

ALTER TABLE businessCapabilities 
ADD INDEX IF NOT EXISTS capabilities_project_deleted_idx (projectId, deletedAt);

ALTER TABLE applications 
ADD INDEX IF NOT EXISTS applications_project_deleted_idx (projectId, deletedAt);

ALTER TABLE businessProcesses 
ADD INDEX IF NOT EXISTS processes_project_deleted_idx (projectId, deletedAt);

ALTER TABLE dataEntities 
ADD INDEX IF NOT EXISTS data_entities_project_deleted_idx (projectId, deletedAt);

ALTER TABLE requirements 
ADD INDEX IF NOT EXISTS requirements_project_deleted_idx (projectId, deletedAt);

-- Update relationship indexes (drop old, add optimized compound indexes)
-- Note: Can't drop if not exists, so we'll add new ones with different names
ALTER TABLE eaRelationships 
ADD INDEX IF NOT EXISTS relationships_source_compound_idx (projectId, sourceEntityType, sourceEntityId),
ADD INDEX IF NOT EXISTS relationships_target_compound_idx (projectId, targetEntityType, targetEntityId),
ADD INDEX IF NOT EXISTS relationships_type_compound_idx (projectId, relationshipType),
ADD INDEX IF NOT EXISTS relationships_project_deleted_idx (projectId, deletedAt);

-- Add artifact link indexes
ALTER TABLE artifactEntityLinks 
ADD INDEX IF NOT EXISTS artifact_links_entity_idx (projectId, entityType, entityId),
ADD INDEX IF NOT EXISTS artifact_links_usage_idx (projectId, usageType),
ADD INDEX IF NOT EXISTS artifact_links_project_deleted_idx (projectId, deletedAt);

-- Phase 4: Update Unique Constraints
-- ============================================

-- Add normalized name unique constraints
-- Note: These will fail if duplicates exist, which is intentional for data quality
ALTER TABLE stakeholders 
ADD UNIQUE INDEX IF NOT EXISTS stakeholders_normalized_name_unique (projectId, normalizedName);

ALTER TABLE businessCapabilities 
ADD UNIQUE INDEX IF NOT EXISTS capabilities_normalized_name_unique (projectId, normalizedName);

ALTER TABLE applications 
ADD UNIQUE INDEX IF NOT EXISTS applications_normalized_name_unique (projectId, normalizedName);

ALTER TABLE businessProcesses 
ADD UNIQUE INDEX IF NOT EXISTS processes_normalized_name_unique (projectId, normalizedName);

ALTER TABLE dataEntities 
ADD UNIQUE INDEX IF NOT EXISTS data_entities_normalized_name_unique (projectId, normalizedName);

ALTER TABLE requirements 
ADD UNIQUE INDEX IF NOT EXISTS requirements_normalized_name_unique (projectId, normalizedName);

-- Add unique email constraint to stakeholders
ALTER TABLE stakeholders 
ADD UNIQUE INDEX IF NOT EXISTS stakeholders_email_unique (projectId, email);

-- Add unique constraint to artifact links (prevent duplicates)
ALTER TABLE artifactEntityLinks 
ADD UNIQUE INDEX IF NOT EXISTS artifact_entity_link_unique (artifactId, entityType, entityId, usageType);

-- Phase 5: Convert metadata TEXT to JSON
-- ============================================

-- Note: MySQL doesn't have a direct TEXT to JSON conversion
-- We'll just change the column type - existing valid JSON will work
ALTER TABLE stakeholders MODIFY COLUMN metadata JSON;
ALTER TABLE businessCapabilities MODIFY COLUMN metadata JSON;
ALTER TABLE applications MODIFY COLUMN metadata JSON;
ALTER TABLE businessProcesses MODIFY COLUMN metadata JSON;
ALTER TABLE dataEntities MODIFY COLUMN metadata JSON;
ALTER TABLE requirements MODIFY COLUMN metadata JSON;
ALTER TABLE eaRelationships MODIFY COLUMN metadata JSON;

-- Phase 6: Verification Queries
-- ============================================

-- Verify row counts
SELECT 'Verification: Row Counts' as Step;
SELECT 'businessCapabilities' as TableName, COUNT(*) as RowCount FROM businessCapabilities
UNION ALL SELECT 'applications', COUNT(*) FROM applications
UNION ALL SELECT 'businessProcesses', COUNT(*) FROM businessProcesses
UNION ALL SELECT 'dataEntities', COUNT(*) FROM dataEntities
UNION ALL SELECT 'requirements', COUNT(*) FROM requirements
UNION ALL SELECT 'stakeholders', COUNT(*) FROM stakeholders
UNION ALL SELECT 'eaRelationships', COUNT(*) FROM eaRelationships
UNION ALL SELECT 'artifactEntityLinks', COUNT(*) FROM artifactEntityLinks
UNION ALL SELECT 'organizationUnits', COUNT(*) FROM organizationUnits;

SELECT 'Migration completed successfully!' as Status;
