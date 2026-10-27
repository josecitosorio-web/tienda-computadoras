import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtMoney, fmtFecha } from '../services/api.js';
import { Spinner, EstadoError, EstadoVacio, Badge, Paginacion } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';

export default function HistorialVentas() {
  const [ventas, setVentas] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const [filtros, setFiltros] = useState({ fechaDesde: '', fechaHasta: '', estado: '', numeroVenta: '' });
  const [pagina, setPagina] = useState(1);

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCargando(true);
      setError(null);
      try {
        const params = new URLSearchParams();
        if (filtros.fechaDesde) params.set('fechaDesde', filtros.fechaDesde);
        if (filtros.fechaHasta) params.set('fechaHasta', filtros.fechaHasta);
        if (filtros.estado) params.set('estado', filtros.estado);
        if (filtros.numeroVenta) params.set('numeroVenta', filtros.numeroVenta);
        params.set('pagina', String(pagina));
        params.set('limite', '10');

        const datos = await api.get(`/ventas?${params.toString()}`);
        setVentas(datos.ventas);
        setPaginacion(datos.paginacion);
      } catch (err) {
        setError(err.message);
      } finally {
        setCargando(false);
      }
    },
    [filtros, pagina]
  );

  useEffect(() => {
    cargar();
  }, [cargar]);

  const cambiarFiltro = (campo, valor) => {
    setFiltros((f) => ({ ...f, [campo]: valor }));
    setPagina(1);
  };

  const hayFiltros = Object.values(filtros).some(Boolean);

  return (
    <div>
      <div className="cabecera-pagina">
        <h2>Historial de ventas</h2>
        <Link to="/ventas/nueva" className="btn btn--primario">
          + Nueva venta
        </Link>
      </div>

      <div className="panel panel--filtros">
        <input
          className="input"
          placeholder="Buscar por N° de venta…"
          value={filtros.numeroVenta}
          onChange={(e) => cambiarFiltro('numeroVenta', e.target.value)}
        />
        <div className="campo-inline">
          <label htmlFor="desde">Desde</label>
          <input id="desde" type="date" className="input" value={filtros.fechaDesde} onChange={(e) => cambiarFiltro('fechaDesde', e.target.value)} />
        </div>
        <div className="campo-inline">
          <label htmlFor="hasta">Hasta</label>
          <input id="hasta" type="date" className="input" value={filtros.fechaHasta} onChange={(e) => cambiarFiltro('fechaHasta', e.target.value)} />
        </div>
        <select className="select" value={filtros.estado} onChange={(e) => cambiarFiltro('estado', e.target.value)}>
          <option value="">Todos los estados</option>
          <option value="completada">Completadas</option>
          <option value="anulada">Anuladas</option>
        </select>
        {hayFiltros && (
          <button
            className="btn btn--secundario"
            onClick={() => {
              setFiltros({ fechaDesde: '', fechaHasta: '', estado: '', numeroVenta: '' });
              setPagina(1);
            }}
          >
            Limpiar filtros
          </button>
        )}
      </div>

      {cargando ? (
        <Spinner texto="Cargando ventas…" />
      ) : error ? (
        <EstadoError mensaje={error} reintentar={() => cargar()} />
      ) : ventas.length === 0 ? (
        <EstadoVacio mensaje={hayFiltros ? 'No hay ventas con esos filtros.' : 'Aún no se han registrado ventas.'} />
      ) : (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>N° venta</th>
                <th>Fecha</th>
                <th>Cliente</th>
                <th>Ítems</th>
                <th>Método</th>
                <th>Total</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {ventas.map((v) => (
                <tr key={v._id} className={v.estado === 'anulada' ? 'fila--inactiva' : ''}>
                  <td>{v.numeroVenta}</td>
                  <td>{fmtFecha(v.fecha)}</td>
                  <td>{v.clienteSnapshot?.nombreCompleto || 'Cliente genérico'}</td>
                  <td>{v.items.reduce((s, i) => s + i.cantidad, 0)}</td>
                  <td>{v.metodoPago}</td>
                  <td>{fmtMoney(v.total)}</td>
                  <td>
                    <Badge tipo={v.estado === 'completada' ? 'exito' : 'peligro'}>{v.estado}</Badge>
                  </td>
                  <td>
                    <Link className="btn btn--secundario btn--sm" to={`/ventas/${v._id}`}>
                      Ver detalle
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {paginacion && <Paginacion paginacion={paginacion} onChange={setPagina} />}
    </div>
  );
}
