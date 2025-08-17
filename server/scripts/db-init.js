import 'dotenv/config';
import mysql from 'mysql2/promise';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  try {
    const db = await mysql.createConnection(process.env.DATABASE_URL);
    const sql = fs.readFileSync(path.join(__dirname, '../src/migrations/init.sql'), 'utf-8');
    const statements = sql.split(/;\s*$/m);
    for (const statement of statements) {
      if (statement.trim().length > 0) {
        await db.query(statement);
      }
    }
    await db.end();
    console.log('Database initialized.');
  } catch (error) {
    console.error('Error initializing database:', error);
    process.exit(1);
  }
})();
