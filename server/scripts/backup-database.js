#!/usr/bin/env node

const { exec } = require('child_process');
const fs = require('fs').promises;
const path = require('path');
const { promisify } = require('util');

const execAsync = promisify(exec);

class DatabaseBackup {
  constructor() {
    this.config = {
      host: process.env.DB_HOST || 'localhost',
      port: process.env.DB_PORT || 3306,
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'borderless',
      backupDir: process.env.BACKUP_DIR || path.join(process.cwd(), 'backups'),
      retentionDays: parseInt(process.env.BACKUP_RETENTION_DAYS) || 30,
      s3Bucket: process.env.S3_BACKUP_BUCKET,
      s3Region: process.env.AWS_REGION || 'us-east-1'
    };

    this.timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  }

  async ensureBackupDirectory() {
    try {
      await fs.access(this.config.backupDir);
    } catch (error) {
      await fs.mkdir(this.config.backupDir, { recursive: true });
      console.log(`✅ Created backup directory: ${this.config.backupDir}`);
    }
  }

  async createDatabaseDump() {
    const filename = `${this.config.database}-${this.timestamp}.sql`;
    const filepath = path.join(this.config.backupDir, filename);
    
    console.log(`🔄 Creating database dump: ${filename}`);
    
    const mysqldumpCmd = [
      'mysqldump',
      `--host=${this.config.host}`,
      `--port=${this.config.port}`,
      `--user=${this.config.user}`,
      `--password=${this.config.password}`,
      '--single-transaction',
      '--routines',
      '--triggers',
      '--add-drop-table',
      '--extended-insert',
      '--create-options',
      '--quick',
      '--lock-tables=false',
      this.config.database
    ].join(' ');

    try {
      const { stdout, stderr } = await execAsync(`${mysqldumpCmd} > ${filepath}`);
      
      if (stderr && !stderr.includes('Warning')) {
        throw new Error(`Mysqldump error: ${stderr}`);
      }

      // Verify the dump file exists and has content
      const stats = await fs.stat(filepath);
      if (stats.size === 0) {
        throw new Error('Backup file is empty');
      }

      console.log(`✅ Database dump created: ${filename} (${Math.round(stats.size / 1024 / 1024)}MB)`);
      return filepath;
      
    } catch (error) {
      console.error(`❌ Failed to create database dump: ${error.message}`);
      throw error;
    }
  }

  async compressBackup(filepath) {
    const gzipPath = `${filepath}.gz`;
    console.log(`🔄 Compressing backup...`);
    
    try {
      await execAsync(`gzip ${filepath}`);
      
      const stats = await fs.stat(gzipPath);
      console.log(`✅ Backup compressed: ${path.basename(gzipPath)} (${Math.round(stats.size / 1024 / 1024)}MB)`);
      return gzipPath;
      
    } catch (error) {
      console.error(`❌ Failed to compress backup: ${error.message}`);
      throw error;
    }
  }

  async uploadToS3(filepath) {
    if (!this.config.s3Bucket) {
      console.log('⏭️  S3 bucket not configured, skipping upload');
      return;
    }

    const filename = path.basename(filepath);
    const s3Key = `database-backups/${filename}`;
    
    console.log(`🔄 Uploading to S3: s3://${this.config.s3Bucket}/${s3Key}`);
    
    try {
      const awsCmd = [
        'aws s3 cp',
        filepath,
        `s3://${this.config.s3Bucket}/${s3Key}`,
        '--storage-class STANDARD_IA',
        `--region ${this.config.s3Region}`
      ].join(' ');

      await execAsync(awsCmd);
      console.log(`✅ Backup uploaded to S3: ${s3Key}`);
      
    } catch (error) {
      console.error(`❌ Failed to upload to S3: ${error.message}`);
      throw error;
    }
  }

