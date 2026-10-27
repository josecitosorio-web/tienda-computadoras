import { NavLink, Outlet, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

// Iconos SVG inline (sin dependencias externas).
const iconos = {
  dashboard: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <rect x="3" y="3" width="7" height="9" rx="1.5" />
      <rect x="14" y="3" width="7" height="5" rx="1.5" />
      <rect x="14" y="12" width="7" height="9" rx="1.5" />
      <rect x="3" y="16" width="7" height="5" rx="1.5" />
    </svg>
  ),
  inventario: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </svg>
  ),
  ventas: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M4 19V5M4 19h16M8 16v-5M12 16V8M16 16v-3" />
    </svg>
  ),
  nuevaVenta: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="20" r="1.5" />
      <circle cx="18" cy="20" r="1.5" />
      <path d="M2 3h3l3 12h11l2-8H6" />
    </svg>
  ),
  clientes: (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c.8-3.2 3.4-5 6.5-5s5.7 1.8 6.5 5" />
      <path d="M16 4.5a3.5 3.5 0 010 7M18.5 15.6c2 .7 3.3 2.2 3.9 4.4" />
    </svg>
  )
};

const enlaces = [
  { to: '/', etiqueta: 'Dashboard', icono: 'dashboard', fin: true },
  { to: '/inventario', etiqueta: 'Inventario', icono: 'inventario' },
  { to: '/ventas', etiqueta: 'Historial de ventas', icono: 'ventas' },
  { to: '/ventas/nueva', etiqueta: 'Nueva venta', icono: 'nuevaVenta' },
  { to: '/clientes', etiqueta: 'Clientes', icono: 'clientes' }
];

export default function Layout({ tiendaNombre }) {
  const [menuAbierto, setMenuAbierto] = useState(false);
  const ubicacion = useLocation();

  // Cierra el menú móvil al cambiar de página.
  useEffect(() => setMenuAbierto(false), [ubicacion.pathname]);

  return (
    <div className="layout">
      <button
        className="sidebar-toggle"
        onClick={() => setMenuAbierto((v) => !v)}
        aria-label={menuAbierto ? 'Cerrar menú' : 'Abrir menú'}
      >
        ☰
      </button>
      {menuAbierto && <div className="sidebar-overlay" onClick={() => setMenuAbierto(false)} />}

      <aside className={`sidebar ${menuAbierto ? 'sidebar--abierta' : ''}`}>
        <div className="sidebar__logo">
          <span className="sidebar__logo-cuadro">TC</span>
          <span className="sidebar__logo-texto">{tiendaNombre}</span>
        </div>
        <nav className="sidebar__nav">
          {enlaces.map((e) => (
            <NavLink
              key={e.to}
              to={e.to}
              end={e.fin}
              className={({ isActive }) => `sidebar__enlace ${isActive ? 'sidebar__enlace--activo' : ''}`}
            >
              <span className="sidebar__icono">{iconos[e.icono]}</span>
              {e.etiqueta}
            </NavLink>
          ))}
        </nav>
        <div className="sidebar__pie">
          Comprobante interno · No válido como factura electrónica de SUNAT
        </div>
      </aside>

      <div className="contenido">
        <header className="topbar">
          <h1 className="topbar__titulo">{tiendaNombre}</h1>
          <span className="topbar__sub">Sistema de ventas y facturación interna</span>
        </header>
        <main className="pagina">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
