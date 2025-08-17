const request = require('supertest');
const express = require('express');
const projectsRoutes = require('../../src/routes/projects');
const { pool } = require('../../src/config/db');
const authMiddleware = require('../../src/middleware/authMiddleware');

// Mock dependencies
jest.mock('../../src/config/db', () => ({
  pool: {
    execute: jest.fn()
  }
}));

jest.mock('../../src/middleware/authMiddleware', () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1, role: 'admin' };
    next();
  },
  requireAdmin: (req, res, next) => {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Admin access required' });
    }
    next();
  }
}));

const app = express();
app.use(express.json());
app.use('/api/projects', projectsRoutes);

describe('Projects Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET /api/projects', () => {
    it('should get all projects with pagination', async () => {
      const mockProjects = [
        {
          id: 1,
          titulo: 'Test Project 1',
          descripcion: 'Description 1',
          categoria: 'web',
          tecnologias: '["React", "Node.js"]',
          estado: 'completado',
          fecha_inicio: '2024-01-01',
          fecha_fin: '2024-02-01',
          presupuesto: 5000.00,
          imagen_principal: 'image1.jpg'
        },
        {
          id: 2,
          titulo: 'Test Project 2',
          descripcion: 'Description 2',
          categoria: 'mobile',
          tecnologias: '["React Native"]',
          estado: 'en_progreso',
          fecha_inicio: '2024-02-01',
          fecha_fin: null,
          presupuesto: 8000.00,
          imagen_principal: 'image2.jpg'
        }
      ];

      const mockCount = [{ total: 2 }];

      pool.execute
        .mockResolvedValueOnce([mockProjects]) // Projects query
        .mockResolvedValueOnce([mockCount]); // Count query

      const response = await request(app)
        .get('/api/projects')
        .query({ page: 1, limit: 10 });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.total).toBe(2);
      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });

    it('should filter projects by category', async () => {
      const mockProjects = [
        {
          id: 1,
          titulo: 'Web Project',
          categoria: 'web',
          tecnologias: '["React"]',
          estado: 'completado'
        }
      ];

      const mockCount = [{ total: 1 }];

      pool.execute
        .mockResolvedValueOnce([mockProjects])
        .mockResolvedValueOnce([mockCount]);

      const response = await request(app)
        .get('/api/projects')
        .query({ categoria: 'web' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].categoria).toBe('web');
    });

    it('should search projects by title', async () => {
      const mockProjects = [
        {
          id: 1,
          titulo: 'E-commerce Project',
          categoria: 'web',
          tecnologias: '["React"]',
          estado: 'completado'
        }
      ];

      const mockCount = [{ total: 1 }];

      pool.execute
        .mockResolvedValueOnce([mockProjects])
        .mockResolvedValueOnce([mockCount]);

      const response = await request(app)
        .get('/api/projects')
        .query({ search: 'commerce' });

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].titulo).toContain('commerce');
    });
  });

  describe('GET /api/projects/:id', () => {
    it('should get a single project by ID', async () => {
      const mockProject = {
        id: 1,
        titulo: 'Test Project',
        descripcion: 'Test description',
        categoria: 'web',
        tecnologias: '["React", "Node.js"]',
        estado: 'completado',
        fecha_inicio: '2024-01-01',
        fecha_fin: '2024-02-01',
        presupuesto: 5000.00,
        imagen_principal: 'image.jpg'
      };

      pool.execute.mockResolvedValueOnce([[mockProject]]);

      const response = await request(app)
        .get('/api/projects/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(1);
      expect(response.body.data.titulo).toBe('Test Project');
    });

    it('should return 404 for non-existent project', async () => {
      pool.execute.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .get('/api/projects/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Proyecto no encontrado');
    });

    it('should return 400 for invalid ID format', async () => {
      const response = await request(app)
        .get('/api/projects/invalid-id');

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const projectData = {
        titulo: 'New Project',
        descripcion: 'New project description',
        categoria: 'web',
        tecnologias: ['React', 'Node.js'],
        estado: 'planificado',
        fecha_inicio: '2024-03-01',
        presupuesto: 7000.00,
        usuario_id: 1
      };

      pool.execute.mockResolvedValueOnce([{ insertId: 1 }]);

      const response = await request(app)
        .post('/api/projects')
        .send(projectData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Proyecto creado exitosamente');
      expect(response.body.data.id).toBe(1);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        descripcion: 'Missing title'
      };

      const response = await request(app)
        .post('/api/projects')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate enum values', async () => {
      const invalidData = {
        titulo: 'Test Project',
        descripcion: 'Test description',
        categoria: 'invalid-category',
        tecnologias: ['React'],
        estado: 'invalid-status'
      };

      const response = await request(app)
        .post('/api/projects')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /api/projects/:id', () => {
    it('should update an existing project', async () => {
      const updateData = {
        titulo: 'Updated Project',
        descripcion: 'Updated description',
        estado: 'completado'
      };

      // Mock project exists check
      pool.execute
        .mockResolvedValueOnce([[{ id: 1 }]]) // Check if exists
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Update

      const response = await request(app)
        .put('/api/projects/1')
        .send(updateData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Proyecto actualizado exitosamente');
    });

    it('should return 404 for non-existent project', async () => {
      pool.execute.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .put('/api/projects/999')
        .send({ titulo: 'Updated Title' });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Proyecto no encontrado');
    });
  });

  describe('DELETE /api/projects/:id', () => {
    it('should delete an existing project', async () => {
      // Mock project exists check
      pool.execute
        .mockResolvedValueOnce([[{ id: 1 }]]) // Check if exists
        .mockResolvedValueOnce([{ affectedRows: 1 }]); // Delete

      const response = await request(app)
        .delete('/api/projects/1');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Proyecto eliminado exitosamente');
    });

    it('should return 404 for non-existent project', async () => {
      pool.execute.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .delete('/api/projects/999');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Proyecto no encontrado');
    });
  });
});