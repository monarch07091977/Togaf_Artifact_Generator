/**
 * Production-Ready Schema Migration v2.1
 * Runs SQL migrations directly without interactive prompts
 */

import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('ERROR: DATABASE_URL environment variable not set');
  process.exit(1);
}

// Parse MySQL connection URL
const url = new URL(DATABASE_URL);
const config = {
  host: url.hostname,
  port: parseInt(url.port) || 3306,
  user: url.username,
  password: url.password,
  database: url.pathname.slice(1), // Remove leading slash
  ssl: {
    rejectUnauthorized: true,
  },
};

console.log('🚀 Starting Production-Ready Schema Migration v2.1...');
console.log(`📦 Database: ${config.database}`);
console.log(`🌐 Host: ${config.host}:${config.port}\n`);

const migrations = [
  {
    name: 'Add normalizedName to businessCapabilities',
    sql: `ALTER TABLE businessCapabilities ADD COLUMN IF NOT EXISTS normalizedName VARCHAR(255) NOT NULL DEFAULT '' AFTER name;`,
  },
  {
    name: 'Add normalizedName to applications',
    sql: `ALTER TABLE applications ADD COLUMN IF NOT EXISTS normalizedName VARCHAR(255) NOT NULL DEFAULT '' AFTER name;`,
  },
  {
    name: 'Add normalizedName to businessProcesses',
    sql: `ALTER TABLE businessProcesses ADD COLUMN IF NOT EXISTS normalizedName VARCHAR(255) NOT NULL DEFAULT '' AFTER name;`,
  },
  {
    name: 'Add normalizedName to dataEntities',
    sql: `ALTER TABLE dataEntities ADD COLUMN IF NOT EXISTS normalizedName VARCHAR(255) NOT NULL DEFAULT '' AFTER name;`,
  },
  {
    name: 'Add normalizedName to requirements',
    sql: `ALTER TABLE requirements ADD COLUMN IF NOT EXISTS normalizedName VARCHAR(255) NOT NULL DEFAULT '' AFTER name;`,
  },
  {
    name: 'Populate normalizedName in businessCapabilities',
    sql: `UPDATE businessCapabilities SET normalizedName = LOWER(TRIM(name)) WHERE normalizedName = '';`,
  },
  {
    name: 'Populate normalizedName in applications',
    sql: `UPDATE applications SET normalizedName = LOWER(TRIM(name)) WHERE normalizedName = '';`,
  },
  {
    name: 'Populate normalizedName in businessProcesses',
    sql: `UPDATE businessProcesses SET normalizedName = LOWER(TRIM(name)) WHERE normalizedName = '';`,
  },
  {
    name: 'Populate normalizedName in dataEntities',
    sql: `UPDATE dataEntities SET normalizedName = LOWER(TRIM(name)) WHERE normalizedName = '';`,
  },
  {
    name: 'Populate normalizedName in requirements',
    sql: `UPDATE requirements SET normalizedName = LOWER(TRIM(name)) WHERE normalizedName = '';`,
  },
  {
    name: 'Add deletedBy to businessCapabilities',
    sql: `ALTER TABLE businessCapabilities ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt;`,
  },
  {
    name: 'Add deletedBy to applications',
    sql: `ALTER TABLE applications ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt;`,
  },
  {
    name: 'Add deletedBy to businessProcesses',
    sql: `ALTER TABLE businessProcesses ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt;`,
  },
  {
    name: 'Add deletedBy to dataEntities',
    sql: `ALTER TABLE dataEntities ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt;`,
  },
  {
    name: 'Add deletedBy to requirements',
    sql: `ALTER TABLE requirements ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt;`,
  },
  {
    name: 'Add updatedAt to eaRelationships',
    sql: `ALTER TABLE eaRelationships ADD COLUMN IF NOT EXISTS updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP AFTER createdAt;`,
  },
  {
    name: 'Add deletedAt to eaRelationships',
    sql: `ALTER TABLE eaRelationships ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL AFTER updatedAt;`,
  },
  {
    name: 'Add deletedBy to eaRelationships',
    sql: `ALTER TABLE eaRelationships ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt;`,
  },
  {
    name: 'Add projectId to artifactEntityLinks',
    sql: `ALTER TABLE artifactEntityLinks ADD COLUMN IF NOT EXISTS projectId INT NOT NULL DEFAULT 0 AFTER id;`,
  },
  {
    name: 'Add createdBy to artifactEntityLinks',
    sql: `ALTER TABLE artifactEntityLinks ADD COLUMN IF NOT EXISTS createdBy INT NULL AFTER usageType;`,
  },
  {
    name: 'Add createdVia to artifactEntityLinks',
    sql: `ALTER TABLE artifactEntityLinks ADD COLUMN IF NOT EXISTS createdVia VARCHAR(50) NOT NULL DEFAULT 'manual' AFTER createdBy;`,
  },
  {
    name: 'Add deletedAt to artifactEntityLinks',
    sql: `ALTER TABLE artifactEntityLinks ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL AFTER createdAt;`,
  },
  {
    name: 'Add deletedBy to artifactEntityLinks',
    sql: `ALTER TABLE artifactEntityLinks ADD COLUMN IF NOT EXISTS deletedBy INT NULL AFTER deletedAt;`,
  },
  {
    name: 'Populate projectId in artifactEntityLinks',
    sql: `UPDATE artifactEntityLinks ael INNER JOIN artifacts a ON ael.artifactId = a.id SET ael.projectId = a.projectId WHERE ael.projectId = 0;`,
  },
  {
    name: 'Create organizationUnits table',
    sql: `CREATE TABLE IF NOT EXISTS organizationUnits (
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
      deletedBy INT
    );`,
  },
];

async function runMigration() {
  let connection;
  
  try {
    console.log('📡 Connecting to database...');
    connection = await mysql.createConnection(config);
    console.log('✅ Connected successfully\n');
    
    let successCount = 0;
    let skipCount = 0;
    let errorCount = 0;
    
    for (const migration of migrations) {
      try {
        console.log(`⏳ ${migration.name}...`);
        await connection.execute(migration.sql);
        console.log(`✅ ${migration.name} - SUCCESS\n`);
        successCount++;
      } catch (error) {
        if (error.code === 'ER_DUP_FIELDNAME' || error.message.includes('Duplicate column')) {
          console.log(`⏭️  ${migration.name} - SKIPPED (already exists)\n`);
          skipCount++;
        } else {
          console.error(`❌ ${migration.name} - ERROR:`);
          console.error(`   ${error.message}\n`);
          errorCount++;
        }
      }
    }
    
    console.log('═══════════════════════════════════════');
    console.log('📊 Migration Summary:');
    console.log(`   ✅ Success: ${successCount}`);
    console.log(`   ⏭️  Skipped: ${skipCount}`);
    console.log(`   ❌ Errors: ${errorCount}`);
    console.log('═══════════════════════════════════════\n');
    
    if (errorCount === 0) {
      console.log('🎉 Migration completed successfully!');
    } else {
      console.log('⚠️  Migration completed with errors. Please review above.');
    }
    
  } catch (error) {
    console.error('💥 Fatal error during migration:');
    console.error(error);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('\n👋 Database connection closed');
    }
  }
}

runMigration();
