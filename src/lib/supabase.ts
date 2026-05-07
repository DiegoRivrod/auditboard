import { createClient } from '@supabase/supabase-js'
import { demoSupabase } from './demoSupabase'

const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

// En modo demo se usa el cliente mock (sin Supabase real).
// En producción se usa el cliente real con las variables de entorno.
export const supabase = IS_DEMO
  ? (demoSupabase as any)
  : createClient(
      import.meta.env.VITE_SUPABASE_URL,
      import.meta.env.VITE_SUPABASE_ANON_KEY,
    )