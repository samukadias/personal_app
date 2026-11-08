/**
 * Criptografia do cofre — tudo acontece no navegador.
 * Senha mestra -> PBKDF2 (SHA-256) -> chave AES-GCM 256.
 * O servidor só recebe { iv, ct } (texto cifrado). A senha mestra nunca sai daqui.
 */
export type Box = { iv: string; ct: string }

const enc = new TextEncoder()
const dec = new TextDecoder()

const toB64 = (buf: ArrayBuffer | Uint8Array) => {
  const bytes = new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}
const fromB64 = (s: string) => Uint8Array.from(atob(s), (c) => c.charCodeAt(0))

export const newSalt = () => toB64(crypto.getRandomValues(new Uint8Array(16)))
export const DEFAULT_ITERATIONS = 310_000

export async function deriveKey(password: string, salt: string, iterations = DEFAULT_ITERATIONS) {
  const base = await crypto.subtle.importKey('raw', enc.encode(password), 'PBKDF2', false, ['deriveKey'])
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: fromB64(salt), iterations, hash: 'SHA-256' },
    base,
    { name: 'AES-GCM', length: 256 },
    false,
    ['encrypt', 'decrypt'],
  )
}

export async function seal(key: CryptoKey, value: unknown): Promise<Box> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const ct = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, enc.encode(JSON.stringify(value)))
  return { iv: toB64(iv), ct: toB64(ct) }
}

export async function open<T>(key: CryptoKey, box: Box): Promise<T> {
  const pt = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromB64(box.iv) }, key, fromB64(box.ct))
  return JSON.parse(dec.decode(pt)) as T
}

/* ---------- gerador de senhas ---------- */
const SETS = {
  lower: 'abcdefghijkmnopqrstuvwxyz',
  upper: 'ABCDEFGHJKLMNPQRSTUVWXYZ',
  digits: '23456789',
  symbols: '!@#$%&*?-_=+.',
}
export type GenOpts = { length: number; upper: boolean; digits: boolean; symbols: boolean }

function randInt(max: number) {
  // amostragem por rejeição: sem viés de módulo
  const lim = Math.floor(0x1_0000_0000 / max) * max
  const buf = new Uint32Array(1)
  do crypto.getRandomValues(buf); while (buf[0] >= lim)
  return buf[0] % max
}

export function generatePassword(o: GenOpts) {
  const groups = [SETS.lower]
  if (o.upper) groups.push(SETS.upper)
  if (o.digits) groups.push(SETS.digits)
  if (o.symbols) groups.push(SETS.symbols)
  const all = groups.join('')
  const chars = groups.map((g) => g[randInt(g.length)]) // garante 1 de cada grupo
  while (chars.length < o.length) chars.push(all[randInt(all.length)])
  for (let i = chars.length - 1; i > 0; i--) { const j = randInt(i + 1); [chars[i], chars[j]] = [chars[j], chars[i]] }
  return chars.join('')
}

export function strength(pw: string): { score: 0 | 1 | 2 | 3 | 4; label: string } {
  if (!pw) return { score: 0, label: 'vazia' }
  let pool = 0
  if (/[a-z]/.test(pw)) pool += 26
  if (/[A-Z]/.test(pw)) pool += 26
  if (/\d/.test(pw)) pool += 10
  if (/[^a-zA-Z0-9]/.test(pw)) pool += 20
  const bits = pw.length * Math.log2(Math.max(pool, 1))
  if (bits < 36) return { score: 1, label: 'fraquinha' }
  if (bits < 60) return { score: 2, label: 'dá pro gasto' }
  if (bits < 90) return { score: 3, label: 'parruda' }
  return { score: 4, label: 'blindada' }
}
