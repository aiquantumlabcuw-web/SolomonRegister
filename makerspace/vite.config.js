import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0', // Listen on all network interfaces
    port: 5050, // Explicitly set to 5050
    strictPort: true, // Don't try other ports if 5050 is busy
    allowedHosts: [
      'www.cuwcs.com','cuwcs.com'
    ],
  }
})
