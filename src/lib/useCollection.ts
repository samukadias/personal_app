import { useCallback, useEffect, useReducer, useState } from 'react'
import { store, uid, type Rec } from './store'

// cache compartilhado entre telas (o contador da Home e o módulo veem o mesmo dado)
const cache = new Map<string, Rec[]>()
const inflight = new Map<string, Promise<void>>()
const subs = new Map<string, Set<() => void>>()
const notify = (kind: string) => subs.get(kind)?.forEach((f) => f())

export function clearCache() {
  const kinds = [...cache.keys()]
  cache.clear()
  kinds.forEach(notify)
}

function load(kind: string) {
  if (!inflight.has(kind)) {
    const p = store.list(kind).then((r) => { cache.set(kind, r); notify(kind) })
      .finally(() => inflight.delete(kind))
    inflight.set(kind, p)
  }
  return inflight.get(kind)!
}

export function useCollection<T>(kind: string) {
  const [, force] = useReducer((x: number) => x + 1, 0)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const set = subs.get(kind) ?? new Set()
    set.add(force)
    subs.set(kind, set)
    if (!cache.has(kind)) load(kind).catch((e) => setError(e.message ?? String(e)))
    return () => { set.delete(force) }
  }, [kind])

  const save = useCallback(async (data: T, id?: string) => {
    const rec = await store.put(kind, id ?? uid(), data)
    const list = cache.get(kind) ?? []
    const i = list.findIndex((r) => r.id === rec.id)
    cache.set(kind, i >= 0 ? list.map((r) => (r.id === rec.id ? rec : r)) : [...list, rec])
    notify(kind)
    return rec as Rec<T>
  }, [kind])

  const remove = useCallback(async (id: string) => {
    await store.remove(id)
    cache.set(kind, (cache.get(kind) ?? []).filter((r) => r.id !== id))
    notify(kind)
  }, [kind])

  return {
    items: (cache.get(kind) ?? []) as Rec<T>[],
    loading: !cache.has(kind) && !error,
    error,
    save,
    remove,
  }
}
