import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react-swc';
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 8080,
    proxy: {
      '/v4': 'https://api.football-data.org'
    }
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, "./src"),
      '@components': '/src/components',
      '@utils': '/src/utils',
      '@config': '/src/config',
      "@api": "src/services/api",
      types: '/src/types' 
   /*'@hooks': '/src/hooks',
      '@lib': '/src/lib',*/
    }
  }
})
