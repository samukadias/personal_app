import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// base './' + rotas com # = funciona em qualquer hospedagem estática
// (GitHub Pages em subpasta, Netlify, Vercel, Cloudflare Pages...)
export default defineConfig({
  base: './',
  plugins: [react()],
})
