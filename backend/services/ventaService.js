const mongoose = require('mongoose');
const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const ApiError = require('../middleware/ApiError');
const { round2 } = require('../utils/money');
const env = require('../config/env');

// ----------------------------------------------------------------------------
// Utilidades
// ----------------------------------------------------------------------------

// Detecta si el servidor MongoDB permite transacciones (replSet o mongos).
// En una instancia standalone no están disponibles y se usa el respaldo atómico.
function soportaTransacciones() {
  const topology = mongoose.connection.client?.topology;
  if (!topology) return false;
  const tipo = topology.constructor?.name || '';
  return tipo === 'ReplSet' || tipo === 'Mongos';
}

// Genera un número de venta correlativo único, p. ej. V-20250101-0001.
async function generarNumeroVenta(fecha = new Date()) {
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  const prefijo = `V-${yyyy}${mm}${dd}-`;

  const ultima = await Venta.findOne({ numeroVenta: new RegExp(`^${prefijo}`) })
    .sort({ numeroVenta: -1 })
    .select('numeroVenta')
    .lean();

  let correlativo = 1;
  if (ultima) {
    const parte = parseInt(ultima.numeroVenta.slice(prefijo.length), 10);
    if (Number.isFinite(parte)) correlativo = parte + 1;
  }
  return `${prefijo}${String(correlativo).padStart(4, '0')}`;
}

// Valida un descuento: no negativo y no mayor al subtotal.
function validarDescuento(descuento, subtotal) {
  const d = round2(descuento || 0);
  if (d < 0) throw new ApiError(400, 'El descuento no puede ser negativo');
  if (d > subtotal) {
    throw new ApiError(400, 'El descuento no puede ser mayor que el subtotal');
  }
  return d;
}

// ----------------------------------------------------------------------------
// Lógica principal
// ----------------------------------------------------------------------------

/**
 * Registra una venta: valida productos y stock, calcula importes en el backend
 * y descuenta inventario de forma segura.
 *
 * @param {Object} payload - Datos enviados por el cliente (NO se confía en importes).
 * @param {Array} payload.items - [{ productoId, cantidad }]
 * @param {string} [payload.clienteId] - Cliente opcional.
 * @param {string} [payload.metodoPago]
 * @param {number} [payload.descuento]
 * @param {string} [payload.observaciones]
 * @param {Date} [payload.fecha]
 */
async function crearVenta(payload) {
  const { items, clienteId, metodoPago, observaciones, fecha } = payload;

  // --- Validación de ítems ---
  if (!Array.isArray(items) || items.length === 0) {
    throw new ApiError(400, 'La venta debe incluir al menos un producto');
  }

  const idsVistos = new Set();
  for (const item of items) {
    if (!item || !mongoose.Types.ObjectId.isValid(item.productoId)) {
      throw new ApiError(400, 'Cada producto debe incluir un identificador válido');
    }
    if (idsVistos.has(String(item.productoId))) {
      throw new ApiError(400, 'Un mismo producto no puede repetirse en la venta');
    }
    idsVistos.add(String(item.productoId));

    const cantidad = item.cantidad;
    if (!Number.isInteger(cantidad) || cantidad <= 0) {
      throw new ApiError(400, 'Las cantidades deben ser números enteros mayores que cero');
    }
  }

  // --- Cliente opcional ---
  let cliente = null;
  if (clienteId) {
    if (!mongoose.Types.ObjectId.isValid(clienteId)) {
      throw new ApiError(400, 'El identificador del cliente no es válido');
    }
    cliente = await Cliente.findById(clienteId);
    if (!cliente) throw new ApiError(404, 'Cliente no encontrado');
  }

  // --- Cargar productos y calcular importes en el backend ---
  const productosIds = items.map((i) => i.productoId);
  const productos = await Producto.find({ _id: { $in: productosIds } });

  const mapaProductos = new Map(productos.map((p) => [String(p._id), p]));

  const itemsCalculados = [];
  let subtotal = 0;

  for (const item of items) {
    const producto = mapaProductos.get(String(item.productoId));

    if (!producto) {
      throw new ApiError(404, `Uno de los productos no existe (id: ${item.productoId})`);
    }
    if (producto.estado !== 'activo') {
      throw new ApiError(400, `El producto "${producto.nombre}" está inactivo y no puede venderse`);
    }
    if (producto.stock < item.cantidad) {
      throw new ApiError(
        409,
        `Stock insuficiente para "${producto.nombre}". Disponible: ${producto.stock}, solicitado: ${item.cantidad}`
      );
    }

    const precioUnitario = round2(producto.precioVenta);
    const itemSubtotal = round2(precioUnitario * item.cantidad);

    itemsCalculados.push({
      productoId: producto._id,
      nombreProducto: producto.nombre,
      sku: producto.sku,
      marca: producto.marca,
      cantidad: item.cantidad,
      precioUnitario,
      subtotal: itemSubtotal
    });

    subtotal = round2(subtotal + itemSubtotal);
  }

  const descuento = validarDescuento(payload.descuento, subtotal);
  const baseImponible = round2(subtotal - descuento);
  const impuesto = round2(baseImponible * env.taxRate);
  const total = round2(baseImponible + impuesto);

  const numeroVenta = await generarNumeroVenta(fecha || new Date());

  const datosVenta = {
    numeroVenta,
    fecha: fecha || new Date(),
    clienteId: cliente ? cliente._id : null,
    clienteSnapshot: cliente
      ? {
          nombreCompleto: cliente.nombreCompleto || cliente.nombre,
          documentoTipo: cliente.documentoTipo || '',
          documentoNumero: cliente.documentoNumero || ''
        }
      : { nombreCompleto: '', documentoTipo: '', documentoNumero: '' },
    items: itemsCalculados,
    subtotal,
    descuento,
    impuesto,
    total,
    metodoPago: metodoPago || 'Efectivo',
    estado: 'completada',
    observaciones: observaciones || ''
  };

  // --- Persistir descontando stock de forma segura ---
  if (soportaTransacciones()) {
    return crearVentaConTransaccion(datosVenta);
  }
  // Sin transacciones se usa un respaldo atómico documentado.
  return crearVentaConRespaldoAtomico(datosVenta);
}

