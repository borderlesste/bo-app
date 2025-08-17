const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const invoicesController = require('../controllers/invoicesController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');
const { validateInvoice, validateInvoiceStatus } = require('../middleware/validationMiddleware');

// Rate limiting for invoice operations
const invoiceRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Demasiadas solicitudes de facturas. Intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting to all routes
router.use(invoiceRateLimit);

// Apply authentication to all routes
router.use(isAuthenticated);

// GET /api/invoices - Get all invoices with pagination and filters
router.get('/', isAdmin, invoicesController.getAllInvoices);

// GET /api/invoices/stats - Get invoice statistics
router.get('/stats', isAdmin, invoicesController.getInvoiceStats);

// GET /api/invoices/:id - Get single invoice by ID
router.get('/:id', isAdmin, invoicesController.getInvoiceById);

// POST /api/invoices - Create new invoice
router.post('/', isAdmin, validateInvoice, invoicesController.createInvoice);

// POST /api/invoices/generate-from-quotation - Generate invoice from quotation
router.post('/generate-from-quotation', isAdmin, invoicesController.generateFromQuotation);

// PUT /api/invoices/:id/status - Update invoice status
router.put('/:id/status', isAdmin, validateInvoiceStatus, invoicesController.updateInvoiceStatus);

module.exports = router;