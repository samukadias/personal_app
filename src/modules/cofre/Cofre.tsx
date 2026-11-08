import { useEffect, useMemo, useState } from 'react'
import { useCollection } from '../../lib/useCollection'
import type { Rec } from '../../lib/store'
import { byName, matches } from '../../lib/text'
import { DEFAULT_ITERATIONS, deriveKey, generatePassword, newSalt, open, seal, strength, type Box, type GenOpts } from '../../lib/crypto'
import { Button, Empty, Field, IconButton, LetterBadge, Modal, useToast } from '../../components/ui'
import { IconCopy, IconDice, IconEdit, IconEye, IconEyeOff, IconLock, IconOut, IconPlus, IconSearch, IconTrash } from '../../components/icons'
import { normUrl } from '../sites/Sites'

export type Senha = { titulo: string; usuario: string; senha: string; url?: string; notas?: string; categoria?: string }
type Meta = { salt: string; iterations: number; check: Box }
export const KIND_COFRE = 'cofre'
const KIND_META = 'cofre_meta'
const CHECK = 'tralha-ok'
const AUTO_LOCK_MIN = 5

// chave só na memória: recarregou a página, trancou.
let sessionKey: CryptoKey | null = null
const listeners = new Set<(k: CryptoKey | null) => void>()
const setSessionKey = (k: CryptoKey | null) => { sessionKey = k; listeners.forEach((f) => f(k)) }
export const lockVault = () => setSessionKey(null)

function useVaultKey() {
  const [key, setKey] = useState(sessionKey)
  useEffect(() => { listeners.add(setKey); return () => { listeners.delete(setKey) } }, [])
  return key
}

export default function Cofre() {
  const meta = useCollection<Meta>(KIND_META)
  const ents = useCollection<Box>(KIND_COFRE)
  const key = useVaultKey()
  const metaRec = meta.items[0]

  // auto-tranca por inatividade
  useEffect(() => {
    if (!key) return
    let t = setTimeout(lockVault, AUTO_LOCK_MIN * 60_000)
    const bump = () => { clearTimeout(t); t = setTimeout(lockVault, AUTO_LOCK_MIN * 60_000) }
    const evs = ['pointerdown', 'keydown', 'scroll'] as const
    evs.forEach((e) => addEventListener(e, bump, { passive: true }))
    return () => { clearTimeout(t); evs.forEach((e) => removeEventListener(e, bump)) }
  }, [key])

  if (meta.loading) return <div className="page mod-cofre"><p className="muted">Procurando a chave…</p></div>
  if (!crypto?.subtle) return <div className="page mod-cofre"><Empty title="Cofre indisponível" text="O navegador só libera criptografia em HTTPS ou localhost." /></div>
  if (!metaRec) return <Setup onCreate={async (pw) => {
    const salt = newSalt()
    const k = await deriveKey(pw, salt)
    await meta.save({ salt, iterations: DEFAULT_ITERATIONS, check: await seal(k, CHECK) })
    setSessionKey(k)
  }} />
  if (!key) return <Unlock meta={metaRec.data} />
  return <Vault keyObj={key} ents={ents} metaRec={metaRec} saveMeta={meta.save} />
}

/* ---------------- criar senha mestra ---------------- */
function Setup({ onCreate }: { onCreate: (pw: string) => Promise<void> }) {
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [busy, setBusy] = useState(false)
  const [entendi, setEntendi] = useState(false)
  const s = strength(a)
  const ok = a.length >= 10 && a === b && entendi
  return (
    <div className="page mod-cofre">
      <div className="vault-door">
        <div className="vault-dial" aria-hidden><IconLock /></div>
        <p className="kicker">módulo 03 · cofre</p>
        <h1 className="title">Bora criar a senha mestra</h1>
        <p className="lede">Ela tranca tudo aqui dentro. É a <strong>única</strong> senha que você vai precisar decorar.</p>
        <form className="form vault-form" onSubmit={async (e) => { e.preventDefault(); if (!ok) return; setBusy(true); try { await onCreate(a) } finally { setBusy(false) } }}>
          <Field label="Senha mestra" hint={a ? <StrengthBar pw={a} /> : 'Mínimo de 10 caracteres. Uma frase longa funciona muito bem.'}>
            <input type="password" value={a} onChange={(e) => setA(e.target.value)} autoComplete="new-password" />
          </Field>
          <Field label="Repete aí" hint={b && a !== b ? 'Não bateu 🙃' : undefined}>
            <input type="password" value={b} onChange={(e) => setB(e.target.value)} autoComplete="new-password" />
          </Field>
          <label className="check warn">
            <input type="checkbox" checked={entendi} onChange={(e) => setEntendi(e.target.checked)} />
            <span>Entendi que, se eu esquecer essa senha, <strong>ninguém</strong> consegue recuperar o cofre. Nem eu, nem o app.</span>
          </label>
          <Button type="submit" disabled={!ok || busy}>{busy ? 'Forjando a chave…' : 'Criar cofre'}</Button>
          {a && s.score < 2 && <p className="muted small">Dica: algo como “pastel-de-feira-às-7-da-manhã” é forte e fácil de lembrar.</p>}
        </form>
      </div>
    </div>
  )
}

