// Script de datos de demostración.
//
// Uso:
//   npm run seed         -> Agrega datos sin borrar los existentes (evita duplicados por SKU).
//   npm run seed:reset   -> ELIMINA productos, ventas y clientes y recarga la demo completa.
//
// El seed normal nunca borra información existente.

require('dotenv').config();
const mongoose = require('mongoose');
const env = require('../config/env');

const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Venta = require('../models/Venta');
const { round2 } = require('../utils/money');

const RESET = process.argv.includes('--reset');

const PRODUCTOS = [
  { nombre: 'Laptop Lenovo IdeaPad 3', marca: 'Lenovo', modelo: '15IIL05', categoria: 'Laptop', sku: 'LAP-LEN-001', precioCompra: 1800, precioVenta: 2450, stock: 12, stockMinimo: 3, descripcion: 'Intel Core i5, 8GB RAM, 512GB SSD' },
  { nombre: 'Laptop HP Pavilion 15', marca: 'HP', modelo: '15-eg2000', categoria: 'Laptop', sku: 'LAP-HP-002', precioCompra: 2200, precioVenta: 2990, stock: 8, stockMinimo: 3, descripcion: 'Ryzen 5, 16GB RAM, 512GB SSD' },
  { nombre: 'Laptop Acer Aspire 5', marca: 'Acer', modelo: 'A515-57', categoria: 'Laptop', sku: 'LAP-ACR-003', precioCompra: 1750, precioVenta: 2350, stock: 2, stockMinimo: 3, descripcion: 'Core i5, 8GB RAM, 256GB SSD' },
  { nombre: 'PC de escritorio Ryzen 5', marca: 'AMD', modelo: 'Build-ATX', categoria: 'PC de escritorio', sku: 'PCE-AMD-004', precioCompra: 3100, precioVenta: 4200, stock: 5, stockMinimo: 2, descripcion: 'Ryzen 5 5600G, 16GB RAM, 1TB SSD' },
  { nombre: 'PC de escritorio Intel i7', marca: 'Intel', modelo: 'Build-MATX', categoria: 'PC de escritorio', sku: 'PCE-INT-005', precioCompra: 3800, precioVenta: 5100, stock: 3, stockMinimo: 2, descripcion: 'Core i7, 32GB RAM, RTX 4060' },
  { nombre: 'Monitor Samsung 24" FHD', marca: 'Samsung', modelo: 'LF24T350', categoria: 'Monitor', sku: 'MON-SAM-006', precioCompra: 480, precioVenta: 690, stock: 15, stockMinimo: 4, descripcion: '24 pulgadas, 75Hz, IPS' },
  { nombre: 'Monitor LG UltraGear 27"', marca: 'LG', modelo: '27GP850-B', categoria: 'Monitor', sku: 'MON-LG-007', precioCompra: 950, precioVenta: 1350, stock: 6, stockMinimo: 2, descripcion: '27 pulgadas, 144Hz, QHD' },
  { nombre: 'Teclado mecánico Redragon', marca: 'Redragon', modelo: 'K552', categoria: 'Teclado', sku: 'TEC-RED-008', precioCompra: 130, precioVenta: 210, stock: 25, stockMinimo: 6, descripcion: 'Switches blue, RGB' },
  { nombre: 'Mouse Logitech G203', marca: 'Logitech', modelo: 'G203', categoria: 'Mouse', sku: 'MOU-LOG-009', precioCompra: 90, precioVenta: 150, stock: 30, stockMinimo: 8, descripcion: '8000 DPI, iluminación RGB' },
  { nombre: 'SSD Kingston 1TB NVMe', marca: 'Kingston', modelo: 'NV2', categoria: 'Almacenamiento', sku: 'SSD-KIN-010', precioCompra: 260, precioVenta: 380, stock: 18, stockMinimo: 5, descripcion: 'Lectura 3500MB/s' },
  { nombre: 'Memoria RAM Corsair 16GB', marca: 'Corsair', modelo: 'Vengeance LPX', categoria: 'Componentes', sku: 'RAM-COR-011', precioCompra: 280, precioVenta: 420, stock: 2, stockMinimo: 5, descripcion: 'DDR4 3200MHz (2x8GB)' },
  { nombre: 'Tarjeta gráfica RTX 4060', marca: 'NVIDIA', modelo: 'RTX 4060 8GB', categoria: 'Componentes', sku: 'GPU-NVI-012', precioCompra: 1450, precioVenta: 1950, stock: 4, stockMinimo: 2, descripcion: '8GB GDDR6' },
  { nombre: 'Audífonos HyperX Cloud', marca: 'HyperX', modelo: 'Cloud II', categoria: 'Accesorios', sku: 'AUD-HPX-013', precioCompra: 320, precioVenta: 480, stock: 10, stockMinimo: 3, descripcion: 'Sonido envolvente 7.1' },
  { nombre: 'Mousepad RGB grande', marca: 'T-Force', modelo: 'GT900', categoria: 'Accesorios', sku: 'PAD-TFO-014', precioCompra: 45, precioVenta: 85, stock: 0, stockMinimo: 5, descripcion: '90x40cm, iluminación RGB' }
];

