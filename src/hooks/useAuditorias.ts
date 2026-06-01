import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import type { Auditoria } from '../types'

// Clave compartida entre Tablero y Dashboard para recordar/sincronizar
// la auditoría que el usuario está viendo.
const STORAGE_KEY = 'auditboard_auditoria_id'

/**
 * Carga la lista de auditorías y gestiona cuál está seleccionada.
 * La selección se persiste en localStorage, de modo que se mantiene al
 * navegar entre Tablero y Dashboard y tras recargar la página.
 *
 * Si la selección guardada ya no existe (o no hay), cae a la auditoría
 * marcada como `activa` o, en su defecto, a la más reciente.
 */
export function useAuditorias() {
  const [auditorias, setAuditorias] = useState<Auditoria[]>([])
  const [auditoriaId, setAuditoriaId] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelado = false

    async function cargar() {
      const { data, error } = await supabase
        .from('auditorias')
        .select('id, nombre, activa, created_at')
        .order('created_at', { ascending: false })

      if (cancelado) return

      if (error) {
        console.error('useAuditorias fetch:', error)
        setLoading(false)
        return
      }

      const lista = (data ?? []) as Auditoria[]
      setAuditorias(lista)

      // Resolver la selección: guardada → activa → más reciente
      const guardada = localStorage.getItem(STORAGE_KEY)
      const existeGuardada = guardada && lista.some(a => a.id === guardada)
      const activa = lista.find(a => a.activa)
      const seleccion = existeGuardada
        ? (guardada as string)
        : (activa?.id ?? lista[0]?.id ?? '')

      setAuditoriaId(seleccion)
      if (seleccion) localStorage.setItem(STORAGE_KEY, seleccion)
      setLoading(false)
    }

    cargar()
    return () => { cancelado = true }
  }, [])

  const setAuditoria = useCallback((id: string) => {
    setAuditoriaId(id)
    localStorage.setItem(STORAGE_KEY, id)
  }, [])

  return { auditorias, auditoriaId, setAuditoria, loading }
}
