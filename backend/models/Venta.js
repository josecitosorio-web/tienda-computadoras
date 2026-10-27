const mongoose = require('mongoose');

// Esquema de un ítem vendido. Conserva datos históricos del producto
// para que ventas anteriores no cambien al actualizar el producto.
const VentaItemSchema = new mongoose.Schema(
  {
    productoId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Producto',
      required: true
    },
    nombreProducto: { type: String, required: true },
    sku: { type: String, required: true },
    marca: { type: String, default: '' },
    cantidad: {
      type: Number,
      required: true,
      min: [1, 'La cantidad debe ser al menos 1'],
      validate: {
        validator: Number.isInteger,
        message: 'La cantidad debe ser un número entero'
      }
    },
    precioUnitario: {
      type: Number,
      required: true,
      min: [0, 'El precio unitario no puede ser negativo']
    },
    subtotal: {
      type: Number,
      required: true,
      min: [0, 'El subtotal no puede ser negativo']
    }
  },
  { _id: false }
);

const VentaSchema = new mongoose.Schema(
  {
    numeroVenta: {
      type: String,
      required: true,
      unique: true,
      index: true
    },
    fecha: {
      type: Date,
      default: Date.now,
      required: true
    },
    clienteId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Cliente',
      default: null
    },
    // Copia de los datos del cliente al momento de la venta.
    clienteSnapshot: {
      nombreCompleto: { type: String, default: '' },
      documentoTipo: { type: String, default: '' },
      documentoNumero: { type: String, default: '' }
    },
    items: {
      type: [VentaItemSchema],
      validate: {
        validator: (v) => Array.isArray(v) && v.length > 0,
        message: 'La venta debe tener al menos un producto'
      }
    },
    subtotal: { type: Number, required: true, min: 0 },
    descuento: { type: Number, required: true, default: 0, min: 0 },
    impuesto: { type: Number, required: true, default: 0, min: 0 },
    total: { type: Number, required: true, min: 0 },
    metodoPago: {
      type: String,
      required: true,
      enum: {
        values: ['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'],
        message: 'Método de pago no válido'
      },
      default: 'Efectivo'
    },
    estado: {
      type: String,
      enum: {
        values: ['completada', 'anulada'],
        message: 'Estado de venta no válido'
      },
      default: 'completada',
      index: true
    },
    observaciones: { type: String, default: '' },
    // Marca si el stock ya fue restaurado para evitar restauraciones dobles.
    stockRestaurado: { type: Boolean, default: false }
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

VentaSchema.index({ fecha: -1 });
VentaSchema.index({ createdAt: -1 });
VentaSchema.index({ estado: 1, fecha: -1 });

module.exports = mongoose.model('Venta', VentaSchema, 'ventas');
