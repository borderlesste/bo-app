const express = require('express');
const router = express.Router();
const {
  getAllClients,
  getClientById,
  createClient,
  updateClient,
  deleteClient,
  getClientStats,
  sendMessageToClient
} = require('../controllers/clientsController.js');
const { isAuthenticated, requireRole } = require('../middleware/authMiddleware.js');
const { 
  sanitizationMiddleware,
  validateClientMiddleware,
  validateIdMiddleware,
  validateMessageMiddleware,
  createRateLimitMiddleware
} = require('../middleware/validationMiddleware.js');

// Apply rate limiting and sanitization to all routes
router.use(createRateLimitMiddleware(150, 15 * 60 * 1000)); // 150 requests per 15 minutes
router.use(sanitizationMiddleware);

// All routes require authentication and admin role
router.use(isAuthenticated);
router.use(requireRole('admin'));

// Client statistics (dashboard)
router.get('/stats', getClientStats);

// Get all clients with filters and pagination
router.get('/', getAllClients);

// Get single client by ID
router.get('/:id', validateIdMiddleware('id'), getClientById);

// Create new client
router.post('/', validateClientMiddleware, createClient);

// Update client
router.put('/:id', validateIdMiddleware('id'), validateClientMiddleware, updateClient);

// Delete client (soft delete)
router.delete('/:id', validateIdMiddleware('id'), deleteClient);

// Send message to client
router.post('/:id/message', validateIdMiddleware('id'), validateMessageMiddleware, sendMessageToClient);

module.exports = router;