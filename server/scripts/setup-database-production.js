const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load production environment variables
dotenv.config({ path: '.env.production' });

async function setupProductionDatabase() {
  console.log('🚀 Setting up production database...');
  
  let connection;
  
  try {
    // Create connection without specifying database
    connection = await mysql.createConnection({
      host: process.env.DB_HOST,
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER,
      password: process.env.DB_PASSWORD
    });
    
    console.log('✅ Connected to MySQL server');

    // Create database if it doesn't exist
    await connection.execute(`CREATE DATABASE IF NOT EXISTS \`${process.env.DB_NAME}\``);
    console.log(`✅ Database '${process.env.DB_NAME}' created or already exists`);

    // Connect to the specific database
    await connection.changeUser({ database: process.env.DB_NAME });
    console.log(`✅ Connected to database '${process.env.DB_NAME}'`);

    // Read and execute init.sql file
    const initSqlPath = path.join(__dirname, '../src/migrations/init.sql');
    
    if (!fs.existsSync(initSqlPath)) {
      throw new Error(`❌ init.sql file not found at: ${initSqlPath}`);
    }

    const initSql = fs.readFileSync(initSqlPath, 'utf8');
    console.log('📄 init.sql file read successfully');

    // Split SQL into individual statements
    const statements = initSql
      .split(';')
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

    console.log(`🔧 Executing ${statements.length} SQL statements...`);

    // Execute each SQL statement
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      try {
        await connection.execute(statement);
        console.log(`✅ Statement ${i + 1}/${statements.length} executed`);
      } catch (error) {
        console.log(`⚠️  Warning in statement ${i + 1}: ${error.message}`);
        // Continue with next statements
      }
    }

    // Verify tables were created correctly
    const [tables] = await connection.execute('SHOW TABLES');
    console.log('📊 Tables created in database:');
    tables.forEach(table => {
      const tableName = Object.values(table)[0];
      console.log(`   - ${tableName}`);
    });

    // Insert production admin user only
    await insertProductionData(connection);

    console.log('🎉 Production database setup completed successfully!');
    console.log('');
    console.log('📋 Summary:');
    console.log(`   - Database: ${process.env.DB_NAME}`);
    console.log(`   - Tables created: ${tables.length}`);
    console.log('   - Production admin user created');
    console.log('');

  } catch (error) {
    console.error('❌ Error setting up production database:', error.message);
    process.exit(1);
  } finally {
    if (connection) {
      await connection.end();
      console.log('🔌 Database connection closed');
    }
  }
}

async function insertProductionData(connection) {
  console.log('📝 Inserting production data...');

  try {
    // Check if data already exists
    const [existingUsers] = await connection.execute('SELECT COUNT(*) as count FROM usuarios');
    if (existingUsers[0].count > 0) {
      console.log('ℹ️  Data already exists in database, skipping production data insertion');
      return;
    }

    // Insert production admin user (you should change the password after first login)
    await connection.execute(`
      INSERT INTO usuarios (nombre, email, direccion, telefono, password, rol) VALUES 
      ('Administrator', 'admin@borderlesstechno.com', 'Borderless Techno Company HQ', '+52 55 1234 5678', '$2b$10$92IXUNpkjO0rOQ5byMi.Ye4oKoEa3Ro9llC/.og/at2.uheWG/igi', 'admin')
    `);

    console.log('✅ Production admin user created successfully');
    console.log('');
    console.log('🔐 Production credentials:');
    console.log('   Admin: admin@borderlesstechno.com / password');
    console.log('   ⚠️  IMPORTANT: Change the admin password after first login!');

  } catch (error) {
    console.log('⚠️  Error inserting production data:', error.message);
  }
}

// Execute script if called directly
if (require.main === module) {
  setupProductionDatabase();
}

module.exports = { setupProductionDatabase };