const express = require('express');
const { body } = require('express-validator');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
  getUnreadCount
} = require('../controllers/notificationsController.js');
const { isAuthenticated } = require('../middleware/authMiddleware.js');
const { 
  sanitizationMiddleware,
  validateNotificationMiddleware,
  validateIdMiddleware,
  createRateLimitMiddleware
} = require('../middleware/validationMiddleware.js');

const router = express.Router();

// Aplicar rate limiting y sanitización a todas las rutas
router.use(createRateLimitMiddleware(200, 15 * 60 * 1000)); // 200 requests per 15 minutes
router.use(sanitizationMiddleware);

// Get user notifications
router.get('/', isAuthenticated, getNotifications);

// Get unread count
router.get('/unread-count', isAuthenticated, getUnreadCount);

// Create notification
router.post('/', 
  isAuthenticated,
  validateNotificationMiddleware,
  createNotification
);

// Mark notification as read
router.put('/:id/read', isAuthenticated, validateIdMiddleware('id'), markAsRead);

// Mark all notifications as read
router.put('/mark-all-read', isAuthenticated, markAllAsRead);

// Delete notification
router.delete('/:id', isAuthenticated, validateIdMiddleware('id'), deleteNotification);

module.exports = router;