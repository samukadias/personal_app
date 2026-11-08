export type Theme = 'auto' | 'light' | 'dark'
const KEY = 'tralha:tema'
export const getTheme = (): Theme => { try { return (localStorage.getItem(KEY) as Theme) || 'auto' } catch { return 'auto' } }
export function applyTheme(t: Theme) {
  if (t === 'auto') document.documentElement.removeAttribute('data-theme')
  else document.documentElement.setAttribute('data-theme', t)
  try { localStorage.setItem(KEY, t) } catch { /* sem storage, sem drama */ }
}
