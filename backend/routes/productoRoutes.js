const express = require('express');
const controller = require('../controllers/productoController');

const router = express.Router();

// GET /api/productos - listar con búsqueda, filtros y paginación
router.get('/productos', controller.listarProductos);

// GET /api/productos/:id - consultar un producto
router.get('/productos/:id', controller.obtenerProducto);

// POST /api/productos - crear un producto
router.post('/productos', controller.crearProducto);

// PUT /api/productos/:id - actualizar un producto
router.put('/productos/:id', controller.actualizarProducto);

// PATCH /api/productos/:id - actualizar parcialmente un producto
router.patch('/productos/:id', controller.actualizarProducto);

// PATCH /api/productos/:id/estado - activar o desactivar
router.patch('/productos/:id/estado', controller.cambiarEstadoProducto);

// DELETE /api/productos/:id - eliminar solo si no tiene ventas
router.delete('/productos/:id', controller.eliminarProducto);

module.exports = router;
