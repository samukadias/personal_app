import { useMemo, useState } from 'react'
import { modules } from '../modules/registry'
import { useCollection } from '../lib/useCollection'
import { go } from '../lib/router'
import { matches, byName } from '../lib/text'
import type { Coisa } from '../modules/guardados/Guardados'
import { linkSeguro, type Site } from '../modules/sites/Sites'
import type { Nota } from '../modules/notas/Notas'
import { IconSearch } from '../components/icons'

const saudacao = () => {
  const h = new Date().getHours()
  if (h < 5) return 'Boa madrugada, coruja'
  if (h < 12) return 'Bom dia'
  if (h < 18) return 'Boa tarde'
  return 'Boa noite'
}
const FRASES = [
  'Tudo no seu lugar. Ou pelo menos catalogado.',
  'Organização é só preguiça com planejamento.',
  'Se não tá aqui, você emprestou.',
  'Menos “onde eu enfiei isso?”, mais vida.',
  'A caixa preta média agradece.',
]

function Counter({ kind }: { kind: string }) {
  const { items, loading } = useCollection(kind)
  return <span className="mod-count">{loading ? '…' : items.length}</span>
}

export default function Home() {
  const coisas = useCollection<Coisa>('coisa')
  const sites = useCollection<Site>('site')
  const notas = useCollection<Nota>('nota')
  const [q, setQ] = useState('')
  const frase = useMemo(() => FRASES[Math.floor(Math.random() * FRASES.length)], [])

  const byId = useMemo(() => new Map(coisas.items.map((r) => [r.id, r])), [coisas.items])
  const ondeFica = (paiId: string | null) => {
    const out: string[] = []
    let cur = paiId ? byId.get(paiId) : undefined
    for (let g = 0; cur && g < 50; g++) { out.unshift(cur.data.nome); cur = cur.data.paiId ? byId.get(cur.data.paiId) : undefined }
    return out.join(' → ') || 'sem lugar'
  }
  const achadosCoisas = q.trim() ? coisas.items.filter((r) => matches(q, r.data.nome, r.data.notas, r.data.tags)).slice(0, 8) : []
  const achadosSites = q.trim() ? sites.items.filter((r) => matches(q, r.data.nome, r.data.url, r.data.categoria)).slice(0, 6) : []
  const achadosNotas = q.trim() ? notas.items.filter((r) => matches(q, r.data.titulo, r.data.texto, r.data.tags)).slice(0, 6) : []
  const recentes = [...coisas.items].sort((a, b) => b.updated_at.localeCompare(a.updated_at)).slice(0, 5)
  const fixados = sites.items.filter((r) => r.data.fixado).sort((a, b) => byName(a.data.nome, b.data.nome)).slice(0, 8)

  return (
    <div className="page home">
      <header className="home-hero">
        <p className="kicker">{new Date().toLocaleDateString('pt-BR', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
        <h1 className="title">{saudacao()}<span className="title-accent">!</span></h1>
        <p className="lede scribble">{frase}</p>
      </header>

      <div className="search-big search-home">
        <IconSearch />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar em tudo (coisas, sites e notas)…" aria-label="Busca geral" />
        {q && <button className="search-clear" onClick={() => setQ('')}>limpar</button>}
      </div>

      {q.trim() ? (
        <div className="home-results">
          <section>
            <h2 className="section-title">Coisas</h2>
            {achadosCoisas.length ? (
              <ul className="mini-list">
                {achadosCoisas.map((r) => (
                  <li key={r.id}><button onClick={() => go('cade', r.data.recipiente ? r.id : r.data.paiId)}>
                    <strong>{r.data.icone} {r.data.nome}</strong><span>{ondeFica(r.data.paiId)}</span>
                  </button></li>
                ))}
              </ul>
            ) : <p className="muted">Nenhuma.</p>}
          </section>
          <section>
            <h2 className="section-title">Sites</h2>
            {achadosSites.length ? (
              <ul className="mini-list">
                {achadosSites.map((r) => (
                  <li key={r.id}><a href={linkSeguro(r.data.url)} target="_blank" rel="noopener noreferrer">
                    <strong>{r.data.nome}</strong><span>{r.data.categoria || 'Sem categoria'}</span>
                  </a></li>
                ))}
              </ul>
            ) : <p className="muted">Nenhum.</p>}
          </section>
          <section>
            <h2 className="section-title">Notas</h2>
            {achadosNotas.length ? (
              <ul className="mini-list">
                {achadosNotas.map((r) => (
                  <li key={r.id}><button onClick={() => go('notas')}>
                    <strong>📝 {r.data.titulo || r.data.texto.split('\n')[0].replace(/^\s*[-*]?\s*\[( |x)\]\s?/i, '').slice(0, 60) || 'sem título'}</strong>
                    <span>{r.data.tags?.length ? r.data.tags.map((t) => `#${t}`).join(' ') : 'nota'}</span>
                  </button></li>
                ))}
              </ul>
            ) : <p className="muted">Nenhuma.</p>}
          </section>
          <p className="muted small">O cofre não entra na busca geral — senha a gente procura com ele aberto.</p>
        </div>
      ) : (
        <>
          <section className="mod-cards">
            {modules.map((m, i) => (
              <a key={m.id} href={`#/${m.id}`} className="mod-card" style={{ ['--c' as string]: m.color, ['--tilt' as string]: `${[-1.2, 0.8, -0.5][i % 3]}deg` }}>
                <span className="mod-icon">{m.icon}</span>
                <span className="mod-name">{m.name}</span>
                <span className="mod-tag">{m.tagline}</span>
                <Counter kind={m.kind} />
              </a>
            ))}
            <a href="#/ajustes" className="mod-card mod-card-ghost">
              <span className="mod-name">+ módulo</span>
              <span className="mod-tag">tem espaço pra mais coisa aqui. veja o README.</span>
            </a>
          </section>

          <div className="home-cols">
            <section>
              <h2 className="section-title">Mexidos por último</h2>
              {recentes.length ? (
                <ul className="mini-list">
                  {recentes.map((r) => (
                    <li key={r.id}><button onClick={() => go('cade', r.data.recipiente ? r.id : r.data.paiId)}>
                      <strong>{r.data.icone || '•'} {r.data.nome}</strong><span>{ondeFica(r.data.paiId)}</span>
                    </button></li>
                  ))}
                </ul>
              ) : <p className="muted">Nada catalogado ainda. <a href="#/cade">Começar pelo Cadê?</a></p>}
            </section>
            <section>
              <h2 className="section-title">Sites fixados</h2>
              {fixados.length ? (
                <div className="pin-cloud">
                  {fixados.map((r) => <a key={r.id} className="pill" href={linkSeguro(r.data.url)} target="_blank" rel="noopener noreferrer">{r.data.nome} ↗</a>)}
                </div>
              ) : <p className="muted">Fixe sites com o 📌 pra eles aparecerem aqui.</p>}
            </section>
          </div>
        </>
      )}
    </div>
  )
}
