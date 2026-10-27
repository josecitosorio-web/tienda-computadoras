import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Servidor de desarrollo con proxy hacia el backend para poder llamar
// a /api sin configurar CORS manualmente en cada petición.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true
      }
    }
  }
});
