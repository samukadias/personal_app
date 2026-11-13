import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import { ToastProvider } from './components/ui'
import { AuthProvider } from './lib/auth'
import { applyTheme, getTheme } from './lib/theme'
import './styles.css'

applyTheme(getTheme())

// não deixa outro site carregar o SamuAPP escondido dentro de uma moldura (clickjacking)
if (window.top !== window.self) {
  document.body.innerHTML = '<p style="font:16px sans-serif;padding:24px">Abra o SamuAPP diretamente pelo endereço dele.</p>'
  throw new Error('SamuAPP não roda dentro de iframe')
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <AuthProvider>
      <ToastProvider>
        <App />
      </ToastProvider>
    </AuthProvider>
  </React.StrictMode>,
)
