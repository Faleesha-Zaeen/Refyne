import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
process.env.NODE_OPTIONS = "--max-old-space-size=4096";


export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:5000',
        changeOrigin: true,
        secure: false,
        config:{
          maxBodyLength:Infinity,
          maxContentLength:Infinity
        },
        ws: true,
        timeout: 0,           // ⬅ prevents upload timeout
        proxyTimeout: 0,      // ⬅ prevents upstream timeout
      }
    }
  }
});

