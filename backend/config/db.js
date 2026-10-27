const mongoose = require('mongoose');
const env = require('./env');

// Estado de la conexión para poder reportarlo desde /api/health.
const dbState = () => {
  // 0 = disconnected, 1 = connected, 2 = connecting, 3 = disconnecting
  const states = { 0: 'desconectado', 1: 'conectado', 2: 'conectando', 3: 'desconectando' };
  return states[mongoose.connection.readyState] || 'desconocido';
};

async function connectDB() {
  // Evita reconexiones duplicadas en entornos con recarga de módulos.
  mongoose.set('strictQuery', true);

  mongoose.connection.on('connected', () => console.log('MongoDB conectado'));
  mongoose.connection.on('error', (err) => console.error('Error de MongoDB:', err.message));
  mongoose.connection.on('disconnected', () => console.warn('MongoDB desconectado'));

  try {
    await mongoose.connect(env.mongoUri, {
      serverSelectionTimeoutMS: 8000
    });
  } catch (err) {
    console.error('No se pudo conectar a MongoDB:', err.message);
    throw err;
  }
}

module.exports = { connectDB, dbState };
