import { useState } from 'react'
import { supabase } from '../lib/supabase'
import { Button, Field } from '../components/ui'

export default function Login() {
  const [email, setEmail] = useState('')
  const [pw, setPw] = useState('')
  const [modo, setModo] = useState<'entrar' | 'criar'>('entrar')
  const [msg, setMsg] = useState<{ t: string; err?: boolean } | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setBusy(true); setMsg(null)
    const { error, data } = modo === 'entrar'
      ? await supabase!.auth.signInWithPassword({ email, password: pw })
      : await supabase!.auth.signUp({ email, password: pw })
    setBusy(false)
    if (error) return setMsg({ t: error.message === 'Invalid login credentials' ? 'E-mail ou senha não batem.' : error.message, err: true })
    if (modo === 'criar' && !data.session) setMsg({ t: 'Conta criada! Confirme pelo link que chegou no seu e-mail e depois entre.' })
  }

  return (
    <div className="login">
      <div className="login-card">
        <span className="logo big">tralha<i>.</i></span>
        <p className="lede">Suas coisas, seus links e suas senhas.<br />Num lugar só, e só seu.</p>
        <form className="form" onSubmit={submit}>
          <Field label="E-mail"><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" required /></Field>
          <Field label="Senha da conta" hint={modo === 'criar' ? 'Essa é a senha de login. A do cofre é outra, criada lá dentro.' : undefined}>
            <input type="password" value={pw} onChange={(e) => setPw(e.target.value)} minLength={8} required autoComplete={modo === 'entrar' ? 'current-password' : 'new-password'} />
          </Field>
          {msg && <p className={`banner ${msg.err ? 'banner-warn' : ''}`}>{msg.t}</p>}
          <Button type="submit" disabled={busy}>{busy ? 'Um segundo…' : modo === 'entrar' ? 'Entrar' : 'Criar conta'}</Button>
        </form>
        <button className="link" onClick={() => { setModo(modo === 'entrar' ? 'criar' : 'entrar'); setMsg(null) }}>
          {modo === 'entrar' ? 'Primeira vez? Criar conta' : 'Já tenho conta'}
        </button>
      </div>
      <div className="login-doodles" aria-hidden><span>📦</span><span>🔖</span><span>🗝️</span></div>
    </div>
  )
}
