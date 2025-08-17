const mysql = require('mysql2/promise');

// Test database configuration
const testDbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME + '_test' || 'borderless_test',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
};

let testPool;

beforeAll(async () => {
  // Create test database if it doesn't exist
  const connection = await mysql.createConnection({
    host: testDbConfig.host,
    port: testDbConfig.port,
    user: testDbConfig.user,
    password: testDbConfig.password
  });

  await connection.execute(`CREATE DATABASE IF NOT EXISTS ${testDbConfig.database}`);
  await connection.end();

  // Create connection pool for tests
  testPool = mysql.createPool(testDbConfig);

  // Set up test environment variables
  process.env.NODE_ENV = 'test';
  process.env.DB_NAME = testDbConfig.database;
  process.env.JWT_SECRET = 'test-jwt-secret';
  process.env.SESSION_SECRET = 'test-session-secret';
});

afterAll(async () => {
  if (testPool) {
    await testPool.end();
  }
});

// Clean database before each test
beforeEach(async () => {
  if (testPool) {
    // Get all tables
    const [tables] = await testPool.execute(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = ?
    `, [testDbConfig.database]);

    // Disable foreign key checks
    await testPool.execute('SET FOREIGN_KEY_CHECKS = 0');

    // Truncate all tables
    for (const table of tables) {
      await testPool.execute(`TRUNCATE TABLE ${table.table_name}`);
    }

    // Re-enable foreign key checks
    await testPool.execute('SET FOREIGN_KEY_CHECKS = 1');
  }
});

// Global test utilities
global.testDb = testPool;
global.testUtils = {
  createTestUser: async (userData = {}) => {
    const bcrypt = require('bcrypt');
    const defaultUser = {
      nombre: 'Test User',
      email: 'test@example.com',
      password: await bcrypt.hash('password123', 10),
      rol: 'client',
      telefono: '1234567890',
      empresa: 'Test Company'
    };

    const user = { ...defaultUser, ...userData };
    const [result] = await testPool.execute(
      'INSERT INTO usuarios (nombre, email, password, rol, telefono, empresa) VALUES (?, ?, ?, ?, ?, ?)',
      [user.nombre, user.email, user.password, user.rol, user.telefono, user.empresa]
    );

    return { id: result.insertId, ...user };
  },

  createTestProject: async (projectData = {}) => {
    const defaultProject = {
      titulo: 'Test Project',
      descripcion: 'Test project description',
      categoria: 'web',
      tecnologias: JSON.stringify(['React', 'Node.js']),
      estado: 'completado',
      fecha_inicio: new Date(),
      fecha_fin: new Date(),
      presupuesto: 5000.00,
      usuario_id: null,
      imagen_principal: 'test-image.jpg'
    };

    const project = { ...defaultProject, ...projectData };
    const [result] = await testPool.execute(`
      INSERT INTO proyectos (titulo, descripcion, categoria, tecnologias, estado, 
                           fecha_inicio, fecha_fin, presupuesto, usuario_id, imagen_principal) 
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      project.titulo, project.descripcion, project.categoria, project.tecnologias,
      project.estado, project.fecha_inicio, project.fecha_fin, project.presupuesto,
      project.usuario_id, project.imagen_principal
    ]);

    return { id: result.insertId, ...project };
  },

  generateAuthToken: (userId, role = 'client') => {
    const jwt = require('jsonwebtoken');
    return jwt.sign(
      { id: userId, role },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  }
};

// Mock console methods to reduce noise in tests
global.console = {
  ...console,
  log: jest.fn(),
  debug: jest.fn(),
  info: jest.fn(),
  warn: jest.fn(),
  error: jest.fn()
};