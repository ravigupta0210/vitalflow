const express = require('express');
const router = express.Router();
const { authenticateJWT } = require('../middleware/auth');
const { getSettings, updateSettings } = require('../controllers/settingsController');

// All settings routes require authentication
router.use(authenticateJWT);

// GET /api/settings - Get user settings
router.get('/', getSettings);

// PUT /api/settings - Update user settings
router.put('/', updateSettings);

module.exports = router;
