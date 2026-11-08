import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { supabase } from './supabase'
import { clearCache } from './useCollection'
import { lockVault } from '../modules/cofre/Cofre'

type AuthState = { ready: boolean; session: Session | null; signOut: () => Promise<void> }
const Ctx = createContext<AuthState>({ ready: true, session: null, signOut: async () => {} })
export const useAuth = () => useContext(Ctx)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(!supabase)
  const [session, setSession] = useState<Session | null>(null)
  useEffect(() => {
    if (!supabase) return
    supabase.auth.getSession().then(({ data }) => { setSession(data.session); setReady(true) })
    const { data } = supabase.auth.onAuthStateChange((_e, s) => {
      setSession((prev) => {
        if (prev?.user.id !== s?.user.id) { clearCache(); lockVault() }
        return s
      })
    })
    return () => data.subscription.unsubscribe()
  }, [])
  const signOut = async () => { lockVault(); await supabase?.auth.signOut(); clearCache() }
  return <Ctx.Provider value={{ ready, session, signOut }}>{children}</Ctx.Provider>
}