/* ---------------- destrancar ---------------- */
function Unlock({ meta }: { meta: Meta }) {
  const [pw, setPw] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const [shake, setShake] = useState(0)
  const go = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setErr('')
    try {
      const k = await deriveKey(pw, meta.salt, meta.iterations)
      if ((await open<string>(k, meta.check)) !== CHECK) throw new Error()
      setSessionKey(k)
    } catch {
      setErr('Senha errada. Respira e tenta de novo.')
      setShake((n) => n + 1)
    } finally { setBusy(false) }
  }
  return (
    <div className="page mod-cofre">
      <div className="vault-door" key={shake} data-shake={shake > 0 || undefined}>
        <div className="vault-dial" aria-hidden><IconLock /></div>
        <p className="kicker">módulo 03 · cofre</p>
        <h1 className="title">Trancado. 🔒</h1>
        <p className="lede">Digite a senha mestra pra abrir.</p>
        <form className="form vault-form" onSubmit={go}>
          <Field label="Senha mestra" hint={err || undefined}>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" autoFocus />
          </Field>
          <Button type="submit" disabled={!pw || busy}>{busy ? 'Girando o segredo…' : 'Abrir'}</Button>
        </form>
      </div>
    </div>
  )
}

/* ---------------- cofre aberto ---------------- */
function Vault({ keyObj, ents, metaRec, saveMeta }: {
  keyObj: CryptoKey
  ents: ReturnType<typeof useCollection<Box>>
  metaRec: Rec<Meta>
  saveMeta: (d: Meta, id?: string) => Promise<Rec<Meta>>
}) {
  const { toast, ask } = useToast()
  const [dec, setDec] = useState<Record<string, Senha>>({})
  const [falhas, setFalhas] = useState(0)
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string | null>(null)
  const [show, setShow] = useState<Record<string, boolean>>({})
  const [editing, setEditing] = useState<{ id?: string; data?: Senha } | null>(null)
  const [trocando, setTrocando] = useState(false)

  useEffect(() => {
    let vivo = true
    ;(async () => {
      const out: Record<string, Senha> = {}
      let bad = 0
      for (const r of ents.items) {
        try { out[r.id] = await open<Senha>(keyObj, r.data) } catch { bad++ }
      }
      if (vivo) { setDec(out); setFalhas(bad) }
    })()
    return () => { vivo = false }
  }, [keyObj, ents.items])

  const lista = Object.entries(dec)
  const categorias = useMemo(() => [...new Set(lista.map(([, s]) => s.categoria || 'Geral'))].sort(byName), [lista])
  const visiveis = lista
    .filter(([, s]) => (!cat || (s.categoria || 'Geral') === cat) && matches(q, s.titulo, s.usuario, s.url, s.categoria))
    .sort((a, b) => byName(a[1].titulo, b[1].titulo))

  const copiar = async (txt: string, oque: string) => {
    try {
      await navigator.clipboard.writeText(txt)
      toast(`${oque} copiado — some da área de transferência em 30s`)
      setTimeout(() => { navigator.clipboard.writeText('').catch(() => {}) }, 30_000)
    } catch { toast('Não consegui copiar 😕', 'err') }
  }
  const apagar = async (id: string) => {
    if (!(await ask(`Apagar a senha de "${dec[id].titulo}"? Não tem volta.`, 'Apagar'))) return
    await ents.remove(id)
    toast('Apagada.')
  }

  return (
    <div className="page mod-cofre">
      <header className="page-head">
        <div>
          <p className="kicker">módulo 03 · cofre <span className="status-dot">aberto</span></p>
          <h1 className="title">Cofre<span className="title-accent">*</span></h1>
          <p className="lede">Tudo criptografado aqui no seu navegador. Tranca sozinho após {AUTO_LOCK_MIN} min parado.</p>
        </div>
        <div className="head-actions">
          <Button variant="ghost" onClick={lockVault}><IconLock /> Trancar</Button>
          <Button onClick={() => setEditing({})}><IconPlus /> Senha</Button>
        </div>
      </header>

      {falhas > 0 && <p className="banner banner-warn">{falhas} registro(s) não abriram com esta chave. Talvez sejam de uma senha mestra antiga.</p>}

      <div className="search-big">
        <IconSearch />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar por serviço, usuário ou site" aria-label="Buscar senhas" />
        {q && <button className="search-clear" onClick={() => setQ('')}>limpar</button>}
      </div>

      {categorias.length > 1 && (
        <div className="filter-row">
          <button className={`pill${!cat ? ' on' : ''}`} onClick={() => setCat(null)}>Todas</button>
          {categorias.map((c) => <button key={c} className={`pill${cat === c ? ' on' : ''}`} onClick={() => setCat(cat === c ? null : c)}>{c}</button>)}
        </div>
      )}

      {!lista.length ? (
        <Empty doodle={<span className="doodle-box">🗝️</span>} title="Cofre vazio, e bem trancado"
          text="Guarde aqui a primeira senha. Dica: use o gerador e esqueça o ‘123mudar’."
          action={<Button onClick={() => setEditing({})}><IconPlus /> Guardar senha</Button>} />
      ) : (
        <ul className="pw-list">
          {visiveis.map(([id, s]) => (
            <li key={id} className="pw-row">
              <LetterBadge text={s.titulo} size={40} />
              <div className="pw-info">
                <strong>{s.titulo}</strong>
                <button className="pw-user" onClick={() => s.usuario && copiar(s.usuario, 'Usuário')} title="Copiar usuário">{s.usuario || '—'}</button>
              </div>
              <code className="pw-secret">{show[id] ? s.senha : '•'.repeat(Math.min(Math.max(s.senha.length, 8), 14))}</code>
              <div className="row-actions">
                <IconButton label={show[id] ? 'Esconder' : 'Mostrar'} onClick={() => setShow({ ...show, [id]: !show[id] })}>{show[id] ? <IconEyeOff /> : <IconEye />}</IconButton>
                <IconButton label="Copiar senha" className="accent" onClick={() => copiar(s.senha, 'Senha')}><IconCopy /></IconButton>
                {s.url && <a className="icon-btn" href={normUrl(s.url)} target="_blank" rel="noopener noreferrer" aria-label="Abrir site" title="Abrir site"><IconOut /></a>}
                <IconButton label="Editar" onClick={() => setEditing({ id, data: s })}><IconEdit /></IconButton>
                <IconButton label="Apagar" onClick={() => apagar(id)}><IconTrash /></IconButton>
              </div>
            </li>
          ))}
          {!visiveis.length && <p className="muted">Nada encontrado.</p>}
        </ul>
      )}

      <p className="fineprint">
        <button className="link" onClick={() => setTrocando(true)}>Trocar senha mestra</button>
      </p>

      {editing && (
        <SenhaForm data={editing.data} categorias={categorias} onClose={() => setEditing(null)}
          onSave={async (s) => {
            await ents.save(await seal(keyObj, s), editing.id)
            setEditing(null)
            toast(editing.id ? 'Atualizada ✔' : 'Trancada no cofre ✔')
          }} />
      )}
      {trocando && (
        <TrocarMestra meta={metaRec.data} onClose={() => setTrocando(false)}
          onTrocar={async (nova) => {
            const salt = newSalt()
            const k = await deriveKey(nova, salt)
            for (const [id, s] of Object.entries(dec)) await ents.save(await seal(k, s), id)
            await saveMeta({ salt, iterations: DEFAULT_ITERATIONS, check: await seal(k, CHECK) }, metaRec.id)
            setSessionKey(k)
            setTrocando(false)
            toast('Senha mestra trocada ✔')
          }} />
      )}
    </div>
  )
}

