// Piezas de interfaz reutilizables: estados, paginación, confirmación y badges.

export function Spinner({ texto = 'Cargando…' }) {
  return (
    <div className="estado estado--cargando" role="status">
      <div className="spinner" />
      <span>{texto}</span>
    </div>
  );
}

export function EstadoVacio({ mensaje = 'Sin datos para mostrar', accion = null }) {
  return (
    <div className="estado estado--vacio">
      <div className="estado__icono">📭</div>
      <p>{mensaje}</p>
      {accion}
    </div>
  );
}

export function EstadoError({ mensaje = 'Ocurrió un error', reintentar }) {
  return (
    <div className="estado estado--error">
      <p>{mensaje}</p>
      {reintentar && (
        <button className="btn btn--secundario" onClick={reintentar}>
          Reintentar
        </button>
      )}
    </div>
  );
}

export function Badge({ tipo, children }) {
  return <span className={`badge badge--${tipo}`}>{children}</span>;
}

export function Paginacion({ paginacion, onChange }) {
  if (!paginacion || paginacion.paginas <= 1) return null;
  const { pagina, paginas } = paginacion;
  return (
    <div className="paginacion">
      <button className="btn btn--secundario btn--sm" disabled={pagina <= 1} onClick={() => onChange(pagina - 1)}>
        ‹ Anterior
      </button>
      <span className="paginacion__info">
        Página {pagina} de {paginas}
      </span>
      <button className="btn btn--secundario btn--sm" disabled={pagina >= paginas} onClick={() => onChange(pagina + 1)}>
        Siguiente ›
      </button>
    </div>
  );
}

export function ConfirmDialog({ abierto, titulo, mensaje, textoConfirmar = 'Confirmar', textoCancelar = 'Cancelar', peligroso = false, onConfirmar, onCancelar }) {
  if (!abierto) return null;
  return (
    <div className="modal-fondo" onClick={onCancelar}>
      <div className="modal" role="dialog" aria-modal="true" onClick={(e) => e.stopPropagation()}>
        <h3 className="modal__titulo">{titulo}</h3>
        <p className="modal__mensaje">{mensaje}</p>
        <div className="modal__acciones">
          <button className="btn btn--secundario" onClick={onCancelar}>
            {textoCancelar}
          </button>
          <button className={`btn ${peligroso ? 'btn--peligroso' : 'btn--primario'}`} onClick={onConfirmar} autoFocus>
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  );
}
