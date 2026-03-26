import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import NuevaObsModal from '../components/modals/NuevaObsModal'
import DetailPanel from '../components/detail/DetailPanel'

const COLUMNAS = [
  { id: 'sin_fecha', titulo: 'Sin Fecha', color: '#ef4444', bg: '#fef2f2', border: '#fecaca' },
  { id: 'fecha_comprometida', titulo: 'Fecha Comprometida', color: '#f59e0b', bg: '#fffbeb', border: '#fde68a' },
  { id: 'en_ejecucion', titulo: 'En Ejecucion', color: '#3b82f6', bg: '#eff6ff', border: '#bfdbfe' },
  { id: 'en_verificacion', titulo: 'En Verificacion', color: '#8b5cf6', bg: '#faf5ff', border: '#ddd6fe' },
  { id: 'levantada', titulo: 'Levantada', color: '#22c55e', bg: '#f0fdf4', border: '#bbf7d0' },
]

const COLORES_AREA: Record<string, string> = {
  CALIDAD: '#c0392b',
  PRODUCCION: '#1a6fb5',
  ALMACEN: '#d97706',
  MANTENIMIENTO: '#16a34a',
}

export default function Tablero() {
  const navigate = useNavigate()
  const [observaciones, setObservaciones] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [usuario, setUsuario] = useState<any>(null)
  const [mostrarModal, setMostrarModal] = useState(false)
  const [auditoriaId, setAuditoriaId] = useState('')
  const [obsSeleccionada, setObsSeleccionada] = useState<any>(null)

  useEffect(() => {
    cargarDatos()
  }, [])

  const esCalidad = usuario?.area?.codigo === 'CALIDAD'

  async function cargarDatos() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      navigate('/login')
      return
    }

    const { data: perfil } = await supabase
      .from('perfiles')
      .select('*, area:areas(*)')
      .eq('id', user.id)
      .single()

    setUsuario(perfil)

    const { data: auditoria } = await supabase
      .from('auditorias')
      .select('id')
      .eq('activa', true)
      .single()

    if (auditoria) setAuditoriaId(auditoria.id)

    const { data: obs } = await supabase
      .from('observaciones')
      .select('*, area_responsable:areas(*)')
      .order('created_at', { ascending: false })

    setObservaciones(obs || [])
    setLoading(false)
  }

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
      alert('Error al eliminar: ' + error.message)
    } else {
      cargarDatos()
    }
  }

  const obsPorEstado = (estado: string) =>
    observaciones.filter(o => o.estado === estado)

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
    <div style={{ minHeight: '100vh', background: '#f0f2f5', fontFamily: 'system-ui, sans-serif' }}>

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
            justifyContent: 'center', fontSize: '16px'
          }}>🔍</div>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '18px' }}>AuditBoard</span>
          <span style={{
            marginLeft: '8px', background: '#c0392b', color: 'white',
            fontSize: '10px', fontWeight: '700', padding: '2px 8px',
            borderRadius: '20px', letterSpacing: '0.5px'
          }}>AUDITORIA ACTIVA</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {usuario && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '30px', height: '30px', borderRadius: '7px',
                background: COLORES_AREA[usuario.area?.codigo] || '#666',
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
            📊 Dashboard
          </button>
          {esCalidad && (
            <button
              onClick={() => setMostrarModal(true)}
              style={{
                background: '#c0392b', border: 'none',
                color: 'white', borderRadius: '7px',
                padding: '7px 14px', fontSize: '12px',
                fontWeight: '700', cursor: 'pointer'
              }}
            >
              + Nueva Observacion
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
        padding: '12px 24px', display: 'flex', gap: '12px'
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

      {/* TABLERO */}
      <div style={{ padding: '20px 24px', overflowX: 'auto' }}>
        <div style={{ display: 'flex', gap: '14px', minWidth: 'max-content' }}>
          {COLUMNAS.map(col => (
            <div key={col.id} style={{ width: '280px' }}>
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
                minHeight: '400px', padding: '8px',
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
                        borderTop: `3px solid ${COLORES_AREA[obs.area_responsable?.codigo] || '#ccc'}`,
                        cursor: 'pointer',
                        boxShadow: obsSeleccionada?.id === obs.id ? '0 0 0 2px #3b82f6' : 'none',
                        transition: 'all 0.2s'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                        <span style={{ fontSize: '10px', fontWeight: '700', color: '#b0bdd4', textTransform: 'uppercase' }}>
                          {obs.codigo}
                        </span>
                        <span style={{
                          fontSize: '10px', fontWeight: '700', padding: '1px 6px', borderRadius: '4px',
                          background: obs.severidad === 'critica' ? '#fee2e2' : obs.severidad === 'mayor' ? '#fef3c7' : '#dbeafe',
                          color: obs.severidad === 'critica' ? '#c0392b' : obs.severidad === 'mayor' ? '#b45309' : '#1a6fb5'
                        }}>
                          {obs.severidad === 'critica' ? 'No Conformidad' : obs.severidad === 'mayor' ? 'Observacion' : 'Oportunidad de Mejora'}
                        </span>
                      </div>
                      <div style={{
                        fontSize: '11px', fontWeight: '700', textTransform: 'uppercase',
                        color: COLORES_AREA[obs.area_responsable?.codigo] || '#666',
                        marginBottom: '5px'
                      }}>
                        {obs.area_responsable?.nombre}
                      </div>
                      <p style={{ fontSize: '13px', fontWeight: '600', color: '#1a2234', lineHeight: '1.35', margin: 0 }}>
                        {obs.titulo}
                      </p>
                      {obs.porcentaje_avance > 0 && (
                        <div style={{ marginTop: '8px' }}>
                          <div style={{ height: '4px', background: '#e8edf5', borderRadius: '4px', overflow: 'hidden' }}>
                            <div style={{
                              height: '100%', borderRadius: '4px',
                              background: COLORES_AREA[obs.area_responsable?.codigo] || '#3b82f6',
                              width: `${obs.porcentaje_avance}%`
                            }} />
                          </div>
                        </div>
                      )}
                      {esCalidad && (
                        <button
                          onClick={e => {
                            e.stopPropagation()
                            if (window.confirm('Eliminar esta observacion?')) {
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
                          🗑️ Eliminar
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
          obs={obsSeleccionada}
          usuarioId={usuario?.id}
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
          usuarioId={usuario?.id}
          onClose={() => setMostrarModal(false)}
          onCreada={() => cargarDatos()}
        />
      )}

    </div>
  )
}