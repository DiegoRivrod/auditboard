// Lectura centralizada de variables de entorno de Vite.
// Validar aquí evita errores oscuros cuando faltan VITE_SUPABASE_URL / KEY en prod.

export const IS_DEMO = import.meta.env.VITE_DEMO_MODE === 'true'

export const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? ''
export const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

if (!IS_DEMO && (!SUPABASE_URL || !SUPABASE_ANON_KEY)) {
  console.error('[env] Faltan VITE_SUPABASE_URL o VITE_SUPABASE_ANON_KEY en .env.local')
}
