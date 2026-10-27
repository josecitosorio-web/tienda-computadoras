import { createContext, useCallback, useContext, useState } from 'react';

// Sistema de notificaciones integrado en la interfaz (no se usa alert()).
const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const notificar = useCallback((mensaje, tipo = 'info', duracion = 3500) => {
    const id = Date.now() + Math.random();
    setToasts((prev) => [...prev, { id, mensaje, tipo }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, duracion);
  }, []);

  const mostrar = {
    exito: (m) => notificar(m, 'exito'),
    error: (m) => notificar(m, 'error', 5000),
    info: (m) => notificar(m, 'info')
  };

  return (
    <ToastContext.Provider value={mostrar}>
      {children}
      <div className="toast-container" aria-live="polite">
        {toasts.map((t) => (
          <div key={t.id} className={`toast toast--${t.tipo}`}>
            <span className="toast__icono">
              {t.tipo === 'exito' ? '✓' : t.tipo === 'error' ? '✕' : 'ℹ'}
            </span>
            {t.mensaje}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast debe usarse dentro de ToastProvider');
  return ctx;
}
