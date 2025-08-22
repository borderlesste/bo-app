const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function runMigration() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    multipleStatements: true
  });

  try {
    console.log('📦 Running email campaigns migration...');
    
    // Run table migrations
    const tableMigrations = [
      'create_email_campaigns.sql',
      'create_email_campaigns_recipients.sql'
    ];
    
    for (const migration of tableMigrations) {
      console.log(`Running ${migration}...`);
      const migrationPath = path.join(__dirname, '../src/migrations', migration);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      await connection.execute(migrationSQL);
      console.log(`✅ ${migration} completed`);
    }
    
    // Run indexes separately
    const indexes = [
      'CREATE INDEX idx_email_campaigns_estado ON email_campaigns(estado)',
      'CREATE INDEX idx_email_campaigns_tipo ON email_campaigns(tipo)',
      'CREATE INDEX idx_email_campaigns_fecha_envio ON email_campaigns(fecha_envio)',
      'CREATE INDEX idx_email_campaign_recipients_campaign ON email_campaign_recipients(campaign_id)',
      'CREATE INDEX idx_email_campaign_recipients_estado ON email_campaign_recipients(estado)'
    ];
    
    for (const indexSQL of indexes) {
      try {
        await connection.execute(indexSQL);
        console.log(`✅ Index created: ${indexSQL.split(' ')[2]}`);
      } catch (error) {
        if (error.message.includes('Duplicate key name')) {
          console.log(`⚠️  Index already exists: ${indexSQL.split(' ')[2]}`);
        } else {
          console.log(`❌ Failed to create index: ${error.message}`);
        }
      }
    }
    
    console.log('✅ All email campaigns migrations completed successfully!');
    
    // Verify tables were created
    const [tables] = await connection.execute(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_SCHEMA = ? AND TABLE_NAME IN ('email_campaigns', 'email_campaign_recipients')
    `, [process.env.DB_NAME]);
    
    console.log('📋 Created tables:', tables.map(t => t.TABLE_NAME));
    
  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    process.exit(1);
  } finally {
    await connection.end();
  }
}

runMigration();