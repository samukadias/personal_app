import { supabase } from './supabase'

/**
 * Todo dado do app é um "registro" genérico: { id, kind, data }.
 * Um módulo novo só precisa escolher um `kind` — nada de migração de banco.
 */
export type Rec<T = any> = { id: string; kind: string; data: T; updated_at: string }

export interface Store {
  list(kind: string): Promise<Rec[]>
  all(): Promise<Rec[]>
  put(kind: string, id: string, data: unknown): Promise<Rec>
  remove(id: string): Promise<void>
}

export const uid = () =>
  crypto.randomUUID?.() ?? `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`

/* ---------- modo local: localStorage ---------- */
const LS_KEY = 'tralha:records'
const readLS = (): Record<string, Rec> => {
  try { return JSON.parse(localStorage.getItem(LS_KEY) || '{}') } catch { return {} }
}
const writeLS = (m: Record<string, Rec>) => localStorage.setItem(LS_KEY, JSON.stringify(m))

const localStore: Store = {
  async list(kind) { return Object.values(readLS()).filter((r) => r.kind === kind) },
  async all() { return Object.values(readLS()) },
  async put(kind, id, data) {
    const m = readLS()
    const rec: Rec = { id, kind, data, updated_at: new Date().toISOString() }
    m[id] = rec
    writeLS(m)
    return rec
  },
  async remove(id) { const m = readLS(); delete m[id]; writeLS(m) },
}

/* ---------- modo nuvem: Supabase (tabela `records` com RLS) ---------- */
const cloudStore = (): Store => {
  const sb = supabase!
  const cols = 'id, kind, data, updated_at'
  return {
    async list(kind) {
      const { data, error } = await sb.from('records').select(cols).eq('kind', kind)
      if (error) throw error
      return data as Rec[]
    },
    async all() {
      const { data, error } = await sb.from('records').select(cols)
      if (error) throw error
      return data as Rec[]
    },
    async put(kind, id, data) {
      const row = { id, kind, data, updated_at: new Date().toISOString() }
      const { data: out, error } = await sb.from('records').upsert(row).select(cols).single()
      if (error) throw error
      return out as Rec
    },
    async remove(id) {
      const { error } = await sb.from('records').delete().eq('id', id)
      if (error) throw error
    },
  }
}

export const store: Store = supabase ? cloudStore() : localStore
