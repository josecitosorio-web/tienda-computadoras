import { useEffect, useMemo, useState, useCallback } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, fmtMoney } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import { ConfirmDialog } from '../components/ui.jsx';

export default function NuevaVenta() {
  const navigate = useNavigate();
  const toast = useToast();

  // Búsqueda de productos
  const [busqueda, setBusqueda] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);

  // Carrito: { productoId, nombre, sku, marca, precioVenta, stock, cantidad }
  const [carrito, setCarrito] = useState([]);
  const [descuento, setDescuento] = useState('0');

  // Cliente
  const [clientes, setClientes] = useState([]);
  const [clienteId, setClienteId] = useState('');

  const [metodoPago, setMetodoPago] = useState('Efectivo');
  const [observaciones, setObservaciones] = useState('');
  const [confirmando, setConfirmando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const cargarClientes = useCallback(async () => {
    try {
      const datos = await api.get('/clientes?limite=100');
      setClientes(datos.clientes);
    } catch (err) {
      toast.error(`No se pudieron cargar los clientes: ${err.message}`);
    }
  }, [toast]);

  useEffect(() => {
    cargarClientes();
  }, [cargarClientes]);

  // Busca productos activos por nombre o SKU.
  const buscarProductos = useCallback(async () => {
    if (!busqueda.trim()) {
      setResultados([]);
      return;
    }
    setBuscando(true);
    try {
      const params = new URLSearchParams({ buscar: busqueda.trim(), estado: 'activo', limite: '8' });
      const datos = await api.get(`/productos?${params}`);
      setResultados(datos.productos);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setBuscando(false);
    }
  }, [busqueda, toast]);

  useEffect(() => {
    const t = setTimeout(buscarProductos, 300);
    return () => clearTimeout(t);
  }, [buscarProductos]);

  const agregarAlCarrito = (producto) => {
    const yaEnCarrito = carrito.some((i) => i.productoId === producto._id);
    if (yaEnCarrito) {
      toast.info('El producto ya está en el carrito');
      return;
    }
    if (producto.stock === 0) {
      toast.error(`"${producto.nombre}" está agotado`);
      return;
    }
    setCarrito((c) => [
      ...c,
      {
        productoId: producto._id,
        nombre: producto.nombre,
        sku: producto.sku,
        marca: producto.marca,
        precioVenta: producto.precioVenta,
        stock: producto.stock,
        cantidad: 1
      }
    ]);
  };

  const cambiarCantidad = (productoId, cantidad) => {
    setCarrito((c) =>
      c.map((i) => {
        if (i.productoId !== productoId) return i;
        const n = Number(cantidad);
        if (Number.isNaN(n)) return i;
        // Valida contra el stock disponible antes de registrar la venta.
        if (n > i.stock) {
          toast.error(`Stock disponible de "${i.nombre}": ${i.stock}`);
          return { ...i, cantidad: i.stock };
        }
        return { ...i, cantidad: n };
      })
    );
  };

  const quitarDelCarrito = (productoId) =>
    setCarrito((c) => c.filter((i) => i.productoId !== productoId));

  // Totales calculados en la interfaz solo como vista previa.
  // El backend los recalcula y es la única fuente de verdad.
  const { subtotal, descuentoNum, baseImponible, impuesto, total } = useMemo(() => {
    const redondear = (v) => Math.round((v + Number.EPSILON) * 100) / 100;
    const sub = redondear(carrito.reduce((s, i) => s + i.precioVenta * (Number.isInteger(i.cantidad) && i.cantidad > 0 ? i.cantidad : 0), 0));
    let d = Number(descuento) || 0;
    if (d < 0) d = 0;
    if (d > sub) d = sub;
    const base = redondear(sub - d);
    // La tasa real la aplica el backend; aquí 0% para vista previa coherente.
    const imp = redondear(base * 0);
    return { subtotal: sub, descuentoNum: d, baseImponible: base, impuesto: imp, total: redondear(base + imp) };
  }, [carrito, descuento]);

  const carritoValido = carrito.length > 0 && carrito.every((i) => Number.isInteger(i.cantidad) && i.cantidad > 0) && descuentoNum <= subtotal;

  const confirmarVenta = async () => {
    setConfirmando(false);
    setGuardando(true);
    try {
      const cuerpo = {
        items: carrito.map((i) => ({ productoId: i.productoId, cantidad: i.cantidad })),
        clienteId: clienteId || undefined,
        metodoPago,
        descuento: descuentoNum,
        observaciones: observaciones.trim() || undefined
      };
      const venta = await api.post('/ventas', cuerpo);
      toast.exito(`Venta ${venta.numeroVenta} registrada correctamente`);
      navigate(`/ventas/${venta._id}`);
    } catch (err) {
      toast.error(err.message);
      setGuardando(false);
    }
  };

  return (
    <div>
      <div className="cabecera-pagina">
        <h2>Nueva venta</h2>
        <Link to="/ventas" className="enlace">
          ← Historial de ventas
        </Link>
      </div>

      <div className="rejilla-venta">
        {/* Columna izquierda: búsqueda de productos */}
        <div className="columna">
          <section className="panel">
            <div className="panel__cabecera">
              <h3>Buscar productos</h3>
            </div>
            <input
              className="input"
              placeholder="Escribe el nombre o SKU…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
            <div className="resultados-busqueda">
              {buscando ? (
                <p className="texto-tenue">Buscando…</p>
              ) : !busqueda.trim() ? (
                <p className="texto-tenue">Busca por nombre o SKU para agregar productos al carrito.</p>
              ) : resultados.length === 0 ? (
                <p className="texto-tenue">Sin resultados.</p>
              ) : (
                resultados.map((p) => (
                  <div key={p._id} className="resultado-producto">
                    <div className="resultado-producto__info">
                      <strong>{p.nombre}</strong>
                      <span className="texto-tenue">
                        {p.sku} · {p.marca} · {fmtMoney(p.precioVenta)}
                      </span>
                    </div>
                    <span className={`stock ${p.stock === 0 ? 'stock--agotado' : p.stock <= p.stockMinimo ? 'stock--bajo' : ''}`}>
                      Stock: {p.stock}
                    </span>
                    <button className="btn btn--primario btn--sm" onClick={() => agregarAlCarrito(p)} disabled={p.stock === 0}>
                      Agregar
                    </button>
                  </div>
                ))
              )}
            </div>
          </section>
        </div>

        {/* Columna derecha: carrito y confirmación */}
        <div className="columna">
          <section className="panel">
            <div className="panel__cabecera">
              <h3>Carrito ({carrito.length} productos)</h3>
            </div>
            {carrito.length === 0 ? (
              <p className="vacio-inline">El carrito está vacío.</p>
            ) : (
              <table className="tabla tabla--compacta">
                <thead>
                  <tr>
                    <th>Producto</th>
                    <th>Precio</th>
                    <th>Cant.</th>
                    <th>Subtotal</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {carrito.map((i) => (
                    <tr key={i.productoId}>
                      <td>
                        <strong>{i.nombre}</strong>
                        <div className="texto-tenue">{i.sku}</div>
                      </td>
                      <td>{fmtMoney(i.precioVenta)}</td>
                      <td>
                        <input
                          type="number"
                          min="1"
                          step="1"
                          max={i.stock}
                          className="input input--cantidad"
                          value={i.cantidad}
                          onChange={(e) => cambiarCantidad(i.productoId, e.target.value)}
                        />
                      </td>
                      <td>{fmtMoney(i.precioVenta * (Number.isInteger(i.cantidad) && i.cantidad > 0 ? i.cantidad : 0))}</td>
                      <td>
                        <button className="btn btn--peligroso btn--sm" onClick={() => quitarDelCarrito(i.productoId)} aria-label={`Quitar ${i.nombre}`}>
                          ✕
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <section className="panel">
            <div className="campos-rejilla">
              <div className="campo">
                <label>Cliente</label>
                <select className="select" value={clienteId} onChange={(e) => setClienteId(e.target.value)}>
                  <option value="">Cliente genérico</option>
                  {clientes.map((c) => (
                    <option key={c._id} value={c._id}>
                      {[c.nombre, c.apellido].filter(Boolean).join(' ')}
                      {c.documentoNumero ? ` — ${c.documentoNumero}` : ''}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label>Método de pago</label>
                <select className="select" value={metodoPago} onChange={(e) => setMetodoPago(e.target.value)}>
                  {['Efectivo', 'Tarjeta', 'Transferencia', 'Otro'].map((m) => (
                    <option key={m} value={m}>
                      {m}
                    </option>
                  ))}
                </select>
              </div>
              <div className="campo">
                <label>Descuento (S/)</label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  className={`input ${descuentoNum > subtotal ? 'input--error' : ''}`}
                  value={descuento}
                  onChange={(e) => setDescuento(e.target.value)}
                />
                {descuentoNum > subtotal && <span className="error-texto">No puede superar el subtotal</span>}
              </div>
              <div className="campo campo--completo">
                <label>Observaciones</label>
                <input className="input" value={observaciones} onChange={(e) => setObservaciones(e.target.value)} placeholder="Opcional" />
              </div>
            </div>

            <div className="resumen-venta">
              <div className="resumen-venta__fila">
                <span>Subtotal</span>
                <span>{fmtMoney(subtotal)}</span>
              </div>
              <div className="resumen-venta__fila">
                <span>Descuento</span>
                <span>-{fmtMoney(descuentoNum)}</span>
              </div>
              <div className="resumen-venta__fila">
                <span>Impuesto</span>
                <span>{fmtMoney(impuesto)}</span>
              </div>
              <div className="resumen-venta__fila resumen-venta__fila--total">
                <span>Total</span>
                <span>{fmtMoney(total)}</span>
              </div>
            </div>

            <button
              className="btn btn--primario btn--completo"
              disabled={!carritoValido || guardando}
              onClick={() => setConfirmando(true)}
            >
              {guardando ? 'Guardando…' : 'Confirmar venta'}
            </button>
            {!carritoValido && carrito.length > 0 && (
              <p className="texto-tenue" role="note">
                Verifica cantidades (enteros mayores que 0) y que el descuento no supere el subtotal.
              </p>
            )}
          </section>
        </div>
      </div>

      <ConfirmDialog
        abierto={confirmando}
        titulo="Confirmar venta"
        mensaje={`Se registrarán ${carrito.length} producto(s) por un total de ${fmtMoney(total)} y se descontará el inventario.`}
        textoConfirmar="Guardar venta"
        onConfirmar={confirmarVenta}
        onCancelar={() => setConfirmando(false)}
      />
    </div>
  );
}
