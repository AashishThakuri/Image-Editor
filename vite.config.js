import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  return {
    plugins: [react()],
    server: {
      port: 3000,
      open: true,
      headers: {
        // Allow popup-based OAuth flows (e.g., Firebase) to close their window without COOP blocking
        'Cross-Origin-Opener-Policy': 'same-origin-allow-popups',
      },
      proxy: {
        '/veo-api': {
          target: env.VITE_VEO_API_ENDPOINT || 'http://localhost:8787',
          changeOrigin: true,
          secure: false,
          rewrite: (path) => path.replace(/^\/veo-api\/v1beta/, '/v1beta'),
        },
      },
    },
  }
})
