import { useCallback, useEffect, useState } from 'react'
import { toast } from 'react-toastify'
import { supabase } from '../../lib/supabase'
import { TIPOS, SEVERIDADES, inputStyle, labelStyle } from '../../constants'
import type { Area, Subarea } from '../../types'

interface Props {
  auditoriaId: string
  usuarioId: string
  onClose: () => void
  onCreada: () => void
}

export default function NuevaObsModal({ auditoriaId, usuarioId, onClose, onCreada }: Props) {
  const [areas, setAreas] = useState<Area[]>([])
  const [subareas, setSubareas] = useState<Subarea[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    tipo: 'maquinaria',
    severidad: 'mayor',
    titulo: '',
    descripcion: '',
    accion_requerida: '',
    ubicacion: '',
    area_responsable_id: '',
    subarea_id: '',
    fecha_inicio: '',
    fecha_cierre: '',
  })

  const cargarAreas = useCallback(async () => {
    const { data, error } = await supabase
      .from('areas')
      .select('*')
    if (error) console.error('NuevaObsModal cargarAreas:', error)
    setAreas(data || [])
    if (data && data.length > 0) {
      setForm(f => ({ ...f, area_responsable_id: data[0].id }))
    }
  }, [])

  const cargarSubareas = useCallback(async (areaId: string) => {
    const { data, error } = await supabase
      .from('subareas')
      .select('*')
      .eq('area_id', areaId)
    if (error) console.error('NuevaObsModal cargarSubareas:', error)
    setSubareas(data || [])
    if (data && data.length > 0) {
      setForm(f => ({ ...f, subarea_id: data[0].id }))
    } else {
      setForm(f => ({ ...f, subarea_id: '' }))
    }
  }, [])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    cargarAreas()
  }, [cargarAreas])

  useEffect(() => {
    if (form.area_responsable_id) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      cargarSubareas(form.area_responsable_id)
    }
  }, [form.area_responsable_id, cargarSubareas])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo || !form.area_responsable_id) return
    if (!auditoriaId) {
      toast.error('No hay una auditoría activa. Contacta al administrador.')
      return
    }
    setLoading(true)

    // Generación atómica del código via RPC (evita race condition)
    const { data: codigo, error: errCodigo } = await supabase.rpc('generar_codigo_observacion')
    if (errCodigo || !codigo) {
      toast.error('Error al generar el código de observación')
      console.error('rpc generar_codigo_observacion:', errCodigo)
      setLoading(false)
      return
    }

    const { error } = await supabase
      .from('observaciones')
      .insert({
        tipo: form.tipo,
        severidad: form.severidad,
        titulo: form.titulo,
        descripcion: form.descripcion,
        accion_requerida: form.accion_requerida,
        ubicacion: form.ubicacion,
        area_responsable_id: form.area_responsable_id,
        subarea_id: form.subarea_id || null,
        codigo,
        auditoria_id: auditoriaId,
        creado_por: usuarioId,
        estado: 'sin_fecha',
        porcentaje_avance: 0,
        fecha_inicio_comprometida: form.fecha_inicio || null,
        fecha_cierre_estimada: form.fecha_cierre || null,
      })

    if (error) {
      toast.error('Error al crear la observación: ' + error.message)
      setLoading(false)
      return
    }

    // TODO: notificación al jefe de área pendiente de implementar.
    // Requiere columna `email` en `perfiles` o lectura de auth.users via RPC.

    setLoading(false)
    onCreada()
    onClose()
  }

  return (
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(10,20,40,0.5)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      zIndex: 500, fontFamily: 'system-ui, sans-serif'
    }} onClick={e => e.target === e.currentTarget && onClose()}>

      <div style={{
        background: 'white', borderRadius: '16px',
        width: '540px', maxHeight: '85vh',
        overflowY: 'auto', boxShadow: '0 30px 80px rgba(0,0,0,0.25)'
      }}>

        <div style={{
          padding: '22px 24px 16px',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start'
        }}>
          <div>
            <div style={{ fontSize: '20px', fontWeight: '800', color: '#1a2234' }}>
              Nueva Observación
            </div>
            <div style={{ fontSize: '12px', color: '#7a8aaa', marginTop: '2px' }}>
              Auditoría General 2026
            </div>
          </div>
          <button onClick={onClose} style={{
            width: '30px', height: '30px', borderRadius: '7px',
            background: '#f7f9fc', border: '1px solid #e2e8f0',
            fontSize: '18px', cursor: 'pointer', color: '#7a8aaa',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>x</button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: '20px 24px 24px' }}>

          {/* Area y Subarea */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Área Responsable *</label>
              <select
                value={form.area_responsable_id}
                onChange={e => setForm(f => ({ ...f, area_responsable_id: e.target.value }))}
                style={inputStyle}
                required
              >
                {areas.map(a => (
                  <option key={a.id} value={a.id}>{a.nombre}</option>
                ))}
              </select>
            </div>
            <div>
              <label style={labelStyle}>Subárea</label>
              <select
                value={form.subarea_id}
                onChange={e => setForm(f => ({ ...f, subarea_id: e.target.value }))}
                style={inputStyle}
              >
                {subareas.map(s => (
                  <option key={s.id} value={s.id}>{s.nombre}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Tipo */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Tipo *</label>
            <select
              value={form.tipo}
              onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
              style={inputStyle}
            >
              {TIPOS.map(t => (
                <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
              ))}
            </select>
          </div>

          {/* Severidad */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Severidad *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {SEVERIDADES.map(s => (
                <div
                  key={s.id}
                  onClick={() => setForm(f => ({ ...f, severidad: s.id }))}
                  style={{
                    flex: 1, padding: '8px', textAlign: 'center',
                    borderRadius: '7px', cursor: 'pointer', fontSize: '11px', fontWeight: '700',
                    background: form.severidad === s.id ? s.bg : '#f7f9fc',
                    color: form.severidad === s.id ? s.color : '#7a8aaa',
                    border: `2px solid ${form.severidad === s.id ? s.color : '#e2e8f0'}`,
                    transition: 'all 0.15s'
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          {/* Titulo */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Título de la observación *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Describe brevemente el hallazgo..."
              style={inputStyle}
              required
            />
          </div>

          {/* Descripcion */}
          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Descripción detallada</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Detalla el problema encontrado, evidencias, riesgos..."
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }}
            />
          </div>

          {/* Accion y Ubicacion */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Acción requerida</label>
              <input
                type="text"
                value={form.accion_requerida}
                onChange={e => setForm(f => ({ ...f, accion_requerida: e.target.value }))}
                placeholder="Qué debe hacer el área..."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Ubicación / Zona</label>
              <input
                type="text"
                value={form.ubicacion}
                onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))}
                placeholder="Ej: Línea 2, Zona B..."
                style={inputStyle}
              />
            </div>
          </div>

          {/* Fechas */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Fecha de Inicio</label>
              <input
                type="date"
                value={form.fecha_inicio}
                onChange={e => setForm(f => ({ ...f, fecha_inicio: e.target.value }))}
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Fecha de Cierre</label>
              <input
                type="date"
                value={form.fecha_cierre}
                onChange={e => setForm(f => ({ ...f, fecha_cierre: e.target.value }))}
                style={inputStyle}
              />
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: '10px' }}>
            <button type="button" onClick={onClose} style={{
              flex: 1, padding: '11px', borderRadius: '8px',
              background: '#f7f9fc', border: '1px solid #e2e8f0',
              fontSize: '13px', fontWeight: '600', cursor: 'pointer', color: '#7a8aaa'
            }}>
              Cancelar
            </button>
            <button type="submit" disabled={loading} style={{
              flex: 2, padding: '11px', borderRadius: '8px',
              background: loading ? '#999' : '#c0392b',
              border: 'none', color: 'white',
              fontSize: '13px', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer'
            }}>
              {loading ? 'Registrando...' : 'Registrar y Notificar al Área'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}