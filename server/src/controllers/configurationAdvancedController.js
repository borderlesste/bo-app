const { validationResult } = require('express-validator');
const { Configuracion } = require('../models');

// Get all configuration
exports.getConfiguration = async (req, res) => {
  try {
    // Only admins can view configuration
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver la configuración'
      });
    }

    const config = await Configuracion.get();
    
    res.json({
      success: true,
      data: config
    });
  } catch (error) {
    console.error('Error getting configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración'
    });
  }
};

// Update configuration
exports.updateConfiguration = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    // Only admins can update configuration
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar la configuración'
      });
    }

    const updatedConfig = await Configuracion.update(req.body);
    
    res.json({
      success: true,
      message: 'Configuración actualizada correctamente',
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating configuration:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración'
    });
  }
};

// Get company information
exports.getCompanyInfo = async (req, res) => {
  try {
    const companyInfo = await Configuracion.getCompanyInfo();
    
    res.json({
      success: true,
      data: companyInfo
    });
  } catch (error) {
    console.error('Error getting company info:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener información de la empresa'
    });
  }
};

// Update company information
exports.updateCompanyInfo = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    // Only admins can update company info
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar la información de la empresa'
      });
    }

    const updatedConfig = await Configuracion.updateCompanyInfo(req.body);
    
    res.json({
      success: true,
      message: 'Información de empresa actualizada correctamente',
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating company info:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar información de empresa'
    });
  }
};

// Get theme settings
exports.getThemeSettings = async (req, res) => {
  try {
    const themeSettings = await Configuracion.getThemeSettings();
    
    res.json({
      success: true,
      data: themeSettings
    });
  } catch (error) {
    console.error('Error getting theme settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración de tema'
    });
  }
};

// Update theme settings
exports.updateThemeSettings = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    const updatedConfig = await Configuracion.updateThemeSettings(req.body);
    
    res.json({
      success: true,
      message: 'Configuración de tema actualizada correctamente',
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating theme settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración de tema'
    });
  }
};

// Get security settings
exports.getSecuritySettings = async (req, res) => {
  try {
    // Only admins can view security settings
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver la configuración de seguridad'
      });
    }

    const securitySettings = await Configuracion.getSecuritySettings();
    
    res.json({
      success: true,
      data: securitySettings
    });
  } catch (error) {
    console.error('Error getting security settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración de seguridad'
    });
  }
};

// Update security settings
exports.updateSecuritySettings = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    // Only admins can update security settings
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para modificar la configuración de seguridad'
      });
    }

    const updatedConfig = await Configuracion.updateSecuritySettings(req.body);
    
    res.json({
      success: true,
      message: 'Configuración de seguridad actualizada correctamente',
      data: updatedConfig
    });
  } catch (error) {
    console.error('Error updating security settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar configuración de seguridad'
    });
  }
};

// Get business settings
exports.getBusinessSettings = async (req, res) => {
  try {
    const businessSettings = await Configuracion.getBusinessSettings();
    
    res.json({
      success: true,
      data: businessSettings
    });
  } catch (error) {
    console.error('Error getting business settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener configuración de negocio'
    });
  }
};