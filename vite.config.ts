import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3411,
    host: true,
    allowedHosts: ['play.maya.on', 'localhost'],
  },
  base: '/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    target: 'es2020',
  },
})
