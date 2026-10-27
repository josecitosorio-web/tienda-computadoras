// Cliente HTTP central para la API. En desarrollo usa el proxy de Vite (/api),
// en producción permite sobrescribir la URL base con VITE_API_URL.
const BASE_URL = import.meta.env.VITE_API_URL || '/api';

async function request(path, options = {}) {
  const config = {
    headers: { 'Content-Type': 'application/json' },
    ...options
  };

  const respuesta = await fetch(`${BASE_URL}${path}`, config);

  let datos = null;
  try {
    datos = await respuesta.json();
  } catch (_) {
    /* respuesta sin cuerpo JSON */
  }

  if (!respuesta.ok) {
    const mensaje = datos?.detalles?.length
      ? `${datos.mensaje}: ${datos.detalles.join(' | ')}`
      : datos?.mensaje || `Error HTTP ${respuesta.status}`;
    const error = new Error(mensaje);
    error.status = respuesta.status;
    throw error;
  }

  return datos;
}

export const api = {
  get: (path) => request(path),
  post: (path, body) => request(path, { method: 'POST', body: JSON.stringify(body) }),
  put: (path, body) => request(path, { method: 'PUT', body: JSON.stringify(body) }),
  patch: (path, body) => request(path, { method: 'PATCH', body: JSON.stringify(body) }),
  del: (path) => request(path, { method: 'DELETE' })
};

// Helpers de formato compartidos.
export const fmtMoney = (valor) =>
  new Intl.NumberFormat('es-PE', { style: 'currency', currency: 'PEN' }).format(valor || 0);

export const fmtFecha = (fecha) =>
  new Date(fecha).toLocaleString('es-PE', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
