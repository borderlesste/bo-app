const { pool } = require('../config/db.js');
const { validationResult } = require('express-validator');

/**
 * UNIFIED CONFIGURATION CONTROLLER
 * Consolidates config.js, configuration.js, and configurationAdvanced.js
 * Provides single point for all configuration management
 */

// Get general configuration
const getGeneralConfig = async (req, res) => {
  try {
    const [config] = await pool.execute(
      'SELECT * FROM configuracion WHERE id = 1 LIMIT 1'
    );

    if (config.length === 0) {
      // Create default configuration if none exists
      await pool.execute(`
        INSERT INTO configuracion (id, company_name, company_email, created_at, updated_at) 
        VALUES (1, 'Borderless Techno', 'info@borderlesstechno.com', NOW(), NOW())
      `);
      
      const [newConfig] = await pool.execute(
        'SELECT * FROM configuracion WHERE id = 1'
      );
      
      return res.json({
        success: true,
        data: newConfig[0]
      });
    }

    res.json({
      success: true,
      data: config[0]
    });
  } catch (error) {
    console.error('Error getting configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Update general configuration
const updateGeneralConfig = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      company_name,
      company_description,
      company_slogan,
      company_email,
      company_phone,
      company_whatsapp,
      company_address,
      company_website,
      company_timezone,
      company_language,
      company_currency,
      company_rfc,
      company_regimen_fiscal
    } = req.body;

    // Check if configuration exists
    const [existingConfig] = await pool.execute(
      'SELECT id FROM configuracion WHERE id = 1'
    );

    if (existingConfig.length === 0) {
      // Insert new configuration
      await pool.execute(`
        INSERT INTO configuracion 
        (id, company_name, company_description, company_slogan, company_email, 
         company_phone, company_whatsapp, company_address, company_website,
         company_timezone, company_language, company_currency, company_rfc,
         company_regimen_fiscal, created_at, updated_at) 
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `, [
        company_name, company_description, company_slogan, company_email,
        company_phone, company_whatsapp, company_address, company_website,
        company_timezone, company_language, company_currency, company_rfc,
        company_regimen_fiscal
      ]);
    } else {
      // Update existing configuration
      await pool.execute(`
        UPDATE configuracion 
        SET company_name = ?, company_description = ?, company_slogan = ?, 
            company_email = ?, company_phone = ?, company_whatsapp = ?, 
            company_address = ?, company_website = ?, company_timezone = ?, 
            company_language = ?, company_currency = ?, company_rfc = ?,
            company_regimen_fiscal = ?, updated_at = NOW()
        WHERE id = 1
      `, [
        company_name, company_description, company_slogan, company_email,
        company_phone, company_whatsapp, company_address, company_website,
        company_timezone, company_language, company_currency, company_rfc,
        company_regimen_fiscal
      ]);
    }

    res.json({
      success: true,
      message: 'Configuración actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Get theme configuration
const getThemeConfig = async (req, res) => {
  try {
    const [config] = await pool.execute(
      `SELECT theme_mode, theme_primary_color, theme_secondary_color, 
              theme_compact_mode, theme_animations 
       FROM configuracion WHERE id = 1`
    );

    res.json({
      success: true,
      data: config[0] || {
        theme_mode: 'light',
        theme_primary_color: '#7c3aed',
        theme_secondary_color: '#06b6d4',
        theme_compact_mode: false,
        theme_animations: true
      }
    });
  } catch (error) {
    console.error('Error getting theme configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Update theme configuration
const updateThemeConfig = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const {
      theme_mode,
      theme_primary_color,
      theme_secondary_color,
      theme_compact_mode,
      theme_animations
    } = req.body;

    await pool.execute(`
      UPDATE configuracion 
      SET theme_mode = ?, theme_primary_color = ?, theme_secondary_color = ?, 
          theme_compact_mode = ?, theme_animations = ?, updated_at = NOW()
      WHERE id = 1
    `, [
      theme_mode, theme_primary_color, theme_secondary_color,
      theme_compact_mode, theme_animations
    ]);

    res.json({
      success: true,
      message: 'Configuración de tema actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating theme configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Get security configuration
const getSecurityConfig = async (req, res) => {
  try {
    const [config] = await pool.execute(
      `SELECT password_min_length, password_require_uppercase, password_require_lowercase,
              password_require_numbers, password_require_symbols, password_expiration_days,
              password_history_count, login_max_attempts, login_lockout_minutes,
              session_timeout_minutes, session_max_concurrent, two_factor_enabled
       FROM configuracion WHERE id = 1`
    );

    res.json({
      success: true,
      data: config[0] || {
        password_min_length: 8,
        password_require_uppercase: true,
        password_require_lowercase: true,
        password_require_numbers: true,
        password_require_symbols: true,
        password_expiration_days: 90,
        password_history_count: 5,
        login_max_attempts: 5,
        login_lockout_minutes: 30,
        session_timeout_minutes: 60,
        session_max_concurrent: 3,
        two_factor_enabled: false
      }
    });
  } catch (error) {
    console.error('Error getting security configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Update security configuration
const updateSecurityConfig = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

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

    await pool.execute(`
      UPDATE configuracion 
      SET password_min_length = ?, password_require_uppercase = ?, 
          password_require_lowercase = ?, password_require_numbers = ?,
          password_require_symbols = ?, password_expiration_days = ?,
          password_history_count = ?, login_max_attempts = ?,
          login_lockout_minutes = ?, session_timeout_minutes = ?,
          session_max_concurrent = ?, two_factor_enabled = ?,
          ip_whitelist = ?, ip_blacklist = ?, updated_at = NOW()
      WHERE id = 1
    `, [
      password_min_length, password_require_uppercase, password_require_lowercase,
      password_require_numbers, password_require_symbols, password_expiration_days,
      password_history_count, login_max_attempts, login_lockout_minutes,
      session_timeout_minutes, session_max_concurrent, two_factor_enabled,
      ip_whitelist, ip_blacklist
    ]);

    res.json({
      success: true,
      message: 'Configuración de seguridad actualizada exitosamente'
    });
  } catch (error) {
    console.error('Error updating security configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Get payment methods configuration
const getPaymentConfig = async (req, res) => {
  try {
    const [paymentMethods] = await pool.execute(
      'SELECT * FROM configuracion_pagos ORDER BY orden, nombre'
    );

    res.json({
      success: true,
      data: paymentMethods
    });
  } catch (error) {
    console.error('Error getting payment configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Update payment method configuration
const updatePaymentConfig = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { payment_methods } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      // Update each payment method
      for (const method of payment_methods) {
        if (method.id) {
          // Update existing
          await connection.execute(`
            UPDATE configuracion_pagos 
            SET enabled = ?, configuracion = ?, instrucciones = ?, 
                comision_porcentaje = ?, comision_fija = ?, orden = ?, updated_at = NOW()
            WHERE id = ?
          `, [
            method.enabled, JSON.stringify(method.configuracion || {}),
            method.instrucciones, method.comision_porcentaje || 0,
            method.comision_fija || 0, method.orden || 0, method.id
          ]);
        } else {
          // Insert new
          await connection.execute(`
            INSERT INTO configuracion_pagos 
            (metodo, nombre, descripcion, enabled, es_online, configuracion, 
             instrucciones, comision_porcentaje, comision_fija, orden, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            method.metodo, method.nombre, method.descripcion,
            method.enabled, method.es_online, JSON.stringify(method.configuracion || {}),
            method.instrucciones, method.comision_porcentaje || 0,
            method.comision_fija || 0, method.orden || 0
          ]);
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Configuración de pagos actualizada exitosamente'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating payment configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Get notification configuration
const getNotificationConfig = async (req, res) => {
  try {
    const [notifications] = await pool.execute(
      'SELECT * FROM configuracion_notificaciones ORDER BY tipo_evento'
    );

    res.json({
      success: true,
      data: notifications
    });
  } catch (error) {
    console.error('Error getting notification configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Update notification configuration
const updateNotificationConfig = async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        errors: errors.array()
      });
    }

    const { notifications } = req.body;

    const connection = await pool.getConnection();
    await connection.beginTransaction();

    try {
      for (const notification of notifications) {
        if (notification.id) {
          // Update existing
          await connection.execute(`
            UPDATE configuracion_notificaciones 
            SET email_enabled = ?, sms_enabled = ?, push_enabled = ?, 
                webhook_enabled = ?, roles_notificar = ?, plantilla_email = ?, 
                plantilla_sms = ?, updated_at = NOW()
            WHERE id = ?
          `, [
            notification.email_enabled, notification.sms_enabled,
            notification.push_enabled, notification.webhook_enabled,
            notification.roles_notificar, notification.plantilla_email,
            notification.plantilla_sms, notification.id
          ]);
        } else {
          // Insert new
          await connection.execute(`
            INSERT INTO configuracion_notificaciones 
            (tipo_evento, nombre, descripcion, email_enabled, sms_enabled, 
             push_enabled, webhook_enabled, roles_notificar, plantilla_email, 
             plantilla_sms, created_at, updated_at) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
          `, [
            notification.tipo_evento, notification.nombre, notification.descripcion,
            notification.email_enabled, notification.sms_enabled,
            notification.push_enabled, notification.webhook_enabled,
            notification.roles_notificar, notification.plantilla_email,
            notification.plantilla_sms
          ]);
        }
      }

      await connection.commit();

      res.json({
        success: true,
        message: 'Configuración de notificaciones actualizada exitosamente'
      });

    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }

  } catch (error) {
    console.error('Error updating notification configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

// Get complete configuration (all sections)
const getCompleteConfig = async (req, res) => {
  try {
    const [generalConfig] = await pool.execute(
      'SELECT * FROM configuracion WHERE id = 1'
    );
    
    const [paymentMethods] = await pool.execute(
      'SELECT * FROM configuracion_pagos ORDER BY orden, nombre'
    );
    
    const [notifications] = await pool.execute(
      'SELECT * FROM configuracion_notificaciones ORDER BY tipo_evento'
    );

    res.json({
      success: true,
      data: {
        general: generalConfig[0] || {},
        payment_methods: paymentMethods,
        notifications: notifications
      }
    });
  } catch (error) {
    console.error('Error getting complete configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
};

module.exports = {
  getGeneralConfig,
  updateGeneralConfig,
  getThemeConfig,
  updateThemeConfig,
  getSecurityConfig,
  updateSecurityConfig,
  getPaymentConfig,
  updatePaymentConfig,
  getNotificationConfig,
  updateNotificationConfig,
  getCompleteConfig
};