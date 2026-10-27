require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');

const env = require('./config/env');
const { connectDB } = require('./config/db');

const productoRoutes = require('./routes/productoRoutes');
const ventaRoutes = require('./routes/ventaRoutes');
const clienteRoutes = require('./routes/clienteRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const healthRoutes = require('./routes/healthRoutes');
const errorHandler = require('./middleware/errorHandler');

const app = express();

// ----------------------------------------------------------------------------
// Seguridad y middleware global
// ----------------------------------------------------------------------------
app.use(helmet());
app.use(
  cors({
    origin: env.frontendUrl,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE']
  })
);
// Límite razonable para el cuerpo JSON (100kb).
app.use(express.json({ limit: '100kb' }));
if (env.nodeEnv === 'development') {
  app.use(morgan('dev'));
}

// ----------------------------------------------------------------------------
// Rutas bajo el prefijo /api
// ----------------------------------------------------------------------------
app.use('/api', healthRoutes);
app.use('/api', productoRoutes);
app.use('/api', ventaRoutes);
app.use('/api', clienteRoutes);
app.use('/api', dashboardRoutes);

// Ruta raíz informativa.
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API de la tienda de computadoras',
    documentacion: 'Consulta /api/health para verificar el estado'
  });
});

// 404: ruta no encontrada.
app.use((req, res) => {
  res.status(404).json({ mensaje: `Ruta no encontrada: ${req.method} ${req.originalUrl}` });
});

// Manejador central de errores.
app.use(errorHandler);

// ----------------------------------------------------------------------------
// Arranque del servidor
// ----------------------------------------------------------------------------
async function iniciar() {
  try {
    await connectDB();
    app.listen(env.port, () => {
      console.log(`Servidor corriendo en http://localhost:${env.port}`);
      console.log(`Tasa de impuesto: ${env.taxRate * 100}% | Moneda: ${env.currency}`);
    });
  } catch (error) {
    console.error('No se pudo iniciar el servidor:', error.message);
    process.exit(1);
  }
}

iniciar();

module.exports = app;
