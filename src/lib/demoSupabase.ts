/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
/**
 * Mock Supabase client para modo demo.
 * Devuelve datos estáticos de demoData.ts — sin ninguna llamada de red.
 * Usado cuando VITE_DEMO_MODE=true.
 *
 * Las firmas tienen `any` y parámetros con `_` (ignorados) porque emulan la API
 * pública de @supabase/supabase-js sin importar sus tipos completos.
 */
import {
  DEMO_AREAS, DEMO_SUBAREAS, DEMO_PERFIL, DEMO_AUDITORIA,
  DEMO_OBSERVACIONES, DEMO_ACTUALIZACIONES,
} from './demoData'

// ─── Utilidad ────────────────────────────────────────────────────────────────
function ok<T>(data: T) {
  return Promise.resolve({ data, error: null })
}

// ─── Query builder thenable ──────────────────────────────────────────────────
class QueryBuilder {
  private table: string
  private conditions: Record<string, any> = {}
  private _mode: 'select' | 'delete' | 'update' = 'select'
  private _single = false

  constructor(table: string) {
    this.table = table
  }

  select(_fields?: string): this { return this }

  eq(col: string, val: any): this {
    this.conditions[col] = val
    return this
  }

  order(_col: string, _opts?: any): this { return this }
  like(_col: string, _pattern: string): this { return this }
  limit(_n: number): this { return this }

  single(): Promise<{ data: any; error: null }> {
    this._single = true
    return this._resolve()
  }

  delete(): this { this._mode = 'delete'; return this }

  update(_data: any): this { this._mode = 'update'; return this }

  insert(_data: any): Promise<{ data: null; error: null }> {
    return ok(null)
  }

  // Hace el builder directamente awaitable
  then(
    onfulfilled?: ((value: { data: any; error: null }) => any) | null,
    onrejected?: ((reason: any) => any) | null,
  ): Promise<any> {
    return this._resolve().then(onfulfilled ?? undefined, onrejected ?? undefined)
  }

  private _resolve(): Promise<{ data: any; error: null }> {
    if (this._mode === 'delete' || this._mode === 'update') {
      return ok(null)
    }
    return ok(this._getData())
  }

  private _getData(): any {
    const cond = this.conditions

    switch (this.table) {
      case 'perfiles': {
        // Cubre: .eq('id', userId) y .eq('area_id', x).eq('rol','jefe')
        const result = { ...DEMO_PERFIL }
        return this._single ? result : [result]
      }

      case 'auditorias': {
        return this._single ? DEMO_AUDITORIA : [DEMO_AUDITORIA]
      }

      case 'observaciones': {
        // El selector de Dashboard pide solo ciertos campos — devolvemos todo
        // ya que los componentes hacen pick en runtime
        return DEMO_OBSERVACIONES
      }

      case 'actualizaciones': {
        const obsId = cond['observacion_id']
        const filtered = obsId
          ? DEMO_ACTUALIZACIONES.filter(a => a.observacion_id === obsId)
          : DEMO_ACTUALIZACIONES
        return filtered
      }

      case 'areas': {
        return DEMO_AREAS
      }

      case 'subareas': {
        const areaId = cond['area_id']
        return areaId
          ? DEMO_SUBAREAS.filter(s => s.area_id === areaId)
          : DEMO_SUBAREAS
      }

      default:
        return this._single ? null : []
    }
  }
}

// ─── Mock Supabase ────────────────────────────────────────────────────────────
export const demoSupabase = {
  auth: {
    getUser: () =>
      ok({ user: { id: DEMO_PERFIL.id, email: 'demo@auditboard.app' } }),
    signOut: () => ok(null),
    signInWithPassword: (_credentials: any) =>
      ok({ session: { user: { id: DEMO_PERFIL.id } }, user: { id: DEMO_PERFIL.id } }),
  },

  from: (table: string) => new QueryBuilder(table),

  rpc: (name: string, _params?: any) => {
    if (name === 'generar_codigo_observacion') {
      const n = Math.floor(Math.random() * 900) + 100
      return ok(`OBS-${new Date().getFullYear()}-${n}`)
    }
    return ok(null)
  },

  functions: {
    invoke: (_name: string, _opts?: any) => ok({ data: null }),
  },
}