function StrengthBar({ pw }: { pw: string }) {
  const s = strength(pw)
  return (
    <span className="strength" data-score={s.score}>
      <span className="strength-bar"><i /><i /><i /><i /></span> {s.label}
    </span>
  )
}

function SenhaForm({ data, categorias, onClose, onSave }: {
  data?: Senha; categorias: string[]; onClose: () => void; onSave: (s: Senha) => Promise<void>
}) {
  const [s, setS] = useState<Senha>(data ?? { titulo: '', usuario: '', senha: '', categoria: '' })
  const [ver, setVer] = useState(!data)
  const [gen, setGen] = useState<GenOpts>({ length: 20, upper: true, digits: true, symbols: true })
  const [busy, setBusy] = useState(false)
  const gerar = (o = gen) => { setS((x) => ({ ...x, senha: generatePassword(o) })); setVer(true) }
  useEffect(() => { if (!data) gerar() }, []) // eslint-disable-line react-hooks/exhaustive-deps
  const setGenOpt = (o: Partial<GenOpts>) => { const n = { ...gen, ...o }; setGen(n); gerar(n) }
  const opcoes = [...new Set([...categorias.filter((c) => c !== 'Geral'), 'Pessoal', 'Trabalho', 'Banco', 'Redes sociais', 'Streaming', 'E-mail'])]

  return (
    <Modal open onClose={onClose} tone="var(--mint)" title={data ? 'Editar senha' : 'Nova senha'}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" form="senha-form" disabled={busy || !s.titulo.trim() || !s.senha}>{busy ? 'Cifrando…' : 'Salvar'}</Button>
      </>}>
      <form id="senha-form" className="form" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true)
        try { await onSave({ ...s, titulo: s.titulo.trim(), categoria: s.categoria?.trim() }) } finally { setBusy(false) }
      }}>
        <Field label="Serviço"><input value={s.titulo} onChange={(e) => setS({ ...s, titulo: e.target.value })} placeholder="ex.: Netflix" required /></Field>
        <div className="grid-2">
          <Field label="Usuário / e-mail"><input value={s.usuario} onChange={(e) => setS({ ...s, usuario: e.target.value })} autoComplete="off" /></Field>
          <Field label="Site (opcional)"><input value={s.url ?? ''} onChange={(e) => setS({ ...s, url: e.target.value })} placeholder="netflix.com" inputMode="url" /></Field>
        </div>
        <Field label="Senha" hint={<StrengthBar pw={s.senha} />}>
          <div className="input-group">
            <input className="mono" type={ver ? 'text' : 'password'} value={s.senha} onChange={(e) => setS({ ...s, senha: e.target.value })} autoComplete="new-password" required />
            <IconButton label={ver ? 'Esconder' : 'Mostrar'} onClick={() => setVer(!ver)}>{ver ? <IconEyeOff /> : <IconEye />}</IconButton>
            <IconButton label="Gerar outra" className="accent" onClick={() => gerar()}><IconDice /></IconButton>
          </div>
        </Field>
        <div className="gen">
          <label className="gen-len">Tamanho <b>{gen.length}</b>
            <input type="range" min={8} max={48} value={gen.length} onChange={(e) => setGenOpt({ length: Number(e.target.value) })} />
          </label>
          <div className="chips">
            <button type="button" className={`pill pill-sm${gen.upper ? ' on' : ''}`} onClick={() => setGenOpt({ upper: !gen.upper })}>ABC</button>
            <button type="button" className={`pill pill-sm${gen.digits ? ' on' : ''}`} onClick={() => setGenOpt({ digits: !gen.digits })}>123</button>
            <button type="button" className={`pill pill-sm${gen.symbols ? ' on' : ''}`} onClick={() => setGenOpt({ symbols: !gen.symbols })}>#$%</button>
          </div>
        </div>
        <Field label="Categoria">
          <input value={s.categoria ?? ''} onChange={(e) => setS({ ...s, categoria: e.target.value })} list="pw-cats" placeholder="Geral" />
          <datalist id="pw-cats">{opcoes.map((c) => <option key={c} value={c} />)}</datalist>
        </Field>
        <Field label="Notas (também criptografadas)">
          <textarea rows={2} value={s.notas ?? ''} onChange={(e) => setS({ ...s, notas: e.target.value })} placeholder="Perguntas de segurança, PIN, etc." />
        </Field>
      </form>
    </Modal>
  )
}

