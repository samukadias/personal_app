/** minúsculas e sem acento — "Câmera" casa com "camera" */
export const norm = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().trim()
export const matches = (q: string, ...fields: (string | undefined | string[])[]) => {
  const n = norm(q)
  if (!n) return true
  const hay = norm(fields.flat().filter(Boolean).join(' '))
  return n.split(/\s+/).every((t) => hay.includes(t))
}
export const byName = (a: string, b: string) => a.localeCompare(b, 'pt-BR', { sensitivity: 'base' })
