import { useEffect, useRef, useState } from 'react'

/**
 * Arrastar-e-soltar que funciona com mouse e com dedo.
 * - Mouse: começa ao mover ~6px com o botão apertado.
 * - Toque: segure ~0,35s parado e então arraste (assim a rolagem normal continua funcionando).
 * Alvos de soltura são elementos com `data-drop="<id>"` ("root" = nível principal).
 */
export type Arrasto = { id: string; label: string; x: number; y: number; alvo: string | null }

export function useArrastar(podeSoltar: (id: string, alvo: string) => boolean, onSoltar: (id: string, alvo: string) => void) {
  const [arrasto, setArrasto] = useState<Arrasto | null>(null)
  const ref = useRef<Arrasto | null>(null)
  const engoleClique = useRef(false)
  const cbs = useRef({ podeSoltar, onSoltar })
  cbs.current = { podeSoltar, onSoltar }

  const atualizar = (a: Arrasto | null) => { ref.current = a; setArrasto(a) }

  // enquanto arrasta com o dedo, impede a página de rolar
  useEffect(() => {
    const bloquear = (e: TouchEvent) => { if (ref.current) e.preventDefault() }
    window.addEventListener('touchmove', bloquear, { passive: false })
    return () => window.removeEventListener('touchmove', bloquear)
  }, [])

  const alvoEm = (x: number, y: number, id: string) => {
    const el = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-drop]')
    const alvo = el?.dataset.drop ?? null
    return alvo && cbs.current.podeSoltar(id, alvo) ? alvo : null
  }

  const iniciar = (e: React.PointerEvent, id: string, label: string) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest('.no-drag')) return
    const x0 = e.clientX, y0 = e.clientY
    const toque = e.pointerType !== 'mouse'
    let ativo = false
    let timer = 0

    const comecar = (x: number, y: number) => {
      ativo = true
      navigator.vibrate?.(15)
      atualizar({ id, label, x, y, alvo: null })
    }
    const mover = (ev: PointerEvent) => {
      const dist = Math.hypot(ev.clientX - x0, ev.clientY - y0)
      if (!ativo) {
        if (toque) { if (dist > 10) fim() } // mexeu antes do tempo: é rolagem, não arrasto
        else if (dist > 6) comecar(ev.clientX, ev.clientY)
        return
      }
      atualizar({ id, label, x: ev.clientX, y: ev.clientY, alvo: alvoEm(ev.clientX, ev.clientY, id) })
    }
    const soltar = (ev: PointerEvent) => {
      if (ativo) {
        engoleClique.current = true
        setTimeout(() => { engoleClique.current = false }, 50)
        const alvo = alvoEm(ev.clientX, ev.clientY, id)
        if (alvo) cbs.current.onSoltar(id, alvo)
      }
      fim()
    }
    const fim = () => {
      clearTimeout(timer)
      window.removeEventListener('pointermove', mover)
      window.removeEventListener('pointerup', soltar)
      window.removeEventListener('pointercancel', fim)
      if (ativo) atualizar(null)
      ativo = false
    }
    if (toque) timer = window.setTimeout(() => comecar(x0, y0), 350)
    window.addEventListener('pointermove', mover)
    window.addEventListener('pointerup', soltar)
    window.addEventListener('pointercancel', fim)
  }

  /** props pra espalhar no elemento arrastável */
  const arrastavel = (id: string, label: string) => ({
    onPointerDown: (e: React.PointerEvent) => iniciar(e, id, label),
    onClickCapture: (e: React.MouseEvent) => { if (engoleClique.current) { e.preventDefault(); e.stopPropagation() } },
    onContextMenu: (e: React.MouseEvent) => { if (ref.current) e.preventDefault() },
    'data-dragging': arrasto?.id === id ? '' : undefined,
  })

  /** props pra espalhar num alvo de soltura */
  const soltavel = (alvo: string) => ({
    'data-drop': alvo,
    'data-over': arrasto?.alvo === alvo ? '' : undefined,
  })

  return { arrasto, arrastavel, soltavel }
}
