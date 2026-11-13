import { useRef, useState } from 'react'
import { store, type Rec } from '../lib/store'
import { clearCache } from '../lib/useCollection'
import { isCloud } from '../lib/supabase'
import { useAuth } from '../lib/auth'
import { applyTheme, getTheme, type Theme } from '../lib/theme'
import { Button, useToast } from '../components/ui'
import { modules } from '../modules/registry'

export default function Ajustes() {
  const { session, signOut } = useAuth()
  const { toast, ask } = useToast()
  const [theme, setTheme] = useState<Theme>(getTheme())
  const file = useRef<HTMLInputElement>(null)

  const exportar = async () => {
    const all = await store.all()
    const blob = new Blob([JSON.stringify({ app: 'tralha', versao: 1, exportadoEm: new Date().toISOString(), registros: all }, null, 2)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `samuapp-backup-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
    toast(`Backup com ${all.length} registros baixado ✔`)
  }
  const importar = async (f: File) => {
    try {
      const json = JSON.parse(await f.text())
      const regs: Rec[] = json.registros
      if (!Array.isArray(regs)) throw new Error('Arquivo não parece um backup do SamuAPP.')
      if (!(await ask(`Importar ${regs.length} registros? Itens com o mesmo id serão sobrescritos.`, 'Importar'))) return
      const temCofre = regs.some((r) => r.kind === 'cofre_meta')
      if (temCofre && (await store.list('cofre_meta')).length && !(await ask('O backup tem um cofre e você já tem um aqui. A senha mestra do backup vai substituir a atual. Continuar?', 'Continuar'))) return
      if (temCofre) for (const m of await store.list('cofre_meta')) await store.remove(m.id)
      for (const r of regs) await store.put(r.kind, r.id, r.data)
      clearCache()
      toast('Importado ✔')
    } catch (e) { toast(e instanceof Error ? e.message : 'Falhou a importação', 'err') }
  }

  return (
    <div className="page ajustes">
      <header className="page-head">
        <div>
          <p className="kicker">bastidores</p>
          <h1 className="title">Ajustes<span className="title-accent">~</span></h1>
        </div>
      </header>

      <section className="panel">
        <h2>Onde ficam seus dados</h2>
        {isCloud ? (
          <p>Na nuvem (Supabase), sincronizados entre dispositivos. Logado como <strong>{session?.user.email}</strong>.</p>
        ) : (
          <p><strong>Modo local:</strong> tudo fica só neste navegador. Para acessar de qualquer lugar, conecte o Supabase (passo a passo no README).</p>
        )}
        {isCloud && <Button variant="ghost" onClick={signOut}>Sair da conta</Button>}
      </section>

      <section className="panel">
        <h2>Aparência</h2>
        <div className="seg">
          {(['auto', 'light', 'dark'] as Theme[]).map((t) => (
            <button key={t} className={theme === t ? 'on' : ''} onClick={() => { setTheme(t); applyTheme(t) }}>
              {{ auto: 'Igual ao sistema', light: 'Claro', dark: 'Escuro' }[t]}
            </button>
          ))}
        </div>
      </section>

      <section className="panel">
        <h2>Backup</h2>
        <p>Baixa um arquivo .json com tudo. As senhas do cofre continuam criptografadas dentro dele.</p>
        <div className="head-actions">
          <Button onClick={exportar}>Baixar backup</Button>
          <Button variant="ghost" onClick={() => file.current?.click()}>Importar backup</Button>
          <input ref={file} type="file" accept="application/json" hidden onChange={(e) => { const f = e.target.files?.[0]; if (f) importar(f); e.target.value = '' }} />
        </div>
      </section>

      <section className="panel">
        <h2>Módulos instalados</h2>
        <ul className="mod-list">
          {modules.map((m) => <li key={m.id}><span className="dot" style={{ background: m.color }} /> <strong>{m.name}</strong> — {m.tagline}</li>)}
        </ul>
        <p className="muted small">Quer um módulo novo (contas a pagar, plantas, livros, receitas…)? Cada um é um arquivo em <code>src/modules</code> + uma linha em <code>registry.tsx</code>.</p>
      </section>
    </div>
  )
}
