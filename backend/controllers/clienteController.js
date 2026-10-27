const Cliente = require('../models/Cliente');
const Venta = require('../models/Venta');
const ApiError = require('../middleware/ApiError');
const asyncHandler = require('../middleware/asyncHandler');
const { isValidObjectId } = require('../utils/objectId');

// Listar clientes con búsqueda y paginación.
const listarClientes = asyncHandler(async (req, res) => {
  const { buscar, pagina = 1, limite = 10 } = req.query;

  const filtro = {};
  if (buscar) {
    const regex = new RegExp(buscar.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filtro.$or = [{ nombre: regex }, { apellido: regex }, { documentoNumero: regex }, { correo: regex }];
  }

  const pageNum = Math.max(1, parseInt(pagina, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limite, 10) || 10));

  const [total, clientes] = await Promise.all([
    Cliente.countDocuments(filtro),
    Cliente.find(filtro)
      .sort({ createdAt: -1 })
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean()
  ]);

  res.json({
    clientes,
    paginacion: {
      total,
      pagina: pageNum,
      limite: limitNum,
      paginas: Math.ceil(total / limitNum) || 1
    }
  });
});

// Obtener un cliente.
const obtenerCliente = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'El identificador del cliente no es válido');

  const cliente = await Cliente.findById(id).lean();
  if (!cliente) throw new ApiError(404, 'Cliente no encontrado');
  res.json(cliente);
});

// Crear un cliente.
const crearCliente = asyncHandler(async (req, res) => {
  const { nombre } = req.body || {};
  if (!nombre || !String(nombre).trim()) {
    throw new ApiError(400, 'El nombre del cliente es obligatorio');
  }

  const cliente = await Cliente.create({
    nombre: String(nombre).trim(),
    apellido: req.body.apellido || '',
    documentoTipo: req.body.documentoTipo || '',
    documentoNumero: req.body.documentoNumero || '',
    telefono: req.body.telefono || '',
    correo: req.body.correo || '',
    direccion: req.body.direccion || ''
  });

  res.status(201).json(cliente);
});

// Actualizar un cliente.
const actualizarCliente = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'El identificador del cliente no es válido');

  const cliente = await Cliente.findById(id);
  if (!cliente) throw new ApiError(404, 'Cliente no encontrado');

  const campos = ['nombre', 'apellido', 'documentoTipo', 'documentoNumero', 'telefono', 'correo', 'direccion'];
  for (const campo of campos) {
    if (req.body[campo] !== undefined) cliente[campo] = req.body[campo];
  }

  if (!String(cliente.nombre).trim()) {
    throw new ApiError(400, 'El nombre del cliente es obligatorio');
  }

  await cliente.save();
  res.json(cliente);
});

// Eliminar un cliente solo si no tiene ventas asociadas.
const eliminarCliente = asyncHandler(async (req, res) => {
  const { id } = req.params;
  if (!isValidObjectId(id)) throw new ApiError(400, 'El identificador del cliente no es válido');

  const cliente = await Cliente.findById(id);
  if (!cliente) throw new ApiError(404, 'Cliente no encontrado');

  const relacionado = await Venta.exists({ clienteId: cliente._id });
  if (relacionado) {
    throw new ApiError(409, 'El cliente tiene ventas registradas y no puede eliminarse');
  }

  await cliente.deleteOne();
  res.json({ mensaje: 'Cliente eliminado correctamente' });
});

module.exports = {
  listarClientes,
  obtenerCliente,
  crearCliente,
  actualizarCliente,
  eliminarCliente
};
