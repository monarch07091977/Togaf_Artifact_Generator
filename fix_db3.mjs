import mysql from 'mysql2/promise';

const DATABASE_URL = process.env.DATABASE_URL;

async function fixDatabase() {
  const connection = await mysql.createConnection(DATABASE_URL);
  
  try {
    console.log('Disabling foreign key checks...');
    await connection.execute('SET FOREIGN_KEY_CHECKS=0');
    
    console.log('Fetching existing projects...');
    const [projects] = await connection.execute('SELECT * FROM projects');
    console.log(`Found ${projects.length} projects`);
    
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
    for (const project of projects) {
      await connection.execute(
        `INSERT INTO projects (id, userId, name, description, currentPhase, status, createdAt, updatedAt)
         VALUES (?, ?, ?, ?, ?, 'active', ?, ?)`,
        [project.id, project.userId, project.name, project.description, project.currentPhase, project.createdAt, project.updatedAt]
      );
    }
    
    console.log('Re-enabling foreign key checks...');
    await connection.execute('SET FOREIGN_KEY_CHECKS=1');
    
    console.log('Database fixed successfully!');
  } catch (error) {
    console.error('Error:', error);
    await connection.execute('SET FOREIGN_KEY_CHECKS=1');
    throw error;
  } finally {
    await connection.end();
  }
}

fixDatabase().catch(console.error);
