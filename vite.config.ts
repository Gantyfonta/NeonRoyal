
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  base: './', // CRITICAL: Ensures assets use relative paths for GitHub Pages subfolder hosting
  define: {
    // Shim process.env for browser compatibility
    'process.env': {
      API_KEY: JSON.stringify(process.env.API_KEY || '')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: false,
    minify: 'terser',
  }
});
