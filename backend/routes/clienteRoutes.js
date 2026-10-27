const express = require('express');
const controller = require('../controllers/clienteController');

const router = express.Router();

// GET /api/clientes - listar con búsqueda y paginación
router.get('/clientes', controller.listarClientes);

// GET /api/clientes/:id - obtener un cliente
router.get('/clientes/:id', controller.obtenerCliente);

// POST /api/clientes - crear un cliente
router.post('/clientes', controller.crearCliente);

// PATCH /api/clientes/:id - actualizar un cliente
router.patch('/clientes/:id', controller.actualizarCliente);

// DELETE /api/clientes/:id - eliminar si no tiene ventas
router.delete('/clientes/:id', controller.eliminarCliente);

module.exports = router;
