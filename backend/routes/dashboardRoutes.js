const express = require('express');
const controller = require('../controllers/dashboardController');

const router = express.Router();

// GET /api/dashboard/resumen - indicadores del panel
router.get('/dashboard/resumen', controller.obtenerResumen);

module.exports = router;
