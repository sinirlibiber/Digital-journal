import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  define: {
    global: 'globalThis',
  },
  resolve: {
    alias: {
      '@telegram-apps/bridge': resolve(__dirname, 'src/mocks/telegram-apps-bridge.js'),
    }
  },
})
