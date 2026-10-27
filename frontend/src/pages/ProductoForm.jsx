import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { api } from '../services/api.js';
import { useToast } from '../components/Toast.jsx';
import { CATEGORIAS } from './Inventario.jsx';
import { Spinner } from '../components/ui.jsx';

const estadoInicial = {
  nombre: '',
  marca: '',
  modelo: '',
  categoria: '',
  descripcion: '',
  sku: '',
  precioCompra: '0',
  precioVenta: '',
  stock: '0',
  stockMinimo: '0',
  estado: 'activo'
};

export default function ProductoForm() {
  const { id } = useParams();
  const esEdicion = Boolean(id);
  const navigate = useNavigate();
  const toast = useToast();

  const [datos, setDatos] = useState(estadoInicial);
  const [errores, setErrores] = useState({});
  const [enviando, setEnviando] = useState(false);
  const [cargandoProducto, setCargandoProducto] = useState(esEdicion);

  useEffect(() => {
    if (!esEdicion) return;
    let activo = true;
    (async () => {
      try {
        const p = await api.get(`/productos/${id}`);
        if (!activo) return;
        setDatos({
          nombre: p.nombre,
          marca: p.marca,
          modelo: p.modelo,
          categoria: p.categoria,
          descripcion: p.descripcion || '',
          sku: p.sku,
          precioCompra: String(p.precioCompra ?? '0'),
          precioVenta: String(p.precioVenta ?? ''),
          stock: String(p.stock ?? '0'),
          stockMinimo: String(p.stockMinimo ?? '0'),
          estado: p.estado
        });
      } catch (err) {
        toast.error(err.message);
        navigate('/inventario');
      } finally {
        if (activo) setCargandoProducto(false);
      }
    })();
    return () => {
      activo = false;
    };
  }, [esEdicion, id, navigate, toast]);

  const actualizarCampo = (campo, valor) => {
    setDatos((d) => ({ ...d, [campo]: valor }));
    setErrores((e) => ({ ...e, [campo]: undefined }));
  };

  // Validación en el cliente coherente con las reglas del backend.
  const validar = () => {
    const e = {};
    if (!datos.nombre.trim()) e.nombre = 'El nombre es obligatorio';
    if (!datos.marca.trim()) e.marca = 'La marca es obligatoria';
    if (!datos.modelo.trim()) e.modelo = 'El modelo es obligatorio';
    if (!datos.categoria) e.categoria = 'Selecciona una categoría';
    if (!datos.sku.trim()) e.sku = 'El SKU es obligatorio';

    const pv = Number(datos.precioVenta);
    if (!datos.precioVenta || Number.isNaN(pv) || pv <= 0) e.precioVenta = 'Debe ser un número mayor que 0';

    const pc = Number(datos.precioCompra);
    if (Number.isNaN(pc) || pc < 0) e.precioCompra = 'No puede ser negativo';

    const stock = Number(datos.stock);
    if (!Number.isInteger(stock) || stock < 0) e.stock = 'Debe ser un entero mayor o igual que 0';

    const stockMin = Number(datos.stockMinimo);
    if (!Number.isInteger(stockMin) || stockMin < 0) e.stockMinimo = 'Debe ser un entero mayor o igual que 0';

    setErrores(e);
    return Object.keys(e).length === 0;
  };

  const enviar = async (evento) => {
    evento.preventDefault();
    if (!validar()) return;

    setEnviando(true);
    const cuerpo = {
      nombre: datos.nombre.trim(),
      marca: datos.marca.trim(),
      modelo: datos.modelo.trim(),
      categoria: datos.categoria,
      descripcion: datos.descripcion.trim(),
      sku: datos.sku.trim().toUpperCase(),
      precioCompra: Number(datos.precioCompra),
      precioVenta: Number(datos.precioVenta),
      stock: Number(datos.stock),
      stockMinimo: Number(datos.stockMinimo),
      estado: datos.estado
    };

    try {
      if (esEdicion) {
        // En edición no se permite modificar el stock directamente para no romper inventario.
        delete cuerpo.stock;
        await api.put(`/productos/${id}`, cuerpo);
        toast.exito('Producto actualizado');
      } else {
        await api.post('/productos', cuerpo);
        toast.exito('Producto registrado');
      }
      navigate('/inventario');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setEnviando(false);
    }
  };

  if (cargandoProducto) return <Spinner texto="Cargando producto…" />;

  return (
    <div className="ancho-lectura">
      <div className="cabecera-pagina">
        <h2>{esEdicion ? 'Editar producto' : 'Registrar producto'}</h2>
        <Link to="/inventario" className="enlace">
          ← Volver al inventario
        </Link>
      </div>

      <form className="panel panel--formulario" onSubmit={enviar} noValidate>
        <div className="campos-rejilla">
          <div className="campo">
            <label htmlFor="nombre">Nombre *</label>
            <input id="nombre" className={`input ${errores.nombre ? 'input--error' : ''}`} value={datos.nombre} onChange={(e) => actualizarCampo('nombre', e.target.value)} />
            {errores.nombre && <span className="error-texto">{errores.nombre}</span>}
          </div>

          <div className="campo">
            <label htmlFor="sku">SKU *</label>
            <input id="sku" className={`input ${errores.sku ? 'input--error' : ''}`} value={datos.sku} onChange={(e) => actualizarCampo('sku', e.target.value.toUpperCase())} />
            {errores.sku && <span className="error-texto">{errores.sku}</span>}
          </div>

          <div className="campo">
            <label htmlFor="marca">Marca *</label>
            <input id="marca" className={`input ${errores.marca ? 'input--error' : ''}`} value={datos.marca} onChange={(e) => actualizarCampo('marca', e.target.value)} />
            {errores.marca && <span className="error-texto">{errores.marca}</span>}
          </div>

          <div className="campo">
            <label htmlFor="modelo">Modelo *</label>
            <input id="modelo" className={`input ${errores.modelo ? 'input--error' : ''}`} value={datos.modelo} onChange={(e) => actualizarCampo('modelo', e.target.value)} />
            {errores.modelo && <span className="error-texto">{errores.modelo}</span>}
          </div>

          <div className="campo">
            <label htmlFor="categoria">Categoría *</label>
            <select id="categoria" className={`select ${errores.categoria ? 'input--error' : ''}`} value={datos.categoria} onChange={(e) => actualizarCampo('categoria', e.target.value)}>
              <option value="">Selecciona…</option>
              {CATEGORIAS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
            {errores.categoria && <span className="error-texto">{errores.categoria}</span>}
          </div>

          <div className="campo">
            <label htmlFor="estado">Estado</label>
            <select id="estado" className="select" value={datos.estado} onChange={(e) => actualizarCampo('estado', e.target.value)}>
              <option value="activo">Activo</option>
              <option value="inactivo">Inactivo</option>
            </select>
          </div>

          <div className="campo">
            <label htmlFor="precioCompra">Precio compra (S/)</label>
            <input id="precioCompra" type="number" min="0" step="0.01" className={`input ${errores.precioCompra ? 'input--error' : ''}`} value={datos.precioCompra} onChange={(e) => actualizarCampo('precioCompra', e.target.value)} />
            {errores.precioCompra && <span className="error-texto">{errores.precioCompra}</span>}
          </div>

          <div className="campo">
            <label htmlFor="precioVenta">Precio venta (S/) *</label>
            <input id="precioVenta" type="number" min="0.01" step="0.01" className={`input ${errores.precioVenta ? 'input--error' : ''}`} value={datos.precioVenta} onChange={(e) => actualizarCampo('precioVenta', e.target.value)} />
            {errores.precioVenta && <span className="error-texto">{errores.precioVenta}</span>}
          </div>

          {!esEdicion && (
            <div className="campo">
              <label htmlFor="stock">Stock inicial</label>
              <input id="stock" type="number" min="0" step="1" className={`input ${errores.stock ? 'input--error' : ''}`} value={datos.stock} onChange={(e) => actualizarCampo('stock', e.target.value)} />
              {errores.stock && <span className="error-texto">{errores.stock}</span>}
            </div>
          )}

          <div className="campo">
            <label htmlFor="stockMinimo">Stock mínimo (alerta)</label>
            <input id="stockMinimo" type="number" min="0" step="1" className={`input ${errores.stockMinimo ? 'input--error' : ''}`} value={datos.stockMinimo} onChange={(e) => actualizarCampo('stockMinimo', e.target.value)} />
            {errores.stockMinimo && <span className="error-texto">{errores.stockMinimo}</span>}
          </div>

          <div className="campo campo--completo">
            <label htmlFor="descripcion">Descripción</label>
            <textarea id="descripcion" className="input" rows="2" value={datos.descripcion} onChange={(e) => actualizarCampo('descripcion', e.target.value)} />
          </div>
        </div>

        {esEdicion && (
          <p className="aviso">
            El stock se modifica automáticamente por las ventas y anulaciones; no se edita directamente.
          </p>
        )}

        <div className="form-acciones">
          <button type="button" className="btn btn--secundario" onClick={() => navigate('/inventario')}>
            Cancelar
          </button>
          <button type="submit" className="btn btn--primario" disabled={enviando}>
            {enviando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Registrar producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
