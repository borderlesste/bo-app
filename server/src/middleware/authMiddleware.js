const securityLogService = require('../services/securityLogService.js');
const { User } = require('../models');

const isAuthenticated = (req, res, next) => {
  console.log('Verificando sesión. SessionID:', req.session.id);
  console.log('Usuario en sesión:', req.session.userId);
  
  if (!req.session.userId) {
    // Registrar acceso denegado por falta de sesión
    const ip = securityLogService.constructor.extractIP(req);
    const userAgent = securityLogService.constructor.extractUserAgent(req);
    
    securityLogService.logAccessDenied(
      null,
      null,
      ip,
      userAgent,
      req.originalUrl,
      'sesion_no_encontrada'
    ).catch(err => console.error('Error logging access denied:', err));
    
    return res.status(401).json({ message: 'No autorizado - Sesión requerida' });
  }

  // Agregar información del usuario a req.user para compatibilidad
  req.user = {
    id: req.session.userId,
    rol: req.session.userRole, // Changed from 'role' to 'rol' to match database
    email: req.session.userEmail,
    nombre: req.session.userName
  };
  
  console.log('Usuario autenticado:', req.user);
  next();
};

const isAdmin = (req, res, next) => {
  console.log('Verificando rol de administrador. req.user:', req.user);
  console.log('Rol en sesión:', req.session.userRole);
  
  if (req.session.userRole === 'admin' || req.user?.rol === 'admin') {
    return next();
  }
  
  // Registrar acceso denegado por falta de permisos de admin
  const ip = securityLogService.constructor.extractIP(req);
  const userAgent = securityLogService.constructor.extractUserAgent(req);
  
  securityLogService.logAccessDenied(
    req.user.id,
    req.user.email,
    ip,
    userAgent,
    req.originalUrl,
    'permisos_insuficientes_admin'
  ).catch(err => console.error('Error logging access denied:', err));
  
  return res.status(403).json({ message: 'Acceso denegado - Se requiere rol de administrador' });
};

const requireRole = (role) => {
  return (req, res, next) => {
    console.log(`Verificando rol requerido: ${role}. Usuario actual:`, req.user);
    
    if (!req.user || req.user.rol !== role) {
      // Registrar acceso denegado por falta de permisos
      const ip = securityLogService.constructor.extractIP(req);
      const userAgent = securityLogService.constructor.extractUserAgent(req);
      
      securityLogService.logAccessDenied(
        req.user?.id || null,
        req.user?.email || null,
        ip,
        userAgent,
        req.originalUrl,
        `permisos_insuficientes_${role}`
      ).catch(err => console.error('Error logging access denied:', err));
      
      return res.status(403).json({ 
        message: `Acceso denegado - Se requiere rol de ${role}` 
      });
    }
    
    next();
  };
};

module.exports = { isAuthenticated, isAdmin, requireRole };
