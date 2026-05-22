import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import { demoSupabase } from './demoSupabase'
import { IS_DEMO, SUPABASE_URL, SUPABASE_ANON_KEY } from './env'

// El cliente real implementa muchos más métodos, pero la app solo usa
// auth/from/rpc/functions. Compartimos esa firma mínima con el mock demo.
type SupabaseLike = Pick<SupabaseClient, 'auth' | 'from' | 'rpc' | 'functions'>

function makeClient(): SupabaseLike {
  if (IS_DEMO) return demoSupabase as unknown as SupabaseLike
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local')
  }
  return createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
}

export const supabase = makeClient()
