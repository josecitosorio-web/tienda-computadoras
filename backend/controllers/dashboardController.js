const Venta = require('../models/Venta');
const Producto = require('../models/Producto');
const asyncHandler = require('../middleware/asyncHandler');
const { round2 } = require('../utils/money');

// Resumen del dashboard: ventas del día, productos activos, stock bajo,
// ventas recientes y productos más vendidos.
const obtenerResumen = asyncHandler(async (req, res) => {
  // Rango del día actual (desde medianoche hasta ahora).
  const ahora = new Date();
  const inicioDia = new Date(ahora);
  inicioDia.setHours(0, 0, 0, 0);

  const [
    ventasHoy,
    totalVendidoHoyAgg,
    productosActivos,
    stockBajoAgg,
    ventasRecientes,
    masVendidosAgg
  ] = await Promise.all([
    // Cantidad de ventas del día (solo completadas).
    Venta.countDocuments({ estado: 'completada', fecha: { $gte: inicioDia } }),

    // Suma del total vendido en el día.
    Venta.aggregate([
      { $match: { estado: 'completada', fecha: { $gte: inicioDia } } },
      { $group: { _id: null, total: { $sum: '$total' } } }
    ]),

    // Productos activos.
    Producto.countDocuments({ estado: 'activo' }),

    // Productos con stock por debajo del mínimo (incluye agotados).
    Producto.aggregate([
      { $match: { estado: 'activo' } },
      { $match: { $expr: { $lte: ['$stock', '$stockMinimo'] } } },
      {
        $project: {
          _id: 1,
          nombre: 1,
          sku: 1,
          stock: 1,
          stockMinimo: 1,
          categoria: 1,
          agotado: { $eq: ['$stock', 0] }
        }
      },
      { $sort: { stock: 1 } },
      { $limit: 15 }
    ]),

    // Ventas recientes.
    Venta.find().sort({ fecha: -1 }).limit(8).lean(),

    // Productos más vendidos (solo ventas completadas).
    Venta.aggregate([
      { $match: { estado: 'completada' } },
      { $unwind: '$items' },
      {
        $group: {
          _id: '$items.productoId',
          nombreProducto: { $first: '$items.nombreProducto' },
          sku: { $first: '$items.sku' },
          unidadesVendidas: { $sum: '$items.cantidad' },
          ingresos: { $sum: '$items.subtotal' }
        }
      },
      { $sort: { unidadesVendidas: -1 } },
      { $limit: 5 }
    ])
  ]);

  const totalVendidoHoy = totalVendidoHoyAgg[0]?.total || 0;

  res.json({
    totalVendidoHoy: round2(totalVendidoHoy),
    ventasHoy,
    productosActivos,
    productosStockBajo: stockBajoAgg.length,
    alertasStockBajo: stockBajoAgg,
    ventasRecientes,
    productosMasVendidos: masVendidosAgg.map((p) => ({
      ...p,
      ingresos: round2(p.ingresos)
    }))
  });
});

module.exports = { obtenerResumen };
