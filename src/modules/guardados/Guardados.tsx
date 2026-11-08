import { useMemo, useState } from 'react'
import { useCollection } from '../../lib/useCollection'
import type { Rec } from '../../lib/store'
import { go } from '../../lib/router'
import { byName, matches } from '../../lib/text'
import { Button, Empty, Field, IconButton, Modal, useToast } from '../../components/ui'
import { IconBack, IconBox, IconEdit, IconPlus, IconSearch, IconTrash } from '../../components/icons'

/** Uma "coisa" pode ser um item ou um recipiente (caixa, bolsa, gaveta, armário...) */
export type Coisa = {
  nome: string
  recipiente: boolean
  paiId: string | null
  notas?: string
  tags?: string[]
  qtd?: number
  icone?: string
  cor?: string
}
export const KIND_COISA = 'coisa'

const ICONES_RECIPIENTE = ['📦', '👜', '🗄️', '🧰', '🎒', '🗃️', '🛍️', '🧺', '🚪', '🏠']
const ICONES_ITEM = ['🔌', '⌨️', '🖱️', '🎧', '📱', '🔋', '🔧', '📄', '🧦', '🎮', '📷', '💡']
const CORES = ['#1d1a16', '#ff6b4a', '#ffc845', '#5fd3b3', '#7db8ff', '#ff9ecf', '#b9a4ff', '#8a6f4e', '#f3ead8']

