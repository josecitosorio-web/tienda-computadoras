const mongoose = require('mongoose');

const ClienteSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    apellido: {
      type: String,
      trim: true,
      default: ''
    },
    documentoTipo: {
      type: String,
      trim: true,
      default: '',
      // Ejemplos: DNI, RUC, CE, PASAPORTE
    },
    documentoNumero: {
      type: String,
      trim: true,
      default: ''
    },
    telefono: {
      type: String,
      trim: true,
      default: ''
    },
    correo: {
      type: String,
      trim: true,
      lowercase: true,
      default: ''
    },
    direccion: {
      type: String,
      trim: true,
      default: ''
    }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Nombre completo virtual para facilitar la presentación.
ClienteSchema.virtual('nombreCompleto').get(function () {
  return [this.nombre, this.apellido].filter(Boolean).join(' ').trim();
});

ClienteSchema.index({ nombre: 1 });
ClienteSchema.index({ documentoNumero: 1 });
ClienteSchema.index({ nombre: 'text', apellido: 'text', documentoNumero: 'text' });

module.exports = mongoose.model('Cliente', ClienteSchema, 'clientes');
