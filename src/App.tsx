import { useEffect } from 'react'
import { useRoute, go } from './lib/router'
import { useAuth } from './lib/auth'
import { isCloud } from './lib/supabase'
import { modules } from './modules/registry'
import Home from './pages/Home'
import Login from './pages/Login'
import Ajustes from './pages/Ajustes'
import { IconGear, IconHome } from './components/icons'

export default function App() {
  const { ready, session } = useAuth()
  const [section = '', ...params] = useRoute()
  const mod = modules.find((m) => m.id === section)

  useEffect(() => { window.scrollTo(0, 0) }, [section])
  useEffect(() => {
    document.title = mod ? `${mod.name} · tralha` : section === 'ajustes' ? 'Ajustes · tralha' : 'tralha'
  }, [mod, section])

  if (!ready) return <div className="boot"><span className="logo">tralha<i>.</i></span></div>
  if (isCloud && !session) return <Login />

  const nav = [
    { id: '', name: 'Início', icon: <IconHome />, color: 'var(--tomato)' },
    ...modules.map((m) => ({ id: m.id, name: m.name, icon: m.icon, color: m.color })),
    { id: 'ajustes', name: 'Ajustes', icon: <IconGear />, color: 'var(--lilac)' },
  ]
  const Comp = mod?.component

  return (
    <div className="shell">
      <aside className="sidebar">
        <button className="logo" onClick={() => go()}>tralha<i>.</i></button>
        <p className="logo-sub">o canivete suíço<br />da sua vida</p>
        <nav className="nav">
          {nav.map((n) => (
            <a key={n.id} href={`#/${n.id}`} className={`nav-item${section === n.id ? ' on' : ''}`} style={{ ['--c' as string]: n.color }}>
              <span className="nav-icon">{n.icon}</span><span className="nav-label">{n.name}</span>
            </a>
          ))}
        </nav>
        {import.meta.env.DEV && <p className="dev-flag">versão de teste<br /><span>rodando no seu PC</span></p>}
        {!isCloud && <p className="local-flag">modo local<br /><span>dados só neste navegador</span></p>}
      </aside>
      <main className="main">
        {Comp ? <Comp key={mod!.id} params={params} /> : section === 'ajustes' ? <Ajustes /> : <Home />}
      </main>
    </div>
  )
}
