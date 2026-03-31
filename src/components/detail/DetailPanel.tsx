import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  obs: any
  usuarioId: string
  esCalidad?: boolean
  onClose: () => void
  onActualizada: () => void
}

const COLORES_AREA: Record<string, string> = {
  CALIDAD: '#c0392b',
  PRODUCCION: '#1a6fb5',
  'LOGISTICA Y ALMACEN': '#d97706',
  MANTENIMIENTO: '#16a34a',
}

const ESTADOS = [
  { id: 'sin_fecha', label: 'Sin Fecha', color: '#ef4444' },
  { id: 'fecha_comprometida', label: 'Fecha Comprometida', color: '#f59e0b' },
  { id: 'en_ejecucion', label: 'En Ejecucion', color: '#3b82f6' },
  { id: 'en_verificacion', label: 'En Verificacion', color: '#8b5cf6' },
  { id: 'levantada', label: 'Levantada', color: '#22c55e' },
]

function formatFecha(fecha: string) {
  const d = new Date(fecha)
  return d.toLocaleDateString('es-PE', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

function getLabelEstado(estado: string) {
  const e = ESTADOS.find(e => e.id === estado)
  return e?.label || estado
}

function getColorEstado(estado: string) {
  const e = ESTADOS.find(e => e.id === estado)
  return e?.color || '#666'
}

const TIPOS = ['estructura', 'maquinaria', 'producto', 'documentacion', 'seguridad']
const SEVERIDADES = [
  { id: 'critica', label: 'No Conformidad', bg: '#fee2e2', color: '#c0392b' },
  { id: 'mayor', label: 'Observacion', bg: '#fef3c7', color: '#b45309' },
  { id: 'menor', label: 'Oportunidad de Mejora', bg: '#dbeafe', color: '#1a6fb5' },
]

export default function DetailPanel({ obs, usuarioId, esCalidad, onClose, onActualizada }: Props) {
  const [estado, setEstado] = useState(obs.estado)
  const [porcentaje, setPorcentaje] = useState(obs.porcentaje_avance)
  const [fechaInicio, setFechaInicio] = useState(obs.fecha_inicio_comprometida || '')
  const [fechaCierre, setFechaCierre] = useState(obs.fecha_cierre_estimada || '')
  const [comentario, setComentario] = useState('')
  const [loading, setLoading] = useState(false)
  const [guardado, setGuardado] = useState(false)
  const [historial, setHistorial] = useState<any[]>([])

  // Campos editables solo para Calidad
  const [titulo, setTitulo] = useState(obs.titulo || '')
  const [descripcion, setDescripcion] = useState(obs.descripcion || '')
  const [accionRequerida, setAccionRequerida] = useState(obs.accion_requerida || '')
  const [tipo, setTipo] = useState(obs.tipo || '')
  const [severidad, setSeveridad] = useState(obs.severidad || '')
  const [ubicacion, setUbicacion] = useState(obs.ubicacion || '')
  const [areaId, setAreaId] = useState(obs.area_responsable_id || '')
  const [subareaId, setSubareaId] = useState(obs.subarea_id || '')
  const [areas, setAreas] = useState<any[]>([])
  const [subareas, setSubareas] = useState<any[]>([])

  useEffect(() => {
    cargarHistorial()
  }, [obs.id])

  useEffect(() => {
    if (esCalidad) cargarAreas()
  }, [esCalidad])

  useEffect(() => {
    if (esCalidad && areaId) cargarSubareas(areaId)
  }, [areaId, esCalidad])

  async function cargarAreas() {
    const { data } = await supabase.from('areas').select('*')
    setAreas(data || [])
  }

  async function cargarSubareas(id: string) {
    const { data } = await supabase.from('subareas').select('*').eq('area_id', id)
    setSubareas(data || [])
    // Si el area cambió y la subarea actual no pertenece a ella, resetear
    if (id !== obs.area_responsable_id) {
      setSubareaId(data && data.length > 0 ? data[0].id : '')
    }
  }

  async function cargarHistorial() {
    const { data } = await supabase
      .from('actualizaciones')
      .select('*, usuario:perfiles(nombre_completo, area:areas(codigo))')
      .eq('observacion_id', obs.id)
      .order('created_at', { ascending: true })
    setHistorial(data || [])
  }

  async function handleGuardar() {
    setLoading(true)

    const { error } = await supabase
      .from('observaciones')
      .update({
        estado,
        porcentaje_avance: porcentaje,
        fecha_inicio_comprometida: fechaInicio || null,
        fecha_cierre_estimada: fechaCierre || null,
        ...(estado === 'levantada' && { fecha_cierre_real: new Date().toISOString() }),
        ...(esCalidad && {
          titulo,
          descripcion: descripcion || null,
          accion_requerida: accionRequerida || null,
          tipo,
          severidad,
          ubicacion: ubicacion || null,
          area_responsable_id: areaId,
          subarea_id: subareaId || null,
        }),
      })
      .eq('id', obs.id)

    if (error) {
      alert('Error al guardar: ' + error.message)
      setLoading(false)
      return
    }

    await supabase
      .from('actualizaciones')
      .insert({
        observacion_id: obs.id,
        usuario_id: usuarioId,
        tipo: 'cambio_estado',
        contenido: comentario || null,
        estado_anterior: obs.estado,
        estado_nuevo: estado,
        porcentaje_anterior: obs.porcentaje_avance,
        porcentaje_nuevo: porcentaje,
      })

    setLoading(false)
    setGuardado(true)
    setTimeout(() => {
      setGuardado(false)
      onActualizada()
      onClose()
    }, 1000)
  }

  const areaSeleccionada = esCalidad ? areas.find(a => a.id === areaId) : obs.area_responsable
  const colorArea = COLORES_AREA[areaSeleccionada?.codigo] || '#666'

  const inputStyle = {
    width: '100%', padding: '9px 12px',
    background: '#f7f9fc', border: '1px solid #e2e8f0',
    borderRadius: '7px', fontSize: '13px',
    fontFamily: 'system-ui, sans-serif',
    color: '#1a2234', outline: 'none',
    boxSizing: 'border-box' as const
  }

  const labelStyle = {
    display: 'block' as const,
    fontSize: '11px', fontWeight: '700' as const,
    textTransform: 'uppercase' as const,
    letterSpacing: '0.5px', color: '#7a8aaa',
    marginBottom: '5px'
  }

  return (
    <div style={{
      position: 'fixed', top: 0, right: 0, bottom: 0,
      width: '420px', background: 'white',
      borderLeft: '1px solid #e2e8f0',
      boxShadow: '-8px 0 32px rgba(0,0,0,0.1)',
      zIndex: 200, overflowY: 'auto',
      fontFamily: 'system-ui, sans-serif',
      display: 'flex', flexDirection: 'column'
    }}>

      {/* CABECERA */}
      <div style={{
        padding: '20px 22px 16px',
        borderBottom: '1px solid #e2e8f0',
        position: 'sticky', top: 0,
        background: 'white', zIndex: 10
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div style={{ flex: 1, paddingRight: '12px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '11px', fontWeight: '700', color: '#b0bdd4', textTransform: 'uppercase' }}>
                {obs.codigo}
              </span>
              <span style={{
                fontSize: '10px', fontWeight: '700', padding: '2px 8px', borderRadius: '4px',
                background: severidad === 'critica' ? '#fee2e2' : severidad === 'mayor' ? '#fef3c7' : '#dbeafe',
                color: severidad === 'critica' ? '#c0392b' : severidad === 'mayor' ? '#b45309' : '#1a6fb5'
              }}>
                {severidad === 'critica' ? 'No Conformidad' : severidad === 'mayor' ? 'Observacion' : 'Oportunidad de Mejora'}
              </span>
            </div>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a2234', lineHeight: '1.3' }}>
              {titulo}
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '30px', height: '30px', borderRadius: '7px',
            background: '#f7f9fc', border: '1px solid #e2e8f0',
            fontSize: '18px', cursor: 'pointer', color: '#7a8aaa',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0
          }}>x</button>
        </div>

        {/* Area y Subarea */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px', flexWrap: 'wrap' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: '6px',
            padding: '4px 10px', borderRadius: '6px',
            border: '1px solid ' + colorArea + '40',
            background: colorArea + '15'
          }}>
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: colorArea }} />
            <span style={{ fontSize: '12px', fontWeight: '700', color: colorArea }}>
              {areaSeleccionada?.nombre || obs.area_responsable?.nombre}
            </span>
          </div>
          {obs.subarea && (
            <div style={{
              display: 'inline-flex', alignItems: 'center', gap: '6px',
              padding: '4px 10px', borderRadius: '6px',
              border: '1px solid #e2e8f0', background: '#f7f9fc'
            }}>
              <span style={{ fontSize: '12px', fontWeight: '600', color: '#7a8aaa' }}>
                📍 {obs.subarea.nombre}
              </span>
            </div>
          )}
        </div>
      </div>

      {/* CUERPO */}
      <div style={{ padding: '20px 22px', flex: 1 }}>

        {esCalidad ? (
          <>
            <div style={{
              background: '#fff8f0', border: '1px solid #fde68a',
              borderRadius: '8px', padding: '12px 14px', marginBottom: '16px'
            }}>
              <div style={{ fontSize: '11px', fontWeight: '700', color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '10px' }}>
                Edicion — Solo Calidad
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>Area Responsable</label>
                  <select value={areaId} onChange={e => setAreaId(e.target.value)} style={inputStyle}>
                    {areas.map(a => (
                      <option key={a.id} value={a.id}>{a.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Subarea</label>
                  <select value={subareaId} onChange={e => setSubareaId(e.target.value)} style={inputStyle} disabled={subareas.length === 0}>
                    {subareas.length === 0
                      ? <option value="">Sin subareas</option>
                      : subareas.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)
                    }
                  </select>
                </div>
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Titulo</label>
                <input value={titulo} onChange={e => setTitulo(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Descripcion</label>
                <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)}
                  style={{ ...inputStyle, minHeight: '70px', resize: 'vertical' as const }} />
              </div>

              <div style={{ marginBottom: '12px' }}>
                <label style={labelStyle}>Accion Requerida</label>
                <input value={accionRequerida} onChange={e => setAccionRequerida(e.target.value)} style={inputStyle} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' }}>
                <div>
                  <label style={labelStyle}>Tipo</label>
                  <select value={tipo} onChange={e => setTipo(e.target.value)} style={inputStyle}>
                    {TIPOS.map(t => (
                      <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={labelStyle}>Severidad</label>
                  <select value={severidad} onChange={e => setSeveridad(e.target.value)} style={inputStyle}>
                    {SEVERIDADES.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={labelStyle}>Ubicacion / Zona</label>
                <input value={ubicacion} onChange={e => setUbicacion(e.target.value)} style={inputStyle} placeholder="Ej: Línea 3, Almacén Norte..." />
              </div>
            </div>
          </>
        ) : (
          <>
            {obs.descripcion && (
              <div style={{ marginBottom: '16px' }}>
                <div style={labelStyle}>Descripcion</div>
                <p style={{ fontSize: '13px', color: '#4a5568', lineHeight: '1.5', margin: 0 }}>
                  {obs.descripcion}
                </p>
              </div>
            )}
            {obs.accion_requerida && (
              <div style={{ marginBottom: '16px' }}>
                <div style={labelStyle}>Accion Requerida</div>
                <div style={{
                  background: '#fffbeb', border: '1px solid #fde68a',
                  borderRadius: '8px', padding: '10px 12px',
                  fontSize: '13px', color: '#92400e'
                }}>
                  {obs.accion_requerida}
                </div>
              </div>
            )}
          </>
        )}

        <div style={{ height: '1px', background: '#e2e8f0', margin: '4px 0 16px' }} />

        <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#b0bdd4', marginBottom: '14px' }}>
          Respuesta del Area
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
          <div>
            <label style={labelStyle}>Fecha de inicio</label>
            <input type="date" value={fechaInicio} onChange={e => setFechaInicio(e.target.value)} style={inputStyle} />
          </div>
          <div>
            <label style={labelStyle}>Fecha cierre est.</label>
            <input type="date" value={fechaCierre} onChange={e => setFechaCierre(e.target.value)} style={inputStyle} />
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Avance — {porcentaje}%</label>
          <input type="range" min="0" max="100" step="5" value={porcentaje}
            onChange={e => setPorcentaje(Number(e.target.value))}
            style={{ width: '100%' }} />
          <div style={{ height: '6px', background: '#e8edf5', borderRadius: '6px', marginTop: '6px', overflow: 'hidden' }}>
            <div style={{ height: '100%', borderRadius: '6px', background: colorArea, width: porcentaje + '%', transition: 'width 0.3s ease' }} />
          </div>
        </div>

        <div style={{ marginBottom: '14px' }}>
          <label style={labelStyle}>Estado actual</label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {ESTADOS.map(e => (
              <div key={e.id} onClick={() => setEstado(e.id)} style={{
                padding: '9px 12px', borderRadius: '8px', cursor: 'pointer',
                fontSize: '13px', fontWeight: '600',
                border: '2px solid ' + (estado === e.id ? e.color : '#e2e8f0'),
                background: estado === e.id ? e.color + '15' : '#f7f9fc',
                color: estado === e.id ? e.color : '#7a8aaa',
                display: 'flex', alignItems: 'center', gap: '8px'
              }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: estado === e.id ? e.color : '#d1d9e6' }} />
                {e.label}
              </div>
            ))}
          </div>
        </div>

        <div style={{ marginBottom: '16px' }}>
          <label style={labelStyle}>Comentario</label>
          <textarea value={comentario} onChange={e => setComentario(e.target.value)}
            placeholder="Describe el avance, materiales, bloqueos..."
            style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }} />
        </div>

        <button onClick={handleGuardar} disabled={loading || guardado} style={{
          width: '100%', padding: '12px',
          background: guardado ? '#22c55e' : loading ? '#999' : colorArea,
          color: 'white', border: 'none', borderRadius: '8px',
          fontSize: '14px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
          transition: 'background 0.3s'
        }}>
          {guardado ? 'Guardado exitosamente' : loading ? 'Guardando...' : esCalidad ? 'Guardar Cambios' : 'Guardar y Notificar a Calidad'}
        </button>

        {/* HISTORIAL */}
        <div style={{ marginTop: '28px' }}>
          <div style={{ height: '1px', background: '#e2e8f0', marginBottom: '16px' }} />
          <div style={{ fontSize: '12px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px', color: '#b0bdd4', marginBottom: '16px' }}>
            Historial de Actividad
          </div>

          {historial.length === 0 ? (
            <div style={{ color: '#c0cce0', fontSize: '12px', textAlign: 'center', padding: '20px 0' }}>
              Sin actividad registrada aun
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {historial.map((item, idx) => {
                const colorUsuario = COLORES_AREA[item.usuario?.area?.codigo] || '#666'
                const esUltimo = idx === historial.length - 1
                return (
                  <div key={item.id} style={{ display: 'flex', gap: '12px', paddingBottom: esUltimo ? '0' : '16px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '28px', flexShrink: 0 }}>
                      <div style={{
                        width: '10px', height: '10px', borderRadius: '50%',
                        background: item.estado_nuevo ? getColorEstado(item.estado_nuevo) : colorUsuario,
                        flexShrink: 0, marginTop: '3px'
                      }} />
                      {!esUltimo && (
                        <div style={{ width: '2px', flex: 1, background: '#e2e8f0', marginTop: '4px' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '12.5px', fontWeight: '600', color: '#1a2234', marginBottom: '2px' }}>
                        {item.estado_nuevo ? (
                          <>
                            Estado cambiado a{' '}
                            <span style={{ color: getColorEstado(item.estado_nuevo), fontWeight: '700' }}>
                              {getLabelEstado(item.estado_nuevo)}
                            </span>
                            {item.porcentaje_nuevo !== null && item.porcentaje_nuevo !== undefined && (
                              <span style={{ color: '#7a8aaa' }}> — {item.porcentaje_nuevo}% avance</span>
                            )}
                          </>
                        ) : (
                          'Actualizacion registrada'
                        )}
                      </div>
                      {item.contenido && (
                        <div style={{
                          fontSize: '12px', color: '#4a5568',
                          background: '#f7f9fc', border: '1px solid #e2e8f0',
                          borderRadius: '6px', padding: '7px 10px',
                          marginTop: '5px', lineHeight: '1.4'
                        }}>
                          {item.contenido}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', color: '#b0bdd4', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <span style={{ fontWeight: '600', color: colorUsuario }}>
                          {item.usuario?.nombre_completo || 'Usuario'}
                        </span>
                        <span>·</span>
                        <span>{formatFecha(item.created_at)}</span>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}