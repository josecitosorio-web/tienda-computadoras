import { useCallback, useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, fmtMoney, fmtFecha } from '../services/api.js';
import { Spinner, EstadoError, Badge, ConfirmDialog } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';
import envTienda from '../services/tienda.js';

export default function DetalleVenta() {
  const { id } = useParams();
  const navigate = useNavigate();
  const toast = useToast();

  const [venta, setVenta] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);
  const [confirmarAnulacion, setConfirmarAnulacion] = useState(false);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const datos = await api.get(`/ventas/${id}`);
      setVenta(datos);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [id]);

  useEffect(() => {
    cargar();
  }, [cargar]);

  const anular = async () => {
    setConfirmarAnulacion(false);
    try {
      const actualizada = await api.patch(`/ventas/${id}/anular`);
      setVenta(actualizada);
      toast.exito('Venta anulada y stock restaurado');
    } catch (err) {
      toast.error(err.message);
    }
  };

  if (cargando) return <Spinner texto="Cargando venta…" />;
  if (error) return <EstadoError mensaje={error} reintentar={cargar} />;
  if (!venta) return null;

  const esCompletada = venta.estado === 'completada';

  return (
    <div>
      <div className="cabecera-pagina">
        <h2>Venta {venta.numeroVenta}</h2>
        <div className="cabecera-pagina__acciones">
          <Link to="/ventas" className="enlace">
            ← Historial
          </Link>
          {esCompletada && (
            <button className="btn btn--peligroso" onClick={() => setConfirmarAnulacion(true)}>
              Anular venta
            </button>
          )}
        </div>
      </div>

      <div className="panel comprobante" id="comprobante">
        <div className="comprobante__cabecera no-print">
          <Badge tipo={esCompletada ? 'exito' : 'peligro'}>{venta.estado}</Badge>
          <span className="texto-tenue">{fmtFecha(venta.fecha)}</span>
        </div>

        <div className="comprobante__encabezado">
          <div>
            <h3 className="comprobante__tienda">{envTienda.nombre}</h3>
            <p className="comprobante__dato">RUC: {envTienda.ruc}</p>
            <p className="comprobante__dato">{envTienda.direccion}</p>
            <p className="comprobante__dato">{envTienda.telefono} · {envTienda.correo}</p>
          </div>
          <div className="comprobante__numero">
            <span className="comprobante__titulo-doc">Comprobante interno</span>
            <strong>{venta.numeroVenta}</strong>
            <span className="comprobante__dato">{fmtFecha(venta.fecha)}</span>
          </div>
        </div>

        <div className="comprobante__cliente">
          <div>
            <span className="comprobante__dato-titulo">Cliente</span>
            <p>{venta.clienteSnapshot?.nombreCompleto || 'Cliente genérico'}</p>
            {(venta.clienteSnapshot?.documentoTipo || venta.clienteSnapshot?.documentoNumero) && (
              <p className="comprobante__dato">
                {venta.clienteSnapshot.documentoTipo} {venta.clienteSnapshot.documentoNumero}
              </p>
            )}
          </div>
          <div>
            <span className="comprobante__dato-titulo">Método de pago</span>
            <p>{venta.metodoPago}</p>
          </div>
        </div>

        <div className="tabla-envoltura">
          <table className="tabla tabla--compacta">
            <thead>
              <tr>
                <th>Producto</th>
                <th>SKU</th>
                <th>Cant.</th>
                <th>Precio unit.</th>
                <th>Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {venta.items.map((i, idx) => (
                <tr key={`${i.productoId}-${idx}`}>
                  <td>
                    <strong>{i.nombreProducto}</strong>
                    <div className="texto-tenue">{i.marca}</div>
                  </td>
                  <td>{i.sku}</td>
                  <td>{i.cantidad}</td>
                  <td>{fmtMoney(i.precioUnitario)}</td>
                  <td>{fmtMoney(i.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="comprobante__totales">
          <div className="resumen-venta__fila">
            <span>Subtotal</span>
            <span>{fmtMoney(venta.subtotal)}</span>
          </div>
          <div className="resumen-venta__fila">
            <span>Descuento</span>
            <span>-{fmtMoney(venta.descuento)}</span>
          </div>
          <div className="resumen-venta__fila">
            <span>Impuesto</span>
            <span>{fmtMoney(venta.impuesto)}</span>
          </div>
          <div className="resumen-venta__fila resumen-venta__fila--total">
            <span>Total pagado</span>
            <span>{fmtMoney(venta.total)}</span>
          </div>
        </div>

        {venta.observaciones && <p className="comprobante__obs">Observaciones: {venta.observaciones}</p>}

        {venta.estado === 'anulada' && (
          <div className="sello-anulada" aria-hidden="true">
            ANULADA
          </div>
        )}

        <p className="comprobante__legal">
          Este comprobante es interno de la aplicación académica y no constituye una factura electrónica
          oficial de SUNAT.
        </p>
      </div>

      <div className="no-print form-acciones">
        <button className="btn btn--secundario" onClick={() => navigate('/ventas')}>
          Volver
        </button>
        <button className="btn btn--primario" onClick={() => window.print()} disabled={!esCompletada && venta.estado === 'anulada'}>
          Imprimir comprobante
        </button>
      </div>

      <ConfirmDialog
        abierto={confirmarAnulacion}
        titulo="Anular venta"
        mensaje={`¿Seguro que deseas anular la venta ${venta.numeroVenta}? El stock de los productos se restaurará una sola vez y no se podrá revertir.`}
        textoConfirmar="Anular"
        peligroso
        onConfirmar={anular}
        onCancelar={() => setConfirmarAnulacion(false)}
      />
    </div>
  );
}