const CLIENTES = [
  { nombre: 'Juan', apellido: 'Pérez', documentoTipo: 'DNI', documentoNumero: '45678912', telefono: '987654321', correo: 'juan.perez@email.com', direccion: 'Av. Los Olivos 123' },
  { nombre: 'María', apellido: 'Gómez', documentoTipo: 'DNI', documentoNumero: '78945612', telefono: '912345678', correo: 'maria.gomez@email.com', direccion: 'Jr. Las Flores 45' },
  { nombre: 'Comercial Andes', apellido: 'SAC', documentoTipo: 'RUC', documentoNumero: '20123456789', telefono: '014567890', correo: 'compras@andes.pe', direccion: 'Av. Industrial 999' },
  { nombre: 'Carlos', apellido: 'Ramírez', documentoTipo: 'DNI', documentoNumero: '32165498', telefono: '998877665', correo: 'carlos.ramirez@email.com', direccion: 'Calle Primavera 78' }
];

function diasAtras(dias) {
  const f = new Date();
  f.setDate(f.getDate() - dias);
  return f;
}

// Genera un número de venta con formato V-YYYYMMDD-NNNN.
function numeroVenta(fecha, correlativo) {
  const yyyy = fecha.getFullYear();
  const mm = String(fecha.getMonth() + 1).padStart(2, '0');
  const dd = String(fecha.getDate()).padStart(2, '0');
  return `V-${yyyy}${mm}${dd}-${String(correlativo).padStart(4, '0')}`;
}

// Calcula los importes de una venta igual que lo haría el backend.
function calcularVenta(items, descuento = 0, taxRate = env.taxRate) {
  const subtotal = round2(items.reduce((suma, i) => suma + i.precioUnitario * i.cantidad, 0));
  const d = round2(Math.min(Math.max(descuento, 0), subtotal));
  const base = round2(subtotal - d);
  const impuesto = round2(base * taxRate);
  const total = round2(base + impuesto);
  return { subtotal, descuento: d, impuesto, total };
}

