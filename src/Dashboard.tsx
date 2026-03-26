import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'

const SEVERIDADES = ['No Conformidad', 'Observacion', 'Oportunidad de Mejora']
const COLORES_SEV: Record<string, string> = {
  'No Conformidad': '#ef4444',
  'Observacion': '#f59e0b',
  'Oportunidad de Mejora': '#3b82f6',
}
const COLORES_PIE = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

interface ObsData {
  tipo: string
  severidad: string
  estado: string
  created_at: string
  area_responsable: { nombre: string }[] | null
  subarea: { nombre: string }[] | null
}

function getSevLabel(sev: string) {
  if (sev === 'critica') return 'No Conformidad'
  if (sev === 'mayor') return 'Observacion'
  return 'Oportunidad de Mejora'
}

function getAreaNombre(obs: ObsData): string {
  if (!obs.area_responsable) return ''
  if (Array.isArray(obs.area_responsable)) return obs.area_responsable[0]?.nombre || ''
  return (obs.area_responsable as any)?.nombre || ''
}

function getSubareaNombre(obs: ObsData): string {
  if (!obs.subarea) return ''
  if (Array.isArray(obs.subarea)) return obs.subarea[0]?.nombre || ''
  return (obs.subarea as any)?.nombre || ''
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [obs, setObs] = useState<ObsData[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('observaciones')
        .select(`
          tipo, severidad, estado, created_at,
          area_responsable:areas(nombre),
          subarea:subareas(nombre)
        `)
      if (!error && data) setObs(data as unknown as ObsData[])
      setLoading(false)
    }
    fetchData()
  }, [])

  const porSeveridad = SEVERIDADES.map(s => ({
    name: s,
    value: obs.filter(o => getSevLabel(o.severidad) === s).length
  })).filter(d => d.value > 0)

  const areas = [...new Set(obs.map(o => getAreaNombre(o)).filter(Boolean))]
  const porArea = areas.map(area => {
    const row: Record<string, string | number> = { area }
    SEVERIDADES.forEach(s => {
      row[s] = obs.filter(o => getAreaNombre(o) === area && getSevLabel(o.severidad) === s).length
    })
    return row
  })

  const subareas = [...new Set(obs.map(o => getSubareaNombre(o)).filter(Boolean))]
  const porSubarea = subareas.map(sub => {
    const row: Record<string, string | number> = { subarea: sub }
    SEVERIDADES.forEach(s => {
      row[s] = obs.filter(o => getSubareaNombre(o) === sub && getSevLabel(o.severidad) === s).length
    })
    return row
  })

  const anio = new Date().getFullYear()
  const porMes = MESES.map((mes, i) => {
    const row: Record<string, string | number> = { mes }
    SEVERIDADES.forEach(s => {
      row[s] = obs.filter(o => {
        const d = new Date(o.created_at)
        return d.getFullYear() === anio && d.getMonth() === i && getSevLabel(o.severidad) === s
      }).length
    })
    return row
  })

  const total = obs.length
  const porEstado = {
    sinFecha: obs.filter(o => o.estado === 'sin_fecha').length,
    ejecucion: obs.filter(o => o.estado === 'en_ejecucion').length,
    verificacion: obs.filter(o => o.estado === 'en_verificacion').length,
    levantada: obs.filter(o => o.estado === 'levantada').length,
  }

  if (loading) return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      height: '100vh', background: '#111827', color: 'white',
      fontFamily: 'system-ui, sans-serif'
    }}>
      Cargando dashboard...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#111827', color: 'white', padding: '24px', fontFamily: 'system-ui, sans-serif' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '28px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ background: '#c0392b', padding: '8px', borderRadius: '10px', fontSize: '20px' }}>📊</div>
          <div>
            <h1 style={{ fontSize: '22px', fontWeight: '800', margin: 0 }}>Dashboard de Auditorias</h1>
            <p style={{ color: '#9ca3af', fontSize: '13px', margin: 0 }}>Resumen y tendencias {anio}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/tablero')}
          style={{
            background: '#374151', border: 'none', color: 'white',
            padding: '8px 16px', borderRadius: '8px', fontSize: '13px',
            cursor: 'pointer', fontFamily: 'system-ui, sans-serif'
          }}
        >
          ← Volver al Tablero
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '28px' }}>
        {[
          { label: 'Total', value: total, bg: '#374151' },
          { label: 'Sin Fecha', value: porEstado.sinFecha, bg: '#7f1d1d' },
          { label: 'En Ejecucion', value: porEstado.ejecucion, bg: '#1e3a5f' },
          { label: 'Levantadas', value: porEstado.levantada, bg: '#14532d' },
        ].map(card => (
          <div key={card.label} style={{
            background: card.bg, borderRadius: '12px',
            padding: '16px', textAlign: 'center'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '800' }}>{card.value}</div>
            <div style={{ color: '#d1d5db', fontSize: '12px', marginTop: '4px' }}>{card.label}</div>
          </div>
        ))}
      </div>

      {/* Fila 1 — Pie + Por Area */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
        <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', marginTop: 0 }}>
            Distribucion por Tipo
          </h2>
          {porSeveridad.length === 0 ? (
            <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>
              Sin datos aun
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <PieChart>
                <Pie
                  data={porSeveridad}
                  dataKey="value"
                  nameKey="name"
                  cx="50%" cy="50%"
                  outerRadius={85}
                  label={({ percent }) => `${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  {porSeveridad.map((_, i) => (
                    <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', marginTop: 0 }}>
            Por Area
          </h2>
          {porArea.length === 0 ? (
            <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>
              Sin datos aun
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={porArea}>
                <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
                <XAxis dataKey="area" tick={{ fill: '#9ca3af', fontSize: 11 }} />
                <YAxis tick={{ fill: '#9ca3af' }} allowDecimals={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
                <Legend />
                {SEVERIDADES.map(s => (
                  <Bar key={s} dataKey={s} stackId="a" fill={COLORES_SEV[s]} />
                ))}
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Fila 2 — Por Subarea */}
      <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', marginTop: 0 }}>
          Detalle por Subarea
        </h2>
        {porSubarea.length === 0 ? (
          <div style={{ color: '#6b7280', textAlign: 'center', padding: '40px 0', fontSize: '13px' }}>
            Sin datos de subarea aun
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porSubarea}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="subarea" tick={{ fill: '#9ca3af', fontSize: 11 }} />
              <YAxis tick={{ fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
              <Legend />
              {SEVERIDADES.map(s => (
                <Bar key={s} dataKey={s} stackId="a" fill={COLORES_SEV[s]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Fila 3 — Historico por mes */}
      <div style={{ background: '#1f2937', borderRadius: '12px', padding: '20px' }}>
        <h2 style={{ fontSize: '15px', fontWeight: '700', marginBottom: '16px', marginTop: 0 }}>
          Historico Mensual — {anio}
        </h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={porMes}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="mes" tick={{ fill: '#9ca3af' }} />
            <YAxis tick={{ fill: '#9ca3af' }} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
            <Legend />
            {SEVERIDADES.map(s => (
              <Bar key={s} dataKey={s} stackId="a" fill={COLORES_SEV[s]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>

    </div>
  )
}