  async cleanupOldBackups() {
    console.log(`🔄 Cleaning up backups older than ${this.config.retentionDays} days...`);
    
    try {
      const files = await fs.readdir(this.config.backupDir);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - this.config.retentionDays);
      
      let deletedCount = 0;
      
      for (const file of files) {
        if (!file.endsWith('.sql.gz') && !file.endsWith('.sql')) continue;
        
        const filepath = path.join(this.config.backupDir, file);
        const stats = await fs.stat(filepath);
        
        if (stats.mtime < cutoffDate) {
          await fs.unlink(filepath);
          console.log(`🗑️  Deleted old backup: ${file}`);
          deletedCount++;
        }
      }
      
      console.log(`✅ Cleaned up ${deletedCount} old backup(s)`);
      
    } catch (error) {
      console.error(`❌ Failed to cleanup old backups: ${error.message}`);
    }
  }

  async testRestore(backupPath) {
    console.log(`🔄 Testing backup restore...`);
    
    const testDb = `${this.config.database}_restore_test`;
    
    try {
      // Create test database
      const createDbCmd = [
        'mysql',
        `--host=${this.config.host}`,
        `--port=${this.config.port}`,
        `--user=${this.config.user}`,
        `--password=${this.config.password}`,
        '-e',
        `"CREATE DATABASE IF NOT EXISTS ${testDb}"`
      ].join(' ');
      
      await execAsync(createDbCmd);
      
      // Restore backup to test database
      const restoreCmd = [
        'mysql',
        `--host=${this.config.host}`,
        `--port=${this.config.port}`,
        `--user=${this.config.user}`,
        `--password=${this.config.password}`,
        testDb,
        '<',
        backupPath
      ].join(' ');
      
      await execAsync(`gunzip -c ${backupPath} | mysql --host=${this.config.host} --port=${this.config.port} --user=${this.config.user} --password=${this.config.password} ${testDb}`);
      
      // Verify tables exist
      const verifyCmd = [
        'mysql',
        `--host=${this.config.host}`,
        `--port=${this.config.port}`,
        `--user=${this.config.user}`,
        `--password=${this.config.password}`,
        testDb,
        '-e',
        '"SHOW TABLES"'
      ].join(' ');
      
      const { stdout } = await execAsync(verifyCmd);
      const tableCount = stdout.split('\n').length - 2; // Subtract header and empty line
      
      // Cleanup test database
      const dropDbCmd = [
        'mysql',
        `--host=${this.config.host}`,
        `--port=${this.config.port}`,
        `--user=${this.config.user}`,
        `--password=${this.config.password}`,
        '-e',
        `"DROP DATABASE ${testDb}"`
      ].join(' ');
      
      await execAsync(dropDbCmd);
      
      console.log(`✅ Backup restore test successful (${tableCount} tables restored)`);
      
    } catch (error) {
      console.error(`❌ Backup restore test failed: ${error.message}`);
      throw error;
    }
  }

  async run() {
    const startTime = Date.now();
    console.log(`🚀 Starting database backup for ${this.config.database} at ${new Date().toISOString()}`);
    
    try {
      // Ensure backup directory exists
      await this.ensureBackupDirectory();
      
      // Create database dump
      const dumpPath = await this.createDatabaseDump();
      
      // Compress the backup
      const compressedPath = await this.compressBackup(dumpPath);
      
      // Test the backup
      await this.testRestore(compressedPath);
      
      // Upload to S3 if configured
      await this.uploadToS3(compressedPath);
      
      // Cleanup old backups
      await this.cleanupOldBackups();
      
      const duration = Math.round((Date.now() - startTime) / 1000);
      console.log(`✅ Backup completed successfully in ${duration}s`);
      
      // Exit with success
      process.exit(0);
      
    } catch (error) {
      console.error(`❌ Backup failed: ${error.message}`);
      process.exit(1);
    }
  }
}

// Run backup if called directly
if (require.main === module) {
  const backup = new DatabaseBackup();
  backup.run();
}

module.exports = DatabaseBackup;