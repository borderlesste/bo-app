const request = require('supertest');
const mysql = require('mysql2/promise');
const app = require('../../src/index');

// Integration tests with real database
describe('API Integration Tests', () => {
  let testUser;
  let authToken;
  let testProject;

  beforeAll(async () => {
    // Wait for app to be ready
    await new Promise(resolve => setTimeout(resolve, 1000));
  });

  afterAll(async () => {
    // Clean up test data
    if (testUser) {
      await global.testDb.execute('DELETE FROM usuarios WHERE id = ?', [testUser.id]);
    }
    if (testProject) {
      await global.testDb.execute('DELETE FROM proyectos WHERE id = ?', [testProject.id]);
    }
  });

  describe('Authentication Flow', () => {
    it('should register a new user', async () => {
      const userData = {
        nombre: 'Integration Test User',
        email: 'integration@test.com',
        password: 'password123',
        telefono: '1234567890',
        empresa: 'Test Company'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      
      // Store user for cleanup
      const [users] = await global.testDb.execute(
        'SELECT * FROM usuarios WHERE email = ?',
        [userData.email]
      );
      testUser = users[0];
    });

    it('should login with registered user', async () => {
      const loginData = {
        email: 'integration@test.com',
        password: 'password123'
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.token).toBeDefined();
      
      authToken = response.body.token;
    });

    it('should access protected route with valid token', async () => {
      const response = await request(app)
        .get('/api/admin/stats')
        .set('Authorization', `Bearer ${authToken}`);

      // May return 403 if user is not admin, but should not be 401
      expect(response.status).not.toBe(401);
    });
  });

  describe('Projects CRUD Flow', () => {
    beforeAll(async () => {
      // Create an admin user for project operations
      const adminUser = await global.testUtils.createTestUser({
        email: 'admin@test.com',
        rol: 'admin'
      });
      authToken = global.testUtils.generateAuthToken(adminUser.id, 'admin');
    });

    it('should create a new project', async () => {
      const projectData = {
        titulo: 'Integration Test Project',
        descripcion: 'A project created during integration testing',
        categoria: 'web',
        tecnologias: ['React', 'Node.js', 'MySQL'],
        estado: 'planificado',
        fecha_inicio: '2024-03-01',
        presupuesto: 5000.00
      };

      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send(projectData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBeDefined();
      
      testProject = { id: response.body.data.id };
    });

    it('should get the created project', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.titulo).toBe('Integration Test Project');
    });

    it('should update the project', async () => {
      const updateData = {
        titulo: 'Updated Integration Test Project',
        estado: 'en_progreso'
      };

      const response = await request(app)
        .put(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify the update
      const getResponse = await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.body.data.titulo).toBe('Updated Integration Test Project');
      expect(getResponse.body.data.estado).toBe('en_progreso');
    });

    it('should get projects list with pagination', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.pagination).toBeDefined();
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should filter projects by category', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ categoria: 'web' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // All returned projects should be 'web' category
      response.body.data.forEach(project => {
        expect(project.categoria).toBe('web');
      });
    });

    it('should search projects by title', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .query({ search: 'Integration' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      
      // Should find our test project
      const foundProject = response.body.data.find(
        p => p.id === testProject.id
      );
      expect(foundProject).toBeDefined();
    });

    it('should delete the project', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify deletion
      const getResponse = await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(getResponse.status).toBe(404);
      
      testProject = null; // Mark as deleted for cleanup
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app)
        .get('/api/health');

      expect(response.status).toBe(200);
      expect(response.body.status).toBeDefined();
      expect(response.body.database).toBeDefined();
    });
  });

  describe('Error Handling', () => {
    it('should handle 404 for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route');

      expect(response.status).toBe(404);
    });

    it('should handle validation errors', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ invalid: 'data' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle unauthorized access', async () => {
      const response = await request(app)
        .get('/api/admin/stats');

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });
});