// Estrategia 1: transacciones de MongoDB (replSet / Atlas).
async function crearVentaConTransaccion(datosVenta) {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // Descuento condicional e atómico: solo aplica si hay stock suficiente.
    for (const item of datosVenta.items) {
      const resultado = await Producto.findOneAndUpdate(
        { _id: item.productoId, stock: { $gte: item.cantidad }, estado: 'activo' },
        { $inc: { stock: -item.cantidad } },
        { new: true, session }
      );
      if (!resultado) {
        throw new ApiError(409, 'Stock insuficiente o producto inactivo durante la confirmación');
      }
    }

    const [venta] = await Venta.create([datosVenta], { session });
    await session.commitTransaction();
    return venta;
  } catch (error) {
    await session.abortTransaction();
    throw error;
  } finally {
    session.endSession();
  }
}

// Estrategia 2: respaldo atómico sin transacciones.
// Se descuenta con filtro condicional (evita stock negativo) y, si algo falla
// a mitad de camino, se revierte lo ya descontado para no dejar inventario inconsistente.
async function crearVentaConRespaldoAtomico(datosVenta) {
  const descontados = []; // Productos ya descontados que podrían necesitar reversión.

  try {
    for (const item of datosVenta.items) {
      const resultado = await Producto.findOneAndUpdate(
        { _id: item.productoId, stock: { $gte: item.cantidad }, estado: 'activo' },
        { $inc: { stock: -item.cantidad } },
        { new: true }
      );

      if (!resultado) {
        throw new ApiError(409, `Stock insuficiente o producto inactivo para el ítem "${item.nombreProducto}"`);
      }
      // Registra para poder revertir si un paso posterior falla.
      descontados.push({ productoId: item.productoId, cantidad: item.cantidad });
    }

    const venta = await Venta.create(datosVenta);
    return venta;
  } catch (error) {
    // Revierte los descuentos ya aplicados.
    for (const d of descontados) {
      try {
        await Producto.updateOne({ _id: d.productoId }, { $inc: { stock: d.cantidad } });
      } catch (revertError) {
        console.error('No se pudo revertir stock para', d.productoId, revertError.message);
      }
    }
    throw error;
  }
}

/**
 * Anula una venta y restaura el stock exactamente una vez.
 */
async function anularVenta(idVenta) {
  const venta = await Venta.findById(idVenta);
  if (!venta) throw new ApiError(404, 'Venta no encontrada');
  if (venta.estado === 'anulada') {
    throw new ApiError(409, 'La venta ya fue anulada');
  }

  const restaurados = [];

  const restaurar = async () => {
    for (const item of venta.items) {
      await Producto.updateOne({ _id: item.productoId }, { $inc: { stock: item.cantidad } });
      restaurados.push(item.productoId);
    }
  };

  if (soportaTransacciones()) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      // Cambio condicional: solo anula si aún no está anulada.
      const actualizada = await Venta.findOneAndUpdate(
        { _id: venta._id, estado: 'completada' },
        { $set: { estado: 'anulada', stockRestaurado: true } },
        { new: true, session }
      );
      if (!actualizada) throw new ApiError(409, 'La venta ya fue anulada');

      for (const item of venta.items) {
        await Producto.updateOne(
          { _id: item.productoId },
          { $inc: { stock: item.cantidad } },
          { session }
        );
      }
      await session.commitTransaction();
      return actualizada;
    } catch (error) {
      await session.abortTransaction();
      throw error;
    } finally {
      session.endSession();
    }
  }

  // Respaldo sin transacciones: marcado condicional + restauración.
  const actualizada = await Venta.findOneAndUpdate(
    { _id: venta._id, estado: 'completada' },
    { $set: { estado: 'anulada', stockRestaurado: true } },
    { new: true }
  );
  if (!actualizada) throw new ApiError(409, 'La venta ya fue anulada');

  try {
    await restaurar();
  } catch (error) {
    // Si la restauración falla, revierte el estado para mantener coherencia.
    await Venta.updateOne({ _id: venta._id }, { $set: { estado: 'completada', stockRestaurado: false } });
    throw error;
  }

  return actualizada;
}

module.exports = {
  crearVenta,
  anularVenta,
  generarNumeroVenta,
  soportaTransacciones
};
