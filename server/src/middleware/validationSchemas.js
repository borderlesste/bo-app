const { body, param, query } = require('express-validator');

// User validation schemas
const userValidation = {
  register: [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('email').isEmail().withMessage('Email inválido'),
    body('password').isLength({ min: 8 }).withMessage('La contraseña debe tener al menos 8 caracteres'),
    body('telefono').optional().isMobilePhone().withMessage('Teléfono inválido'),
    body('empresa').optional().notEmpty().withMessage('Empresa no puede estar vacía')
  ],
  update: [
    body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('telefono').optional().isMobilePhone().withMessage('Teléfono inválido'),
    body('empresa').optional().notEmpty().withMessage('Empresa no puede estar vacía')
  ]
};

// Cotización validation schemas
const cotizacionValidation = {
  create: [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('email').optional().isEmail().withMessage('Email inválido'),
    body('titulo').notEmpty().withMessage('El título es requerido'),
    body('descripcion').notEmpty().withMessage('La descripción es requerida'),
    body('precio_estimado').optional().isNumeric().withMessage('El precio estimado debe ser numérico'),
    body('moneda').optional().isIn(['MXN', 'USD', 'EUR']).withMessage('Moneda inválida'),
    body('tiempo_entrega_dias').optional().isInt({ min: 1 }).withMessage('Tiempo de entrega debe ser mayor a 0')
  ],
  update: [
    body('titulo').optional().notEmpty().withMessage('El título no puede estar vacío'),
    body('descripcion').optional().notEmpty().withMessage('La descripción no puede estar vacía'),
    body('precio_estimado').optional().isNumeric().withMessage('El precio estimado debe ser numérico'),
    body('estado').optional().isIn(['Pendiente', 'Aprobada', 'Rechazada', 'Expirada']).withMessage('Estado inválido')
  ]
};

// order validation schemas
const orderValidation = {
  create: [
    body('usuario_id').isInt().withMessage('Usuario ID debe ser un número'),
    body('descripcion').optional().notEmpty().withMessage('La descripción no puede estar vacía'),
    body('fecha_entrega_estimada').optional().isISO8601().withMessage('Fecha de entrega inválida'),
    body('prioridad').optional().isIn(['baja', 'normal', 'alta', 'urgente']).withMessage('Prioridad inválida')
  ],
  update: [
    body('estado').optional().isIn(['nuevo', 'confirmado', 'en_proceso', 'completado', 'cancelado', 'en_pausa']).withMessage('Estado inválido'),
    body('descripcion').optional().notEmpty().withMessage('La descripción no puede estar vacía'),
    body('fecha_entrega_estimada').optional().isISO8601().withMessage('Fecha de entrega inválida')
  ]
};

// Factura validation schemas
const facturaValidation = {
  create: [
    body('usuario_id').isInt().withMessage('Usuario ID debe ser un número'),
    body('fecha_vencimiento').isISO8601().withMessage('Fecha de vencimiento inválida'),
    body('moneda').optional().isIn(['MXN', 'USD', 'EUR']).withMessage('Moneda inválida'),
    body('metodo_pago').optional().notEmpty().withMessage('Método de pago no puede estar vacío'),
    body('uso_cfdi').optional().notEmpty().withMessage('Uso CFDI no puede estar vacío')
  ],
  update: [
    body('estado').optional().isIn(['borrador', 'emitida', 'timbrada', 'cancelada', 'pagada']).withMessage('Estado inválido'),
    body('fecha_vencimiento').optional().isISO8601().withMessage('Fecha de vencimiento inválida')
  ]
};

// Pago validation schemas
const pagoValidation = {
  create: [
    body('usuario_id').isInt().withMessage('Usuario ID debe ser un número'),
    body('monto').isNumeric().withMessage('El monto debe ser numérico'),
    body('metodo_pago').isIn(['efectivo', 'transferencia', 'tarjeta', 'cheque', 'paypal', 'otro']).withMessage('Método de pago inválido'),
    body('fecha_pago').isISO8601().withMessage('Fecha de pago inválida'),
    body('tipo').optional().isIn(['anticipo', 'parcial', 'total', 'devolucion']).withMessage('Tipo de pago inválido')
  ],
  update: [
    body('estado').optional().isIn(['pendiente', 'procesando', 'aplicado', 'rechazado', 'cancelado']).withMessage('Estado inválido'),
    body('monto').optional().isNumeric().withMessage('El monto debe ser numérico')
  ]
};

// Proyecto validation schemas
const proyectoValidation = {
  create: [
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('descripcion').notEmpty().withMessage('La descripción es requerida'),
    body('categoria').notEmpty().withMessage('La categoría es requerida'),
    body('fecha_inicio').optional().isISO8601().withMessage('Fecha de inicio inválida'),
    body('fecha_fin').optional().isISO8601().withMessage('Fecha de fin inválida'),
    body('url_demo').optional().isURL().withMessage('URL de demo inválida'),
    body('url_produccion').optional().isURL().withMessage('URL de producción inválida'),
    body('repositorio').optional().isURL().withMessage('URL de repositorio inválida')
  ],
  update: [
    body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('descripcion').optional().notEmpty().withMessage('La descripción no puede estar vacía'),
    body('estado').optional().isIn(['planificacion', 'desarrollo', 'revision', 'completado', 'mantenimiento']).withMessage('Estado inválido'),
    body('es_publico').optional().isBoolean().withMessage('Es público debe ser booleano'),
    body('es_destacado').optional().isBoolean().withMessage('Es destacado debe ser booleano')
  ]
};

