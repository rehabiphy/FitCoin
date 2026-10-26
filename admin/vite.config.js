import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// The live API's origin (the panel adds /api/v1)
const LIVE_ORIGIN = 'https://fitcoin-7jq7.onrender.com';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  // `npm run dev` -> local backend, `npm run dev:live` -> live backend
  const target = env.API_PROXY_TARGET || (mode === 'live' ? LIVE_ORIGIN : 'http://localhost:5000');
  return {
    plugins: [react()],
    server: {
      port: 5173,
      // The panel calls /api/v1 on itself and Vite forwards it, so no CORS setup is needed while developing
      proxy: {
        '/api': { target, changeOrigin: true, secure: true },
      },
    },
  };
});
