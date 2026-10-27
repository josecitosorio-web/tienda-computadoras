const mongoose = require('mongoose');
const asyncHandler = require('../middleware/asyncHandler');
const { dbState } = require('../config/db');
const { soportaTransacciones } = require('../services/ventaService');
const env = require('../config/env');

// Estado de salud del servidor y de la conexión con MongoDB.
const health = asyncHandler(async (req, res) => {
  const estadoMongo = dbState();
  const conectado = mongoose.connection.readyState === 1;

  res.status(conectado ? 200 : 503).json({
    estado: conectado ? 'ok' : 'degradado',
    servidor: 'activo',
    baseDatos: {
      estado: estadoMongo,
      nombre: mongoose.connection.name || null
    },
    transaccionesDisponibles: soportaTransacciones(),
    impuestoConfigurado: env.taxRate,
    moneda: env.currency,
    timestamp: new Date().toISOString()
  });
});

module.exports = { health };
