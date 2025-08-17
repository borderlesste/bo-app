// Utilidades de validación para los componentes del cliente

export const validateEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePhone = (phone) => {
  const phoneRegex = /^[+]?[1-9][\d]{0,15}$/;
  return phoneRegex.test(phone.replace(/\s/g, ''));
};

export const validateClient = (clientData) => {
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

export const validatePassword = (password) => {
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

export const validateProfileForm = (formData) => {
  const errors = {};
  
  // Validar nombre
  if (!formData.nombre || formData.nombre.trim().length < 2) {
    errors.nombre = 'El nombre debe tener al menos 2 caracteres';
  }
  
  if (formData.nombre && formData.nombre.length > 100) {
    errors.nombre = 'El nombre no puede exceder los 100 caracteres';
  }
  
  // Validar teléfono si se proporciona
  if (formData.telefono && !validatePhone(formData.telefono)) {
    errors.telefono = 'El formato del teléfono no es válido';
  }
  
  // Validar empresa si se proporciona
  if (formData.empresa && formData.empresa.length > 100) {
    errors.empresa = 'El nombre de la empresa no puede exceder los 100 caracteres';
  }
  
  // Validar dirección si se proporciona
  if (formData.direccion && formData.direccion.length > 500) {
    errors.direccion = 'La dirección no puede exceder los 500 caracteres';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validatePasswordChangeForm = (formData) => {
  const errors = {};
  
  // Validar contraseña actual
  if (!formData.currentPassword) {
    errors.currentPassword = 'La contraseña actual es obligatoria';
  }
  
  // Validar nueva contraseña
  const passwordValidation = validatePassword(formData.newPassword);
  if (!passwordValidation.isValid) {
    errors.newPassword = passwordValidation.errors.join(', ');
  }
  
  // Validar confirmación de contraseña
  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Debes confirmar la nueva contraseña';
  } else if (formData.newPassword !== formData.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }
  
  // Verificar que la nueva contraseña sea diferente de la actual
  if (formData.currentPassword === formData.newPassword) {
    errors.newPassword = 'La nueva contraseña debe ser diferente de la actual';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const sanitizeInput = (input) => {
  if (typeof input !== 'string') return input;
  
  return input
    .trim()
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '') // Remove script tags
    .replace(/<[^>]*>/g, '') // Remove HTML tags
    .substring(0, 1000); // Limit length
};

export const validateNumericInput = (value, min = 0, max = Number.MAX_SAFE_INTEGER) => {
  const num = parseFloat(value);
  
  if (isNaN(num)) {
    return { isValid: false, error: 'Debe ser un número válido' };
  }
  
  if (num < min) {
    return { isValid: false, error: `El valor mínimo es ${min}` };
  }
  
  if (num > max) {
    return { isValid: false, error: `El valor máximo es ${max}` };
  }
  
  return { isValid: true };
};

export const formatCurrency = (amount) => {
  try {
    return new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN'
    }).format(amount || 0);
  } catch (error) {
    return `$${(amount || 0).toFixed(2)}`;
  }
};

export const formatDate = (dateString, options = {}) => {
  if (!dateString) return 'N/A';
  
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return 'Fecha inválida';
    
    const defaultOptions = {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      ...options
    };
    
    return date.toLocaleDateString('es-MX', defaultOptions);
  } catch (error) {
    return 'Fecha inválida';
  }
};

export const debounce = (func, wait) => {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
};

export const validateProject = (projectData) => {
  const errors = {};
  
  if (!projectData.titulo || projectData.titulo.trim().length < 3) {
    errors.titulo = 'El título debe tener al menos 3 caracteres';
  }
  
  if (projectData.titulo && projectData.titulo.length > 200) {
    errors.titulo = 'El título no puede exceder los 200 caracteres';
  }
  
  if (!projectData.descripcion || projectData.descripcion.trim().length < 10) {
    errors.descripcion = 'La descripción debe tener al menos 10 caracteres';
  }
  
  if (projectData.descripcion && projectData.descripcion.length > 2000) {
    errors.descripcion = 'La descripción no puede exceder los 2000 caracteres';
  }
  
  if (!projectData.categoria || projectData.categoria.trim().length === 0) {
    errors.categoria = 'La categoría es obligatoria';
  }
  
  if (!projectData.estado || !['activo', 'pausado', 'completado', 'cancelado'].includes(projectData.estado)) {
    errors.estado = 'El estado debe ser uno de: activo, pausado, completado, cancelado';
  }
  
  if (projectData.presupuesto !== undefined) {
    const budgetValidation = validateNumericInput(projectData.presupuesto, 0, 10000000);
    if (!budgetValidation.isValid) {
      errors.presupuesto = budgetValidation.error;
    }
  }
  
  if (projectData.fecha_inicio) {
    const startDate = new Date(projectData.fecha_inicio);
    if (isNaN(startDate.getTime())) {
      errors.fecha_inicio = 'La fecha de inicio no es válida';
    }
  }
  
  if (projectData.fecha_fin) {
    const endDate = new Date(projectData.fecha_fin);
    if (isNaN(endDate.getTime())) {
      errors.fecha_fin = 'La fecha de fin no es válida';
    } else if (projectData.fecha_inicio) {
      const startDate = new Date(projectData.fecha_inicio);
      if (endDate <= startDate) {
        errors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio';
      }
    }
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateNotification = (notificationData) => {
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

export const validateFileUpload = (file, options = {}) => {
  const {
    maxSize = 10 * 1024 * 1024, // 10MB default
    allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    requiredDimensions = null // { width: 1920, height: 1080 }
  } = options;
  
  const errors = [];
  
  if (!file) {
    errors.push('No se ha seleccionado ningún archivo');
    return { isValid: false, errors };
  }
  
  if (file.size > maxSize) {
    errors.push(`El archivo es demasiado grande. Máximo ${Math.round(maxSize / 1024 / 1024)}MB permitido`);
  }
  
  if (!allowedTypes.includes(file.type)) {
    errors.push(`Tipo de archivo no permitido. Tipos aceptados: ${allowedTypes.join(', ')}`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateLoginForm = (formData) => {
  const errors = {};
  
  if (!formData.email || !validateEmail(formData.email)) {
    errors.email = 'Ingresa un email válido';
  }
  
  if (!formData.password || formData.password.length < 6) {
    errors.password = 'La contraseña debe tener al menos 6 caracteres';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateRegisterForm = (formData) => {
  const errors = {};
  
  if (!formData.nombre || formData.nombre.trim().length < 2) {
    errors.nombre = 'El nombre debe tener al menos 2 caracteres';
  }
  
  if (formData.nombre && formData.nombre.length > 100) {
    errors.nombre = 'El nombre no puede exceder los 100 caracteres';
  }
  
  if (!formData.email || !validateEmail(formData.email)) {
    errors.email = 'Ingresa un email válido';
  }
  
  const passwordValidation = validatePassword(formData.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.errors.join(', ');
  }
  
  if (!formData.confirmPassword) {
    errors.confirmPassword = 'Debes confirmar la contraseña';
  } else if (formData.password !== formData.confirmPassword) {
    errors.confirmPassword = 'Las contraseñas no coinciden';
  }
  
  if (formData.telefono && !validatePhone(formData.telefono)) {
    errors.telefono = 'El formato del teléfono no es válido';
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const validateUrl = (url) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

export const sanitizeHtml = (dirty) => {
  const clean = dirty
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, '')
    .replace(/<object\b[^<]*(?:(?!<\/object>)<[^<]*)*<\/object>/gi, '')
    .replace(/<embed\b[^<]*(?:(?!<\/embed>)<[^<]*)*<\/embed>/gi, '')
    .replace(/<link\b[^>]*>/gi, '')
    .replace(/<meta\b[^>]*>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
    
  return clean;
};

export const rateLimit = (maxRequests = 10, windowMs = 60000) => {
  const requests = new Map();
  
  return (identifier = 'default') => {
    const now = Date.now();
    const windowStart = now - windowMs;
    
    if (!requests.has(identifier)) {
      requests.set(identifier, []);
    }
    
    const userRequests = requests.get(identifier);
    const validRequests = userRequests.filter(time => time > windowStart);
    
    if (validRequests.length >= maxRequests) {
      return {
        allowed: false,
        remainingRequests: 0,
        resetTime: Math.ceil((validRequests[0] + windowMs - now) / 1000)
      };
    }
    
    validRequests.push(now);
    requests.set(identifier, validRequests);
    
    return {
      allowed: true,
      remainingRequests: maxRequests - validRequests.length,
      resetTime: 0
    };
  };
};

export const createFormValidator = (validationRules) => {
  return (formData) => {
    const errors = {};
    
    for (const [field, rules] of Object.entries(validationRules)) {
      const value = formData[field];
      
      for (const rule of rules) {
        const result = rule(value, formData);
        if (result !== true) {
          errors[field] = result;
          break; // Stop at first error
        }
      }
    }
    
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  };
};

export const validationRules = {
  required: (value) => {
    if (value === undefined || value === null || value === '') {
      return 'Este campo es obligatorio';
    }
    return true;
  },
  
  minLength: (min) => (value) => {
    if (value && value.length < min) {
      return `Debe tener al menos ${min} caracteres`;
    }
    return true;
  },
  
  maxLength: (max) => (value) => {
    if (value && value.length > max) {
      return `No puede exceder los ${max} caracteres`;
    }
    return true;
  },
  
  email: (value) => {
    if (value && !validateEmail(value)) {
      return 'Formato de email inválido';
    }
    return true;
  },
  
  numeric: (value) => {
    if (value && isNaN(value)) {
      return 'Debe ser un número válido';
    }
    return true;
  },
  
  url: (value) => {
    if (value && !validateUrl(value)) {
      return 'Debe ser una URL válida';
    }
    return true;
  }
};