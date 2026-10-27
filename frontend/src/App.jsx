import { useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout.jsx';
import Dashboard from './pages/Dashboard.jsx';
import Inventario from './pages/Inventario.jsx';
import ProductoForm from './pages/ProductoForm.jsx';
import HistorialVentas from './pages/HistorialVentas.jsx';
import NuevaVenta from './pages/NuevaVenta.jsx';
import DetalleVenta from './pages/DetalleVenta.jsx';
import Clientes from './pages/Clientes.jsx';
import { ToastProvider } from './components/Toast.jsx';

export default function App() {
  // Estado global ligero: nombre de la tienda para la barra superior.
  const [tiendaNombre] = useState('Tienda de Computadoras');

  return (
    <ToastProvider>
      <Routes>
        <Route element={<Layout tiendaNombre={tiendaNombre} />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/inventario" element={<Inventario />} />
          <Route path="/productos/nuevo" element={<ProductoForm />} />
          <Route path="/productos/:id/editar" element={<ProductoForm />} />
          <Route path="/ventas" element={<HistorialVentas />} />
          <Route path="/ventas/nueva" element={<NuevaVenta />} />
          <Route path="/ventas/:id" element={<DetalleVenta />} />
          <Route path="/clientes" element={<Clientes />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
