import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Field } from '../components/ui'

// Cadastro de contas novas fica desligado no Supabase de propósito: o app é só seu.
export default function Login() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const { error } = await supabase!.auth.signInWithPassword({ email, password: pw })
    setBusy(false)
    if (!error) return
    if (error.message === 'Invalid login credentials') setMsg('E-mail ou senha não batem.')
    else if (error.status === 429) setMsg('Muitas tentativas. Espere alguns minutos e tente de novo.')
    else setMsg('Não deu pra entrar agora. Tente de novo daqui a pouco.')
  }

  return (
    <div className="login">
      <div className="login-card">
        <span className="logo big">tralha<i>.</i></span>
        <p className="lede">Suas coisas, seus links e suas senhas.<br />Num lugar só, e só seu.</p>
        <form className="form" onSubmit={submit}>
          <Field label="E-mail"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
          <Field label="Senha da conta">
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} required autoComplete="current-password" />
          </Field>
          {msg && <p className="banner banner-warn">{msg}</p>}
          <Button type="submit" disabled={busy}>{busy ? 'Um segundo…' : 'Entrar'}</Button>
        </form>
      </div>
      <div className="login-doodles" aria-hidden><span>📦</span><span>🔖</span><span>🗝️</span></div>
    </div>
  )
}
