import { useMemo, useState } from 'react'
import { useCollection } from '../../lib/useCollection'
import type { Rec } from '../../lib/store'
import { byName, matches } from '../../lib/text'
import { Button, Empty, Field, IconButton, LetterBadge, Modal, useToast } from '../../components/ui'
import { IconEdit, IconOut, IconPin, IconPlus, IconSearch, IconTrash } from '../../components/icons'

export type Site = { url: string; nome: string; categoria: string; notas?: string; fixado?: boolean }
export const KIND_SITE = 'site'

const SUGESTOES = ['Trabalho', 'Ferramentas', 'Estudo', 'Notícias', 'Compras', 'Finanças', 'Lazer', 'Design', 'Dev']

export const normUrl = (u: string) => {
  const t = u.trim()
  if (!t) return t
  return /^https?:\/\//i.test(t) ? t : `https://${t.replace(/^[a-z][a-z0-9+.-]*:\/\//i, '')}`
}
/** só deixa abrir links http/https (bloqueia javascript:, data: etc.) */
const linkSeguro = (u: string) => {
  try { const x = new URL(normUrl(u)); return x.protocol === 'https:' || x.protocol === 'http:' ? x.href : undefined } catch { return undefined }
}
export const dominio = (u: string) => {
  try { return new URL(normUrl(u)).hostname.replace(/^www\./, '') } catch { return u }
}

export default function Sites() {
  const { items, loading, save, remove } = useCollection<Site>(KIND_SITE)
  const { toast, ask } = useToast()
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ rec?: Rec<Site> } | null>(null)

  const categorias = useMemo(() => {
    const m = new Map<string, number>()
    items.forEach((r) => m.set(r.data.categoria || 'Sem categoria', (m.get(r.data.categoria || 'Sem categoria') ?? 0) + 1))
    return [...m.entries()].sort((a, b) => byName(a[0], b[0]))
  }, [items])

  const visiveis = items
    .filter((r) => (!cat || (r.data.categoria || 'Sem categoria') === cat) && matches(q, r.data.nome, r.data.url, r.data.notas, r.data.categoria))
    .sort((a, b) => byName(a.data.nome, b.data.nome))
  const fixados = visiveis.filter((r) => r.data.fixado)
  const grupos = new Map<string, Rec<Site>[]>()
  visiveis.filter((r) => !r.data.fixado).forEach((r) => {
    const c = r.data.categoria || 'Sem categoria'
    grupos.set(c, [...(grupos.get(c) ?? []), r])
  })

  const apagar = async (r: Rec<Site>) => {
    if (!(await ask(`Tirar "${r.data.nome}" dos favoritos?`, 'Tirar'))) return
    await remove(r.id)
    toast('Removido.')
  }

  const card = (r: Rec<Site>) => (
    <li key={r.id} className="site-card">
      <a className="site-main" href={linkSeguro(r.data.url)} target="_blank" rel="noopener noreferrer">
        <LetterBadge text={r.data.nome} />
        <span className="site-text">
          <strong>{r.data.nome}</strong>
          <span className="site-domain">{dominio(r.data.url)}</span>
          {r.data.notas && <span className="site-notes">{r.data.notas}</span>}
        </span>
        <IconOut className="site-out" />
      </a>
      <div className="site-tools">
        <IconButton label={r.data.fixado ? 'Desafixar' : 'Fixar no topo'} className={r.data.fixado ? 'pinned' : ''}
          onClick={() => save({ ...r.data, fixado: !r.data.fixado }, r.id)}><IconPin /></IconButton>
        <IconButton label="Editar" onClick={() => setEditing({ rec: r })}><IconEdit /></IconButton>
        <IconButton label="Apagar" onClick={() => apagar(r)}><IconTrash /></IconButton>
      </div>
    </li>
  )

  return (
    <div className="page mod-sites">
      <header className="page-head">
        <div>
          <p className="kicker">módulo 02 · favoritos</p>
          <h1 className="title">Sites<span className="title-accent">.</span></h1>
          <p className="lede">Aquelas 47 abas abertas, finalmente organizadas.</p>
        </div>
        <div className="head-actions">
          <Button onClick={() => setEditing({})}><IconPlus /> Site</Button>
        </div>
      </header>

      <div className="search-big">
        <IconSearch />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por nome, endereço ou nota" aria-label="Buscar sites" />
        {q && <button className="search-clear" onClick={() => setQ('')}>limpar</button>}
      </div>

      {categorias.length > 0 && (
        <div className="filter-row" role="tablist" aria-label="Categorias">
          <button className={`pill${!cat ? ' on' : ''}`} onClick={() => setCat(null)}>Todas <b>{items.length}</b></button>
          {categorias.map(([c, n]) => (
            <button key={c} className={`pill${cat === c ? ' on' : ''}`} onClick={() => setCat(cat === c ? null : c)}>{c} <b>{n}</b></button>
          ))}
        </div>
      )}

      {loading ? <p className="muted">Carregando seus cantinhos da internet…</p> : !items.length ? (
        <Empty doodle={<span className="doodle-box">🔖</span>} title="Nenhum site salvo"
          text="Cole um endereço e escolha uma categoria. Simples assim."
          action={<Button onClick={() => setEditing({})}><IconPlus /> Salvar o primeiro</Button>} />
      ) : !visiveis.length ? (
        <p className="muted">Nada bate com essa busca.</p>
      ) : (
        <>
          {fixados.length > 0 && (
            <section>
              <h2 className="section-title">📌 Fixados</h2>
              <ul className="site-grid">{fixados.map(card)}</ul>
            </section>
          )}
          {[...grupos.entries()].sort((a, b) => byName(a[0], b[0])).map(([c, rs]) => (
            <section key={c}>
              <h2 className="section-title">{c} <span className="count">{rs.length}</span></h2>
              <ul className="site-grid">{rs.map(card)}</ul>
            </section>
          ))}
        </>
      )}

      {editing && (
        <SiteForm key={editing.rec?.id ?? 'novo'} rec={editing.rec} categorias={categorias.map(([c]) => c)}
          defaultCat={cat} onClose={() => setEditing(null)}
          onSave={async (d, id) => { await save(d, id); setEditing(null); toast(id ? 'Atualizado ✔' : 'Salvo nos favoritos ✔') }} />
      )}
    </div>
  )
}

