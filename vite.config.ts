import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

// GitHub Pages project site: https://<user>.github.io/reminder/
export default defineConfig({
  plugins: [react()],
  base: '/reminder/',
})