function TrocarMestra({ meta, onClose, onTrocar }: { meta: Meta; onClose: () => void; onTrocar: (nova: string) => Promise<void> }) {
  const [atual, setAtual] = useState('')
  const [nova, setNova] = useState('')
  const [rep, setRep] = useState('')
  const [err, setErr] = useState('')
  const [busy, setBusy] = useState(false)
  const ok = atual && nova.length >= 10 && nova === rep
  return (
    <Modal open onClose={onClose} tone="var(--tomato)" title="Trocar senha mestra"
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancelar</Button>
        <Button type="submit" form="troca-form" disabled={!ok || busy}>{busy ? 'Recifrando tudo…' : 'Trocar'}</Button>
      </>}>
      <form id="troca-form" className="form" onSubmit={async (e) => {
        e.preventDefault(); setBusy(true); setErr('')
        try {
          const k = await deriveKey(atual, meta.salt, meta.iterations)
          if ((await open<string>(k, meta.check)) !== CHECK) throw new Error()
        } catch { setErr('A senha atual não confere.'); setBusy(false); return }
        try { await onTrocar(nova) } catch (x) { setErr(String(x)); setBusy(false) }
      }}>
        <Field label="Senha mestra atual" hint={err || undefined}><input type="password" value={atual} onChange={(e) => setAtual(e.target.value)} /></Field>
        <Field label="Nova senha mestra" hint={nova ? <StrengthBar pw={nova} /> : 'Mínimo de 10 caracteres.'}><input type="password" value={nova} onChange={(e) => setNova(e.target.value)} autoComplete="new-password" /></Field>
        <Field label="Repete a nova" hint={rep && rep !== nova ? 'Não bateu 🙃' : undefined}><input type="password" value={rep} onChange={(e) => setRep(e.target.value)} autoComplete="new-password" /></Field>
      </form>
    </Modal>
  )
}
