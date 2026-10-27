require('dotenv').config();

// Configuración centralizada a partir de las variables de entorno.
// Se validan los valores críticos para fallar temprano si algo falta.
const env = {
  port: parseInt(process.env.PORT, 10) || 3000,
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/tienda_computadoras_db',
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:5173',
  // Tasa de impuesto. 0.18 = 18%. Se valida que sea un número no negativo.
  taxRate: Number.isFinite(parseFloat(process.env.TAX_RATE)) ? parseFloat(process.env.TAX_RATE) : 0,
  currency: process.env.CURRENCY || 'PEN',
  nodeEnv: process.env.NODE_ENV || 'development',
  tienda: {
    nombre: process.env.TIENDA_NOMBRE || 'Tienda de Computadoras',
    ruc: process.env.TIENDA_RUC || '',
    direccion: process.env.TIENDA_DIRECCION || '',
    telefono: process.env.TIENDA_TELEFONO || '',
    correo: process.env.TIENDA_CORREO || ''
  }
};

if (env.taxRate < 0) {
  throw new Error('TAX_RATE no puede ser negativo.');
}

module.exports = env;
