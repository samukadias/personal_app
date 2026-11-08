import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode, type ButtonHTMLAttributes } from 'react'
import { IconX } from './icons'

/* ---------- Botão ---------- */
type BtnProps = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger' | 'plain'; small?: boolean }
export function Button({ variant = 'primary', small, className = '', ...rest }: BtnProps) {
  return <button type="button" className={`btn btn-${variant}${small ? ' btn-sm' : ''} ${className}`} {...rest} />
}
export function IconButton({ label, className = '', ...rest }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return <button type="button" className={`icon-btn ${className}`} aria-label={label} title={label} {...rest} />
}

/* ---------- Campo ---------- */
export function Field({ label, hint, children }: { label: string; hint?: ReactNode; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-label">{label}</span>
      {children}
      {hint && <span className="field-hint">{hint}</span>}
    </label>
  )
}

/* ---------- Modal ---------- */
export function Modal({ open, onClose, title, children, footer, tone }: {
  open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode; tone?: string
}) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    addEventListener('keydown', onKey)
    const first = ref.current?.querySelector<HTMLElement>('input, textarea, select')
    first?.focus()
    return () => removeEventListener('keydown', onKey)
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="modal-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal" role="dialog" aria-modal aria-label={title} ref={ref} style={tone ? { ['--tone' as string]: tone } : undefined}>
        <header className="modal-head">
          <h2>{title}</h2>
          <IconButton label="Fechar" onClick={onClose}><IconX /></IconButton>
        </header>
        <div className="modal-body">{children}</div>
        {footer && <footer className="modal-foot">{footer}</footer>}
      </div>
    </div>
  )
}

/* ---------- Estado vazio ---------- */
export function Empty({ title, text, action, doodle }: { title: string; text?: ReactNode; action?: ReactNode; doodle?: ReactNode }) {
  return (
    <div className="empty">
      {doodle && <div className="empty-doodle">{doodle}</div>}
      <h3>{title}</h3>
      {text && <p>{text}</p>}
      {action}
    </div>
  )
}

/* ---------- Toasts + confirmação ---------- */
type Toast = { id: number; text: string; tone?: 'ok' | 'err' }
type Ask = { text: string; yes: string; resolve: (v: boolean) => void }
const Ctx = createContext<{ toast: (t: string, tone?: Toast['tone']) => void; ask: (t: string, yes?: string) => Promise<boolean> }>(null!)
export const useToast = () => useContext(Ctx)

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])
  const [asking, setAsking] = useState<Ask | null>(null)
  const toast = useCallback((text: string, tone: Toast['tone'] = 'ok') => {
    const id = Date.now() + Math.random()
    setToasts((t) => [...t, { id, text, tone }])
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2800)
  }, [])
  const ask = useCallback((text: string, yes = 'Sim, pode') =>
    new Promise<boolean>((resolve) => setAsking({ text, yes, resolve })), [])
  const answer = (v: boolean) => { asking?.resolve(v); setAsking(null) }
  return (
    <Ctx.Provider value={{ toast, ask }}>
      {children}
      <div className="toasts" aria-live="polite">
        {toasts.map((t) => <div key={t.id} className={`toast toast-${t.tone}`}>{t.text}</div>)}
      </div>
      <Modal open={!!asking} onClose={() => answer(false)} title="Peraí…" tone="var(--tomato)"
        footer={<>
          <Button variant="ghost" onClick={() => answer(false)}>Melhor não</Button>
          <Button variant="danger" onClick={() => answer(true)}>{asking?.yes}</Button>
        </>}>
        <p className="ask-text">{asking?.text}</p>
      </Modal>
    </Ctx.Provider>
  )
}

/* ---------- Avatar de letra (sem buscar ícones em serviços externos) ---------- */
const PALETTE = ['var(--tomato)', 'var(--mustard)', 'var(--mint)', 'var(--sky)', 'var(--pink)', 'var(--lilac)']
export const colorFor = (s: string) => PALETTE[[...s].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETTE.length]
export function LetterBadge({ text, size = 44 }: { text: string; size?: number }) {
  const ch = (text.trim()[0] || '?').toUpperCase()
  return <span className="letter-badge" style={{ width: size, height: size, background: colorFor(text), fontSize: size * 0.48 }}>{ch}</span>
}
