const mongoose = require('mongoose');

const ProductoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre es obligatorio'],
      trim: true
    },
    marca: {
      type: String,
      required: [true, 'La marca es obligatoria'],
      trim: true
    },
    modelo: {
      type: String,
      required: [true, 'El modelo es obligatorio'],
      trim: true
    },
    categoria: {
      type: String,
      required: [true, 'La categoría es obligatoria'],
      trim: true
    },
    descripcion: {
      type: String,
      trim: true,
      default: ''
    },
    sku: {
      type: String,
      required: [true, 'El SKU es obligatorio'],
      unique: true,
      trim: true,
      uppercase: true
    },
    precioCompra: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'El precio de compra no puede ser negativo']
    },
    precioVenta: {
      type: Number,
      required: [true, 'El precio de venta es obligatorio'],
      min: [0.01, 'El precio de venta debe ser mayor que cero']
    },
    stock: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'El stock no puede ser negativo'],
      validate: {
        validator: Number.isInteger,
        message: 'El stock debe ser un número entero'
      }
    },
    stockMinimo: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'El stock mínimo no puede ser negativo'],
      validate: {
        validator: Number.isInteger,
        message: 'El stock mínimo debe ser un número entero'
      }
    },
    estado: {
      type: String,
      enum: {
        values: ['activo', 'inactivo'],
        message: 'El estado debe ser "activo" o "inactivo"'
      },
      default: 'activo'
    }
  },
  {
    timestamps: true,
    // Incluye los campos virtuales y normaliza la salida JSON.
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Índices para búsquedas y filtros frecuentes.
// sku ya tiene índice único por unique: true.
ProductoSchema.index({ nombre: 1 });
ProductoSchema.index({ categoria: 1 });
ProductoSchema.index({ marca: 1 });
ProductoSchema.index({ estado: 1 });
ProductoSchema.index({ nombre: 'text', sku: 'text' });

// Virtual: indica si el stock está por debajo del mínimo.
ProductoSchema.virtual('stockBajo').get(function () {
  return this.stock <= this.stockMinimo;
});

// Virtual: indica si el producto está agotado.
ProductoSchema.virtual('agotado').get(function () {
  return this.stock === 0;
});

module.exports = mongoose.model('Producto', ProductoSchema, 'productos');