export default function Guardados({ params }: { params: string[] }) {
  const { items, loading, save, remove } = useCollection<Coisa>(KIND_COISA)
  const { toast, ask } = useToast()
  const atualId = params[0] ?? null
  const [q, setQ] = useState('')
  const [editing, setEditing] = useState<{ rec?: Rec<Coisa>; recipiente: boolean } | null>(null)

  const byId = useMemo(() => new Map(items.map((r) => [r.id, r])), [items])
  const caminho = (id: string | null) => {
    const out: Rec<Coisa>[] = []
    let cur = id ? byId.get(id) : undefined
    for (let guard = 0; cur && guard < 50; guard++) {
      out.unshift(cur)
      cur = cur.data.paiId ? byId.get(cur.data.paiId) : undefined
    }
    return out
  }
  const filhosDe = (id: string | null) => items.filter((r) => (r.data.paiId ?? null) === id)
  const totalDentro = (id: string): number => filhosDe(id).reduce((n, r) => n + 1 + (r.data.recipiente ? totalDentro(r.id) : 0), 0)

  const atual = atualId ? byId.get(atualId) : undefined
  const trilha = caminho(atualId)
  const filhos = filhosDe(atualId).sort((a, b) =>
    Number(b.data.recipiente) - Number(a.data.recipiente) || byName(a.data.nome, b.data.nome))
  const recipientes = filhos.filter((r) => r.data.recipiente)
  const soltos = filhos.filter((r) => !r.data.recipiente)

  const resultados = q.trim()
    ? items.filter((r) => matches(q, r.data.nome, r.data.notas, r.data.tags)).sort((a, b) => byName(a.data.nome, b.data.nome))
    : []

  const apagar = async (r: Rec<Coisa>) => {
    const n = r.data.recipiente ? filhosDe(r.id).length : 0
    const msg = n
      ? `Apagar "${r.data.nome}"? As ${n} coisa(s) que estão dentro dele vão subir um nível (não somem).`
      : `Apagar "${r.data.nome}" do catálogo?`
    if (!(await ask(msg, 'Apagar'))) return
    for (const f of filhosDe(r.id)) await save({ ...f.data, paiId: r.data.paiId ?? null }, f.id)
    await remove(r.id)
    toast('Foi pro limbo. 👋')
  }

  if (atualId && !loading && !atual) {
    return <Empty title="Esse lugar não existe mais" text="Talvez tenha sido apagado." action={<Button onClick={() => go('cade')}>Voltar pro início</Button>} />
  }

  return (
    <div className="page mod-cade">
      <header className="page-head">
        <div>
          <p className="kicker">módulo 01 · guardados</p>
          <h1 className="title">Cadê<span className="title-accent">?</span></h1>
          <p className="lede">Onde você guardou aquele cabo que <em>com certeza</em> estava aqui.</p>
        </div>
        <div className="head-actions">
          <Button variant="ghost" onClick={() => setEditing({ recipiente: true })}><IconBox /> Caixa / lugar</Button>
          <Button onClick={() => setEditing({ recipiente: false })}><IconPlus /> Coisa</Button>
        </div>
      </header>

      <div className="search-big">
        <IconSearch />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Cadê o meu… (ex.: cabo usb-c)" aria-label="Buscar coisas" />
        {q && <button className="search-clear" onClick={() => setQ('')}>limpar</button>}
      </div>

      {q.trim() ? (
        <section>
          <h2 className="section-title">{resultados.length ? `Achei ${resultados.length}` : 'Nada por aqui'}</h2>
          {!resultados.length && <p className="muted">Nenhuma coisa com esse nome, nota ou etiqueta. Será que você emprestou?</p>}
          <ul className="found-list">
            {resultados.map((r) => {
              const onde = caminho(r.data.paiId)
              return (
                <li key={r.id} className="found">
                  <button className="found-main" onClick={() => { setQ(''); go('cade', r.data.recipiente ? r.id : r.data.paiId) }}>
                    <span className="found-icon">{r.data.icone || (r.data.recipiente ? '📦' : '•')}</span>
                    <span>
                      <strong>{r.data.nome}</strong>{r.data.qtd && r.data.qtd > 1 ? <span className="qtd"> ×{r.data.qtd}</span> : null}
                      <span className="where">
                        {onde.length ? onde.map((p, i) => <span key={p.id} className="where-step">{i > 0 && <span className="arrow">→</span>}{p.data.nome}</span>)
                          : <span className="where-step">solto por aí (sem lugar)</span>}
                      </span>
                    </span>
                  </button>
                  <IconButton label="Editar" onClick={() => setEditing({ rec: r, recipiente: r.data.recipiente })}><IconEdit /></IconButton>
                </li>
              )
            })}
          </ul>
        </section>
      ) : (
        <>
          <nav className="crumbs" aria-label="Caminho">
            <button className={!atualId ? 'on' : ''} onClick={() => go('cade')}>🏠 Tudo</button>
            {trilha.map((t) => (
              <span key={t.id} className="crumb-wrap"><span className="crumb-sep">/</span>
                <button className={t.id === atualId ? 'on' : ''} onClick={() => go('cade', t.id)}>{t.data.icone || '📦'} {t.data.nome}</button>
              </span>
            ))}
          </nav>

          {atual && (
            <div className="here-card" style={{ ['--box' as string]: atual.data.cor || 'var(--ink)' }}>
              <span className="box-lid" aria-hidden />
              <IconButton label="Voltar" onClick={() => go('cade', atual.data.paiId)}><IconBack /></IconButton>
              <div className="here-info">
                <h2>{atual.data.icone || '📦'} {atual.data.nome}</h2>
                {atual.data.notas && <p>{atual.data.notas}</p>}
              </div>
              <div className="row-actions">
                <IconButton label="Editar" onClick={() => setEditing({ rec: atual, recipiente: true })}><IconEdit /></IconButton>
                <IconButton label="Apagar" onClick={() => apagar(atual)}><IconTrash /></IconButton>
              </div>
            </div>
          )}

          {loading ? <p className="muted">Abrindo as caixas…</p> : !filhos.length ? (
            <Empty
              doodle={<span className="doodle-box">📦</span>}
              title={atual ? 'Caixa vazia (ou é o que parece)' : 'Nada catalogado ainda'}
              text={atual ? 'Adicione o que tem aqui dentro — inclusive outras caixas.' : 'Comece pelos lugares: "Caixa preta grande", "Gaveta do escritório"… depois coloque as coisas dentro.'}
              action={<div className="empty-actions">
                <Button variant="ghost" onClick={() => setEditing({ recipiente: true })}><IconBox /> Criar caixa / lugar</Button>
                <Button onClick={() => setEditing({ recipiente: false })}><IconPlus /> Adicionar coisa</Button>
              </div>}
            />
          ) : (
            <>
              {recipientes.length > 0 && (
                <section>
                  <h2 className="section-title">{atual ? 'Recipientes aqui dentro' : 'Lugares & caixas'}</h2>
                  <div className="box-grid">
                    {recipientes.map((r, i) => (
                      <div key={r.id} className="box-card" style={{ ['--box' as string]: r.data.cor || 'var(--ink)', ['--tilt' as string]: `${(i % 3) - 1}deg` }}>
                        <button className="box-open" onClick={() => go('cade', r.id)}>
                          <span className="box-lid" />
                          <span className="box-icon">{r.data.icone || '📦'}</span>
                          <strong>{r.data.nome}</strong>
                          <span className="box-count">{totalDentro(r.id) || 'vazio'}{totalDentro(r.id) ? ' coisa(s)' : ''}</span>
                        </button>
                        <div className="box-tools">
                          <IconButton label="Editar" onClick={() => setEditing({ rec: r, recipiente: true })}><IconEdit /></IconButton>
                          <IconButton label="Apagar" onClick={() => apagar(r)}><IconTrash /></IconButton>
                        </div>
                      </div>
                    ))}
                  </div>
                </section>
              )}
              {soltos.length > 0 && (
                <section>
                  <h2 className="section-title">{atual ? 'Coisas aqui dentro' : 'Coisas soltas'}</h2>
                  <ul className="thing-list">
                    {soltos.map((r) => (
                      <li key={r.id} className="thing">
                        <span className="thing-icon">{r.data.icone || '•'}</span>
                        <div className="thing-info">
                          <strong>{r.data.nome}{r.data.qtd && r.data.qtd > 1 ? <span className="qtd"> ×{r.data.qtd}</span> : null}</strong>
                          {r.data.notas && <p>{r.data.notas}</p>}
                          {!!r.data.tags?.length && <div className="tags">{r.data.tags.map((t) => <span key={t} className="tag">#{t}</span>)}</div>}
                        </div>
                        <div className="row-actions">
                          <IconButton label="Editar / mover" onClick={() => setEditing({ rec: r, recipiente: false })}><IconEdit /></IconButton>
                          <IconButton label="Apagar" onClick={() => apagar(r)}><IconTrash /></IconButton>
                        </div>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </>
          )}
        </>
      )}

      {editing && (
        <CoisaForm
          key={editing.rec?.id ?? 'novo'}
          rec={editing.rec}
          recipiente={editing.recipiente}
          paiPadrao={atualId}
          todos={items}
          caminho={caminho}
          onClose={() => setEditing(null)}
          onSave={async (data, id) => {
            await save(data, id)
            setEditing(null)
            toast(id ? 'Atualizado ✔' : data.recipiente ? 'Caixa criada. Agora enche ela!' : 'Catalogado ✔')
          }}
        />
      )}
    </div>
  )
}

function CoisaForm({ rec, recipiente, paiPadrao, todos, caminho, onClose, onSave }: {
  rec?: Rec<Coisa>; recipiente: boolean; paiPadrao: string | null; todos: Rec<Coisa>[]
  caminho: (id: string | null) => Rec<Coisa>[]; onClose: () => void; onSave: (d: Coisa, id?: string) => Promise<void>
}) {
  const [d, setD] = useState<Coisa>(rec?.data ?? { nome: '', recipiente, paiId: paiPadrao, icone: recipiente ? '📦' : '', cor: recipiente ? CORES[0] : undefined })
  const [tags, setTags] = useState((rec?.data.tags ?? []).join(', '))
  const [busy, setBusy] = useState(false)
  const set = <K extends keyof Coisa>(k: K, v: Coisa[K]) => setD((x) => ({ ...x, [k]: v }))

  // não pode guardar uma caixa dentro dela mesma (nem dentro de algo que está dentro dela)
  const proibidos = new Set<string>()
  if (rec) {
    const marcar = (id: string) => { proibidos.add(id); todos.filter((t) => t.data.paiId === id).forEach((t) => marcar(t.id)) }
    marcar(rec.id)
  }
  const destinos = todos
    .filter((t) => t.data.recipiente && !proibidos.has(t.id))
    .map((t) => ({ id: t.id, label: caminho(t.id).map((p) => p.data.nome).join(' › ') }))
    .sort((a, b) => byName(a.label, b.label))

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!d.nome.trim()) return
    setBusy(true)
    try {
      await onSave({ ...d, nome: d.nome.trim(), tags: tags.split(',').map((t) => t.trim().replace(/^#/, '')).filter(Boolean) }, rec?.id)
    } finally { setBusy(false) }
  }

  const icones = d.recipiente ? ICONES_RECIPIENTE : ICONES_ITEM
  return (
    <Modal open onClose={onClose} tone="var(--mustard)"
      title={rec ? `Editar ${d.recipiente ? 'recipiente' : 'coisa'}` : d.recipiente ? 'Nova caixa / lugar' : 'Nova coisa'}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" form="coisa-form" disabled={busy || !d.nome.trim()}>{busy ? 'Salvando…' : 'Salvar'}</Button>
      </>}>
      <form id="coisa-form" onSubmit={submit} className="form">
        <div className="seg">
          <button type="button" className={!d.recipiente ? 'on' : ''} onClick={() => set('recipiente', false)}>É uma coisa</button>
          <button type="button" className={d.recipiente ? 'on' : ''} onClick={() => set('recipiente', true)}>Guarda coisas dentro</button>
        </div>
        <Field label="Nome">
          <input value={d.nome} onChange={(e) => set('nome', e.target.value)} required
            placeholder={d.recipiente ? 'ex.: Caixa preta grande' : 'ex.: Cabo USB-C 15 cm'} />
        </Field>
        <Field label="Está dentro de">
          <select value={d.paiId ?? ''} onChange={(e) => set('paiId', e.target.value || null)}>
            <option value="">— nenhum lugar (nível principal)</option>
            {destinos.map((o) => <option key={o.id} value={o.id}>{o.label}</option>)}
          </select>
        </Field>
        <div className="grid-2">
          <Field label="Ícone">
            <div className="chips">
              {icones.map((i) => <button type="button" key={i} className={`chip-emoji${d.icone === i ? ' on' : ''}`} onClick={() => set('icone', d.icone === i ? '' : i)}>{i}</button>)}
            </div>
          </Field>
          {d.recipiente ? (
            <Field label="Cor (pra reconhecer de longe)">
              <div className="chips">
                {CORES.map((c) => <button type="button" key={c} aria-label={`cor ${c}`} className={`chip-color${d.cor === c ? ' on' : ''}`} style={{ background: c }} onClick={() => set('cor', c)} />)}
              </div>
            </Field>
          ) : (
            <Field label="Quantidade">
              <input type="number" min={1} value={d.qtd ?? ''} onChange={(e) => set('qtd', e.target.value ? Number(e.target.value) : undefined)} placeholder="1" />
            </Field>
          )}
        </div>
        <Field label="Detalhes" hint="Marca, modelo, cor, tamanho… tudo que ajude a achar na busca.">
          <textarea rows={2} value={d.notas ?? ''} onChange={(e) => set('notas', e.target.value)} placeholder="ex.: marca Logitech, bateria AAA" />
        </Field>
        <Field label="Etiquetas" hint="Separadas por vírgula.">
          <input value={tags} onChange={(e) => setTags(e.target.value)} placeholder="cabos, eletrônicos, viagem" />
        </Field>
      </form>
    </Modal>
  )
}
