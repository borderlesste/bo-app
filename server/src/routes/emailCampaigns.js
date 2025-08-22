const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const emailCampaignsController = require('../controllers/emailCampaignsController');
const { isAuthenticated, isAdmin } = require('../middleware/authMiddleware');

// Rate limiting for email campaigns
const campaignRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 50, // 50 requests per window
  message: {
    success: false,
    message: 'Demasiadas solicitudes de campañas. Intenta de nuevo en 15 minutos.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiting and authentication to all routes
router.use(campaignRateLimit);
router.use(isAuthenticated);
router.use(isAdmin); // Only admins can manage email campaigns

// GET /api/email-campaigns - Get all campaigns
router.get('/', emailCampaignsController.getAllCampaigns);

// GET /api/email-campaigns/:id - Get single campaign
router.get('/:id', emailCampaignsController.getCampaignById);

// POST /api/email-campaigns - Create new campaign
router.post('/', emailCampaignsController.createCampaign);

// PUT /api/email-campaigns/:id - Update campaign
router.put('/:id', emailCampaignsController.updateCampaign);

// DELETE /api/email-campaigns/:id - Delete campaign
router.delete('/:id', emailCampaignsController.deleteCampaign);

// POST /api/email-campaigns/:id/send - Send campaign
router.post('/:id/send', emailCampaignsController.sendCampaign);

module.exports = router;