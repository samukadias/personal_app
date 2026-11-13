import { useMemo, useState } from 'react'
import { useCollection } from '../../lib/useCollection'
import type { Rec } from '../../lib/store'
import { byName, matches } from '../../lib/text'
import { Button, Empty, Field, IconButton, Modal, useToast } from '../../components/ui'
import { IconPin, IconPlus, IconSearch, IconTrash } from '../../components/icons'

export type Nota = {
  titulo: string
  texto: string
  cor: string        // chave de COR
  fixada?: boolean
  tags?: string[]
}
export const KIND_NOTA = 'nota'

const CORES: Record<string, string> = {
  mustard: 'var(--mustard)', pink: 'var(--pink)', sky: 'var(--sky)',
  mint: 'var(--mint)', lilac: 'var(--lilac)', papel: 'var(--card)',
}
const corDe = (c?: string) => CORES[c ?? ''] ?? CORES.mustard

/** linha de checklist: "[ ] comprar pilha" ou "- [x] feito" */
const CHECK = /^(\s*[-*]?\s*)\[( |x)\]\s?(.*)$/i

const quando = (iso: string) => {
  const d = new Date(iso)
  const dias = Math.floor((Date.now() - d.getTime()) / 86_400_000)
  if (dias < 1 && new Date().getDate() === d.getDate()) return `hoje, ${d.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
  if (dias < 2) return 'ontem'
  if (dias < 7) return `há ${dias} dias`
  return d.toLocaleDateString('pt-BR', { day: 'numeric', month: 'short', year: d.getFullYear() === new Date().getFullYear() ? undefined : 'numeric' })
}

export default function Notas() {
  const { items, loading, save, remove } = useCollection<Nota>(KIND_NOTA)
  const { toast, ask } = useToast()
  const [q, setQ] = useState('')
  const [tag, setTag] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ rec?: Rec<Nota> } | null>(null)

  const tags = useMemo(() => {
    const m = new Map<string, number>()
    items.forEach((r) => r.data.tags?.forEach((t) => m.set(t, (m.get(t) ?? 0) + 1)))
    return [...m.entries()].sort((a, b) => byName(a[0], b[0]))
  }, [items])

  const visiveis = items
    .filter((r) => (!tag || r.data.tags?.includes(tag)) && matches(q, r.data.titulo, r.data.texto, r.data.tags))
    .sort((a, b) => b.updated_at.localeCompare(a.updated_at))
  const fixadas = visiveis.filter((r) => r.data.fixada)
  const outras = visiveis.filter((r) => !r.data.fixada)

  const alternarItem = async (r: Rec<Nota>, linha: number) => {
    const linhas = r.data.texto.split('\n')
    linhas[linha] = linhas[linha].replace(CHECK, (_m, pre, x, resto) => `${pre}[${x === ' ' ? 'x' : ' '}] ${resto}`)
    await save({ ...r.data, texto: linhas.join('\n') }, r.id)
  }
  const fixar = async (r: Rec<Nota>) => {
    await save({ ...r.data, fixada: !r.data.fixada }, r.id)
    toast(r.data.fixada ? 'Desafixada.' : 'Fixada no topo 📌')
  }
  const apagar = async (r: Rec<Nota>) => {
    if (!(await ask(`Apagar a nota "${r.data.titulo || 'sem título'}"?`, 'Apagar'))) return
    await remove(r.id)
    setEditing(null)
    toast('Nota amassada e jogada fora. 🗑️')
  }

  const card = (r: Rec<Nota>, i: number) => {
    const linhas = r.data.texto.split('\n')
    const feitos = linhas.filter((l) => /\[x\]/i.test(l) && CHECK.test(l)).length
    const total = linhas.filter((l) => CHECK.test(l)).length
    return (
      <li key={r.id} className="nota" style={{ ['--nota' as string]: corDe(r.data.cor), ['--nota-ink' as string]: r.data.cor === 'papel' ? 'var(--ink)' : 'var(--on-color)', ['--tilt' as string]: `${[-1.4, 0.9, -0.4, 1.3][i % 4]}deg` }}>
        <button className="nota-open" onClick={() => setEditing({ rec: r })} aria-label={`Abrir nota ${r.data.titulo || 'sem título'}`} />
        {r.data.fixada && <span className="nota-tape" aria-hidden />}
        {r.data.titulo && <h3>{r.data.titulo}</h3>}
        <div className="nota-texto">
          {linhas.slice(0, 14).map((l, n) => {
            const m = l.match(CHECK)
            if (!m) return <p key={n}>{l || ' '}</p>
            const feito = m[2].toLowerCase() === 'x'
            return (
              <label key={n} className={`nota-check${feito ? ' feito' : ''}`}>
                <input type="checkbox" checked={feito} onChange={() => alternarItem(r, n)} />
                <span>{m[3]}</span>
              </label>
            )
          })}
          {linhas.length > 14 && <p className="nota-mais">+ {linhas.length - 14} linha(s)…</p>}
        </div>
        <footer className="nota-foot">
          <span className="nota-quando">{total ? `${feitos}/${total} feitos · ` : ''}{quando(r.updated_at)}</span>
          <span className="nota-tools">
            <IconButton label={r.data.fixada ? 'Desafixar' : 'Fixar no topo'} className={r.data.fixada ? 'on' : ''} onClick={() => fixar(r)}><IconPin /></IconButton>
            <IconButton label="Apagar" onClick={() => apagar(r)}><IconTrash /></IconButton>
          </span>
        </footer>
        {!!r.data.tags?.length && <div className="tags">{r.data.tags.map((t) => <span key={t} className="tag">#{t}</span>)}</div>}
      </li>
    )
  }

  return (
    <div className="page mod-notas">
      <header className="page-head">
        <div>
          <p className="kicker">módulo 04 · anotações</p>
          <h1 className="title">Notas<span className="title-accent">✎</span></h1>
          <p className="lede">Aquela ideia do banho, a lista do mercado, o número do encanador.</p>
        </div>
        <div className="head-actions">
          <Button onClick={() => setEditing({})}><IconPlus /> Nota</Button>
        </div>
      </header>

      <div className="search-big">
        <IconSearch />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Procurar nas notas…" aria-label="Buscar notas" />
        {q && <button className="search-clear" onClick={() => setQ('')}>limpar</button>}
      </div>

      {tags.length > 0 && (
        <div className="filter-row">
          <button className={`pill pill-sm${!tag ? ' on' : ''}`} onClick={() => setTag(null)}>todas <b>{items.length}</b></button>
          {tags.map(([t, n]) => <button key={t} className={`pill pill-sm${tag === t ? ' on' : ''}`} onClick={() => setTag(tag === t ? null : t)}>#{t} <b>{n}</b></button>)}
        </div>
      )}

      {loading ? <p className="muted">Desamassando os papéis…</p> : !items.length ? (
        <Empty doodle={<span className="doodle-box">📝</span>} title="Nenhuma nota ainda"
          text="Escreva qualquer coisa. Dica: comece uma linha com [ ] e ela vira um item de lista pra marcar."
          action={<Button onClick={() => setEditing({})}><IconPlus /> Primeira nota</Button>} />
      ) : !visiveis.length ? (
        <p className="muted">Nada com isso por aqui.</p>
      ) : (
        <>
          {fixadas.length > 0 && <section><h2 className="section-title">Fixadas</h2><ul className="nota-grid">{fixadas.map(card)}</ul></section>}
          {outras.length > 0 && <section>{fixadas.length > 0 && <h2 className="section-title">O resto</h2>}<ul className="nota-grid">{outras.map(card)}</ul></section>}
        </>
      )}

      {editing && (
        <NotaForm key={editing.rec?.id ?? 'nova'} rec={editing.rec} onClose={() => setEditing(null)} onDelete={apagar}
          onSave={async (data, id) => { await save(data, id); setEditing(null); toast(id ? 'Nota atualizada ✔' : 'Anotado ✔') }} />
      )}
    </div>
  )
}

function NotaForm({ rec, onClose, onSave, onDelete }: {
  rec?: Rec<Nota>; onClose: () => void; onSave: (d: Nota, id?: string) => Promise<void>; onDelete: (r: Rec<Nota>) => void
}) {
  const [d, setD] = useState<Nota>(rec?.data ?? { titulo: '', texto: '', cor: 'mustard' })
  const [tags, setTags] = useState((rec?.data.tags ?? []).join(', '))
  const [busy, setBusy] = useState(false)
  const vazio = !d.titulo.trim() && !d.texto.trim()

  const addChecklist = () => setD((x) => ({ ...x, texto: x.texto + (x.texto && !x.texto.endsWith('\n') ? '\n' : '') + '[ ] ' }))
  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (vazio) return
    setBusy(true)
    try {
      await onSave({ ...d, titulo: d.titulo.trim(), texto: d.texto.replace(/\s+$/, ''), tags: tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean) }, rec?.id)
    } finally { setBusy(false) }
  }

  return (
    <Modal open onClose={onClose} tone={corDe(d.cor)} title={rec ? 'Editar nota' : 'Nova nota'}
      footer={<>
        {rec && <Button variant="ghost" className="foot-left" onClick={() => onDelete(rec)}><IconTrash /> Apagar</Button>}
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" form="nota-form" disabled={busy || vazio}>{busy ? 'Salvando…' : 'Salvar'}</Button>
      </>}>
      <form id="nota-form" onSubmit={submit} className="form">
        <Field label="Título"><input value={d.titulo} onChange={(e) => setD({ ...d, titulo: e.target.value })} placeholder="opcional" /></Field>
        <Field label="Anotação" hint={<>Linha começando com <code>[ ]</code> vira item de lista. <button type="button" className="link" onClick={addChecklist}>+ item de lista</button></>}>
          <textarea className="nota-area" rows={9} value={d.texto} onChange={(e) => setD({ ...d, texto: e.target.value })}
            placeholder={'Escreve aí…\n\n[ ] item pra marcar depois'} spellCheck />
        </Field>
        <div className="grid-2">
          <Field label="Cor">
            <div className="chips">
              {Object.entries(CORES).map(([k, v]) => <button type="button" key={k} aria-label={`cor ${k}`} className={`chip-color${d.cor === k ? ' on' : ''}`} style={{ background: v }} onClick={() => setD({ ...d, cor: k })} />)}
            </div>
          </Field>
          <Field label="Etiquetas" hint="Separadas por vírgula.">
            <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="ideias, casa, trabalho" />
          </Field>
        </div>
        <label className="check"><input type="checkbox" checked={!!d.fixada} onChange={(e) => setD({ ...d, fixada: e.target.checked })} /><span>Fixar no topo</span></label>
      </form>
    </Modal>
  )
}
