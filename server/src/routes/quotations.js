const express = require('express');
const router = express.Router();
const {
  getAllQuotations,
  getQuotationById,
  createQuotation,
  updateQuotation,
  deleteQuotation,
  updateQuotationStatus,
  convertQuotationToProject,
  getQuotationStats
} = require('../controllers/quotationsController.js');
const { isAuthenticated, requireRole } = require('../middleware/authMiddleware.js');
const { 
  sanitizationMiddleware,
  validateQuotationMiddleware,
  validateIdMiddleware,
  createRateLimitMiddleware
} = require('../middleware/validationMiddleware.js');

// Apply rate limiting and sanitization to all routes
router.use(createRateLimitMiddleware(100, 15 * 60 * 1000)); // 100 requests per 15 minutes
router.use(sanitizationMiddleware);

// All routes require authentication and admin role
router.use(isAuthenticated);
router.use(requireRole('admin'));

// Quotation statistics (dashboard)
router.get('/stats', getQuotationStats);

// Get all quotations with filters and pagination
router.get('/', getAllQuotations);

// Get single quotation by ID
router.get('/:id', validateIdMiddleware('id'), getQuotationById);

// Create new quotation
router.post('/', validateQuotationMiddleware, createQuotation);

// Update quotation
router.put('/:id', validateIdMiddleware('id'), validateQuotationMiddleware, updateQuotation);

// Update quotation status
router.put('/:id/status', validateIdMiddleware('id'), updateQuotationStatus);

// Convert quotation to project
router.post('/:id/convert', validateIdMiddleware('id'), convertQuotationToProject);

// Delete quotation (soft delete)
router.delete('/:id', validateIdMiddleware('id'), deleteQuotation);

module.exports = router;