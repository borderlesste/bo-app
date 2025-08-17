const { validationResult } = require('express-validator');
const { Servicio } = require('../models');

// Get all services
exports.getAllServices = async (req, res) => {
  try {
    const filters = {
      estado: req.query.estado,
      categoria: req.query.categoria,
      search: req.query.search,
      limit: req.query.limit
    };

    const services = await Servicio.findAll(filters);

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error getting services:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios'
    });
  }
};

// Get service by ID
exports.getServiceById = async (req, res) => {
  try {
    const { id } = req.params;
    const service = await Servicio.findById(id);

    if (!service) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    res.json({
      success: true,
      data: service
    });
  } catch (error) {
    console.error('Error getting service:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicio'
    });
  }
};

// Create new service
exports.createService = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    // Only admins can create services
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para crear servicios'
      });
    }

    const serviceId = await Servicio.create(req.body);

    res.status(201).json({
      success: true,
      message: 'Servicio creado correctamente',
      data: { id: serviceId }
    });
  } catch (error) {
    console.error('Error creating service:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear servicio'
    });
  }
};

// Update service
exports.updateService = async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ 
      success: false,
      errors: errors.array() 
    });
  }

  try {
    // Only admins can update services
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para actualizar servicios'
      });
    }

    const { id } = req.params;
    const updated = await Servicio.update(id, req.body);

    if (!updated) {
      return res.status(404).json({
        success: false,
        message: 'Servicio no encontrado'
      });
    }

    res.json({
      success: true,
      message: 'Servicio actualizado correctamente'
    });
  } catch (error) {
    console.error('Error updating service:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar servicio'
    });
  }
};

// Delete service
exports.deleteService = async (req, res) => {
  try {
    // Only admins can delete services
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para eliminar servicios'
      });
    }

    const { id } = req.params;
    await Servicio.delete(id);

    res.json({
      success: true,
      message: 'Servicio eliminado correctamente'
    });
  } catch (error) {
    console.error('Error deleting service:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar servicio'
    });
  }
};

// Get active services
exports.getActiveServices = async (req, res) => {
  try {
    const services = await Servicio.getActive();

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error getting active services:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios activos'
    });
  }
};

// Get services by category
exports.getServicesByCategory = async (req, res) => {
  try {
    const { categoria } = req.params;
    const services = await Servicio.getByCategory(categoria);

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error getting services by category:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios por categoría'
    });
  }
};

// Get service categories
exports.getCategories = async (req, res) => {
  try {
    const categories = await Servicio.getCategories();

    res.json({
      success: true,
      data: categories
    });
  } catch (error) {
    console.error('Error getting categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener categorías'
    });
  }
};

// Update service status
exports.updateServiceStatus = async (req, res) => {
  try {
    // Only admins can update service status
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para cambiar el estado de servicios'
      });
    }

    const { id } = req.params;
    const { estado } = req.body;

    if (!['activo', 'inactivo'].includes(estado)) {
      return res.status(400).json({
        success: false,
        message: 'Estado inválido'
      });
    }

    await Servicio.updateStatus(id, estado);

    res.json({
      success: true,
      message: 'Estado del servicio actualizado correctamente'
    });
  } catch (error) {
    console.error('Error updating service status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar estado del servicio'
    });
  }
};

// Get service usage statistics
exports.getServiceUsage = async (req, res) => {
  try {
    // Only admins can view usage statistics
    if (req.user.rol !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'No tienes permisos para ver estadísticas'
      });
    }

    const { id } = req.params;
    const usage = await Servicio.getServiceUsage(id);

    res.json({
      success: true,
      data: usage
    });
  } catch (error) {
    console.error('Error getting service usage:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener estadísticas de uso'
    });
  }
};

// Get most used services
exports.getMostUsedServices = async (req, res) => {
  try {
    const limit = req.query.limit || 10;
    const services = await Servicio.getMostUsed(limit);

    res.json({
      success: true,
      data: services
    });
  } catch (error) {
    console.error('Error getting most used services:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener servicios más utilizados'
    });
  }
};