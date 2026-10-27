import { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { api, fmtMoney, fmtFecha } from '../services/api.js';
import { Spinner, EstadoError, Badge } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';

export default function Dashboard() {
  const [resumen, setResumen] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const toast = useToast();

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await api.get('/dashboard/resumen');
      setResumen(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => {
    cargar();
  }, [cargar]);

  if (cargando) return <Spinner texto="Cargando dashboard…" />;
  if (error) return <EstadoError mensaje={error} reintentar={cargar} />;
  if (!resumen) return null;

  return (
    <div>
      <div className="cabecera-pagina">
        <h2>Dashboard</h2>
        <div className="cabecera-pagina__acciones">
          <Link to="/ventas/nueva" className="btn btn--primario">
            + Nueva venta
          </Link>
          <Link to="/productos/nuevo" className="btn btn--secundario">
            + Registrar producto
          </Link>
        </div>
      </div>

      <div className="tarjetas-indicadores">
        <div className="tarjeta-indicador">
          <span className="tarjeta-indicador__etiqueta">Total vendido hoy</span>
          <span className="tarjeta-indicador__valor">{fmtMoney(resumen.totalVendidoHoy)}</span>
        </div>
        <div className="tarjeta-indicador">
          <span className="tarjeta-indicador__etiqueta">Ventas de hoy</span>
          <span className="tarjeta-indicador__valor">{resumen.ventasHoy}</span>
        </div>
        <div className="tarjeta-indicador">
          <span className="tarjeta-indicador__etiqueta">Productos activos</span>
          <span className="tarjeta-indicador__valor">{resumen.productosActivos}</span>
        </div>
        <div className={`tarjeta-indicador ${resumen.productosStockBajo > 0 ? 'tarjeta-indicador--alerta' : ''}`}>
          <span className="tarjeta-indicador__etiqueta">Stock bajo</span>
          <span className="tarjeta-indicador__valor">{resumen.productosStockBajo}</span>
        </div>
      </div>

      <div className="rejilla-2col">
        <section className="panel">
          <div className="panel__cabecera">
            <h3>Ventas recientes</h3>
            <Link to="/ventas" className="enlace">
              Ver historial →
            </Link>
          </div>
          {resumen.ventasRecientes.length === 0 ? (
            <p className="vacio-inline">No hay ventas registradas.</p>
          ) : (
            <div className="tabla-envoltura">
              <table className="tabla">
                <thead>
                  <tr>
                    <th>N° venta</th>
                    <th>Fecha</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {resumen.ventasRecientes.map((v) => (
                    <tr key={v._id}>
                      <td>
                        <Link className="enlace" to={`/ventas/${v._id}`}>
                          {v.numeroVenta}
                        </Link>
                      </td>
                      <td>{fmtFecha(v.fecha)}</td>
                      <td>{v.clienteSnapshot?.nombreCompleto || 'Cliente genérico'}</td>
                      <td>{fmtMoney(v.total)}</td>
                      <td>
                        <Badge tipo={v.estado === 'completada' ? 'exito' : 'peligro'}>
                          {v.estado}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <div className="columna-panel">
          <section className="panel">
            <div className="panel__cabecera">
              <h3>Alertas de stock bajo</h3>
            </div>
            {resumen.alertasStockBajo.length === 0 ? (
              <p className="vacio-inline">Todos los productos tienen stock suficiente.</p>
            ) : (
              <ul className="lista-alertas">
                {resumen.alertasStockBajo.map((p) => (
                  <li key={p._id} className="lista-alertas__item">
                    <span>
                      <strong>{p.nombre}</strong>
                      <span className="texto-tenue"> · {p.sku}</span>
                    </span>
                    <Badge tipo={p.agotado ? 'peligro' : 'alerta'}>
                      {p.agotado ? 'Agotado' : `Stock: ${p.stock}/${p.stockMinimo}`}
                    </Badge>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="panel">
            <div className="panel__cabecera">
              <h3>Productos más vendidos</h3>
            </div>
            {resumen.productosMasVendidos.length === 0 ? (
              <p className="vacio-inline">Aún no hay ventas completadas.</p>
            ) : (
              <ul className="lista-alertas">
                {resumen.productosMasVendidos.map((p) => (
                  <li key={p._id} className="lista-alertas__item">
                    <span>
                      <strong>{p.nombreProducto}</strong>
                      <span className="texto-tenue"> · {p.sku}</span>
                    </span>
                    <span className="texto-tenue">
                      {p.unidadesVendidas} u · {fmtMoney(p.ingresos)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
