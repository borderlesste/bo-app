const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const { createPublicQuote } = require('../controllers/publicController');

// Rate limiting for public routes (more restrictive)
const publicRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 requests per windowMs
  message: {
    success: false,
    error: 'Demasiadas solicitudes, intenta de nuevo más tarde'
  }
});

// Apply rate limiting to all public routes
router.use(publicRateLimit);

// Public quote request endpoint
router.post('/quotes', createPublicQuote);

module.exports = router;