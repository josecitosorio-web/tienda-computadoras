const Producto = require('../models/Producto');
const Venta = require('../models/Venta');
const ApiError = require('../middleware/ApiError');
const asyncHandler = require('../middleware/asyncHandler');

// Listar productos con búsqueda, filtros y paginación.
const listarProductos = asyncHandler(async (req, res) => {
  const {
    buscar,
    marca,
    categoria,
    estado,
    stockBajo,
    pagina = 1,
    limite = 10,
    orden = 'createdAt',
    direccion = 'desc'
  } = req.query;

  const filtro = {};

  // Búsqueda por nombre o SKU (insensible a mayúsculas).
  if (buscar) {
    const regex = new RegExp(buscar.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
    filtro.$or = [{ nombre: regex }, { sku: regex }, { marca: regex }, { modelo: regex }];
  }
  if (marca) filtro.marca = marca;
  if (categoria) filtro.categoria = categoria;
  if (estado) filtro.estado = estado;

  // Productos con stock por debajo del mínimo.
  if (stockBajo === 'true') {
    filtro.$expr = { $lte: ['$stock', '$stockMinimo'] };
  }

  const pageNum = Math.max(1, parseInt(pagina, 10) || 1);
  const limitNum = Math.min(100, Math.max(1, parseInt(limite, 10) || 10));
  const sort = { [orden]: direccion === 'asc' ? 1 : -1 };

  const [total, productos] = await Promise.all([
    Producto.countDocuments(filtro),
    Producto.find(filtro)
      .sort(sort)
      .skip((pageNum - 1) * limitNum)
      .limit(limitNum)
      .lean()
  ]);

  res.json({
    productos,
    paginacion: {
      total,
      pagina: pageNum,
      limite: limitNum,
      paginas: Math.ceil(total / limitNum) || 1
    }
  });
});

// Obtener un producto por id.
const obtenerProducto = asyncHandler(async (req, res) => {
  const producto = await Producto.findById(req.params.id).lean();
  if (!producto) throw new ApiError(404, 'Producto no encontrado');
  res.json(producto);
});

// Crear un producto.
const crearProducto = asyncHandler(async (req, res) => {
  const datos = sanitizarProducto(req.body);
  // Verificación explícita de SKU duplicado para dar un mensaje claro.
  const existente = await Producto.findOne({ sku: datos.sku });
  if (existente) {
    throw new ApiError(409, `Ya existe un producto con el SKU "${datos.sku}"`);
  }
  const producto = await Producto.create(datos);
  res.status(201).json(producto);
});

// Actualizar un producto (PUT/PATCH).
const actualizarProducto = asyncHandler(async (req, res) => {
  const producto = await Producto.findById(req.params.id);
  if (!producto) throw new ApiError(404, 'Producto no encontrado');

  const datos = sanitizarProducto(req.body, true);

  // Si cambia el SKU, verificar que no lo use otro producto.
  if (datos.sku && datos.sku !== producto.sku) {
    const duplicado = await Producto.findOne({ sku: datos.sku, _id: { $ne: producto._id } });
    if (duplicado) {
      throw new ApiError(409, `Ya existe otro producto con el SKU "${datos.sku}"`);
    }
  }

  Object.assign(producto, datos);
  await producto.save();
  res.json(producto);
});

// Cambiar estado activo/inactivo.
const cambiarEstadoProducto = asyncHandler(async (req, res) => {
  const { estado } = req.body;
  if (!['activo', 'inactivo'].includes(estado)) {
    throw new ApiError(400, 'El estado debe ser "activo" o "inactivo"');
  }
  const producto = await Producto.findByIdAndUpdate(
    req.params.id,
    { estado },
    { new: true, runValidators: true }
  );
  if (!producto) throw new ApiError(404, 'Producto no encontrado');
  res.json(producto);
});

// Eliminar producto solo si no está relacionado con ventas.
const eliminarProducto = asyncHandler(async (req, res) => {
  const producto = await Producto.findById(req.params.id);
  if (!producto) throw new ApiError(404, 'Producto no encontrado');

  const relacionado = await Venta.exists({ 'items.productoId': producto._id });
  if (relacionado) {
    throw new ApiError(
      409,
      'El producto está relacionado con ventas y no puede eliminarse. Desactívalo en su lugar.'
    );
  }

  await producto.deleteOne();
  res.json({ mensaje: 'Producto eliminado correctamente' });
});

// Normaliza y valida los campos de un producto.
function sanitizarProducto(body, parcial = false) {
  const datos = {};
  const campos = [
    'nombre',
    'marca',
    'modelo',
    'categoria',
    'descripcion',
    'sku',
    'precioCompra',
    'precioVenta',
    'stock',
    'stockMinimo',
    'estado'
  ];

  for (const campo of campos) {
    if (body[campo] !== undefined) datos[campo] = body[campo];
  }

  if (!parcial) {
    if (datos.nombre === undefined || !String(datos.nombre).trim()) {
      throw new ApiError(400, 'El nombre es obligatorio');
    }
    if (datos.marca === undefined || !String(datos.marca).trim()) {
      throw new ApiError(400, 'La marca es obligatoria');
    }
    if (datos.modelo === undefined || !String(datos.modelo).trim()) {
      throw new ApiError(400, 'El modelo es obligatorio');
    }
    if (datos.categoria === undefined || !String(datos.categoria).trim()) {
      throw new ApiError(400, 'La categoría es obligatoria');
    }
    if (datos.sku === undefined || !String(datos.sku).trim()) {
      throw new ApiError(400, 'El SKU es obligatorio');
    }
    if (datos.precioVenta === undefined) {
      throw new ApiError(400, 'El precio de venta es obligatorio');
    }
  }

  // Conversión y validación numérica.
  if (datos.sku !== undefined) datos.sku = String(datos.sku).trim().toUpperCase();
  if (datos.precioCompra !== undefined) {
    datos.precioCompra = Number(datos.precioCompra);
    if (!Number.isFinite(datos.precioCompra) || datos.precioCompra < 0) {
      throw new ApiError(400, 'El precio de compra debe ser un número mayor o igual que cero');
    }
  }
  if (datos.precioVenta !== undefined) {
    datos.precioVenta = Number(datos.precioVenta);
    if (!Number.isFinite(datos.precioVenta) || datos.precioVenta <= 0) {
      throw new ApiError(400, 'El precio de venta debe ser un número mayor que cero');
    }
  }
  for (const campo of ['stock', 'stockMinimo']) {
    if (datos[campo] !== undefined) {
      const valor = Number(datos[campo]);
      if (!Number.isInteger(valor) || valor < 0) {
        throw new ApiError(400, `El campo "${campo}" debe ser un entero mayor o igual que cero`);
      }
      datos[campo] = valor;
    }
  }
  if (datos.estado !== undefined && !['activo', 'inactivo'].includes(datos.estado)) {
    throw new ApiError(400, 'El estado debe ser "activo" o "inactivo"');
  }

  return datos;
}

module.exports = {
  listarProductos,
  obtenerProducto,
  crearProducto,
  actualizarProducto,
  cambiarEstadoProducto,
  eliminarProducto
};
