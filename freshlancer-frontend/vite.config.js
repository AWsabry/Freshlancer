import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiBaseUrl = env.VITE_API_BASE_URL ||  "https://lashell-precaudal-glinda.ngrok-free.dev";

  if (!apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is not defined. Please set it in your environment.');
  }

  return {
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    server: {
      port: 3000,
      allowedHosts: [
        'localhost',
      ],
      proxy: {
        '/api': {
          target: apiBaseUrl.replace(/\/$/, ''),
          changeOrigin: true,
        },
      },
    },
  };
});
