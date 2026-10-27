const express = require('express');
const controller = require('../controllers/ventaController');

const router = express.Router();

// GET /api/ventas - listar con filtros por fecha, estado y número
router.get('/ventas', controller.listarVentas);

// GET /api/ventas/:id - detalle completo
router.get('/ventas/:id', controller.obtenerVenta);

// POST /api/ventas - registrar una venta (descuenta inventario)
router.post('/ventas', controller.crearVenta);

// PATCH /api/ventas/:id/anular - anular y restaurar stock una sola vez
router.patch('/ventas/:id/anular', controller.anularVenta);

module.exports = router;
