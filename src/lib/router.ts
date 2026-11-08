import { useEffect, useState } from 'react'

/** Rotas com # (ex.: #/cade/abc) — funcionam em qualquer hospedagem estática */
const parse = () => location.hash.replace(/^#\/?/, '').split('/').filter(Boolean).map(decodeURIComponent)

export function useRoute() {
  const [r, setR] = useState(parse)
  useEffect(() => {
    const on = () => setR(parse())
    addEventListener('hashchange', on)
    return () => removeEventListener('hashchange', on)
  }, [])
  return r
}
export const go = (...parts: (string | null | undefined)[]) => {
  location.hash = '/' + parts.filter(Boolean).map((p) => encodeURIComponent(p!)).join('/')
}
