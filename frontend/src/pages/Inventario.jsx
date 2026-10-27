import { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, fmtMoney } from '../services/api.js';
import { Spinner, EstadoError, EstadoVacio, Badge, Paginacion, ConfirmDialog } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Inventario() {
  const [productos, setProductos] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [filtros, setFiltros] = useState({ buscar: '', categoria: '', estado: '', stockBajo: false });
  const [pagina, setPagina] = useState(1);

  const [confirmar, setConfirmar] = useState({ abierto: false, producto: null });
  const navigate = useNavigate();
  const toast = useToast();

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (filtros.buscar) params.set('buscar', filtros.buscar);
      if (filtros.categoria) params.set('categoria', filtros.categoria);
      if (filtros.estado) params.set('estado', filtros.estado);
      if (filtros.stockBajo) params.set('stockBajo', 'true');
      params.set('pagina', String(pagina));
      params.set('limite', '10');

      const datos = await api.get(`/productos?${params.toString()}`);
      setProductos(datos.productos);
      setPaginacion(datos.paginacion);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [filtros, pagina]);

  useEffect(() => {
    const t = setTimeout(cargar, 300); // Debounce para la búsqueda
    return () => clearTimeout(t);
  }, [cargar]);

  const cambiarFiltro = (campo, valor) => {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPagina(1);
  };

  const toggleEstado = async (producto) => {
    const nuevoEstado = producto.estado === 'activo' ? 'inactivo' : 'activo';
    try {
      await api.patch(`/productos/${producto._id}/estado`, { estado: nuevoEstado });
      toast.exito(`Producto ${nuevoEstado === 'activo' ? 'activado' : 'desactivado'}`);
      cargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const eliminar = async () => {
    const producto = confirmar.producto;
    setConfirmar({ abierto: false, producto: null });
    try {
      await api.del(`/productos/${producto._id}`);
      toast.exito('Producto eliminado');
      cargar();
    } catch (err) {
      // Si tiene ventas, la API sugiere desactivar: lo hacemos automáticamente.
      toast.error(err.message);
      if (err.status === 409) {
        try {
          await api.patch(`/productos/${producto._id}/estado`, { estado: 'inactivo' });
          toast.info(`"${producto.nombre}" se desactivó porque tiene ventas registradas`);
          cargar();
        } catch (err2) {
          toast.error(err2.message);
        }
      }
    }
  };

  return (
    <div>
      <div className="cabecera-pagina">
        <h2>Inventario</h2>
        <Link to="/productos/nuevo" className="btn btn--primario">
          + Registrar producto
        </Link>
      </div>

      <div className="panel panel--filtros">
        <input
          className="input"
          placeholder="Buscar por nombre, SKU, marca o modelo…"
          value={filtros.buscar}
          onChange={(e) => cambiarFiltro('buscar', e.target.value)}
        />
        <select className="select" value={filtros.categoria} onChange={(e) => cambiarFiltro('categoria', e.target.value)}>
          <option value="">Todas las categorías</option>
          {CATEGORIAS.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <select className="select" value={filtros.estado} onChange={(e) => cambiarFiltro('estado', e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={filtros.stockBajo}
            onChange={(e) => cambiarFiltro('stockBajo', e.target.checked)}
          />
          Solo stock bajo
        </label>
      </div>

      {cargando ? (
        <Spinner texto="Cargando productos…" />
      ) : error ? (
        <EstadoError mensaje={error} reintentar={cargar} />
      ) : productos.length === 0 ? (
        <EstadoVacio
          mensaje="No hay productos que coincidan con la búsqueda."
          accion={
            <Link to="/productos/nuevo" className="btn btn--primario">
              Registrar el primero
            </Link>
          }
        />
      ) : (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Categoría</th>
                <th>Precio venta</th>
                <th>Stock</th>
                <th>Estado</th>
                <th className="tabla__acc">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {productos.map((p) => (
                <tr key={p._id} className={p.estado === 'inactivo' ? 'fila--inactiva' : ''}>
                  <td>
                    <strong>{p.nombre}</strong>
                    <div className="texto-tenue">
                      {p.marca} · {p.modelo}
                    </div>
                  </td>
                  <td>{p.sku}</td>
                  <td>{p.categoria}</td>
                  <td>{fmtMoney(p.precioVenta)}</td>
                  <td>
                    <span className={`stock ${p.stock === 0 ? 'stock--agotado' : p.stock <= p.stockMinimo ? 'stock--bajo' : ''}`}>
                      {p.stock}
                      {p.stock === 0 && ' · agotado'}
                      {p.stock > 0 && p.stock <= p.stockMinimo && ' · bajo'}
                    </span>
                  </td>
                  <td>
                    <Badge tipo={p.estado === 'activo' ? 'exito' : 'gris'}>{p.estado}</Badge>
                  </td>
                  <td className="tabla__acc">
                    <button className="btn btn--secundario btn--sm" onClick={() => navigate(`/productos/${p._id}/editar`)}>
                      Editar
                    </button>
                    <button className="btn btn--secundario btn--sm" onClick={() => toggleEstado(p)}>
                      {p.estado === 'activo' ? 'Desactivar' : 'Activar'}
                    </button>
                    <button
                      className="btn btn--peligroso btn--sm"
                      onClick={() => setConfirmar({ abierto: true, producto: p })}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginacion && <Paginacion paginacion={paginacion} onChange={setPagina} />}

      <ConfirmDialog
        abierto={confirmar.abierto}
        titulo="Eliminar producto"
        mensaje={`¿Seguro que deseas eliminar "${confirmar.producto?.nombre}"? Esta acción no se puede deshacer.`}
        textoConfirmar="Eliminar"
        peligroso
        onConfirmar={eliminar}
        onCancelar={() => setConfirmar({ abierto: false, producto: null })}
      />
    </div>
  );
}

// Categorías consistentes con el modelo de datos del enunciado.
export const CATEGORIAS = [
  'Laptop',
  'PC de escritorio',
  'Monitor',
  'Teclado',
  'Mouse',
  'Componentes',
  'Almacenamiento',
  'Accesorios'
];