async function main() {
  console.log(`Conectando a ${env.mongoUri} ...`);
  await mongoose.connect(env.mongoUri);

  if (RESET) {
    console.log('⚠️  MODO RESET: se eliminarán TODOS los productos, ventas y clientes.');
    await Promise.all([Venta.deleteMany({}), Producto.deleteMany({}), Cliente.deleteMany({})]);
    console.log('   Colecciones vaciadas.');
  }

  // --- Productos (evita duplicados por SKU en modo normal) ---
  const productosCreados = new Map();
  let productosNuevos = 0;

  for (const datos of PRODUCTOS) {
    const existente = await Producto.findOne({ sku: datos.sku });
    if (existente) {
      productosCreados.set(datos.sku, existente);
      continue;
    }
    const creado = await Producto.create(datos);
    productosCreados.set(datos.sku, creado);
    productosNuevos++;
  }
  console.log(`Productos: ${productosNuevos} creados, ${PRODUCTOS.length - productosNuevos} ya existentes.`);

  // --- Clientes ---
  const clientesCreados = [];
  let clientesNuevos = 0;
  for (const datos of CLIENTES) {
    const existente = await Cliente.findOne({ documentoNumero: datos.documentoNumero });
    if (existente) {
      clientesCreados.push(existente);
      continue;
    }
    const creado = await Cliente.create(datos);
    clientesCreados.push(creado);
    clientesNuevos++;
  }
  console.log(`Clientes: ${clientesNuevos} creados, ${CLIENTES.length - clientesNuevos} ya existentes.`);

  // --- Ventas de demostración ---
  let ventasCreadas = 0;
  const ventaExistente = await Venta.findOne({ numeroVenta: /^V-DEMO-/ });

  // En modo normal solo crea ventas si no hay ninguna demo previa.
  if (RESET || !ventaExistente) {
    // Se usa un mapa de stock para mantener coherencia con las cantidades.
    const stockDisponible = new Map();
    for (const [sku, p] of productosCreados) stockDisponible.set(sku, p.stock);

    const escenarios = [
      { dias: 0, cliente: 0, metodo: 'Efectivo', descuento: 0, items: [ { sku: 'LAP-LEN-001', cantidad: 1 }, { sku: 'MOU-LOG-009', cantidad: 2 } ] },
      { dias: 0, cliente: 1, metodo: 'Tarjeta', descuento: 100, items: [ { sku: 'MON-SAM-006', cantidad: 2 } ] },
      { dias: 1, cliente: 2, metodo: 'Transferencia', descuento: 0, items: [ { sku: 'PCE-AMD-004', cantidad: 1 }, { sku: 'TEC-RED-008', cantidad: 1 }, { sku: 'MOU-LOG-009', cantidad: 1 } ] },
      { dias: 2, cliente: 3, metodo: 'Efectivo', descuento: 50, items: [ { sku: 'SSD-KIN-010', cantidad: 3 } ] },
      { dias: 3, cliente: null, metodo: 'Tarjeta', descuento: 0, items: [ { sku: 'LAP-HP-002', cantidad: 1 } ] },
      { dias: 5, cliente: 0, metodo: 'Efectivo', descuento: 0, items: [ { sku: 'AUD-HPX-013', cantidad: 2 }, { sku: 'PAD-TFO-014', cantidad: 1 } ] },
      { dias: 7, cliente: 1, metodo: 'Transferencia', descuento: 0, items: [ { sku: 'GPU-NVI-012', cantidad: 1 } ] },
      { dias: 10, cliente: null, metodo: 'Efectivo', descuento: 0, items: [ { sku: 'MON-LG-007', cantidad: 1 }, { sku: 'TEC-RED-008', cantidad: 2 } ] }
    ];

    const ventassParaGuardar = [];

    for (let i = 0; i < escenarios.length; i++) {
      const esc = escenarios[i];
      const fecha = diasAtras(esc.dias);

      // Construye los items con precio histórico y valida stock.
      const items = [];
      let stockSuficiente = true;

      for (const it of esc.items) {
        const producto = productosCreados.get(it.sku);
        if (!producto) continue;
        const disp = stockDisponible.get(it.sku) || 0;
        if (disp < it.cantidad) {
          stockSuficiente = false;
          break;
        }
        stockDisponible.set(it.sku, disp - it.cantidad);

        items.push({
          productoId: producto._id,
          nombreProducto: producto.nombre,
          sku: producto.sku,
          marca: producto.marca,
          cantidad: it.cantidad,
          precioUnitario: round2(producto.precioVenta),
          subtotal: round2(producto.precioVenta * it.cantidad)
        });
      }

      if (!stockSuficiente || items.length === 0) continue;

      const cliente = esc.cliente !== null ? clientesCreados[esc.cliente] : null;
      const { subtotal, descuento, impuesto, total } = calcularVenta(items, esc.descuento);

      ventassParaGuardar.push({
        numeroVenta: numeroVenta(fecha, i + 1),
        fecha,
        clienteId: cliente ? cliente._id : null,
        clienteSnapshot: cliente
          ? {
              nombreCompleto: [cliente.nombre, cliente.apellido].filter(Boolean).join(' ').trim(),
              documentoTipo: cliente.documentoTipo || '',
              documentoNumero: cliente.documentoNumero || ''
            }
          : { nombreCompleto: 'Cliente genérico', documentoTipo: '', documentoNumero: '' },
        items,
        subtotal,
        descuento,
        impuesto,
        total,
        metodoPago: esc.metodo,
        estado: 'completada',
        observaciones: esc.dias === 0 ? 'Venta de demostración' : ''
      });
    }

    if (ventassParaGuardar.length > 0) {
      await Venta.insertMany(ventassParaGuardar);
      ventasCreadas = ventassParaGuardar.length;
    }

    // Descuenta del stock real las unidades usadas en la demo.
    for (const [sku, cantidadVendida] of stockDisponible) {
      const producto = productosCreados.get(sku);
      if (!producto) continue;
      const original = PRODUCTOS.find((p) => p.sku === sku)?.stock ?? producto.stock;
      const restante = original - cantidadVendida;
      await Producto.updateOne({ _id: producto._id }, { $set: { stock: Math.max(0, restante) } });
    }
  }

  console.log(`Ventas de demostración creadas: ${ventasCreadas}.`);

  const [totalProductos, totalClientes, totalVentas] = await Promise.all([
    Producto.countDocuments(),
    Cliente.countDocuments(),
    Venta.countDocuments()
  ]);

  console.log('--- Resumen final ---');
  console.log(`Productos: ${totalProductos} | Clientes: ${totalClientes} | Ventas: ${totalVentas}`);
  if (!RESET) {
    console.log('Nota: el seed normal no elimina datos. Usa "npm run seed:reset" para reiniciar.');
  }

  await mongoose.connection.close();
  console.log('Listo.');
}

main().catch(async (error) => {
  console.error('Error en el seed:', error);
  try {
    await mongoose.connection.close();
  } catch (_) {
    /* noop */
  }
  process.exit(1);
});
