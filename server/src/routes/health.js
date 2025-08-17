const express = require('express');
const router = express.Router();
const { pool } = require('../config/db.js');
const os = require('os');
const fs = require('fs').promises;
const path = require('path');

// Basic health check
router.get('/', async (req, res) => {
  try {
    const startTime = process.hrtime();
    
    // Database connectivity check
    const [dbResult] = await pool.execute('SELECT 1 as healthy');
    const dbHealthy = dbResult && dbResult[0].healthy === 1;
    
    // Memory usage
    const memUsage = process.memoryUsage();
    const systemMem = {
      total: os.totalmem(),
      free: os.freemem(),
      used: os.totalmem() - os.freemem()
    };
    
    // CPU load
    const cpuLoad = os.loadavg();
    
    // Uptime
    const uptime = process.uptime();
    
    // Response time calculation
    const endTime = process.hrtime(startTime);
    const responseTime = endTime[0] * 1000 + endTime[1] / 1000000; // Convert to milliseconds
    
    const health = {
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      uptime: Math.floor(uptime),
      environment: process.env.NODE_ENV || 'development',
      version: process.env.npm_package_version || '1.0.0',
      database: {
        status: dbHealthy ? 'connected' : 'disconnected',
        responseTime: `${responseTime.toFixed(2)}ms`
      },
      memory: {
        usage: {
          rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
          heapTotal: `${Math.round(memUsage.heapTotal / 1024 / 1024)}MB`,
          heapUsed: `${Math.round(memUsage.heapUsed / 1024 / 1024)}MB`,
          external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
        },
        system: {
          total: `${Math.round(systemMem.total / 1024 / 1024 / 1024)}GB`,
          free: `${Math.round(systemMem.free / 1024 / 1024 / 1024)}GB`,
          used: `${Math.round(systemMem.used / 1024 / 1024 / 1024)}GB`
        },
        usage_percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100)
      },
      cpu: {
        load: cpuLoad,
        cores: os.cpus().length
      },
      system: {
        platform: os.platform(),
        architecture: os.arch(),
        hostname: os.hostname(),
        nodeVersion: process.version
      }
    };
    
    const statusCode = health.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(health);
    
  } catch (error) {
    console.error('Health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      database: {
        status: 'error'
      }
    });
  }
});

// Detailed system info (admin only)
router.get('/detailed', async (req, res) => {
  try {
    // Get database stats
    const [tableStats] = await pool.execute(`
      SELECT 
        table_name,
        table_rows,
        data_length,
        index_length,
        (data_length + index_length) as total_size
      FROM information_schema.tables 
      WHERE table_schema = DATABASE()
      ORDER BY total_size DESC
      LIMIT 10
    `);
    
    // Get recent activity
    const [recentActivity] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM actividades 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
    `);
    
    // Get user sessions
    const [activeSessions] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM sessions 
      WHERE expires > NOW()
    `);
    
    // Disk usage (if possible)
    let diskUsage = null;
    try {
      const stats = await fs.stat(process.cwd());
      diskUsage = {
        path: process.cwd(),
        // Note: Getting actual disk usage requires platform-specific commands
        accessible: true
      };
    } catch (err) {
      diskUsage = { accessible: false, error: err.message };
    }
    
    const detailedHealth = {
      timestamp: new Date().toISOString(),
      database: {
        tables: tableStats.map(table => ({
          name: table.table_name,
          rows: table.table_rows,
          size: `${Math.round((table.total_size || 0) / 1024 / 1024)}MB`
        })),
        total_tables: tableStats.length
      },
      activity: {
        recent_activities: recentActivity[0]?.count || 0,
        active_sessions: activeSessions[0]?.count || 0
      },
      disk: diskUsage,
      environment_variables: {
        NODE_ENV: process.env.NODE_ENV,
        PORT: process.env.PORT,
        database_configured: !!process.env.DB_HOST
      },
      runtime: {
        pid: process.pid,
        title: process.title,
        argv: process.argv.slice(2), // Hide full path
        cwd: process.cwd()
      }
    };
    
    res.json(detailedHealth);
    
  } catch (error) {
    console.error('Detailed health check error:', error);
    res.status(500).json({
      error: 'Unable to retrieve detailed health information',
      message: error.message
    });
  }
});

// Ready check (for container orchestration)
router.get('/ready', async (req, res) => {
  try {
    // Check if database is ready
    await pool.execute('SELECT 1');
    
    // Check if critical tables exist
    const [tables] = await pool.execute(`
      SELECT COUNT(*) as count 
      FROM information_schema.tables 
      WHERE table_schema = DATABASE() 
      AND table_name IN ('usuarios', 'proyectos', 'notificaciones')
    `);
    
    const tablesReady = tables[0].count >= 3;
    
    if (tablesReady) {
      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString(),
        message: 'Service is ready to accept requests'
      });
    } else {
      res.status(503).json({
        status: 'not_ready',
        timestamp: new Date().toISOString(),
        message: 'Service is not ready - missing critical tables'
      });
    }
    
  } catch (error) {
    res.status(503).json({
      status: 'not_ready',
      timestamp: new Date().toISOString(),
      error: error.message
    });
  }
});

// Liveness check (for container orchestration)
router.get('/live', (req, res) => {
  // Simple check that the process is running
  res.status(200).json({
    status: 'alive',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    pid: process.pid
  });
});

module.exports = router;