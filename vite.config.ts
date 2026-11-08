import { defineConfig, loadEnv, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * Content-Security-Policy só na versão publicada (o servidor de teste precisa de scripts inline).
 * Limita de onde o app pode carregar código e para onde pode mandar dados:
 * só o próprio site, as fontes do Google e o seu Supabase.
 */
function csp(supabaseUrl?: string): Plugin {
  const api = supabaseUrl ? new URL(supabaseUrl).origin : ''
  const policy = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com",
    "img-src 'self' data:",
    `connect-src 'self'${api ? ` ${api} ${api.replace('https://', 'wss://')}` : ''}`,
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
  ].join('; ')
  return {
    name: 'tralha-csp',
    apply: 'build',
    transformIndexHtml: (html) =>
      html.replace('<meta charset="UTF-8" />', `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${policy}" />`),
  }
}

// base './' + rotas com # = funciona em qualquer hospedagem estática
// (GitHub Pages em subpasta, Netlify, Vercel, Cloudflare Pages...)
export default defineConfig(({ mode }) => {
  const env = { ...loadEnv(mode, process.cwd()), ...process.env }
  return {
    base: './',
    plugins: [react(), csp(env.VITE_SUPABASE_URL)],
  }
})
