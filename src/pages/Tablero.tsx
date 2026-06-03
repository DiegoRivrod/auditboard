import { useCallback, useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'react-toastify'
import { supabase } from '../lib/supabase'
import { IS_DEMO } from '../lib/env'
import NuevaObsModal from '../components/modals/NuevaObsModal'
import DetailPanel from '../components/detail/DetailPanel'
import SelectorAuditoria from '../components/SelectorAuditoria'
import { useAuditorias } from '../hooks/useAuditorias'
import { COLORES_AREA, SEVERIDADES } from '../constants'
import type { Observacion, Perfil } from '../types'

const COLUMNAS = [
  { id: 'sin_fecha', titulo: 'Sin Fecha', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  { id: 'fecha_comprometida', titulo: 'Fecha Comprometida', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { id: 'en_ejecucion', titulo: 'En Ejecución', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'en_verificacion', titulo: 'En Verificación', color: '#8b5cf6', bg: '#faf5ff', border: '#ddd6fe' },
  { id: 'levantada', titulo: 'Levantada', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
]

export default function Tablero() {
  const navigate = useNavigate()
  const [observaciones, setObservaciones] = useState<Observacion[]>([])
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState<Perfil | null>(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [obsSeleccionada, setObsSeleccionada] = useState<Observacion | null>(null)
  const [filtroTexto, setFiltroTexto] = useState('')
  const [filtroArea, setFiltroArea] = useState('')

  const { auditorias, auditoriaId, setAuditoria, loading: loadingAud } = useAuditorias()

  const esCalidad = usuario?.area?.codigo === 'CALIDAD'

  // El perfil del usuario se carga una sola vez (no depende de la auditoría).
  useEffect(() => {
    let cancelado = false
    async function cargarPerfil() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        navigate('/login')
        return
      }
      const { data: perfil, error: errPerfil } = await supabase
        .from('perfiles')
        .select('*, area:areas(*)')
        .eq('id', user.id)
        .single()
      if (errPerfil) console.error('Tablero fetch perfil:', errPerfil)
      if (!cancelado) setUsuario(perfil)
    }
    cargarPerfil()
    return () => { cancelado = true }
  }, [navigate])

  // Las observaciones se cargan filtradas por la auditoría seleccionada,
  // de modo que el tablero nunca mezcla observaciones de distintas auditorías.
  const cargarDatos = useCallback(async () => {
    if (!auditoriaId) {
      // No hay ninguna auditoría disponible: tablero vacío, sin spinner infinito.
      setObservaciones([])
      setLoading(false)
      return
    }
    const { data: obs, error: errObs } = await supabase
      .from('observaciones')
      .select('*, area_responsable:areas(*), subarea:subareas(*)')
      .eq('auditoria_id', auditoriaId)
      .order('created_at', { ascending: false })
    if (errObs) {
      console.error('Tablero fetch observaciones:', errObs)
      toast.error('Error al cargar observaciones')
    }
    setObservaciones(obs || [])
    setLoading(false)
  }, [auditoriaId])

  useEffect(() => {
    if (loadingAud) return
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarDatos()
  }, [loadingAud, cargarDatos])

  async function handleLogout() {
    await supabase.auth.signOut()
    navigate('/login')
  }

  async function eliminarObs(id: string) {
    const { error } = await supabase
      .from('observaciones')
      .delete()
      .eq('id', id)

    if (error) {
      console.error('Tablero eliminar obs:', error)
      toast.error('Error al eliminar: ' + error.message)
    } else {
      cargarDatos()
    }
  }

  const areasUnicas = useMemo(
    () => [...new Set(observaciones.map(o => o.area_responsable?.codigo).filter(Boolean))],
    [observaciones],
  )

  const obsFiltradas = useMemo(() => {
    const q = filtroTexto.toLowerCase()
    return observaciones.filter(o => {
      const textoOk = !q
        || o.titulo?.toLowerCase().includes(q)
        || o.codigo?.toLowerCase().includes(q)
      const areaOk = !filtroArea || o.area_responsable?.codigo === filtroArea
      return textoOk && areaOk
    })
  }, [observaciones, filtroTexto, filtroArea])

  const obsPorEstado = (estado: string) =>
    obsFiltradas.filter(o => o.estado === estado)

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#f0f2f5',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#7a8aaa'
    }}>
      Cargando tablero...
    </div>
  )

  return (
    <div style={{ height: '100vh', background: '#f0f2f5', fontFamily: 'system-ui, sans-serif', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

      {/* TOPBAR */}
      <div style={{
        background: '#1a2234', padding: '0 24px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', background: '#c0392b',
            borderRadius: '7px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '13px', fontWeight: '800', color: 'white', letterSpacing: '-0.5px'
          }}>AB</div>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '18px' }}>AuditBoard</span>
          <span style={{ marginLeft: '8px' }}>
            <SelectorAuditoria
              auditorias={auditorias}
              auditoriaId={auditoriaId}
              onChange={setAuditoria}
              tema="oscuro"
            />
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {usuario && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '7px',
                background: COLORES_AREA[usuario.area?.codigo || ''] || '#666',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontSize: '11px', fontWeight: '700'
              }}>
                {usuario.nombre_completo?.split(' ').map((n: string) => n[0]).slice(0, 2).join('')}
              </div>
              <div>
                <div style={{ color: 'white', fontSize: '12px', fontWeight: '600' }}>
                  {usuario.nombre_completo}
                </div>
                <div style={{ color: 'rgba(255,255,255,0.4)', fontSize: '10px', textTransform: 'uppercase' }}>
                  {usuario.area?.nombre}
                </div>
              </div>
            </div>
          )}
          <button
            onClick={() => navigate('/dashboard')}
            style={{
              background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
              color: 'rgba(255,255,255,0.8)', borderRadius: '7px',
              padding: '7px 14px', fontSize: '12px',
              fontWeight: '700', cursor: 'pointer'
            }}
          >
            Dashboard
          </button>
          {esCalidad && !IS_DEMO && (
            <button
              onClick={() => setMostrarModal(true)}
              disabled={!auditoriaId}
              title={!auditoriaId ? 'No hay una auditoría activa' : ''}
              style={{
                background: auditoriaId ? '#c0392b' : '#666',
                border: 'none',
                color: 'white', borderRadius: '7px',
                padding: '7px 14px', fontSize: '12px',
                fontWeight: '700',
                cursor: auditoriaId ? 'pointer' : 'not-allowed',
                opacity: auditoriaId ? 1 : 0.6,
              }}
            >
              + Nueva Observación
            </button>
          )}
          <button onClick={handleLogout} style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.6)', borderRadius: '7px', padding: '6px 12px',
            fontSize: '12px', cursor: 'pointer'
          }}>
            Salir
          </button>
        </div>
      </div>

      {/* STATS */}
      <div style={{
        background: 'white', borderBottom: '1px solid #e2e8f0',
        padding: '12px 24px', display: 'flex', gap: '12px', flexShrink: 0
      }}>
        {COLUMNAS.map(col => (
          <div key={col.id} style={{
            flex: 1, background: col.bg, border: `1px solid ${col.border}`,
            borderRadius: '10px', padding: '10px 14px',
            display: 'flex', alignItems: 'center', gap: '10px'
          }}>
            <span style={{ fontSize: '22px', fontWeight: '800', color: col.color }}>
              {obsPorEstado(col.id).length}
            </span>
            <span style={{ fontSize: '11px', color: col.color, fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.3px' }}>
              {col.titulo}
            </span>
          </div>
        ))}
      </div>

      {/* FILTROS */}
      <div style={{
        background: 'white', borderBottom: '1px solid #e2e8f0',
        padding: '8px 24px', display: 'flex', gap: '10px', alignItems: 'center', flexShrink: 0
      }}>
        <input
          type="text"
          placeholder="Buscar por código o título..."
          value={filtroTexto}
          onChange={e => setFiltroTexto(e.target.value)}
          style={{
            flex: 1, maxWidth: '320px', padding: '6px 12px',
            border: '1px solid #e2e8f0', borderRadius: '7px',
            fontSize: '12px', outline: 'none', color: '#1a2234',
            background: '#f8fafd'
          }}
        />
        <select
          value={filtroArea}
          onChange={e => setFiltroArea(e.target.value)}
          style={{
            padding: '6px 10px', border: '1px solid #e2e8f0',
            borderRadius: '7px', fontSize: '12px', color: '#1a2234',
            background: '#f8fafd', cursor: 'pointer', outline: 'none'
          }}
        >
          <option value="">Todas las áreas</option>
          {areasUnicas.map(codigo => (
            <option key={codigo} value={codigo}>{codigo}</option>
          ))}
        </select>
        {(filtroTexto || filtroArea) && (
          <button
            onClick={() => { setFiltroTexto(''); setFiltroArea('') }}
            style={{
              padding: '6px 12px', border: '1px solid #fecaca',
              borderRadius: '7px', fontSize: '12px', color: '#c0392b',
              background: '#fef2f2', cursor: 'pointer', fontWeight: '600'
            }}
          >
            Limpiar filtros
          </button>
        )}
        {(filtroTexto || filtroArea) && (
          <span style={{ fontSize: '11px', color: '#7a8aaa' }}>
            {obsFiltradas.length} de {observaciones.length} observaciones
          </span>
        )}
      </div>

      {/* TABLERO */}
      <div style={{ flex: 1, padding: '20px 24px', overflowX: 'auto', minHeight: 0 }}>
        <div style={{ display: 'flex', gap: '14px', height: '100%', width: '100%' }}>
          {COLUMNAS.map(col => (
            <div key={col.id} style={{ flex: 1, minWidth: '200px', display: 'flex', flexDirection: 'column', height: '100%' }}>
              <div style={{
                background: col.bg, border: `1px solid ${col.border}`,
                borderBottom: 'none', borderRadius: '10px 10px 0 0',
                padding: '10px 14px', display: 'flex',
                alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
                  <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: col.color }} />
                  <span style={{ fontSize: '11px', fontWeight: '700', color: col.color, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                    {col.titulo}
                  </span>
                </div>
                <span style={{
                  fontSize: '11px', fontWeight: '700', padding: '1px 7px',
                  borderRadius: '20px', background: col.border, color: col.color
                }}>
                  {obsPorEstado(col.id).length}
                </span>
              </div>

              <div style={{
                background: '#f8fafd', border: '1px solid #e8edf5',
                borderTop: 'none', borderRadius: '0 0 10px 10px',
                flex: 1, minHeight: 0, overflowY: 'auto', padding: '8px',
                display: 'flex', flexDirection: 'column', gap: '8px'
              }}>
                {obsPorEstado(col.id).length === 0 ? (
                  <div style={{
                    flex: 1, display: 'flex', alignItems: 'center',
                    justifyContent: 'center', color: '#c0cce0',
                    fontSize: '12px', padding: '40px 0', textAlign: 'center'
                  }}>
                    Sin observaciones
                  </div>
                ) : (
                  obsPorEstado(col.id).map(obs => (
                    <div
                      key={obs.id}
                      onClick={() => setObsSeleccionada(obs)}
                      style={{
                        background: 'white', border: '1px solid #e2e8f0',
                        borderRadius: '10px', padding: '12px',
                        borderTop: `3px solid ${COLORES_AREA[obs.area_responsable?.codigo || ''] || '#ccc'}`,
                        cursor: 'pointer',
                        boxShadow: obsSeleccionada?.id === obs.id ? '0 0 0 2px #3b82f6' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#b0bdd4', textTransform: 'uppercase' }}>
                          {obs.codigo}
                        </span>
                        {(() => {
                          const sev = SEVERIDADES.find(s => s.id === obs.severidad)
                          return sev ? (
                            <span style={{
                              fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px',
                              background: sev.bg, color: sev.color
                            }}>
                              {sev.label}
                            </span>
                          ) : null
                        })()}
                      </div>
                      <div style={{
                        fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                        color: COLORES_AREA[obs.area_responsable?.codigo || ''] || '#666',
                        marginBottom: '3px'
                      }}>
                        {obs.area_responsable?.nombre}
                      </div>
                      {obs.subarea && (
                        <div style={{
                          fontSize: '10px', color: '#7a8aaa',
                          marginBottom: '5px', fontWeight: '500',
                        }}>
                          {obs.subarea.nombre}
                        </div>
                      )}
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#1a2234', lineHeight: '1.35', margin: 0 }}>
                        {obs.titulo}
                      </p>
                      {obs.porcentaje_avance > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ height: '4px', background: '#e8edf5', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '4px',
                              background: COLORES_AREA[obs.area_responsable?.codigo || ''] || '#3b82f6',
                              width: `${obs.porcentaje_avance}%`
                            }} />
                          </div>
                        </div>
                      )}
                      {esCalidad && !IS_DEMO && (
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            if (window.confirm('¿Eliminar esta observación?')) {
                              eliminarObs(obs.id)
                            }
                          }}
                          style={{
                            marginTop: '8px',
                            width: '100%',
                            padding: '5px',
                            background: 'transparent',
                            border: '1px solid #fecaca',
                            borderRadius: '6px',
                            color: '#c0392b',
                            fontSize: '11px',
                            fontWeight: '700',
                            cursor: 'pointer',
                          }}
                        >
                          Eliminar
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {obsSeleccionada && (
        <DetailPanel
          key={obsSeleccionada.id}
          obs={obsSeleccionada}
          usuarioId={usuario?.id ?? ''}
          esCalidad={esCalidad}
          onClose={() => setObsSeleccionada(null)}
          onActualizada={() => {
            setObsSeleccionada(null)
            cargarDatos()
          }}
        />
      )}

      {mostrarModal && (
        <NuevaObsModal
          auditoriaId={auditoriaId}
          usuarioId={usuario?.id ?? ''}
          onClose={() => setMostrarModal(false)}
          onCreada={() => cargarDatos()}
        />
      )}

    </div>
  )
}