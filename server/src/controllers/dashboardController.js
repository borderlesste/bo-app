const { pool } = require('../config/db.js');

// Obtener estadísticas del dashboard admin
const getAdminStats = async (req, res) => {
  try {
    // Obtener estadísticas básicas
    const statsQueries = await Promise.all([
      // Total de clientes
      pool.execute('SELECT COUNT(*) as total FROM usuarios WHERE rol != "admin"'),
      
      // Proyectos activos (pedidos en progreso) 
      pool.execute('SELECT COUNT(*) as total FROM pedidos WHERE estado IN ("nuevo", "confirmado", "en_proceso")'),
      
      // Cotizaciones pendientes
      pool.execute('SELECT COUNT(*) as total FROM cotizaciones WHERE estado = "Pendiente"'),
      
      // Ingresos del mes actual
      pool.execute(`
        SELECT COALESCE(SUM(monto), 0) as total 
        FROM pagos 
        WHERE estado = 'aplicado' 
        AND MONTH(fecha_pago) = MONTH(CURRENT_DATE()) 
        AND YEAR(fecha_pago) = YEAR(CURRENT_DATE())
      `),
      
      // Proyectos completados
      pool.execute('SELECT COUNT(*) as total FROM pedidos WHERE estado = "completado"'),
      
      // Pagos pendientes (monto total)
      pool.execute('SELECT COALESCE(SUM(monto), 0) as total FROM pagos WHERE estado = "pendiente"'),
      
      // Nuevos clientes este mes
      pool.execute(`
        SELECT COUNT(*) as total 
        FROM usuarios 
        WHERE rol != "admin" 
        AND MONTH(created_at) = MONTH(CURRENT_DATE()) 
        AND YEAR(created_at) = YEAR(CURRENT_DATE())
      `),
      
      // Valor promedio de proyectos
      pool.execute('SELECT AVG(total) as promedio FROM pedidos WHERE total IS NOT NULL'),

      // Total de proyectos en portfolio
      pool.execute('SELECT COUNT(*) as total FROM proyectos WHERE es_publico = 1'),

      // Proyectos destacados
      pool.execute('SELECT COUNT(*) as total FROM proyectos WHERE es_destacado = 1'),

      // Facturas pendientes
      pool.execute('SELECT COUNT(*) as total FROM facturas WHERE estado IN ("emitida", "timbrada")'),

      // Total facturado este mes
      pool.execute(`
        SELECT COALESCE(SUM(total), 0) as total 
        FROM facturas 
        WHERE estado IN ("emitida", "timbrada", "pagada") 
        AND MONTH(fecha_emision) = MONTH(CURRENT_DATE()) 
        AND YEAR(fecha_emision) = YEAR(CURRENT_DATE())
      `)
    ]);

    const [
      [totalClients],
      [activeProjects], 
      [pendingQuotes],
      [monthlyRevenue],
      [completedProjects],
      [pendingPayments],
      [newClientsThisMonth],
      [avgProjectValue],
      [portfolioProjects],
      [featuredProjects], 
      [pendingInvoices],
      [monthlyBilled]
    ] = statsQueries;

    const stats = {
      totalClients: totalClients[0].total,
      activeProjects: activeProjects[0].total,
      pendingQuotes: pendingQuotes[0].total,
      monthlyRevenue: parseFloat(monthlyRevenue[0].total) || 0,
      completedProjects: completedProjects[0].total,
      pendingPayments: parseFloat(pendingPayments[0].total) || 0,
      newClientsThisMonth: newClientsThisMonth[0].total,
      averageProjectValue: parseFloat(avgProjectValue[0].promedio) || 0,
      portfolioProjects: portfolioProjects[0].total,
      featuredProjects: featuredProjects[0].total,
      pendingInvoices: pendingInvoices[0].total,
      monthlyBilled: parseFloat(monthlyBilled[0].total) || 0,
      // Métricas calculadas
      growthRate: newClientsThisMonth[0].total > 0 ? ((newClientsThisMonth[0].total / Math.max(totalClients[0].total - newClientsThisMonth[0].total, 1)) * 100) : 0,
      projectCompletionRate: totalClients[0].total > 0 ? ((completedProjects[0].total / Math.max(activeProjects[0].total + completedProjects[0].total, 1)) * 100) : 0,
      collectionEfficiency: parseFloat(pendingPayments[0].total) > 0 ? ((parseFloat(monthlyRevenue[0].total) / (parseFloat(monthlyRevenue[0].total) + parseFloat(pendingPayments[0].total))) * 100) : 100
    };

    res.json({
      success: true,
      data: stats
    });
  } catch (error) {
    console.error('Error al obtener estadísticas del admin:', error);
    res.status(500).json({ 
      message: 'Error al obtener estadísticas',
      error: error.message 
    });
  }
};

