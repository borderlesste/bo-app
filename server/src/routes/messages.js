const express = require('express');
const router = express.Router();
const { body } = require('express-validator');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const messagesController = require('../controllers/messagesController');

// All routes require authentication
router.use(isAuthenticated);

// Validation middleware
const createConversationValidation = [
  body('asunto').notEmpty().withMessage('El asunto es requerido'),
  body('contenido').notEmpty().withMessage('El contenido es requerido')
];

const sendMessageValidation = [
  body('contenido').notEmpty().withMessage('El contenido es requerido')
];

// CLIENT ROUTES (conversaciones siempre dirigidas al admin)
router.get('/client/conversations', messagesController.getClientConversations);
router.post('/client/conversations', createConversationValidation, messagesController.startClientConversation);
router.get('/client/conversations/:conversationId/messages', messagesController.getConversationMessages);
router.post('/client/conversations/:conversationId/messages', sendMessageValidation, messagesController.sendMessage);

// ADMIN ROUTES (solo para admins)
router.get('/admin/conversations', isAdmin, messagesController.getAdminConversations);
router.get('/admin/conversations/:conversationId/messages', isAdmin, messagesController.getConversationMessages);
router.post('/admin/conversations/:conversationId/reply', isAdmin, sendMessageValidation, messagesController.adminReplyMessage);

module.exports = router;