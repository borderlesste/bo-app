const securityLogService = require('../services/securityLogService.js');
const { logActivity } = require('./dashboardController.js');

// GET /api/security/logs - Obtener logs de seguridad con filtros
exports.getSecurityLogs = async (req, res) => {
  try {
    const {
      limite = 50,
      offset = 0,
      tipo,
      usuarioId,
      email,
      ip,
      fechaDesde,
      fechaHasta
    } = req.query;

    const filtros = {
      limite: parseInt(limite),
      offset: parseInt(offset),
      tipo,
      usuarioId: usuarioId ? parseInt(usuarioId) : null,
      email,
      ip,
      fechaDesde,
      fechaHasta
    };

    const logs = await securityLogService.getSecurityLogs(filtros);
    
    // Registrar consulta de logs de seguridad
    await logActivity(
      'security_log_view',
      `Admin ${req.user.nombre} consultó logs de seguridad`,
      req.user.id,
      req.user.id,
      'admin'
    );
    
    res.json({
      logs,
      total: logs.length,
      filtros: filtros
    });
  } catch (error) {
    console.error('Error obteniendo logs de seguridad:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/security/stats - Obtener estadísticas de seguridad
exports.getSecurityStats = async (req, res) => {
  try {
    const { dias = 30 } = req.query;
    const stats = await securityLogService.getSecurityStats(parseInt(dias));
    
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas de seguridad:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/security/summary - Obtener resumen de seguridad
exports.getSecuritySummary = async (req, res) => {
  try {
    const { pool } = require('../config/db.js');
    
    // Estadísticas de los últimos 7 días
    const [recentStats] = await pool.execute(`
      SELECT 
        tipo,
        COUNT(*) as count,
        DATE(created_at) as fecha
      FROM seguridad_log 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
      GROUP BY tipo, DATE(created_at)
      ORDER BY fecha DESC
    `);

    // Top IPs con más actividad sospechosa
    const [topIPs] = await pool.execute(`
      SELECT 
        ip,
        COUNT(*) as total_eventos,
        SUM(CASE WHEN tipo = 'login_fallido' THEN 1 ELSE 0 END) as login_fallidos,
        SUM(CASE WHEN tipo = 'acceso_denegado' THEN 1 ELSE 0 END) as accesos_denegados
      FROM seguridad_log 
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 24 HOUR)
      GROUP BY ip
      HAVING login_fallidos > 0 OR accesos_denegados > 0
      ORDER BY total_eventos DESC
      LIMIT 10
    `);

    // Cuentas bloqueadas actualmente
    const [blockedAccounts] = await pool.execute(`
      SELECT DISTINCT 
        sl.email_intento,
        sl.created_at as fecha_bloqueo,
        u.nombre,
        u.id as usuario_id
      FROM seguridad_log sl
      LEFT JOIN usuarios u ON sl.email_intento = u.email
      WHERE sl.tipo = 'bloqueo_cuenta'
      AND NOT EXISTS (
        SELECT 1 FROM seguridad_log sl2 
        WHERE sl2.email_intento = sl.email_intento 
        AND sl2.tipo = 'desbloqueo_cuenta' 
        AND sl2.created_at > sl.created_at
      )
      ORDER BY sl.created_at DESC
    `);

    // Alertas de seguridad (actividad sospechosa reciente)
    const [alerts] = await pool.execute(`
      SELECT 
        'login_fallidos_multiples' as tipo_alerta,
        email_intento as detalle,
        COUNT(*) as count,
        MAX(created_at) as ultimo_evento
      FROM seguridad_log 
      WHERE tipo = 'login_fallido' 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      GROUP BY email_intento
      HAVING count >= 3
      
      UNION ALL
      
      SELECT 
        'accesos_denegados_multiples' as tipo_alerta,
        CONCAT(ip, ' - ', COALESCE(email_intento, 'Sin sesión')) as detalle,
        COUNT(*) as count,
        MAX(created_at) as ultimo_evento
      FROM seguridad_log 
      WHERE tipo = 'acceso_denegado' 
      AND created_at >= DATE_SUB(NOW(), INTERVAL 1 HOUR)
      GROUP BY ip, email_intento
      HAVING count >= 5
      
      ORDER BY ultimo_evento DESC
    `);

    res.json({
      estadisticas_recientes: recentStats,
      ips_sospechosas: topIPs,
      cuentas_bloqueadas: blockedAccounts,
      alertas: alerts,
      resumen: {
        total_cuentas_bloqueadas: blockedAccounts.length,
        total_ips_sospechosas: topIPs.length,
        total_alertas: alerts.length
      }
    });
  } catch (error) {
    console.error('Error obteniendo resumen de seguridad:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/security/unlock/:email - Desbloquear cuenta por email
exports.unlockAccount = async (req, res) => {
  try {
    const { email } = req.params;
    const ip = securityLogService.constructor.extractIP(req);
    const userAgent = securityLogService.constructor.extractUserAgent(req);
    
    // Verificar si la cuenta está realmente bloqueada
    const isLocked = await securityLogService.isAccountLocked(email);
    if (!isLocked) {
      return res.status(400).json({ message: 'La cuenta no está bloqueada' });
    }
    
    // Buscar el usuario
    const { pool } = require('../config/db.js');
    const [userRows] = await pool.execute('SELECT id, nombre FROM usuarios WHERE email = ?', [email]);
    
    if (userRows.length === 0) {
      return res.status(404).json({ message: 'Usuario no encontrado' });
    }
    
    const user = userRows[0];
    
    // Registrar desbloqueo
    await securityLogService.logAccountUnlock(
      user.id,
      email,
      ip,
      userAgent,
      req.user.nombre
    );
    
    // Registrar actividad de administración
    await logActivity(
      'account_unlock',
      `Admin ${req.user.nombre} desbloqueó cuenta de ${user.nombre} (${email})`,
      req.user.id,
      user.id,
      'admin'
    );
    
    res.json({
      message: 'Cuenta desbloqueada exitosamente',
      usuario: {
        id: user.id,
        nombre: user.nombre,
        email: email
      },
      desbloqueado_por: req.user.nombre
    });
  } catch (error) {
    console.error('Error desbloqueando cuenta:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};