const express = require('express');
const controller = require('../controllers/healthController');

const router = express.Router();

// GET /api/health - estado del servidor y de MongoDB
router.get('/health', controller.health);

module.exports = router;
