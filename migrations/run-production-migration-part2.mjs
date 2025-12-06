/**
 * Production-Ready Schema Migration v2.1 - Part 2
 * Adds remaining columns that depend on deletedAt existing first
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

console.log('🚀 Starting Production-Ready Schema Migration v2.1 - Part 2...\n');

const migrations = [
  // First add deletedAt to entity tables
  {
    name: 'Add deletedAt to businessCapabilities',
    sql: `ALTER TABLE businessCapabilities ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL;`,
  },
  {
    name: 'Add deletedAt to applications',
    sql: `ALTER TABLE applications ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL;`,
  },
  {
    name: 'Add deletedAt to businessProcesses',
    sql: `ALTER TABLE businessProcesses ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL;`,
  },
  {
    name: 'Add deletedAt to dataEntities',
    sql: `ALTER TABLE dataEntities ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL;`,
  },
  {
    name: 'Add deletedAt to requirements',
    sql: `ALTER TABLE requirements ADD COLUMN IF NOT EXISTS deletedAt TIMESTAMP NULL;`,
  },
  // Now add deletedBy AFTER deletedAt
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
  // Fix artifactEntityLinks columns
  {
    name: 'Add createdBy to artifactEntityLinks',
    sql: `ALTER TABLE artifactEntityLinks ADD COLUMN IF NOT EXISTS createdBy INT NULL;`,
  },
  {
    name: 'Add createdVia to artifactEntityLinks',
    sql: `ALTER TABLE artifactEntityLinks ADD COLUMN IF NOT EXISTS createdVia VARCHAR(50) NOT NULL DEFAULT 'manual';`,
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
      console.log('🎉 Migration Part 2 completed successfully!');
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
