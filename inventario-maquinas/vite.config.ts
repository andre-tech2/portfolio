import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/portfolio/inventario-maquinas/',
  plugins: [react()],
  test: {
    environment: 'node',
    setupFiles: ['./src/test/setup.ts']
  }
})