// Obtener actividades recientes
const getRecentActivity = async (req, res) => {
  try {
    const [activities] = await pool.execute(`
      SELECT 
        a.id,
        a.tipo as type,
        a.descripcion as message,
        'normal' as priority,
        a.created_at as time
      FROM actividades a
      ORDER BY a.created_at DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: activities
    });
  } catch (error) {
    console.error('Error al obtener actividades recientes:', error);
    res.status(500).json({ 
      message: 'Error al obtener actividades recientes',
      error: error.message 
    });
  }
};

// Obtener mejores clientes
const getTopClients = async (req, res) => {
  try {
    const [clients] = await pool.execute(`
      SELECT 
        c.id,
        c.nombre as name,
        c.email,
        COALESCE(SUM(p.monto), 0) as totalSpent,
        COUNT(DISTINCT pe.id) as projectsCount,
        CASE 
          WHEN COUNT(DISTINCT pe.id) > 0 AND SUM(CASE WHEN pe.estado IN ('nuevo', 'confirmado', 'en_proceso') THEN 1 ELSE 0 END) > 0 
          THEN 'active'
          ELSE 'completed'
        END as status
      FROM usuarios c
      LEFT JOIN pagos p ON c.id = p.usuario_id AND p.estado = 'aplicado'
      LEFT JOIN pedidos pe ON c.id = pe.usuario_id
      WHERE c.rol != 'admin'
      GROUP BY c.id, c.nombre, c.email
      HAVING COUNT(DISTINCT pe.id) > 0 OR SUM(p.monto) > 0
      ORDER BY totalSpent DESC, projectsCount DESC
      LIMIT 10
    `);

    // Convertir valores a números
    const formattedClients = clients.map(client => ({
      ...client,
      totalSpent: parseFloat(client.totalSpent) || 0,
      projectsCount: parseInt(client.projectsCount) || 0
    }));

    res.json({
      success: true,
      data: formattedClients
    });
  } catch (error) {
    console.error('Error al obtener mejores clientes:', error);
    res.status(500).json({ 
      message: 'Error al obtener mejores clientes',
      error: error.message 
    });
  }
};

// Obtener datos para gráficos del dashboard
const getChartsData = async (req, res) => {
  try {
    const { period = 'month' } = req.query;
    
    // Datos de ingresos por mes (últimos 6 meses)
    const [revenueData] = await pool.execute(`
      SELECT 
        DATE_FORMAT(fecha_pago, '%Y-%m') as month,
        MONTHNAME(fecha_pago) as month_name,
        SUM(monto) as total
      FROM pagos 
      WHERE estado = 'aplicado' 
        AND fecha_pago >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(fecha_pago, '%Y-%m'), MONTHNAME(fecha_pago)
      ORDER BY month ASC
    `);

    // Distribución de proyectos por estado
    const [projectsDistribution] = await pool.execute(`
      SELECT 
        estado as status,
        COUNT(*) as count
      FROM proyectos 
      WHERE es_publico = 1
      GROUP BY estado
      ORDER BY count DESC
    `);

    // Crecimiento de clientes por mes (últimos 6 meses)
    const [clientGrowth] = await pool.execute(`
      SELECT 
        DATE_FORMAT(created_at, '%Y-%m') as month,
        MONTHNAME(created_at) as month_name,
        COUNT(*) as new_clients
      FROM usuarios 
      WHERE rol != 'admin' 
        AND created_at >= DATE_SUB(NOW(), INTERVAL 6 MONTH)
      GROUP BY DATE_FORMAT(created_at, '%Y-%m'), MONTHNAME(created_at)
      ORDER BY month ASC
    `);

    // Distribución de proyectos por categoría
    const [categoryDistribution] = await pool.execute(`
      SELECT 
        categoria as category,
        COUNT(*) as count
      FROM proyectos 
      WHERE es_publico = 1
      GROUP BY categoria
      ORDER BY count DESC
    `);

    // Top servicios más cotizados
    const [topServices] = await pool.execute(`
      SELECT 
        s.nombre as service_name,
        s.categoria as category,
        COUNT(ci.id) as quotes_count,
        AVG(ci.precio_unitario) as avg_price
      FROM servicios s
      LEFT JOIN cotizacion_items ci ON s.id = ci.servicio_id
      GROUP BY s.id, s.nombre, s.categoria
      HAVING quotes_count > 0
      ORDER BY quotes_count DESC
      LIMIT 10
    `);

    res.json({
      success: true,
      data: {
        revenue: revenueData.map(item => ({
          month: item.month_name,
          total: parseFloat(item.total) || 0
        })),
        projectsDistribution: projectsDistribution.map(item => ({
          status: item.status,
          count: item.count,
          percentage: 0 // Se calculará en el frontend
        })),
        clientGrowth: clientGrowth.map(item => ({
          month: item.month_name,
          newClients: item.new_clients
        })),
        categoryDistribution: categoryDistribution.map(item => ({
          category: item.category,
          count: item.count
        })),
        topServices: topServices.map(item => ({
          name: item.service_name,
          category: item.category,
          quotesCount: item.quotes_count,
          avgPrice: parseFloat(item.avg_price) || 0
        }))
      }
    });
  } catch (error) {
    console.error('Error al obtener datos de gráficos:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener datos de gráficos',
      error: error.message 
    });
  }
};

// Obtener resumen financiero detallado
const getFinancialSummary = async (req, res) => {
  try {
    const [financialData] = await pool.execute(`
      SELECT 
        (SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE estado = 'aplicado' AND MONTH(fecha_pago) = MONTH(CURRENT_DATE())) as monthly_income,
        (SELECT COALESCE(SUM(monto), 0) FROM pagos WHERE estado = 'pendiente') as pending_income,
        (SELECT COALESCE(SUM(total), 0) FROM facturas WHERE estado IN ('emitida', 'timbrada')) as pending_invoices,
        (SELECT COALESCE(SUM(precio_estimado), 0) FROM cotizaciones WHERE estado = 'Pendiente') as pending_quotes,
        (SELECT COALESCE(AVG(total), 0) FROM pedidos WHERE total IS NOT NULL) as avg_project_value,
        (SELECT COUNT(*) FROM cotizaciones WHERE estado = 'Aprobada' AND MONTH(created_at) = MONTH(CURRENT_DATE())) as accepted_quotes_month
    `);

    res.json({
      success: true,
      data: financialData[0]
    });
  } catch (error) {
    console.error('Error al obtener resumen financiero:', error);
    res.status(500).json({ 
      success: false,
      message: 'Error al obtener resumen financiero',
      error: error.message 
    });
  }
};

// Función helper para registrar actividades
const logActivity = async (tipo, descripcion, usuarioId = null, entidadId = null, entidadTipo = null) => {
  try {
    // Verificar si existe la tabla actividades primero
    const [tables] = await pool.execute("SHOW TABLES LIKE 'actividades'");
    if (tables.length === 0) {
      // Crear tabla actividades si no existe
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS actividades (
          id INT AUTO_INCREMENT PRIMARY KEY,
          usuario_id INT NULL,
          tipo VARCHAR(50) NOT NULL,
          descripcion TEXT NOT NULL,
          entidad_tipo VARCHAR(50) NULL,
          entidad_id INT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_usuario_id (usuario_id),
          INDEX idx_tipo (tipo),
          INDEX idx_created_at (created_at)
        ) ENGINE=InnoDB
      `);
    }

    await pool.execute(`
      INSERT INTO actividades (usuario_id, tipo, descripcion, entidad_tipo, entidad_id)
      VALUES (?, ?, ?, ?, ?)
    `, [usuarioId, tipo, descripcion, entidadTipo, entidadId]);
  } catch (error) {
    console.error('Error al registrar actividad:', error);
  }
};

module.exports = {
  getAdminStats,
  getRecentActivity,
  getTopClients,
  getChartsData,
  getFinancialSummary,
  logActivity
};