// Servicio validation schemas
const servicioValidation = {
  create: [
    body('codigo').notEmpty().withMessage('El código es requerido'),
    body('nombre').notEmpty().withMessage('El nombre es requerido'),
    body('categoria').notEmpty().withMessage('La categoría es requerida'),
    body('precio_base').optional().isNumeric().withMessage('El precio base debe ser numérico'),
    body('unidad_medida').optional().isIn(['hora', 'proyecto', 'mes', 'año', 'unidad']).withMessage('Unidad de medida inválida')
  ],
  update: [
    body('nombre').optional().notEmpty().withMessage('El nombre no puede estar vacío'),
    body('categoria').optional().notEmpty().withMessage('La categoría no puede estar vacía'),
    body('precio_base').optional().isNumeric().withMessage('El precio base debe ser numérico'),
    body('estado').optional().isIn(['activo', 'inactivo']).withMessage('Estado inválido')
  ]
};

// Mensaje validation schemas
const mensajeValidation = {
  create: [
    body('asunto').notEmpty().withMessage('El asunto es requerido'),
    body('mensaje').notEmpty().withMessage('El mensaje es requerido'),
    body('destinatario_email').optional().isEmail().withMessage('Email de destinatario inválido'),
    body('tipo').optional().isIn(['consulta_general', 'consulta_order', 'soporte', 'cotizacion', 'feedback', 'interno']).withMessage('Tipo de mensaje inválido'),
    body('prioridad').optional().isIn(['baja', 'media', 'alta']).withMessage('Prioridad inválida')
  ]
};

// Notificación validation schemas
const notificacionValidation = {
  create: [
    body('usuario_id').isInt().withMessage('Usuario ID debe ser un número'),
    body('tipo').notEmpty().withMessage('El tipo es requerido'),
    body('titulo').notEmpty().withMessage('El título es requerido'),
    body('mensaje').notEmpty().withMessage('El mensaje es requerido'),
    body('prioridad').optional().isIn(['baja', 'normal', 'alta', 'urgente']).withMessage('Prioridad inválida')
  ]
};

// Configuration validation schemas
const configurationValidation = {
  company: [
    body('company_name').optional().notEmpty().withMessage('El nombre de la empresa no puede estar vacío'),
    body('company_email').optional().isEmail().withMessage('Email de empresa inválido'),
    body('company_phone').optional().notEmpty().withMessage('Teléfono no puede estar vacío'),
    body('company_website').optional().isURL().withMessage('URL del sitio web inválida')
  ],
  theme: [
    body('theme_mode').optional().isIn(['light', 'dark', 'auto']).withMessage('Modo de tema inválido'),
    body('theme_primary_color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color primario inválido'),
    body('theme_secondary_color').optional().matches(/^#[0-9A-F]{6}$/i).withMessage('Color secundario inválido'),
    body('theme_compact_mode').optional().isBoolean().withMessage('Modo compacto debe ser booleano'),
    body('theme_animations').optional().isBoolean().withMessage('Animaciones debe ser booleano')
  ],
  security: [
    body('password_min_length').optional().isInt({ min: 6, max: 32 }).withMessage('Longitud mínima de contraseña debe estar entre 6 y 32'),
    body('login_max_attempts').optional().isInt({ min: 3, max: 10 }).withMessage('Intentos máximos debe estar entre 3 y 10'),
    body('login_lockout_minutes').optional().isInt({ min: 5, max: 1440 }).withMessage('Tiempo de bloqueo debe estar entre 5 y 1440 minutos'),
    body('session_timeout_minutes').optional().isInt({ min: 15, max: 480 }).withMessage('Timeout de sesión debe estar entre 15 y 480 minutos'),
    body('two_factor_enabled').optional().isBoolean().withMessage('2FA debe ser booleano')
  ]
};

// Common parameter validations
const paramValidation = {
  id: param('id').isInt().withMessage('ID debe ser un número entero')
};

// Common query validations
const queryValidation = {
  pagination: [
    query('page').optional().isInt({ min: 1 }).withMessage('Página debe ser un número mayor a 0'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Límite debe estar entre 1 y 100')
  ],
  search: [
    query('search').optional().isLength({ min: 1 }).withMessage('Búsqueda no puede estar vacía')
  ]
};

module.exports = {
  userValidation,
  cotizacionValidation,
  orderValidation,
  facturaValidation,
  pagoValidation,
  proyectoValidation,
  servicioValidation,
  mensajeValidation,
  notificacionValidation,
  configurationValidation,
  paramValidation,
  queryValidation
};