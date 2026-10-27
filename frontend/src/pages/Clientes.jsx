import { useCallback, useEffect, useState } from 'react';
import { api, fmtFecha } from '../services/api.js';
import { Spinner, EstadoError, EstadoVacio, Paginacion, ConfirmDialog } from '../components/ui.jsx';
import { useToast } from '../components/Toast.jsx';

const estadoInicial = {
  nombre: '',
  apellido: '',
  documentoTipo: 'DNI',
  documentoNumero: '',
  telefono: '',
  correo: '',
  direccion: ''
};

export default function Clientes() {
  const toast = useToast();
  const [clientes, setClientes] = useState([]);
  const [paginacion, setPaginacion] = useState(null);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(null);

  const [buscar, setBuscar] = useState('');
  const [pagina, setPagina] = useState(1);

  const [formAbierto, setFormAbierto] = useState(false);
  const [editando, setEditando] = useState(null); // null = nuevo, objeto = edición
  const [datos, setDatos] = useState(estadoInicial);
  const [errorForm, setErrorForm] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    setError(null);
    try {
      const params = new URLSearchParams({ pagina: String(pagina), limite: '10' });
      if (buscar) params.set('buscar', buscar);
      const d = await api.get(`/clientes?${params}`);
      setClientes(d.clientes);
      setPaginacion(d.paginacion);
    } catch (err) {
      setError(err.message);
    } finally {
      setCargando(false);
    }
  }, [buscar, pagina]);

  useEffect(() => {
    const t = setTimeout(cargar, 300);
    return () => clearTimeout(t);
  }, [cargar]);

  const abrirNuevo = () => {
    setEditando(null);
    setDatos(estadoInicial);
    setErrorForm('');
    setFormAbierto(true);
  };

  const abrirEdicion = (cliente) => {
    setEditando(cliente);
    setDatos({
      nombre: cliente.nombre || '',
      apellido: cliente.apellido || '',
      documentoTipo: cliente.documentoTipo || 'DNI',
      documentoNumero: cliente.documentoNumero || '',
      telefono: cliente.telefono || '',
      correo: cliente.correo || '',
      direccion: cliente.direccion || ''
    });
    setErrorForm('');
    setFormAbierto(true);
  };

  const guardar = async (e) => {
    e.preventDefault();
    if (!datos.nombre.trim()) {
      setErrorForm('El nombre es obligatorio');
      return;
    }
    setGuardando(true);
    setErrorForm('');
    try {
      if (editando) {
        await api.patch(`/clientes/${editando._id}`, datos);
        toast.exito('Cliente actualizado');
      } else {
        await api.post('/clientes', datos);
        toast.exito('Cliente registrado');
      }
      setFormAbierto(false);
      cargar();
    } catch (err) {
      setErrorForm(err.message);
    } finally {
      setGuardando(false);
    }
  };

  const eliminar = async () => {
    const cliente = confirmarEliminar;
    setConfirmarEliminar(null);
    try {
      await api.del(`/clientes/${cliente._id}`);
      toast.exito('Cliente eliminado');
      cargar();
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div>
      <div className="cabecera-pagina">
        <h2>Clientes</h2>
        <button className="btn btn--primario" onClick={abrirNuevo}>
          + Registrar cliente
        </button>
      </div>

      <div className="panel panel--filtros">
        <input className="input" placeholder="Buscar por nombre o documento…" value={buscar} onChange={(e) => { setBuscar(e.target.value); setPagina(1); }} />
      </div>

      {cargando ? (
        <Spinner texto="Cargando clientes…" />
      ) : error ? (
        <EstadoError mensaje={error} reintentar={cargar} />
      ) : clientes.length === 0 ? (
        <EstadoVacio
          mensaje={buscar ? 'Sin clientes que coincidan.' : 'No hay clientes registrados. Es optional: las ventas pueden usar cliente genérico.'}
          accion={
            !buscar && (
              <button className="btn btn--primario" onClick={abrirNuevo}>
                Registrar el primero
              </button>
            )
          }
        />
      ) : (
        <div className="tabla-envoltura">
          <table className="tabla">
            <thead>
              <tr>
                <th>Nombre</th>
                <th>Documento</th>
                <th>Teléfono</th>
                <th>Correo</th>
                <th>Registrado</th>
                <th className="tabla__acc">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {clientes.map((c) => (
                <tr key={c._id}>
                  <td>
                    <strong>{[c.nombre, c.apellido].filter(Boolean).join(' ')}</strong>
                  </td>
                  <td>
                    {c.documentoNumero ? `${c.documentoTipo || ''} ${c.documentoNumero}` : '—'}
                  </td>
                  <td>{c.telefono || '—'}</td>
                  <td>{c.correo || '—'}</td>
                  <td>{fmtFecha(c.createdAt)}</td>
                  <td className="tabla__acc">
                    <button className="btn btn--secundario btn--sm" onClick={() => abrirEdicion(c)}>
                      Editar
                    </button>
                    <button className="btn btn--peligroso btn--sm" onClick={() => setConfirmarEliminar(c)}>
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

      {formAbierto && (
        <div className="modal-fondo" onClick={() => setFormAbierto(false)}>
          <form className="modal modal--form" onClick={(e) => e.stopPropagation()} onSubmit={guardar}>
            <h3 className="modal__titulo">{editando ? 'Editar cliente' : 'Registrar cliente'}</h3>
            {errorForm && <div className="aviso aviso--error">{errorForm}</div>}
            <div className="campos-rejilla">
              <div className="campo">
                <label>Nombre *</label>
                <input className="input" value={datos.nombre} onChange={(e) => setDatos({ ...datos, nombre: e.target.value })} />
              </div>
              <div className="campo">
                <label>Apellido</label>
                <input className="input" value={datos.apellido} onChange={(e) => setDatos({ ...datos, apellido: e.target.value })} />
              </div>
              <div className="campo">
                <label>Tipo de documento</label>
                <select className="select" value={datos.documentoTipo} onChange={(e) => setDatos({ ...datos, documentoTipo: e.target.value })}>
                  <option value="DNI">DNI</option>
                  <option value="RUC">RUC</option>
                  <option value="CE">Carné de extranjería</option>
                  <option value="PASAPORTE">Pasaporte</option>
                  <option value="">Sin documento</option>
                </select>
              </div>
              <div className="campo">
                <label>N° de documento</label>
                <input className="input" value={datos.documentoNumero} onChange={(e) => setDatos({ ...datos, documentoNumero: e.target.value })} />
              </div>
              <div className="campo">
                <label>Teléfono</label>
                <input className="input" value={datos.telefono} onChange={(e) => setDatos({ ...datos, telefono: e.target.value })} />
              </div>
              <div className="campo">
                <label>Correo</label>
                <input type="email" className="input" value={datos.correo} onChange={(e) => setDatos({ ...datos, correo: e.target.value })} />
              </div>
              <div className="campo campo--completo">
                <label>Dirección</label>
                <input className="input" value={datos.direccion} onChange={(e) => setDatos({ ...datos, direccion: e.target.value })} />
              </div>
            </div>
            <div className="form-acciones">
              <button type="button" className="btn btn--secundario" onClick={() => setFormAbierto(false)}>
                Cancelar
              </button>
              <button type="submit" className="btn btn--primario" disabled={guardando}>
                {guardando ? 'Guardando…' : 'Guardar'}
              </button>
            </div>
          </form>
        </div>
      )}

      <ConfirmDialog
        abierto={Boolean(confirmarEliminar)}
        titulo="Eliminar cliente"
        mensaje={`¿Seguro que deseas eliminar a "${confirmarEliminar?.nombre}"? Si tiene ventas registradas no se podrá eliminar.`}
        textoConfirmar="Eliminar"
        peligroso
        onConfirmar={eliminar}
        onCancelar={() => setConfirmarEliminar(null)}
      />
    </div>
  );
}