function SiteForm({ rec, categorias, defaultCat, onClose, onSave }: {
  rec?: Rec<Site>; categorias: string[]; defaultCat: string | null; onClose: () => void; onSave: (d: Site, id?: string) => Promise<void>
}) {
  const [d, setD] = useState<Site>(rec?.data ?? { url: '', nome: '', categoria: defaultCat && defaultCat !== 'Sem categoria' ? defaultCat : '' })
  const [nomeMexido, setNomeMexido] = useState(!!rec)
  const [busy, setBusy] = useState(false)
  const opcoes = [...new Set([...categorias.filter((c) => c !== 'Sem categoria'), ...SUGESTOES])]

  const onUrl = (url: string) => {
    setD((x) => {
      if (nomeMexido) return { ...x, url }
      const dom = dominio(url).split('.')[0] ?? ''
      return { ...x, url, nome: dom ? dom[0].toUpperCase() + dom.slice(1) : '' }
    })
  }
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!d.url.trim() || !d.nome.trim()) return
    setBusy(true)
    try { await onSave({ ...d, url: normUrl(d.url), nome: d.nome.trim(), categoria: d.categoria.trim() }, rec?.id) }
    finally { setBusy(false) }
  }
  return (
    <Modal open onClose={onClose} tone="var(--sky)" title={rec ? 'Editar site' : 'Novo site favorito'}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" form="site-form" disabled={busy || !d.url.trim() || !d.nome.trim()}>{busy ? 'Salvando…' : 'Salvar'}</Button>
      </>}>
      <form id="site-form" className="form" onSubmit={submit}>
        <Field label="Endereço">
          <input value={d.url} onChange={(e) => onUrl(e.target.value)} placeholder="ex.: github.com" inputMode="url" required />
        </Field>
        <Field label="Nome">
          <input value={d.nome} onChange={(e) => { setNomeMexido(true); setD({ ...d, nome: e.target.value }) }} required />
        </Field>
        <Field label="Categoria">
          <input value={d.categoria} onChange={(e) => setD({ ...d, categoria: e.target.value })} placeholder="Escolha ou invente uma" list="cats" />
          <datalist id="cats">{opcoes.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <div className="chips">
          {opcoes.slice(0, 10).map((c) => (
            <button type="button" key={c} className={`pill pill-sm${d.categoria === c ? ' on' : ''}`} onClick={() => setD({ ...d, categoria: c })}>{c}</button>
          ))}
        </div>
        <Field label="Nota (opcional)">
          <textarea rows={2} value={d.notas ?? ''} onChange={(e) => setD({ ...d, notas: e.target.value })} placeholder="Por que esse site importa?" />
        </Field>
        <label className="check">
          <input type="checkbox" checked={!!d.fixado} onChange={(e) => setD({ ...d, fixado: e.target.checked })} /> Fixar no topo
        </label>
      </form>
    </Modal>
  )
}
