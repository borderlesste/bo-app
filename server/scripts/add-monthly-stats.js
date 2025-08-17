// scripts/add-monthly-stats.js
const fs = require('fs');
const path = require('path');
const { pool } = require('../src/config/db.js');

async function addMonthlyStatsTable() {
  console.log('🚀 Agregando tabla de estadísticas mensuales...');
  
  try {
    // Crear tabla
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS monthly_stats (
        id INT AUTO_INCREMENT PRIMARY KEY,
        year INT NOT NULL,
        month INT NOT NULL,
        revenue DECIMAL(12,2) DEFAULT 0,
        new_clients INT DEFAULT 0,
        active_projects INT DEFAULT 0,
        completed_projects INT DEFAULT 0,
        pending_quotes INT DEFAULT 0,
        total_orders INT DEFAULT 0,
        created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        UNIQUE KEY unique_month_year (year, month)
      )
    `);
    
    console.log('✅ Tabla monthly_stats creada correctamente');
    
    // Datos de ejemplo para inicializar la tabla
    const monthlyData = [
      { year: 2024, month: 1, revenue: 15000, new_clients: 5, active_projects: 8, completed_projects: 3, pending_quotes: 4, total_orders: 12 },
      { year: 2024, month: 2, revenue: 18000, new_clients: 7, active_projects: 10, completed_projects: 5, pending_quotes: 6, total_orders: 15 },
      { year: 2024, month: 3, revenue: 22000, new_clients: 8, active_projects: 12, completed_projects: 7, pending_quotes: 5, total_orders: 18 }
    ];
    
    for (const data of monthlyData) {
      try {
        await pool.execute(
          'INSERT IGNORE INTO monthly_stats (year, month, revenue, new_clients, active_projects, completed_projects, pending_quotes, total_orders) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [data.year, data.month, data.revenue, data.new_clients, data.active_projects, data.completed_projects, data.pending_quotes, data.total_orders]
        );
      } catch (err) {
        // Ignorar errores de duplicados
        if (!err.message.includes('Duplicate entry')) {
          throw err;
        }
      }
    }
    
    // Verificar que se insertaron los datos
    const [rows] = await pool.execute('SELECT COUNT(*) as count FROM monthly_stats');
    console.log(`📊 Se insertaron/actualizaron ${rows[0].count} registros de estadísticas mensuales`);
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al crear tabla de estadísticas mensuales:', error.message);
    process.exit(1);
  }
}

addMonthlyStatsTable();