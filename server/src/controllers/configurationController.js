const { pool } = require('../config/db.js');
const { logActivity } = require('./dashboardController.js');

// GET /api/configuration/security - Obtener configuración de seguridad
exports.getSecurityConfiguration = async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT * FROM configuracion_seguridad WHERE id = 1'
    );
    
    if (rows.length === 0) {
      // Si no existe configuración, crear una por defecto
      const defaultConfig = {
        password_min_length: 8,
        password_require_uppercase: 1,
        password_require_lowercase: 1,
        password_require_numbers: 1,
        password_require_symbols: 1,
        password_expiration_days: 90,
        password_history_count: 5,
        login_max_attempts: 5,
        login_lockout_minutes: 30,
        session_timeout_minutes: 60,
        session_max_concurrent: 3,
        two_factor_enabled: 0,
        ip_whitelist: null,
        ip_blacklist: null
      };
      
      const [result] = await pool.execute(
        `INSERT INTO configuracion_seguridad (
          password_min_length, password_require_uppercase, password_require_lowercase,
          password_require_numbers, password_require_symbols, password_expiration_days,
          password_history_count, login_max_attempts, login_lockout_minutes,
          session_timeout_minutes, session_max_concurrent, two_factor_enabled,
          ip_whitelist, ip_blacklist
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          defaultConfig.password_min_length,
          defaultConfig.password_require_uppercase,
          defaultConfig.password_require_lowercase,
          defaultConfig.password_require_numbers,
          defaultConfig.password_require_symbols,
          defaultConfig.password_expiration_days,
          defaultConfig.password_history_count,
          defaultConfig.login_max_attempts,
          defaultConfig.login_lockout_minutes,
          defaultConfig.session_timeout_minutes,
          defaultConfig.session_max_concurrent,
          defaultConfig.two_factor_enabled,
          defaultConfig.ip_whitelist,
          defaultConfig.ip_blacklist
        ]
      );
      
      const securityConfig = { id: result.insertId, ...defaultConfig };
      
      // Registrar actividad
      await logActivity(
        'security_config_created',
        `Admin ${req.user.nombre} creó configuración de seguridad por defecto`,
        req.user.id,
        result.insertId,
        'admin'
      );
      
      return res.json(securityConfig);
    }
    
    const securityConfig = rows[0];
    
    // Registrar actividad
    await logActivity(
      'security_config_view',
      `Admin ${req.user.nombre} consultó configuración de seguridad`,
      req.user.id,
      securityConfig.id,
      'admin'
    );
    
    res.json(securityConfig);
  } catch (error) {
    console.error('Error obteniendo configuración de seguridad:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/configuration/security - Actualizar configuración de seguridad
exports.updateSecurityConfiguration = async (req, res) => {
  try {
    const {
      password_min_length,
      password_require_uppercase,
      password_require_lowercase,
      password_require_numbers,
      password_require_symbols,
      password_expiration_days,
      password_history_count,
      login_max_attempts,
      login_lockout_minutes,
      session_timeout_minutes,
      session_max_concurrent,
      two_factor_enabled,
      ip_whitelist,
      ip_blacklist
    } = req.body;
    
    // Validaciones básicas
    if (password_min_length < 4 || password_min_length > 50) {
      return res.status(400).json({ 
        message: 'La longitud mínima de contraseña debe estar entre 4 y 50 caracteres' 
      });
    }
    
    if (login_max_attempts < 1 || login_max_attempts > 20) {
      return res.status(400).json({ 
        message: 'Los intentos máximos de login deben estar entre 1 y 20' 
      });
    }
    
    if (session_timeout_minutes < 5 || session_timeout_minutes > 480) {
      return res.status(400).json({ 
        message: 'El timeout de sesión debe estar entre 5 y 480 minutos' 
      });
    }
    
    const [result] = await pool.execute(
      `UPDATE configuracion_seguridad SET 
       password_min_length = ?, password_require_uppercase = ?, password_require_lowercase = ?,
       password_require_numbers = ?, password_require_symbols = ?, password_expiration_days = ?,
       password_history_count = ?, login_max_attempts = ?, login_lockout_minutes = ?,
       session_timeout_minutes = ?, session_max_concurrent = ?, two_factor_enabled = ?,
       ip_whitelist = ?, ip_blacklist = ?, updated_at = NOW()
       WHERE id = 1`,
      [
        password_min_length,
        password_require_uppercase ? 1 : 0,
        password_require_lowercase ? 1 : 0,
        password_require_numbers ? 1 : 0,
        password_require_symbols ? 1 : 0,
        password_expiration_days,
        password_history_count,
        login_max_attempts,
        login_lockout_minutes,
        session_timeout_minutes,
        session_max_concurrent,
        two_factor_enabled ? 1 : 0,
        ip_whitelist || null,
        ip_blacklist || null
      ]
    );
    
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Configuración de seguridad no encontrada' });
    }
    
    // Obtener la configuración actualizada
    const [updatedRows] = await pool.execute(
      'SELECT * FROM configuracion_seguridad WHERE id = 1'
    );
    
    // Registrar actividad
    await logActivity(
      'security_config_update',
      `Admin ${req.user.nombre} actualizó configuración de seguridad`,
      req.user.id,
      1,
      'admin'
    );
    
    res.json({
      message: 'Configuración de seguridad actualizada exitosamente',
      configuration: updatedRows[0]
    });
  } catch (error) {
    console.error('Error actualizando configuración de seguridad:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/configuration/general - Obtener configuración general del sistema
exports.getGeneralConfiguration = async (req, res) => {
  try {
    // Obtener configuración general de la tabla configuracion
    const [configRows] = await pool.execute(
      'SELECT nombre_campo, valor FROM configuracion WHERE activo = 1'
    );
    
    // Convertir a objeto clave-valor
    const generalConfig = {};
    configRows.forEach(row => {
      generalConfig[row.nombre_campo] = row.valor;
    });
    
    // Registrar actividad
    await logActivity(
      'general_config_view',
      `Admin ${req.user.nombre} consultó configuración general`,
      req.user.id,
      req.user.id,
      'admin'
    );
    
    res.json(generalConfig);
  } catch (error) {
    console.error('Error obteniendo configuración general:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/configuration/general - Actualizar configuración general
exports.updateGeneralConfiguration = async (req, res) => {
  try {
    const configData = req.body;
    const updates = [];
    
    // Procesar cada campo de configuración
    for (const [campo, valor] of Object.entries(configData)) {
      if (valor !== undefined && valor !== null) {
        updates.push(
          pool.execute(
            `INSERT INTO configuracion (nombre_campo, valor, activo) 
             VALUES (?, ?, 1) 
             ON DUPLICATE KEY UPDATE valor = ?, updated_at = NOW()`,
            [campo, valor, valor]
          )
        );
      }
    }
    
    // Ejecutar todas las actualizaciones
    await Promise.all(updates);
    
    // Registrar actividad
    await logActivity(
      'general_config_update',
      `Admin ${req.user.nombre} actualizó configuración general (${Object.keys(configData).length} campos)`,
      req.user.id,
      req.user.id,
      'admin'
    );
    
    res.json({
      message: 'Configuración general actualizada exitosamente',
      updatedFields: Object.keys(configData).length
    });
  } catch (error) {
    console.error('Error actualizando configuración general:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};