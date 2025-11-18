import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function fixDatabase() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('Creating backup...');
    await connection.execute('CREATE TABLE IF NOT EXISTS projects_backup_fix AS SELECT * FROM projects');
    
    console.log('Dropping old table...');
    await connection.execute('DROP TABLE IF EXISTS projects');
    
    console.log('Creating new table...');
    await connection.execute(`
      CREATE TABLE projects (
        id INT AUTO_INCREMENT PRIMARY KEY,
        userId INT NOT NULL,
        name VARCHAR(255) NOT NULL,
        description TEXT,
        currentPhase VARCHAR(100) DEFAULT 'Preliminary',
        status ENUM('active', 'completed', 'on_hold') DEFAULT 'active',
        notionPageUrl TEXT,
        canvaDesignUrl TEXT,
        notionSyncedAt TIMESTAMP NULL,
        canvaSyncedAt TIMESTAMP NULL,
        createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    console.log('Restoring data...');
    await connection.execute(`
      INSERT INTO projects (id, userId, name, description, currentPhase, status, createdAt, updatedAt)
      SELECT 
        id, 
        userId, 
        name, 
        description, 
        currentPhase,
        'active' as status,
        createdAt,
        updatedAt
      FROM projects_backup_fix
    `);
    
    console.log('Dropping backup...');
    await connection.execute('DROP TABLE projects_backup_fix');
    
    console.log('Database fixed successfully!');
  } catch (error) {
    console.error('Error:', error);
    throw error;
  } finally {
    await connection.end();
  }
}

fixDatabase().catch(console.error);
