// server/src/controllers/statsController.js
const { pool } = require('../config/db.js');

// Obtener estadísticas históricas mensuales
const getMonthlyStats = async (req, res) => {
  try {
    const { months = 6, year } = req.query;
    
    let query = `
      SELECT 
        anio as year,
        mes as month,
        total_ingresos as revenue,
        nuevos_usuarios as new_clients,
        proyectos_iniciados as active_projects,
        proyectos_completados as completed_projects,
        cotizaciones_enviadas as pending_quotes,
        pedidos_nuevos as total_orders,
        created_at
      FROM estadisticas_mensuales 
    `;
    
    const params = [];
    
    if (year) {
      query += ' WHERE anio = ?';
      params.push(parseInt(year));
    }
    
    query += ' ORDER BY anio DESC, mes DESC';
    
    if (months && !year) {
      query += ' LIMIT ?';
      params.push(parseInt(months));
    }
    
    const [rows] = await pool.execute(query, params);
    
    // Formatear datos para los gráficos
    const formattedData = rows.reverse().map(row => ({
      year: row.year,
      month: row.month,
      monthName: new Date(row.year, row.month - 1).toLocaleDateString('es-ES', { month: 'short' }),
      revenue: parseFloat(row.revenue),
      newClients: row.new_clients,
      activeProjects: row.active_projects,
      completedProjects: row.completed_projects,
      pendingQuotes: row.pending_quotes,
      totalOrders: row.total_orders,
      date: row.created_at
    }));
    
    res.json({
      success: true,
      data: formattedData,
      total: formattedData.length
    });
  } catch (error) {
    console.error('Error al obtener estadísticas mensuales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener estadísticas de crecimiento acumulado
const getGrowthStats = async (req, res) => {
  try {
    const { months = 12 } = req.query;
    
    const [rows] = await pool.execute(`
      SELECT 
        anio as year,
        mes as month,
        total_ingresos as revenue,
        nuevos_usuarios as new_clients,
        proyectos_iniciados as active_projects,
        proyectos_completados as completed_projects,
        (
          SELECT SUM(nuevos_usuarios) 
          FROM estadisticas_mensuales ms2 
          WHERE (ms2.anio < ms1.anio) 
             OR (ms2.anio = ms1.anio AND ms2.mes <= ms1.mes)
        ) as accumulated_clients,
        (
          SELECT SUM(total_ingresos) 
          FROM estadisticas_mensuales ms3 
          WHERE ms3.anio = ms1.anio AND ms3.mes <= ms1.mes
        ) as yearly_revenue
      FROM estadisticas_mensuales ms1
      ORDER BY anio DESC, mes DESC
      LIMIT ?
    `, [parseInt(months)]);
    
    const formattedData = rows.reverse().map(row => ({
      year: row.year,
      month: row.month,
      monthName: new Date(row.year, row.month - 1).toLocaleDateString('es-ES', { month: 'short' }),
      revenue: parseFloat(row.revenue),
      newClients: row.new_clients,
      accumulatedClients: row.accumulated_clients || 0,
      yearlyRevenue: parseFloat(row.yearly_revenue || 0),
      activeProjects: row.active_projects,
      completedProjects: row.completed_projects
    }));
    
    res.json({
      success: true,
      data: formattedData,
      total: formattedData.length
    });
  } catch (error) {
    console.error('Error al obtener estadísticas de crecimiento:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener resumen de estadísticas por año
const getYearlyStats = async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT 
        anio as year,
        SUM(total_ingresos) as total_revenue,
        SUM(nuevos_usuarios) as total_new_clients,
        AVG(proyectos_iniciados) as avg_active_projects,
        SUM(proyectos_completados) as total_completed_projects,
        SUM(cotizaciones_enviadas) as total_pending_quotes,
        SUM(pedidos_nuevos) as total_orders,
        COUNT(*) as months_recorded
      FROM estadisticas_mensuales
      GROUP BY anio
      ORDER BY anio DESC
    `);
    
    const formattedData = rows.map(row => ({
      year: row.year,
      totalRevenue: parseFloat(row.total_revenue),
      totalNewClients: row.total_new_clients,
      avgActiveProjects: Math.round(row.avg_active_projects),
      totalCompletedProjects: row.total_completed_projects,
      totalPendingQuotes: row.total_pending_quotes,
      totalOrders: row.total_orders,
      monthsRecorded: row.months_recorded,
      avgMonthlyRevenue: parseFloat(row.total_revenue) / row.months_recorded
    }));
    
    res.json({
      success: true,
      data: formattedData,
      total: formattedData.length
    });
  } catch (error) {
    console.error('Error al obtener estadísticas anuales:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Crear o actualizar estadísticas de un mes específico
const updateMonthlyStats = async (req, res) => {
  try {
    const { year, month, revenue, newClients, activeProjects, completedProjects, pendingQuotes, totalOrders } = req.body;
    
    if (!year || !month) {
      return res.status(400).json({
        success: false,
        message: 'Año y mes son requeridos'
      });
    }
    
    const [result] = await pool.execute(`
      INSERT INTO estadisticas_mensuales (anio, mes, total_ingresos, nuevos_usuarios, proyectos_iniciados, proyectos_completados, cotizaciones_enviadas, pedidos_nuevos)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        total_ingresos = VALUES(total_ingresos),
        nuevos_usuarios = VALUES(nuevos_usuarios),
        proyectos_iniciados = VALUES(proyectos_iniciados),
        proyectos_completados = VALUES(proyectos_completados),
        cotizaciones_enviadas = VALUES(cotizaciones_enviadas),
        pedidos_nuevos = VALUES(pedidos_nuevos),
        updated_at = CURRENT_TIMESTAMP
    `, [
      year, 
      month, 
      revenue || 0, 
      newClients || 0, 
      activeProjects || 0, 
      completedProjects || 0, 
      pendingQuotes || 0, 
      totalOrders || 0
    ]);
    
    res.json({
      success: true,
      message: 'Estadísticas actualizadas exitosamente',
      data: {
        year,
        month,
        revenue: revenue || 0,
        newClients: newClients || 0,
        activeProjects: activeProjects || 0,
        completedProjects: completedProjects || 0,
        pendingQuotes: pendingQuotes || 0,
        totalOrders: totalOrders || 0
      }
    });
  } catch (error) {
    console.error('Error al actualizar estadísticas:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

// Obtener comparación entre períodos
const getComparison = async (req, res) => {
  try {
    const { currentYear, currentMonth, compareYear, compareMonth } = req.query;
    
    if (!currentYear || !currentMonth || !compareYear || !compareMonth) {
      return res.status(400).json({
        success: false,
        message: 'Se requieren los parámetros de ambos períodos para comparar'
      });
    }
    
    const [currentData] = await pool.execute(
      'SELECT * FROM estadisticas_mensuales WHERE anio = ? AND mes = ?',
      [parseInt(currentYear), parseInt(currentMonth)]
    );
    
    const [compareData] = await pool.execute(
      'SELECT * FROM estadisticas_mensuales WHERE anio = ? AND mes = ?',
      [parseInt(compareYear), parseInt(compareMonth)]
    );
    
    if (currentData.length === 0 || compareData.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'No se encontraron datos para uno de los períodos especificados'
      });
    }
    
    const current = currentData[0];
    const compare = compareData[0];
    
    const comparison = {
      current: {
        period: `${current.anio}-${current.mes.toString().padStart(2, '0')}`,
        revenue: parseFloat(current.total_ingresos),
        newClients: current.nuevos_usuarios,
        activeProjects: current.proyectos_iniciados,
        completedProjects: current.proyectos_completados
      },
      compare: {
        period: `${compare.anio}-${compare.mes.toString().padStart(2, '0')}`,
        revenue: parseFloat(compare.total_ingresos),
        newClients: compare.nuevos_usuarios,
        activeProjects: compare.proyectos_iniciados,
        completedProjects: compare.proyectos_completados
      },
      changes: {
        revenueChange: parseFloat(current.total_ingresos) - parseFloat(compare.total_ingresos),
        revenuePercentage: ((parseFloat(current.total_ingresos) - parseFloat(compare.total_ingresos)) / parseFloat(compare.total_ingresos) * 100).toFixed(2),
        clientsChange: current.nuevos_usuarios - compare.nuevos_usuarios,
        clientsPercentage: ((current.nuevos_usuarios - compare.nuevos_usuarios) / compare.nuevos_usuarios * 100).toFixed(2),
        projectsChange: current.proyectos_iniciados - compare.proyectos_iniciados,
        projectsPercentage: ((current.proyectos_iniciados - compare.proyectos_iniciados) / compare.proyectos_iniciados * 100).toFixed(2)
      }
    };
    
    res.json({
      success: true,
      data: comparison
    });
  } catch (error) {
    console.error('Error al obtener comparación:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
};

module.exports = {
  getMonthlyStats,
  getGrowthStats,
  getYearlyStats,
  updateMonthlyStats,
  getComparison
};