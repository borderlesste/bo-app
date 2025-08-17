const jwt = require('jsonwebtoken');
const { authenticateToken, requireAdmin } = require('../../src/middleware/authMiddleware');

// Mock jwt
jest.mock('jsonwebtoken');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {},
      session: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should authenticate valid token from Authorization header', () => {
      const mockPayload = { id: 1, role: 'admin' };
      req.headers.authorization = 'Bearer valid-token';
      jwt.verify.mockReturnValue(mockPayload);

      authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('valid-token', process.env.JWT_SECRET);
      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should authenticate valid token from session', () => {
      const mockPayload = { id: 1, role: 'client' };
      req.session.token = 'session-token';
      jwt.verify.mockReturnValue(mockPayload);

      authenticateToken(req, res, next);

      expect(jwt.verify).toHaveBeenCalledWith('session-token', process.env.JWT_SECRET);
      expect(req.user).toEqual(mockPayload);
      expect(next).toHaveBeenCalled();
    });

    it('should return 401 when no token provided', () => {
      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token de acceso requerido'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for invalid token', () => {
      req.headers.authorization = 'Bearer invalid-token';
      jwt.verify.mockImplementation(() => {
        throw new Error('Invalid token');
      });

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token inválido'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 403 for expired token', () => {
      req.headers.authorization = 'Bearer expired-token';
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token expirado'
      });
    });

    it('should handle malformed Authorization header', () => {
      req.headers.authorization = 'InvalidFormat';

      authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Token de acceso requerido'
      });
    });
  });

  describe('requireAdmin', () => {
    it('should allow admin users', () => {
      req.user = { id: 1, role: 'admin' };

      requireAdmin(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block non-admin users', () => {
      req.user = { id: 2, role: 'client' };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acceso de administrador requerido'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should block users without role', () => {
      req.user = { id: 1 };

      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acceso de administrador requerido'
      });
    });

    it('should block requests without user', () => {
      requireAdmin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        success: false,
        error: 'Acceso de administrador requerido'
      });
    });
  });
});