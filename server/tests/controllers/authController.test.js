const request = require('supertest');
const express = require('express');
const bcrypt = require('bcrypt');
const authRoutes = require('../../src/routes/auth');
const { pool } = require('../../src/config/db');

// Mock the database pool
jest.mock('../../src/config/db', () => ({
  pool: {
    execute: jest.fn()
  }
}));

const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Controller', () => {
  describe('POST /api/auth/register', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should register a new user successfully', async () => {
      const userData = {
        nombre: 'John Doe',
        email: 'john@example.com',
        password: 'password123',
        telefono: '1234567890',
        empresa: 'Test Company'
      };

      // Mock database responses
      pool.execute
        .mockResolvedValueOnce([[]]) // Check if user exists (empty result)
        .mockResolvedValueOnce([{ insertId: 1 }]); // Insert user

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Usuario registrado exitosamente');
      expect(pool.execute).toHaveBeenCalledTimes(2);
    });

    it('should return error if user already exists', async () => {
      const userData = {
        nombre: 'John Doe',
        email: 'existing@example.com',
        password: 'password123',
        telefono: '1234567890',
        empresa: 'Test Company'
      };

      // Mock user already exists
      pool.execute.mockResolvedValueOnce([[{ id: 1 }]]);

      const response = await request(app)
        .post('/api/auth/register')
        .send(userData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('El usuario ya existe');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        nombre: 'John Doe'
        // Missing required fields
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate email format', async () => {
      const invalidData = {
        nombre: 'John Doe',
        email: 'invalid-email',
        password: 'password123',
        telefono: '1234567890',
        empresa: 'Test Company'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should validate password strength', async () => {
      const invalidData = {
        nombre: 'John Doe',
        email: 'john@example.com',
        password: '123', // Too short
        telefono: '1234567890',
        empresa: 'Test Company'
      };

      const response = await request(app)
        .post('/api/auth/register')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(() => {
      jest.clearAllMocks();
    });

    it('should login user with valid credentials', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'password123'
      };

      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 1,
        nombre: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        rol: 'client'
      };

      pool.execute.mockResolvedValueOnce([[mockUser]]);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.user.email).toBe(loginData.email);
      expect(response.body.token).toBeDefined();
    });

    it('should return error for invalid email', async () => {
      const loginData = {
        email: 'nonexistent@example.com',
        password: 'password123'
      };

      pool.execute.mockResolvedValueOnce([[]]);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Credenciales inválidas');
    });

    it('should return error for invalid password', async () => {
      const loginData = {
        email: 'john@example.com',
        password: 'wrongpassword'
      };

      const hashedPassword = await bcrypt.hash('password123', 10);
      const mockUser = {
        id: 1,
        nombre: 'John Doe',
        email: 'john@example.com',
        password: hashedPassword,
        rol: 'client'
      };

      pool.execute.mockResolvedValueOnce([[mockUser]]);

      const response = await request(app)
        .post('/api/auth/login')
        .send(loginData);

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
      expect(response.body.error).toBe('Credenciales inválidas');
    });

    it('should validate required fields', async () => {
      const invalidData = {
        email: 'john@example.com'
        // Missing password
      };

      const response = await request(app)
        .post('/api/auth/login')
        .send(invalidData);

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout user successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.message).toBe('Sesión cerrada exitosamente');
    });
  });
});