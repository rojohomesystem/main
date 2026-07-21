import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// El dueño verá los cambios en http://localhost:3003
export default defineConfig({
  plugins: [react()],
  server: {
    port: 3003,
    open: true,
  },
})
