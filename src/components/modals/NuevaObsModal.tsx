import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'

interface Props {
  auditoriaId: string
  usuarioId: string
  onClose: () => void
  onCreada: () => void
}

export default function NuevaObsModal({ auditoriaId, usuarioId, onClose, onCreada }: Props) {
  const [areas, setAreas] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({
    tipo: 'maquinaria',
    severidad: 'mayor',
    titulo: '',
    descripcion: '',
    accion_requerida: '',
    ubicacion: '',
    area_responsable_id: '',
  })

  useEffect(() => {
    cargarAreas()
  }, [])

  async function cargarAreas() {
    const { data } = await supabase
      .from('areas')
      .select('*')
      .neq('codigo', 'CALIDAD')
    setAreas(data || [])
    if (data && data.length > 0) {
      setForm(f => ({ ...f, area_responsable_id: data[0].id }))
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.titulo || !form.area_responsable_id) return
    setLoading(true)

    const { count } = await supabase
      .from('observaciones')
      .select('*', { count: 'exact', head: true })

    const year = new Date().getFullYear()
    const codigo = `OBS-${year}-${String((count || 0) + 1).padStart(3, '0')}`

    const { error } = await supabase
      .from('observaciones')
      .insert({
        ...form,
        codigo,
        auditoria_id: auditoriaId,
        creado_por: usuarioId,
        estado: 'sin_fecha',
        porcentaje_avance: 0,
      })

    if (error) {
      alert('Error al crear la observacion: ' + error.message)
      setLoading(false)
      return
    }

    console.log('Observacion creada, buscando perfil del area...')

    const { data: perfil, error: errorPerfil } = await supabase
      .from('perfiles')
      .select('*, area:areas(*)')
      .eq('area_id', form.area_responsable_id)
      .eq('rol', 'jefe')
      .single()

    console.log('Perfil encontrado:', perfil)
    console.log('Error perfil:', errorPerfil)

    if (perfil) {
      console.log('Llamando Edge Function...')
      const { data: respuesta, error: errorFn } = await supabase.functions.invoke('rapid-task', {
        body: {
          destinatario: 'diego.rivera.182@gmail.com',
          nombreDestinatario: perfil.nombre_completo,
          codigoObs: codigo,
          tituloObs: form.titulo,
          areaResponsable: perfil.area?.nombre,
        }
      })
      console.log('Respuesta Edge Function:', respuesta)
      console.log('Error Edge Function:', errorFn)
    } else {
      console.log('No se encontro perfil para el area seleccionada')
    }

    setLoading(false)
    onCreada()
    onClose()
  }

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
              Nueva Observacion
            </div>
            <div style={{ fontSize: '12px', color: '#7a8aaa', marginTop: '2px' }}>
              Auditoria General Marzo 2026
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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '14px' }}>
            <div>
              <label style={labelStyle}>Area Responsable *</label>
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
              <label style={labelStyle}>Tipo *</label>
              <select
                value={form.tipo}
                onChange={e => setForm(f => ({ ...f, tipo: e.target.value }))}
                style={inputStyle}
              >
                <option value="estructura">Estructura / Instalacion</option>
                <option value="maquinaria">Maquinaria / Equipo</option>
                <option value="producto">Producto / Proceso</option>
                <option value="documentacion">Documentacion</option>
                <option value="seguridad">Seguridad</option>
              </select>
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Severidad *</label>
            <div style={{ display: 'flex', gap: '8px' }}>
              {[
                { val: 'critica', label: 'No Conformidad', bg: '#fee2e2', color: '#c0392b' },
                { val: 'mayor', label: 'Observacion', bg: '#fef3c7', color: '#b45309' },
                { val: 'menor', label: 'Oportunidad de Mejora', bg: '#dbeafe', color: '#1a6fb5' },
              ].map(s => (
                <div
                  key={s.val}
                  onClick={() => setForm(f => ({ ...f, severidad: s.val }))}
                  style={{
                    flex: 1, padding: '8px', textAlign: 'center',
                    borderRadius: '7px', cursor: 'pointer', fontSize: '12px', fontWeight: '700',
                    background: form.severidad === s.val ? s.bg : '#f7f9fc',
                    color: form.severidad === s.val ? s.color : '#7a8aaa',
                    border: `2px solid ${form.severidad === s.val ? s.color : '#e2e8f0'}`,
                    transition: 'all 0.15s'
                  }}
                >
                  {s.label}
                </div>
              ))}
            </div>
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Titulo de la observacion *</label>
            <input
              type="text"
              value={form.titulo}
              onChange={e => setForm(f => ({ ...f, titulo: e.target.value }))}
              placeholder="Describe brevemente el hallazgo..."
              style={inputStyle}
              required
            />
          </div>

          <div style={{ marginBottom: '14px' }}>
            <label style={labelStyle}>Descripcion detallada</label>
            <textarea
              value={form.descripcion}
              onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))}
              placeholder="Detalla el problema encontrado, evidencias, riesgos..."
              style={{ ...inputStyle, minHeight: '80px', resize: 'vertical' as const }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
            <div>
              <label style={labelStyle}>Accion requerida</label>
              <input
                type="text"
                value={form.accion_requerida}
                onChange={e => setForm(f => ({ ...f, accion_requerida: e.target.value }))}
                placeholder="Que debe hacer el area..."
                style={inputStyle}
              />
            </div>
            <div>
              <label style={labelStyle}>Ubicacion / Zona</label>
              <input
                type="text"
                value={form.ubicacion}
                onChange={e => setForm(f => ({ ...f, ubicacion: e.target.value }))}
                placeholder="Ej: Linea 2, Zona B..."
                style={inputStyle}
              />
            </div>
          </div>

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
              {loading ? 'Registrando...' : 'Registrar y Notificar al Area'}
            </button>
          </div>

        </form>
      </div>
    </div>
  )
}