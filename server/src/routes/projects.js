// server/src/routes/projects.js
const express = require('express');
const router = express.Router();
const {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject,
  uploadProjectImage,
  uploadProjectGallery,
  deleteProjectImage,
  getProjectGallery
} = require('../controllers/projectsController.js');
const { uploadProjectImage: uploadMiddleware, handleMulterError } = require('../middleware/uploadMiddleware.js');
const { 
  sanitizationMiddleware,
  validateProjectMiddleware,
  validateIdMiddleware,
  validateFileMiddleware,
  createRateLimitMiddleware
} = require('../middleware/validationMiddleware.js');

// Aplicar rate limiting y sanitización a todas las rutas
router.use(createRateLimitMiddleware(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
router.use(sanitizationMiddleware);

// Rutas públicas
router.get('/', getAllProjects);
router.get('/:id', validateIdMiddleware('id'), getProjectById);

// Ruta para crear tabla de usuarios y admin (temporal)
router.post('/setup-admin', async (req, res) => {
  try {
    const bcrypt = require('bcryptjs');
    const { pool } = require('../config/db.js');
    
    // Crear tabla usuarios si no existe
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS usuarios (
        id INT AUTO_INCREMENT PRIMARY KEY,
        nombre VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        rol ENUM('admin', 'cliente', 'empleado') DEFAULT 'cliente',
        estado ENUM('activo', 'inactivo', 'pendiente') DEFAULT 'activo',
        telefono VARCHAR(20),
        direccion TEXT,
        empresa VARCHAR(255),
        rfc VARCHAR(20),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);
    
    // Verificar si ya existe el admin
    const [existingAdmin] = await pool.execute('SELECT id FROM usuarios WHERE email = ?', ['admin@borderlesstechno.com']);
    if (existingAdmin.length > 0) {
      return res.json({
        success: true,
        message: 'La tabla usuarios y el admin ya existen',
        admin: { email: 'admin@borderlesstechno.com', password: '123456' }
      });
    }
    
    // Crear usuario admin
    const hashedPassword = await bcrypt.hash('123456', 10);
    
    await pool.execute(
      `INSERT INTO usuarios (nombre, email, password, rol, estado, telefono, direccion, empresa, rfc) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        'Administrador Principal',
        'admin@borderlesstechno.com',
        hashedPassword,
        'admin',
        'activo',
        '+52 55 1234 5678',
        'Av. Insurgentes Sur 123, CDMX',
        'Borderless Techno Company',
        'BTC123456789'
      ]
    );
    
    res.json({
      success: true,
      message: 'Tabla usuarios creada y admin configurado exitosamente',
      admin: { email: 'admin@borderlesstechno.com', password: '123456' }
    });
    
  } catch (error) {
    console.error('Error configurando admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error configurando admin',
      error: error.message
    });
  }
});

// Ruta para verificar usuario admin (temporal)
router.get('/check-admin', async (req, res) => {
  try {
    const { pool } = require('../config/db.js');
    
    const [users] = await pool.execute('SELECT id, nombre, email, rol, estado FROM usuarios WHERE email = ?', ['admin@borderlesstechno.com']);
    
    if (users.length === 0) {
      return res.json({
        success: false,
        message: 'Usuario admin no encontrado'
      });
    }
    
    res.json({
      success: true,
      message: 'Usuario admin encontrado',
      user: users[0]
    });
    
  } catch (error) {
    console.error('Error verificando admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error verificando admin',
      error: error.message
    });
  }
});

// Endpoint para listar tablas y usuarios (temporal para debugging)
router.post('/database-info', async (req, res) => {
  try {
    const { pool } = require('../config/db.js');
    
    // Listar todas las tablas
    const [tables] = await pool.execute('SHOW TABLES');
    const tableNames = tables.map(table => Object.values(table)[0]);
    
    // Listar todos los usuarios
    const [users] = await pool.execute('SELECT id, nombre, email, rol, estado, created_at FROM usuarios ORDER BY created_at DESC');
    
    // Contar registros en tablas principales
    const counts = {};
    for (const tableName of ['usuarios', 'proyectos', 'sessions', 'actividades', 'seguridad_log']) {
      try {
        const [countResult] = await pool.execute(`SELECT COUNT(*) as count FROM ${tableName}`);
        counts[tableName] = countResult[0].count;
      } catch (error) {
        counts[tableName] = 'N/A (tabla no existe)';
      }
    }
    
    res.json({
      success: true,
      tables: tableNames,
      users: users,
      record_counts: counts,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error obteniendo información de base de datos:', error);
    res.status(500).json({
      success: false,
      message: 'Error obteniendo información de base de datos',
      error: error.message
    });
  }
});

// Endpoint de login simplificado (temporal para debugging)
router.post('/simple-login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email y contraseña son requeridos'
      });
    }
    
    const bcrypt = require('bcryptjs');
    const { pool } = require('../config/db.js');
    
    // Buscar usuario por email
    const [users] = await pool.execute(
      'SELECT id, nombre, email, password, rol, estado FROM usuarios WHERE email = ? AND estado = ?',
      [email, 'activo']
    );
    
    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas - usuario no encontrado'
      });
    }
    
    const user = users[0];
    
    // Verificar contraseña
    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(401).json({
        success: false,
        message: 'Credenciales inválidas - contraseña incorrecta'
      });
    }
    
    // Crear sesión
    req.session.userId = user.id;
    req.session.userRole = user.rol;
    req.session.userEmail = user.email;
    req.session.userName = user.nombre;
    
    // Remover contraseña de la respuesta
    delete user.password;
    
    res.json({
      success: true,
      message: 'Login exitoso',
      user: user,
      session: {
        userId: req.session.userId,
        userRole: req.session.userRole,
        userEmail: req.session.userEmail,
        userName: req.session.userName
      }
    });
    
  } catch (error) {
    console.error('Error en login simplificado:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor',
      error: error.message
    });
  }
});

// Endpoint para configurar todas las tablas faltantes
router.post('/setup-database', async (req, res) => {
  try {
    const { pool } = require('../config/db.js');
    
    const tables = [];
    
    // 1. Recrear tabla de sesiones con estructura exacta de express-mysql-session
    await pool.execute('DROP TABLE IF EXISTS sessions');
    await pool.execute(`
      CREATE TABLE sessions (
        session_id VARCHAR(128) COLLATE utf8mb4_bin NOT NULL,
        expires INT(11) UNSIGNED NOT NULL,
        data MEDIUMTEXT COLLATE utf8mb4_bin,
        PRIMARY KEY (session_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin
    `);
    tables.push('sessions (recreated)');
    
    // 2. Crear tabla de logs de seguridad
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS seguridad_log (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NULL,
        tipo ENUM('login', 'logout', 'login_fallido', 'acceso_denegado', 'cambio_password', 'registro', 'intento_acceso') NOT NULL,
        email_intento VARCHAR(255) NULL,
        ip VARCHAR(45) NULL,
        user_agent TEXT NULL,
        dispositivo VARCHAR(100) NULL,
        ubicacion VARCHAR(100) NULL,
        detalles JSON NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_tipo (tipo),
        INDEX idx_created_at (created_at),
        INDEX idx_ip (ip)
      ) ENGINE=InnoDB
    `);
    tables.push('seguridad_log');
    
    // 3. Verificar que tabla de usuarios existe
    const [userTables] = await pool.execute("SHOW TABLES LIKE 'usuarios'");
    if (userTables.length === 0) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS usuarios (
          id INT AUTO_INCREMENT PRIMARY KEY,
          nombre VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password VARCHAR(255) NOT NULL,
          rol ENUM('admin', 'cliente', 'empleado') DEFAULT 'cliente',
          estado ENUM('activo', 'inactivo', 'pendiente') DEFAULT 'activo',
          telefono VARCHAR(20),
          direccion TEXT,
          empresa VARCHAR(255),
          rfc VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
      `);
      tables.push('usuarios (creada)');
    } else {
      tables.push('usuarios (ya existía)');
    }
    
    // 4. Verificar que tabla de proyectos existe
    const [projectTables] = await pool.execute("SHOW TABLES LIKE 'proyectos'");
    if (projectTables.length === 0) {
      await pool.execute(`
        CREATE TABLE IF NOT EXISTS proyectos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          codigo VARCHAR(20) UNIQUE NOT NULL,
          nombre VARCHAR(255) NOT NULL,
          descripcion TEXT,
          imagen_principal VARCHAR(500),
          repositorio VARCHAR(500),
          url_demo VARCHAR(500),
          tecnologias JSON,
          categoria VARCHAR(50) DEFAULT 'web',
          estado VARCHAR(50) DEFAULT 'planificacion',
          es_publico BOOLEAN DEFAULT 1,
          es_destacado BOOLEAN DEFAULT 0,
          orden_portfolio INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB
      `);
      tables.push('proyectos (creada)');
    } else {
      tables.push('proyectos (ya existía)');
    }
    
    // 5. Crear tabla de actividades faltante
    await pool.execute(`
      CREATE TABLE IF NOT EXISTS actividades (
        id INT AUTO_INCREMENT PRIMARY KEY,
        usuario_id INT NOT NULL,
        tipo VARCHAR(50) NOT NULL,
        descripcion TEXT NOT NULL,
        entidad_tipo VARCHAR(50) NULL,
        entidad_id INT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_usuario_id (usuario_id),
        INDEX idx_tipo (tipo),
        INDEX idx_created_at (created_at),
        FOREIGN KEY (usuario_id) REFERENCES usuarios(id) ON DELETE CASCADE
      ) ENGINE=InnoDB
    `);
    tables.push('actividades');
    
    res.json({
      success: true,
      message: 'Base de datos configurada exitosamente',
      tables: tables,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error configurando base de datos:', error);
    res.status(500).json({
      success: false,
      message: 'Error configurando base de datos',
      error: error.message
    });
  }
});

// Ruta para crear datos de muestra (temporal)
router.post('/create-sample-data', async (req, res) => {
  try {
    const { pool } = require('../config/db.js');
    
    // Verificar si la tabla proyectos existe
    const [tables] = await pool.execute("SHOW TABLES LIKE 'proyectos'");
    if (tables.length === 0) {
      // Crear tabla si no existe
      await pool.execute(`
        CREATE TABLE proyectos (
          id INT AUTO_INCREMENT PRIMARY KEY,
          codigo VARCHAR(20) UNIQUE NOT NULL,
          nombre VARCHAR(255) NOT NULL,
          descripcion TEXT,
          imagen_principal VARCHAR(500),
          repositorio VARCHAR(500),
          url_demo VARCHAR(500),
          tecnologias JSON,
          categoria VARCHAR(50) DEFAULT 'web',
          estado VARCHAR(50) DEFAULT 'planificacion',
          es_publico BOOLEAN DEFAULT 1,
          es_destacado BOOLEAN DEFAULT 0,
          orden_portfolio INT DEFAULT 0,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        )
      `);
    }
    
    // Verificar si ya hay datos
    const [existing] = await pool.execute('SELECT COUNT(*) as count FROM proyectos');
    if (existing[0].count > 0) {
      return res.json({
        success: true,
        message: `Ya existen ${existing[0].count} proyectos en la base de datos`
      });
    }
    
    // Crear proyectos de muestra
    const sampleProjects = [
      {
        codigo: 'WEB001',
        nombre: 'Sistema de Gestión Empresarial',
        descripcion: 'Plataforma completa para la gestión de clientes, pedidos y pagos de empresas. Incluye dashboard administrativo, gestión de usuarios y reportes avanzados.',
        imagen_principal: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=800&q=80',
        repositorio: 'https://github.com/borderlesste/saas-platform',
        url_demo: 'https://borderlesstechno.com',
        tecnologias: JSON.stringify(['React', 'Node.js', 'MySQL', 'Express', 'Tailwind CSS']),
        categoria: 'web',
        estado: 'completado',
        es_publico: 1,
        es_destacado: 1,
        orden_portfolio: 1
      },
      {
        codigo: 'WEB002',
        nombre: 'E-commerce Moderno',
        descripcion: 'Tienda online completa con carrito de compras, integración de pagos, gestión de inventario y panel administrativo.',
        imagen_principal: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?auto=format&fit=crop&w=800&q=80',
        repositorio: null,
        url_demo: null,
        tecnologias: JSON.stringify(['Vue.js', 'Laravel', 'MySQL', 'Stripe', 'Bootstrap']),
        categoria: 'ecommerce',
        estado: 'en_desarrollo',
        es_publico: 1,
        es_destacado: 0,
        orden_portfolio: 2
      },
      {
        codigo: 'APP001',
        nombre: 'App Móvil de Delivery',
        descripcion: 'Aplicación móvil para pedidos de comida con geolocalización, seguimiento en tiempo real y múltiples métodos de pago.',
        imagen_principal: 'https://images.unsplash.com/photo-1512941937669-90a1b58e7e9c?auto=format&fit=crop&w=800&q=80',
        repositorio: null,
        url_demo: null,
        tecnologias: JSON.stringify(['React Native', 'Firebase', 'Google Maps API', 'PayPal']),
        categoria: 'mobile',
        estado: 'completado',
        es_publico: 1,
        es_destacado: 1,
        orden_portfolio: 3
      }
    ];
    
    for (const project of sampleProjects) {
      await pool.execute(
        'INSERT INTO proyectos (codigo, nombre, descripcion, imagen_principal, repositorio, url_demo, tecnologias, categoria, estado, es_publico, es_destacado, orden_portfolio) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
        [
          project.codigo,
          project.nombre,
          project.descripcion,
          project.imagen_principal,
          project.repositorio,
          project.url_demo,
          project.tecnologias,
          project.categoria,
          project.estado,
          project.es_publico,
          project.es_destacado,
          project.orden_portfolio
        ]
      );
    }
    
    res.json({
      success: true,
      message: `Se crearon ${sampleProjects.length} proyectos de muestra exitosamente`,
      data: sampleProjects.map(p => ({ codigo: p.codigo, nombre: p.nombre }))
    });
    
  } catch (error) {
    console.error('Error creando datos de muestra:', error);
    res.status(500).json({
      success: false,
      message: 'Error creando datos de muestra',
      error: error.message
    });
  }
});

// Rutas para gestión de imágenes
router.post('/upload-image', 
  uploadMiddleware.single('image'), 
  handleMulterError,
  validateFileMiddleware({
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    required: true
  }), 
  uploadProjectImage
);

router.post('/:projectId/gallery', 
  validateIdMiddleware('projectId'),
  uploadMiddleware.array('images', 5), 
  handleMulterError,
  validateFileMiddleware({
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedMimeTypes: ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'],
    required: true
  }),
  uploadProjectGallery
);

router.get('/:projectId/gallery', validateIdMiddleware('projectId'), getProjectGallery);
router.delete('/images/:imageId', validateIdMiddleware('imageId'), deleteProjectImage);

// Rutas protegidas (requieren autenticación admin)
// TODO: Agregar middleware de autenticación para admin
router.post('/', validateProjectMiddleware, createProject);
router.put('/:id', validateIdMiddleware('id'), validateProjectMiddleware, updateProject);
router.delete('/:id', validateIdMiddleware('id'), deleteProject);

module.exports = router;