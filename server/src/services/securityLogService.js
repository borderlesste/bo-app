const { pool, executeWithRetry } = require('../config/db.js');

class SecurityLogService {
  
  // Función principal para registrar eventos de seguridad
  async logSecurityEvent(eventData) {
    try {
      const {
        usuarioId = null,
        tipo,
        emailIntento = null,
        ip,
        userAgent = null,
        dispositivo = null,
        ubicacion = null,
        detalles = null
      } = eventData;

      // Validar que el tipo sea válido
      const tiposValidos = [
        'login_exitoso', 'login_fallido', 'logout', 'cambio_password', 
        'reseteo_password', 'bloqueo_cuenta', 'desbloqueo_cuenta', 'acceso_denegado'
      ];

      if (!tiposValidos.includes(tipo)) {
        throw new Error(`Tipo de evento no válido: ${tipo}`);
      }

      // Detectar dispositivo basado en user agent si no se proporciona
      const deviceInfo = dispositivo || this.detectDevice(userAgent);
      
      // Preparar detalles como JSON si es un objeto
      const detallesJson = typeof detalles === 'object' ? JSON.stringify(detalles) : detalles;

      try {
        const [result] = await executeWithRetry(
          `INSERT INTO seguridad_log 
           (usuario_id, tipo, email_intento, ip, user_agent, dispositivo, ubicacion, detalles)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [usuarioId, tipo, emailIntento, ip, userAgent, deviceInfo, ubicacion, detallesJson]
        );

        console.log(`🔒 Evento de seguridad registrado: ${tipo} - IP: ${ip} - Usuario: ${usuarioId || emailIntento}`);
        return result && result.insertId ? result.insertId : null;
      } catch (insertError) {
        // No dejar que un fallo en el logging de seguridad rompa la petición
        console.error('⚠️ Error registrando evento de seguridad (no crítico):', insertError.code || insertError.message);
        return null;
      }
    } catch (error) {
      // Catch at top-level in case of unexpected issues; do not throw to avoid breaking requests
      console.error('❌ Error interno registrando evento de seguridad (no crítico):', error);
      return null;
    }
  }

  // Login exitoso
  async logSuccessfulLogin(usuarioId, email, ip, userAgent, detalles = {}) {
    return await this.logSecurityEvent({
      usuarioId,
      tipo: 'login_exitoso',
      emailIntento: email,
      ip,
      userAgent,
      detalles: {
        ...detalles,
        timestamp: new Date().toISOString(),
        success: true
      }
    });
  }

  // Login fallido
  async logFailedLogin(email, ip, userAgent, razon = 'credenciales_invalidas') {
    return await this.logSecurityEvent({
      usuarioId: null,
      tipo: 'login_fallido',
      emailIntento: email,
      ip,
      userAgent,
      detalles: {
        razon,
        timestamp: new Date().toISOString(),
        success: false
      }
    });
  }

  // Logout
  async logLogout(usuarioId, email, ip, userAgent) {
    return await this.logSecurityEvent({
      usuarioId,
      tipo: 'logout',
      emailIntento: email,
      ip,
      userAgent,
      detalles: {
        timestamp: new Date().toISOString(),
        accion: 'logout_manual'
      }
    });
  }

  // Cambio de contraseña
  async logPasswordChange(usuarioId, email, ip, userAgent, tipo = 'cambio_voluntario') {
    return await this.logSecurityEvent({
      usuarioId,
      tipo: 'cambio_password',
      emailIntento: email,
      ip,
      userAgent,
      detalles: {
        tipo_cambio: tipo,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Acceso denegado
  async logAccessDenied(usuarioId, email, ip, userAgent, recurso, razon) {
    return await this.logSecurityEvent({
      usuarioId,
      tipo: 'acceso_denegado',
      emailIntento: email,
      ip,
      userAgent,
      detalles: {
        recurso_solicitado: recurso,
        razon_denegacion: razon,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Bloqueo de cuenta
  async logAccountLockout(usuarioId, email, ip, userAgent, razon = 'intentos_fallidos') {
    return await this.logSecurityEvent({
      usuarioId,
      tipo: 'bloqueo_cuenta',
      emailIntento: email,
      ip,
      userAgent,
      detalles: {
        razon_bloqueo: razon,
        timestamp: new Date().toISOString(),
        automatico: true
      }
    });
  }

  // Desbloqueo de cuenta
  async logAccountUnlock(usuarioId, email, ip, userAgent, desbloqueadoPor) {
    return await this.logSecurityEvent({
      usuarioId,
      tipo: 'desbloqueo_cuenta',
      emailIntento: email,
      ip,
      userAgent,
      detalles: {
        desbloqueado_por: desbloqueadoPor,
        timestamp: new Date().toISOString()
      }
    });
  }

  // Detectar tipo de dispositivo basado en user agent
  detectDevice(userAgent) {
    if (!userAgent) return 'Desconocido';

    const ua = userAgent.toLowerCase();
    
    if (ua.includes('mobile') || ua.includes('android') || ua.includes('iphone')) {
      return 'Móvil';
    }
    if (ua.includes('tablet') || ua.includes('ipad')) {
      return 'Tablet';
    }
    if (ua.includes('windows') || ua.includes('macintosh') || ua.includes('linux')) {
      return 'Escritorio';
    }
    if (ua.includes('bot') || ua.includes('crawler') || ua.includes('spider')) {
      return 'Bot';
    }
    
    return 'Desconocido';
  }

  // Obtener intentos fallidos recientes para un email
  async getRecentFailedAttempts(email, minutosAtras = 15) {
    try {
      try {
        const [rows] = await executeWithRetry(
          `SELECT COUNT(*) as intentos 
           FROM seguridad_log 
           WHERE email_intento = ? 
           AND tipo = 'login_fallido' 
           AND created_at > DATE_SUB(NOW(), INTERVAL ? MINUTE)`,
          [email, minutosAtras]
        );
        return rows[0].intentos;
      } catch (error) {
        console.error('Error obteniendo intentos fallidos (no-crítico):', error && error.code ? error.code : error.message);
        return 0;
      }
    } catch (error) {
      console.error('Error obteniendo intentos fallidos:', error);
      return 0;
    }
  }

  // Verificar si una cuenta está bloqueada
  async isAccountLocked(email) {
    try {
      // 1. Verificar estado del usuario en la tabla usuarios
      const [userRows] = await pool.execute(
        'SELECT estado, bloqueado_hasta FROM usuarios WHERE email = ?',
        [email]
      );
      
      if (userRows.length === 0) return false;
      
      const user = userRows[0];
      
      // Si el usuario está marcado como bloqueado en la tabla usuarios
      if (user.estado === 'bloqueado') {
        return true;
      }
      
      // Si hay una fecha de bloqueo temporal y aún no ha expirado
      if (user.bloqueado_hasta && new Date(user.bloqueado_hasta) > new Date()) {
        return true;
      }
      
      // 2. Verificar bloqueos en el log de seguridad
      try {
        const [logRows] = await executeWithRetry(
          `SELECT * FROM seguridad_log 
           WHERE email_intento = ? 
           AND tipo IN ('bloqueo_cuenta', 'desbloqueo_cuenta')
           order BY created_at DESC 
           LIMIT 1`,
          [email]
        );
        
        if (!logRows || logRows.length === 0) return false;
        
        const lastLogEvent = logRows[0];
        
        // If the last event is an unlock, no lock exists
        if (lastLogEvent.tipo === 'desbloqueo_cuenta') {
          return false;
        }
        
        // If it's a lock event, check expiry
        if (lastLogEvent.tipo === 'bloqueo_cuenta') {
          const detalles = JSON.parse(lastLogEvent.detalles || '{}');
          if (detalles.automatico) {
            const tiempoBloqueo = new Date(lastLogEvent.created_at);
            const tiempoExpiracion = new Date(tiempoBloqueo.getTime() + 30 * 60 * 1000); // 30 minutos
            
            // If expired, auto-unlock
            if (new Date() > tiempoExpiracion) {
              await this.logAccountUnlock(null, email, '127.0.0.1', 'Sistema', 'Bloqueo automatico expirado');
              return false;
            }
          }
          
          return true;
        }

        return false;
      } catch (error) {
        console.error('Error verificando bloqueo de cuenta (no-crítico):', error && error.code ? error.code : error.message);
        return false;
      }      
      // Si el último evento es un desbloqueo, no está bloqueado
      if (lastLogEvent.tipo === 'desbloqueo_cuenta') {
        return false;
      }
      
      // Si es un bloqueo automático por intentos fallidos, verificar si ha expirado (30 minutos)
      if (lastLogEvent.tipo === 'bloqueo_cuenta') {
        const detalles = JSON.parse(lastLogEvent.detalles || '{}');
        if (detalles.automatico) {
          const tiempoBloqueo = new Date(lastLogEvent.created_at);
          const tiempoExpiracion = new Date(tiempoBloqueo.getTime() + 30 * 60 * 1000); // 30 minutos
          
          // Si el bloqueo automático ha expirado, desbloquear automáticamente
          if (new Date() > tiempoExpiracion) {
            await this.logAccountUnlock(null, email, '127.0.0.1', 'Sistema', 'Bloqueo automático expirado');
            return false;
          }
        }
        
        // Es un bloqueo manual o automático vigente
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error verificando bloqueo de cuenta:', error);
      return false;
    }
  }

  // Obtener logs de seguridad con filtros
  async getSecurityLogs(filtros = {}) {
    try {
      const {
        limite = 100,
        offset = 0,
        tipo = null,
        usuarioId = null,
        email = null,
        ip = null,
        fechaDesde = null,
        fechaHasta = null
      } = filtros;

      let query = `
        SELECT sl.*, u.nombre, u.email as usuario_email
        FROM seguridad_log sl
        LEFT JOIN usuarios u ON sl.usuario_id = u.id
        WHERE 1=1
      `;
      const params = [];

      if (tipo) {
        query += ' AND sl.tipo = ?';
        params.push(tipo);
      }

      if (usuarioId) {
        query += ' AND sl.usuario_id = ?';
        params.push(usuarioId);
      }

      if (email) {
        query += ' AND sl.email_intento LIKE ?';
        params.push(`%${email}%`);
      }

      if (ip) {
        query += ' AND sl.ip = ?';
        params.push(ip);
      }

      if (fechaDesde) {
        query += ' AND sl.created_at >= ?';
        params.push(fechaDesde);
      }

      if (fechaHasta) {
        query += ' AND sl.created_at <= ?';
        params.push(fechaHasta);
      }

      query += ' order BY sl.created_at DESC LIMIT ? OFFSET ?';
      params.push(limite, offset);

      const [rows] = await pool.execute(query, params);
      return rows;
    } catch (error) {
      console.error('Error obteniendo logs de seguridad:', error);
      throw error;
    }
  }

  // Obtener estadísticas de seguridad
  async getSecurityStats(diasAtras = 30) {
    try {
      const [stats] = await pool.execute(
        `SELECT 
          tipo,
          COUNT(*) as total,
          DATE(created_at) as fecha
         FROM seguridad_log 
         WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY tipo, DATE(created_at)
         order BY fecha DESC, tipo`,
        [diasAtras]
      );

      const [summary] = await pool.execute(
        `SELECT 
          tipo,
          COUNT(*) as total
         FROM seguridad_log 
         WHERE created_at > DATE_SUB(NOW(), INTERVAL ? DAY)
         GROUP BY tipo`,
        [diasAtras]
      );

      return {
        detalle_diario: stats,
        resumen: summary
      };
    } catch (error) {
      console.error('Error obteniendo estadísticas de seguridad:', error);
      throw error;
    }
  }

  // Extraer IP del request
  static extractIP(req) {
    return req.headers['x-forwarded-for'] || 
           req.headers['x-real-ip'] || 
           req.connection.remoteAddress || 
           req.socket.remoteAddress ||
           (req.connection.socket ? req.connection.socket.remoteAddress : null) ||
           '127.0.0.1';
  }

  // Extraer User Agent del request
  static extractUserAgent(req) {
    return req.headers['user-agent'] || 'Desconocido';
  }
}

module.exports = new SecurityLogService();