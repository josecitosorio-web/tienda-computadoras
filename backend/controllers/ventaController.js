const Venta = require('../models/Venta');
const ventaService = require('../services/ventaService');
const ApiError = require('../middleware/ApiError');
const asyncHandler = require('../middleware/asyncHandler');
const { isValidObjectId } = require('../utils/objectId');

// Listar ventas con filtros por fecha, estado y número de venta.
const listarVentas = asyncHandler(async (req, res) => {
  const { fechaDesde, fechaHasta, estado, numeroVenta, pagina = 1, limite = 10 } = req.query;

  const filtro = {};

  if (estado) {
    if (!['completada', 'anulada'].includes(estado)) {
      throw new ApiError(400, 'El estado debe ser "completada" o "anulada"');
    }
    filtro.estado = estado;
  }

  if (numeroVenta) {
    filtro.numeroVenta = new RegExp(numeroVenta.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
  }

  // Rango de fechas inclusivo.
  if (fechaDesde || fechaHasta) {
    filtro.fecha = {};
    if (fechaDesde) {
      const desde = new Date(fechaDesde);
      if (isNaN(desde)) throw new ApiError(400, 'fechaDesde no es una fecha válida');
      desde.setHours(0, 0, 0, 0);
      filtro.fecha.$gte = desde;
    }
    if (fechaHasta) {
      const hasta = new Date(fechaHasta);
      if (isNaN(hasta)) throw new ApiError(400, 'fechaHasta no es una fecha válida');
      hasta.setHours(23, 59, 59, 999);
      filtro.fecha.$lte = hasta;
    }
  }

  const pageNum = Math.max(1, parseInt(pagina, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limite, 10) || 10));

  const [total, ventas] = await Promise.all([
    Venta.countDocuments(filtro),
    Venta.find(filtro)
      .sort({ fecha: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean()
  ]);

  res.json({
    ventas,
    paginacion: {
      total,
      pagina: pageNum,
      limite: limitNum,
      paginas: Math.ceil(total / limitNum) || 1
    }
  });
});

// Obtener el detalle completo de una venta.
const obtenerVenta = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'El identificador de la venta no es válido');

  const venta = await Venta.findById(id).lean();
  if (!venta) throw new ApiError(404, 'Venta no encontrada');
  res.json(venta);
});

// Registrar una venta. El backend valida y calcula todos los importes.
const crearVenta = asyncHandler(async (req, res) => {
  const venta = await ventaService.crearVenta(req.body || {});
  // Recarga con populate para devolver los productos referenciados.
  const ventaCompleta = await Venta.findById(venta._id).lean();
  res.status(201).json(ventaCompleta);
});

// Anular una venta y restaurar stock una sola vez.
const anularVenta = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'El identificador de la venta no es válido');

  const venta = await ventaService.anularVenta(id);
  res.json(venta);
});

module.exports = {
  listarVentas,
  obtenerVenta,
  crearVenta,
  anularVenta
};
