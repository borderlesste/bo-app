const sanitizeHtml = require('sanitize-html');
const validator = require('validator');

const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return sanitizeHtml(input, {
    allowedTags: [],
    allowedAttributes: {},
    disallowedTagsMode: 'discard'
  }).trim();
};

const validateEmail = (email) => {
  return validator.isEmail(email);
};

const validatePassword = (password) => {
  const errors = [];
  
  if (!password || password.length < 6) {
    errors.push('La contraseña debe tener al menos 6 caracteres');
  }
  
  if (!/(?=.*[a-z])/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra minúscula');
  }
  
  if (!/(?=.*[A-Z])/.test(password)) {
    errors.push('La contraseña debe contener al menos una letra mayúscula');
  }
  
  if (!/(?=.*\d)/.test(password)) {
    errors.push('La contraseña debe contener al menos un número');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

const validatePhone = (phone) => {
  return validator.isMobilePhone(phone, 'any', { strictMode: false });
};

const validateProject = (projectData) => {
  const errors = {};
  
  // Usar 'nombre' en lugar de 'titulo' para compatibilidad con el controlador
  if (!projectData.nombre || projectData.nombre.trim().length < 3) {
    errors.nombre = 'El nombre debe tener al menos 3 caracteres';
  }
  
  if (projectData.nombre && projectData.nombre.length > 200) {
    errors.nombre = 'El nombre no puede exceder los 200 caracteres';
  }
  
  if (!projectData.descripcion || projectData.descripcion.trim().length < 10) {
    errors.descripcion = 'La descripción debe tener al menos 10 caracteres';
  }
  
  if (projectData.descripcion && projectData.descripcion.length > 2000) {
    errors.descripcion = 'La descripción no puede exceder los 2000 caracteres';
  }
  
  // Categoría opcional con valor por defecto
  if (projectData.categoria && projectData.categoria.trim().length === 0) {
    errors.categoria = 'La categoría no puede estar vacía';
  }
  
  // Estados válidos para proyectos
  if (projectData.estado && !['planificacion', 'desarrollo', 'revision', 'completado', 'mantenimiento'].includes(projectData.estado)) {
    errors.estado = 'El estado debe ser uno de: planificacion, desarrollo, revision, completado, mantenimiento';
  }
  
  if (projectData.presupuesto !== undefined && projectData.presupuesto !== null) {
    if (isNaN(projectData.presupuesto) || projectData.presupuesto < 0) {
      errors.presupuesto = 'El presupuesto debe ser un número positivo';
    }
    if (projectData.presupuesto > 10000000) {
      errors.presupuesto = 'El presupuesto no puede exceder los $10,000,000';
    }
  }
  
  if (projectData.fecha_inicio && !validator.isISO8601(projectData.fecha_inicio)) {
    errors.fecha_inicio = 'La fecha de inicio debe tener un formato válido';
  }
  
  if (projectData.fecha_fin && !validator.isISO8601(projectData.fecha_fin)) {
    errors.fecha_fin = 'La fecha de fin debe tener un formato válido';
  }
  
  if (projectData.fecha_inicio && projectData.fecha_fin) {
    const startDate = new Date(projectData.fecha_inicio);
    const endDate = new Date(projectData.fecha_fin);
    if (endDate <= startDate) {
      errors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio';
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateNotification = (notificationData) => {
  const errors = {};
  
  if (!notificationData.titulo || notificationData.titulo.trim().length < 3) {
    errors.titulo = 'El título debe tener al menos 3 caracteres';
  }
  
  if (notificationData.titulo && notificationData.titulo.length > 100) {
    errors.titulo = 'El título no puede exceder los 100 caracteres';
  }
  
  if (!notificationData.mensaje || notificationData.mensaje.trim().length < 5) {
    errors.mensaje = 'El mensaje debe tener al menos 5 caracteres';
  }
  
  if (notificationData.mensaje && notificationData.mensaje.length > 500) {
    errors.mensaje = 'El mensaje no puede exceder los 500 caracteres';
  }
  
  if (!notificationData.tipo || !['info', 'success', 'warning', 'error'].includes(notificationData.tipo)) {
    errors.tipo = 'El tipo debe ser uno de: info, success, warning, error';
  }
  
  if (!notificationData.prioridad || !['baja', 'normal', 'alta', 'urgente'].includes(notificationData.prioridad)) {
    errors.prioridad = 'La prioridad debe ser una de: baja, normal, alta, urgente';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateUser = (userData) => {
  const errors = {};
  
  if (!userData.nombre || userData.nombre.trim().length < 2) {
    errors.nombre = 'El nombre debe tener al menos 2 caracteres';
  }
  
  if (userData.nombre && userData.nombre.length > 100) {
    errors.nombre = 'El nombre no puede exceder los 100 caracteres';
  }
  
  if (!userData.email || !validateEmail(userData.email)) {
    errors.email = 'El email no tiene un formato válido';
  }
  
  if (userData.password) {
    const passwordValidation = validatePassword(userData.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors.join(', ');
    }
  }
  
  if (userData.telefono && !validatePhone(userData.telefono)) {
    errors.telefono = 'El formato del teléfono no es válido';
  }
  
  if (userData.empresa && userData.empresa.length > 100) {
    errors.empresa = 'El nombre de la empresa no puede exceder los 100 caracteres';
  }
  
  if (userData.direccion && userData.direccion.length > 500) {
    errors.direccion = 'La dirección no puede exceder los 500 caracteres';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateClient = (clientData) => {
  const errors = {};
  
  if (!clientData.nombre || clientData.nombre.trim().length < 2) {
    errors.nombre = 'El nombre debe tener al menos 2 caracteres';
  }
  
  if (clientData.nombre && clientData.nombre.length > 255) {
    errors.nombre = 'El nombre no puede exceder los 255 caracteres';
  }
  
  if (!clientData.email || !validateEmail(clientData.email)) {
    errors.email = 'El email es requerido y debe tener un formato válido';
  }
  
  if (clientData.telefono && !validatePhone(clientData.telefono)) {
    errors.telefono = 'El formato del teléfono no es válido';
  }
  
  if (clientData.empresa && clientData.empresa.length > 255) {
    errors.empresa = 'El nombre de la empresa no puede exceder los 255 caracteres';
  }
  
  if (clientData.direccion && clientData.direccion.length > 500) {
    errors.direccion = 'La dirección no puede exceder los 500 caracteres';
  }
  
  if (clientData.rfc && (clientData.rfc.length < 10 || clientData.rfc.length > 13)) {
    errors.rfc = 'El RFC debe tener entre 10 y 13 caracteres';
  }
  
  if (clientData.estado && !['activo', 'inactivo', 'pendiente'].includes(clientData.estado)) {
    errors.estado = 'El estado debe ser: activo, inactivo o pendiente';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateMessage = (messageData) => {
  const errors = {};
  
  if (!messageData.tipo || messageData.tipo.trim().length < 2) {
    errors.tipo = 'El tipo de mensaje es requerido';
  }
  
  if (!messageData.titulo || messageData.titulo.trim().length < 3) {
    errors.titulo = 'El título debe tener al menos 3 caracteres';
  }
  
  if (messageData.titulo && messageData.titulo.length > 255) {
    errors.titulo = 'El título no puede exceder los 255 caracteres';
  }
  
  if (!messageData.mensaje || messageData.mensaje.trim().length < 10) {
    errors.mensaje = 'El mensaje debe tener al menos 10 caracteres';
  }
  
  if (messageData.mensaje && messageData.mensaje.length > 1000) {
    errors.mensaje = 'El mensaje no puede exceder los 1000 caracteres';
  }
  
  if (messageData.prioridad && !['baja', 'normal', 'alta', 'critica'].includes(messageData.prioridad)) {
    errors.prioridad = 'La prioridad debe ser: baja, normal, alta o critica';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateQuotation = (quotationData) => {
  const errors = {};
  
  if (!quotationData.usuario_id || !Number.isInteger(Number(quotationData.usuario_id))) {
    errors.usuario_id = 'ID de usuario requerido y debe ser un número válido';
  }
  
  if (!quotationData.titulo || quotationData.titulo.trim().length < 3) {
    errors.titulo = 'El título debe tener al menos 3 caracteres';
  }
  
  if (quotationData.titulo && quotationData.titulo.length > 255) {
    errors.titulo = 'El título no puede exceder los 255 caracteres';
  }
  
  if (quotationData.descripcion && quotationData.descripcion.length > 1000) {
    errors.descripcion = 'La descripción no puede exceder los 1000 caracteres';
  }
  
  if (quotationData.impuestos && (quotationData.impuestos < 0 || quotationData.impuestos > 100)) {
    errors.impuestos = 'Los impuestos deben estar entre 0 y 100%';
  }
  
  if (quotationData.moneda && !['MXN', 'USD', 'EUR'].includes(quotationData.moneda)) {
    errors.moneda = 'La moneda debe ser MXN, USD o EUR';
  }
  
  if (quotationData.validez_dias && (quotationData.validez_dias < 1 || quotationData.validez_dias > 365)) {
    errors.validez_dias = 'La validez debe estar entre 1 y 365 días';
  }
  
  if (quotationData.items && Array.isArray(quotationData.items)) {
    quotationData.items.forEach((item, index) => {
      if (!item.descripcion || item.descripcion.trim().length < 3) {
        errors[`item_${index}_descripcion`] = `Item ${index + 1}: La descripción es requerida (min 3 caracteres)`;
      }
      
      if (!item.cantidad || item.cantidad <= 0) {
        errors[`item_${index}_cantidad`] = `Item ${index + 1}: La cantidad debe ser mayor a 0`;
      }
      
      if (!item.precio_unitario || item.precio_unitario <= 0) {
        errors[`item_${index}_precio`] = `Item ${index + 1}: El precio unitario debe ser mayor a 0`;
      }
    });
  }
  
  if (quotationData.notas && quotationData.notas.length > 1000) {
    errors.notas = 'Las notas no pueden exceder los 1000 caracteres';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateInvoice = (invoiceData) => {
  const errors = {};
  
  if (!invoiceData.usuario_id || !Number.isInteger(Number(invoiceData.usuario_id))) {
    errors.usuario_id = 'ID de usuario requerido y debe ser un número válido';
  }
  
  if (!invoiceData.titulo || invoiceData.titulo.trim().length < 3) {
    errors.titulo = 'El título debe tener al menos 3 caracteres';
  }
  
  if (invoiceData.titulo && invoiceData.titulo.length > 255) {
    errors.titulo = 'El título no puede exceder los 255 caracteres';
  }
  
  if (invoiceData.descripcion && invoiceData.descripcion.length > 1000) {
    errors.descripcion = 'La descripción no puede exceder los 1000 caracteres';
  }
  
  if (invoiceData.moneda && !['MXN', 'USD', 'EUR'].includes(invoiceData.moneda)) {
    errors.moneda = 'La moneda debe ser MXN, USD o EUR';
  }
  
  if (invoiceData.dias_credito && (invoiceData.dias_credito < 0 || invoiceData.dias_credito > 365)) {
    errors.dias_credito = 'Los días de crédito deben estar entre 0 y 365';
  }
  
  if (invoiceData.metodo_pago && !['transferencia', 'efectivo', 'cheque', 'tarjeta_credito', 'tarjeta_debito'].includes(invoiceData.metodo_pago)) {
    errors.metodo_pago = 'Método de pago inválido';
  }
  
  if (invoiceData.items && Array.isArray(invoiceData.items)) {
    if (invoiceData.items.length === 0) {
      errors.items = 'La factura debe tener al menos un item';
    }
    
    invoiceData.items.forEach((item, index) => {
      if (!item.descripcion || item.descripcion.trim().length < 3) {
        errors[`item_${index}_descripcion`] = `Item ${index + 1}: La descripción es requerida (min 3 caracteres)`;
      }
      
      if (!item.cantidad || item.cantidad <= 0) {
        errors[`item_${index}_cantidad`] = `Item ${index + 1}: La cantidad debe ser mayor a 0`;
      }
      
      if (!item.precio_unitario || item.precio_unitario <= 0) {
        errors[`item_${index}_precio`] = `Item ${index + 1}: El precio unitario debe ser mayor a 0`;
      }
      
      if (item.descuento && (item.descuento < 0 || item.descuento > 100)) {
        errors[`item_${index}_descuento`] = `Item ${index + 1}: El descuento debe estar entre 0 y 100%`;
      }
      
      if (item.impuesto_porcentaje && (item.impuesto_porcentaje < 0 || item.impuesto_porcentaje > 100)) {
        errors[`item_${index}_impuesto`] = `Item ${index + 1}: El impuesto debe estar entre 0 y 100%`;
      }
    });
  }
  
  if (invoiceData.notas && invoiceData.notas.length > 1000) {
    errors.notas = 'Las notas no pueden exceder los 1000 caracteres';
  }
  
  if (invoiceData.condiciones_pago && invoiceData.condiciones_pago.length > 500) {
    errors.condiciones_pago = 'Las condiciones de pago no pueden exceder los 500 caracteres';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validateInvoiceStatus = (statusData) => {
  const errors = {};
  const validStatuses = ['borrador', 'emitida', 'timbrada', 'pagada', 'parcialmente_pagada', 'vencida', 'cancelada'];
  
  if (!statusData.estado || !validStatuses.includes(statusData.estado)) {
    errors.estado = `Estado inválido. Estados válidos: ${validStatuses.join(', ')}`;
  }
  
  if (statusData.notas && statusData.notas.length > 500) {
    errors.notas = 'Las notas no pueden exceder los 500 caracteres';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const sanitizeObjectInputs = (obj) => {
  const sanitized = {};
  
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeInput(value);
    } else if (value !== null && typeof value === 'object' && !Array.isArray(value)) {
      sanitized[key] = sanitizeObjectInputs(value);
    } else {
      sanitized[key] = value;
    }
  }
  
  return sanitized;
};

// Middleware de sanitización
const sanitizationMiddleware = (req, res, next) => {
  if (req.body && typeof req.body === 'object') {
    req.body = sanitizeObjectInputs(req.body);
  }
  
  if (req.query && typeof req.query === 'object') {
    req.query = sanitizeObjectInputs(req.query);
  }
  
  if (req.params && typeof req.params === 'object') {
    req.params = sanitizeObjectInputs(req.params);
  }
  
  next();
};

// Middleware genérico de validación
const createValidationMiddleware = (validator) => {
  return (req, res, next) => {
    const validation = validator(req.body);
    
    if (!validation.isValid) {
      return res.status(400).json({
        success: false,
        message: 'Datos de entrada inválidos',
        errors: validation.errors
      });
    }
    
    next();
  };
};

// Middlewares específicos de validación
const validateProjectMiddleware = createValidationMiddleware(validateProject);
const validateNotificationMiddleware = createValidationMiddleware(validateNotification);
const validateUserMiddleware = createValidationMiddleware(validateUser);
const validateClientMiddleware = createValidationMiddleware(validateClient);
const validateMessageMiddleware = createValidationMiddleware(validateMessage);
const validateQuotationMiddleware = createValidationMiddleware(validateQuotation);
const validateInvoiceMiddleware = createValidationMiddleware(validateInvoice);
const validateInvoiceStatusMiddleware = createValidationMiddleware(validateInvoiceStatus);

// Middleware de validación de login
const validateLoginMiddleware = (req, res, next) => {
  const { email, password } = req.body;
  const errors = {};
  
  if (!email || !validateEmail(email)) {
    errors.email = 'Email requerido y debe tener un formato válido';
  }
  
  if (!password || password.length < 6) {
    errors.password = 'Contraseña requerida con al menos 6 caracteres';
  }
  
  if (Object.keys(errors).length > 0) {
    return res.status(400).json({
      success: false,
      message: 'Datos de login inválidos',
      errors
    });
  }
  
  next();
};

// Middleware de rate limiting simple
const createRateLimitMiddleware = (maxRequests = 100, windowMs = 15 * 60 * 1000) => {
  const requests = new Map();
  
  return (req, res, next) => {
    const identifier = req.ip || req.connection.remoteAddress;
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier);
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return res.status(429).json({
        success: false,
        message: 'Demasiadas solicitudes. Intenta de nuevo más tarde.',
        retryAfter: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      });
    }
    
    validRequests.push(now);
    requests.set(identifier, validRequests);
    
    // Headers informativos
    res.set({
      'X-RateLimit-Limit': maxRequests,
      'X-RateLimit-Remaining': maxRequests - validRequests.length,
      'X-RateLimit-Reset': new Date(Date.now() + windowMs).toISOString()
    });
    
    next();
  };
};

// Middleware de validación de archivos
const validateFileMiddleware = (options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB
    allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    required = false
  } = options;
  
  return (req, res, next) => {
    if (!req.file && required) {
      return res.status(400).json({
        success: false,
        message: 'Archivo requerido'
      });
    }
    
    if (req.file) {
      if (req.file.size > maxSize) {
        return res.status(400).json({
          success: false,
          message: `Archivo demasiado grande. Máximo ${Math.round(maxSize / 1024 / 1024)}MB permitido`
        });
      }
      
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          success: false,
          message: `Tipo de archivo no permitido. Tipos aceptados: ${allowedMimeTypes.join(', ')}`
        });
      }
    }
    
    next();
  };
};

// Middleware de validación de ID
const validateIdMiddleware = (paramName = 'id') => {
  return (req, res, next) => {
    const id = req.params[paramName];
    
    if (!id || !validator.isNumeric(id.toString()) || parseInt(id) <= 0) {
      return res.status(400).json({
        success: false,
        message: `ID inválido: ${paramName} debe ser un número positivo`
      });
    }
    
    next();
  };
};

// Client-specific validation functions
const validateClientProfile = (profileData) => {
  const errors = {};
  
  if (!profileData.nombre || profileData.nombre.trim().length < 2) {
    errors.nombre = 'El nombre debe tener al menos 2 caracteres';
  }
  
  if (profileData.nombre && profileData.nombre.length > 100) {
    errors.nombre = 'El nombre no puede exceder los 100 caracteres';
  }
  
  if (!profileData.email || !validateEmail(profileData.email)) {
    errors.email = 'El email no tiene un formato válido';
  }
  
  if (profileData.telefono && !validatePhone(profileData.telefono)) {
    errors.telefono = 'El formato del teléfono no es válido';
  }
  
  if (profileData.empresa && profileData.empresa.length > 100) {
    errors.empresa = 'El nombre de la empresa no puede exceder los 100 caracteres';
  }
  
  if (profileData.direccion && profileData.direccion.length > 500) {
    errors.direccion = 'La dirección no puede exceder los 500 caracteres';
  }
  
  if (profileData.ciudad && profileData.ciudad.length > 100) {
    errors.ciudad = 'La ciudad no puede exceder los 100 caracteres';
  }
  
  if (profileData.pais && profileData.pais.length > 100) {
    errors.pais = 'El país no puede exceder los 100 caracteres';
  }
  
  if (profileData.sitio_web && profileData.sitio_web.length > 255) {
    errors.sitio_web = 'El sitio web no puede exceder los 255 caracteres';
  }
  
  if (profileData.sitio_web && !validator.isURL(profileData.sitio_web, { require_protocol: true })) {
    errors.sitio_web = 'El sitio web debe tener un formato de URL válido';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

const validatePasswordUpdate = (passwordData) => {
  const errors = {};
  
  if (!passwordData.currentPassword || passwordData.currentPassword.length < 1) {
    errors.currentPassword = 'La contraseña actual es requerida';
  }
  
  if (!passwordData.newPassword || passwordData.newPassword.length < 6) {
    errors.newPassword = 'La nueva contraseña debe tener al menos 6 caracteres';
  }
  
  if (passwordData.newPassword && passwordData.newPassword === passwordData.currentPassword) {
    errors.newPassword = 'La nueva contraseña debe ser diferente a la actual';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Client validation middlewares
const validateClientProfileMiddleware = createValidationMiddleware(validateClientProfile);
const validatePasswordUpdateMiddleware = createValidationMiddleware(validatePasswordUpdate);

module.exports = {
  sanitizationMiddleware,
  validateProjectMiddleware,
  validateNotificationMiddleware,
  validateUserMiddleware,
  validateClientMiddleware,
  validateMessageMiddleware,
  validateQuotationMiddleware,
  validateInvoiceMiddleware,
  validateInvoiceStatusMiddleware,
  validateLoginMiddleware,
  validateClientProfileMiddleware,
  validatePasswordUpdateMiddleware,
  createRateLimitMiddleware,
  validateFileMiddleware,
  validateIdMiddleware,
  createValidationMiddleware,
  
  // Aliases for routes usage
  validateInvoice: validateInvoiceMiddleware,
  validateInvoiceStatus: validateInvoiceStatusMiddleware,
  validateClientProfile: validateClientProfileMiddleware,
  validatePasswordUpdate: validatePasswordUpdateMiddleware,
  
  // Funciones de validación exportadas para uso directo
  validateProject,
  validateNotification,
  validateUser,
  validateClient,
  validateMessage,
  validateQuotation,
  validateInvoiceFunction: validateInvoice,
  validateInvoiceStatusFunction: validateInvoiceStatus,
  validateClientProfileFunction: validateClientProfile,
  validatePasswordUpdateFunction: validatePasswordUpdate,
  validateEmail,
  validatePassword,
  validatePhone,
  sanitizeInput,
  sanitizeObjectInputs
};