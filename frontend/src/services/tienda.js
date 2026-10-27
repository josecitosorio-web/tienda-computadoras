// Datos de la tienda mostrados en el comprobante interno.
// Coinciden con las variables TIENDA_* del backend (.env). En una versión
// con autenticación vendrían de la API; aquí se usan como configuración local.
const tienda = {
  nombre: import.meta.env.VITE_TIENDA_NOMBRE || 'Tienda de Computadoras',
  ruc: import.meta.env.VITE_TIENDA_RUC || '20123456789',
  direccion: import.meta.env.VITE_TIENDA_DIRECCION || 'Av. Principal 123, Lima',
  telefono: import.meta.env.VITE_TIENDA_TELEFONO || '(01) 555-0000',
  correo: import.meta.env.VITE_TIENDA_CORREO || 'ventas@tiendacomputadoras.pe'
};

export default tienda;
