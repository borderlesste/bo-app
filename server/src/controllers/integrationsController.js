const integrationsService = require('../services/integrationsService.js');
const { logActivity } = require('./dashboardController.js');

// GET /api/integrations - Obtener todas las integraciones
exports.getIntegrations = async (req, res) => {
  try {
    const integrations = await integrationsService.getAllIntegrations();
    
    // Registrar actividad
    await logActivity(
      'integration_view',
      `Admin ${req.user.nombre} consultó integraciones`,
      req.user.id,
      req.user.id,
      'admin'
    );
    
    res.json(integrations);
  } catch (error) {
    console.error('Error obteniendo integraciones:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// GET /api/integrations/:id - Obtener integración específica
exports.getIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    const integration = await integrationsService.getIntegrationById(id);
    
    if (!integration) {
      return res.status(404).json({ message: 'Integración no encontrada' });
    }
    
    res.json(integration);
  } catch (error) {
    console.error('Error obteniendo integración:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/integrations - Crear nueva integración manual
exports.createIntegration = async (req, res) => {
  try {
    const { tipo, proveedor, nombre, descripcion, enabled, configuracion } = req.body;
    
    // Validaciones básicas
    if (!tipo || !proveedor || !nombre) {
      return res.status(400).json({ 
        message: 'Faltan campos requeridos: tipo, proveedor, nombre' 
      });
    }
    
    const newIntegration = await integrationsService.createIntegration({
      tipo,
      proveedor, 
      nombre,
      descripcion,
      enabled,
      configuracion
    });
    
    // Registrar actividad
    await logActivity(
      'integration_create',
      `Admin ${req.user.nombre} creó integración: ${nombre}`,
      req.user.id,
      newIntegration.id,
      'admin'
    );
    
    res.status(201).json({
      message: 'Integración creada exitosamente',
      integration: newIntegration
    });
  } catch (error) {
    console.error('Error creando integración:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// PUT /api/integrations/:id - Actualizar integración
exports.updateIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    const { nombre, descripcion, enabled, configuracion } = req.body;
    
    const existingIntegration = await integrationsService.getIntegrationById(id);
    if (!existingIntegration) {
      return res.status(404).json({ message: 'Integración no encontrada' });
    }
    
    const updatedIntegration = await integrationsService.updateIntegration(id, {
      nombre,
      descripcion,
      enabled,
      configuracion
    });
    
    // Registrar actividad
    await logActivity(
      'integration_update',
      `Admin ${req.user.nombre} actualizó integración: ${nombre}`,
      req.user.id,
      id,
      'admin'
    );
    
    res.json({
      message: 'Integración actualizada exitosamente',
      integration: updatedIntegration
    });
  } catch (error) {
    console.error('Error actualizando integración:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/integrations/:id - Eliminar integración
exports.deleteIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    
    const integration = await integrationsService.getIntegrationById(id);
    if (!integration) {
      return res.status(404).json({ message: 'Integración no encontrada' });
    }
    
    const deleted = await integrationsService.deleteIntegration(id);
    
    if (deleted) {
      // Registrar actividad
      await logActivity(
        'integration_delete',
        `Admin ${req.user.nombre} eliminó integración: ${integration.nombre}`,
        req.user.id,
        id,
        'admin'
      );
      
      res.json({ message: 'Integración eliminada exitosamente' });
    } else {
      res.status(400).json({ message: 'No se pudo eliminar la integración' });
    }
  } catch (error) {
    console.error('Error eliminando integración:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/integrations/:id/test - Probar conexión de integración
exports.testIntegration = async (req, res) => {
  try {
    const { id } = req.params;
    
    const integration = await integrationsService.getIntegrationById(id);
    if (!integration) {
      return res.status(404).json({ message: 'Integración no encontrada' });
    }
    
    const testResult = await integrationsService.testIntegration(id);
    
    // Registrar actividad
    await logActivity(
      'integration_test',
      `Admin ${req.user.nombre} probó integración: ${integration.nombre} - ${testResult.success ? 'Exitoso' : 'Falló'}`,
      req.user.id,
      id,
      'admin'
    );
    
    res.json({
      message: testResult.success ? 'Prueba exitosa' : 'Prueba fallida',
      result: testResult
    });
  } catch (error) {
    console.error('Error probando integración:', error);
    res.status(500).json({ 
      message: 'Error probando integración',
      error: error.message 
    });
  }
};

// POST /api/integrations/sync - Sincronizar integraciones automáticamente
exports.syncIntegrations = async (req, res) => {
  try {
    const results = await integrationsService.syncIntegrations();
    
    // Registrar actividad
    await logActivity(
      'integration_sync',
      `Admin ${req.user.nombre} sincronizó integraciones - Creadas: ${results.created}, Actualizadas: ${results.updated}`,
      req.user.id,
      null,
      'admin'
    );
    
    res.json({
      message: 'Sincronización completada',
      results: {
        created: results.created,
        updated: results.updated,
        errors: results.errors
      }
    });
  } catch (error) {
    console.error('Error sincronizando integraciones:', error);
    res.status(500).json({ 
      message: 'Error sincronizando integraciones',
      error: error.message 
    });
  }
};

// ============= WEBHOOK FUNCTIONS =============

// GET /api/integrations/webhooks - Obtener todos los webhooks
exports.getWebhooks = async (req, res) => {
  try {
    const webhooks = await integrationsService.getAllWebhooks();
    
    // Registrar actividad
    await logActivity(
      'webhook_view',
      `Admin ${req.user.nombre} consultó webhooks`,
      req.user.id,
      req.user.id,
      'admin'
    );
    
    res.json(webhooks);
  } catch (error) {
    console.error('Error obteniendo webhooks:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// POST /api/integrations/webhooks - Crear nuevo webhook
exports.createWebhook = async (req, res) => {
  try {
    const { nombre, url, eventos, activo = true } = req.body;
    
    // Validaciones básicas
    if (!nombre || !url) {
      return res.status(400).json({ 
        message: 'Faltan campos requeridos: nombre, url' 
      });
    }
    
    // Validar URL
    try {
      new URL(url);
    } catch (error) {
      return res.status(400).json({ message: 'URL inválida' });
    }
    
    const newWebhook = await integrationsService.createWebhook({
      nombre,
      url,
      eventos: Array.isArray(eventos) ? eventos : [],
      activo
    });
    
    // Registrar actividad
    await logActivity(
      'webhook_create',
      `Admin ${req.user.nombre} creó webhook: ${nombre}`,
      req.user.id,
      newWebhook.id,
      'admin'
    );
    
    res.status(201).json({
      message: 'Webhook creado exitosamente',
      webhook: newWebhook
    });
  } catch (error) {
    console.error('Error creando webhook:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};

// DELETE /api/integrations/webhooks/:id - Eliminar webhook
exports.deleteWebhook = async (req, res) => {
  try {
    const { id } = req.params;
    
    const webhook = await integrationsService.getWebhookById(id);
    if (!webhook) {
      return res.status(404).json({ message: 'Webhook no encontrado' });
    }
    
    const deleted = await integrationsService.deleteWebhook(id);
    
    if (deleted) {
      // Registrar actividad
      await logActivity(
        'webhook_delete',
        `Admin ${req.user.nombre} eliminó webhook: ${webhook.nombre}`,
        req.user.id,
        id,
        'admin'
      );
      
      res.json({ message: 'Webhook eliminado exitosamente' });
    } else {
      res.status(400).json({ message: 'No se pudo eliminar el webhook' });
    }
  } catch (error) {
    console.error('Error eliminando webhook:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};