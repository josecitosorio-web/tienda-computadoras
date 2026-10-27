const ApiError = require('./ApiError');
const env = require('../config/env');

// Manejador central de errores. Convierte errores de Mongoose
// (validación, duplicados, ObjectId inválido) en respuestas HTTP claras.
function errorHandler(err, req, res, next) {
  // Si ya es un error operacional que controlamos, lo devolvemos tal cual.
  if (err instanceof ApiError) {
    return res.status(err.statusCode).json({
      mensaje: err.message,
      ...(err.details ? { detalles: err.details } : {})
    });
  }

  // Error de Mongoose por validación.
  if (err.name === 'ValidationError') {
    const detalles = Object.values(err.errors).map((e) => e.message);
    return res.status(400).json({
      mensaje: 'Datos no válidos',
      detalles
    });
  }

  // Campo duplicado (índice único, p. ej. SKU o número de venta).
  if (err.code === 11000) {
    const campo = Object.keys(err.keyValue || {})[0] || 'campo';
    return res.status(409).json({
      mensaje: `El valor de "${campo}" ya existe y debe ser único`
    });
  }

  // ObjectId mal formado en rutas o consultas.
  if (err.name === 'CastError') {
    return res.status(400).json({
      mensaje: `El identificador "${err.value}" no es válido`
    });
  }

  // Error no esperado: no filtrar detalles internos al cliente.
  console.error('Error no controlado:', err);
  return res.status(500).json({
    mensaje: 'Error interno del servidor'
  });
}

module.exports = errorHandler;
