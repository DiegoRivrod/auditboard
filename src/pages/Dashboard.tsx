import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend,
  PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'

const TIPOS = ['No Conforme', 'Observacion', 'Oportunidad de Mejora']
const COLORES_TIPO: Record<string, string> = {
  'No Conforme': '#ef4444',
  'Observacion': '#f59e0b',
  'Oportunidad de Mejora': '#3b82f6',
}
const COLORES_PIE = ['#ef4444', '#f59e0b', '#3b82f6', '#10b981']
const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

interface Observacion {
  tipo: string
  estado: string
  created_at: string
  area_responsable_id: string
  areas: { nombre: string }[] | null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [obs, setObs] = useState<Observacion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('observaciones')
        .select('tipo, estado, created_at, area_responsable_id, areas(nombre)')
      if (!error && data) setObs(data as Observacion[])
      setLoading(false)
    }
    fetchData()
  }, [])

  // --- Datos por tipo (pie) ---
  const porTipo = TIPOS.map(t => ({
    name: t,
    value: obs.filter(o => o.tipo === t).length
  })).filter(d => d.value > 0)

  // --- Datos por área y tipo (barras apiladas) ---
  const areas = [...new Set(obs.map(o => o.areas?.[0]?.nombre).filter(Boolean))] as string[]
  const porArea = areas.map(area => {
    const row: Record<string, string | number> = { area }
    TIPOS.forEach(t => {
      row[t] = obs.filter(o => o.areas?.[0]?.nombre === area && o.tipo === t).length
    })
    return row
  })

  // --- Datos por mes (año actual) ---
  const anio = new Date().getFullYear()
  const porMes = MESES.map((mes, i) => {
    const row: Record<string, string | number> = { mes }
    TIPOS.forEach(t => {
      row[t] = obs.filter(o => {
        const d = new Date(o.created_at)
        return d.getFullYear() === anio && d.getMonth() === i && o.tipo === t
      }).length
    })
    return row
  })

  // --- Totales resumen ---
  const total = obs.length
  const porEstado = {
    sinFecha: obs.filter(o => o.estado === 'SIN_FECHA').length,
    ejecucion: obs.filter(o => o.estado === 'EN_EJECUCION').length,
    verificacion: obs.filter(o => o.estado === 'EN_VERIFICACION').length,
    levantada: obs.filter(o => o.estado === 'LEVANTADA').length,
  }

  if (loading) return (
    <div className="flex items-center justify-center h-screen bg-gray-900 text-white">
      Cargando dashboard...
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-900 text-white p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-lg">
            <span className="text-xl">📊</span>
          </div>
          <div>
            <h1 className="text-2xl font-bold">Dashboard</h1>
            <p className="text-gray-400 text-sm">Resumen de observaciones {anio}</p>
          </div>
        </div>
        <button
          onClick={() => navigate('/tablero')}
          className="bg-gray-700 hover:bg-gray-600 px-4 py-2 rounded-lg text-sm transition"
        >
          ← Volver al Tablero
        </button>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        {[
          { label: 'Total', value: total, color: 'bg-gray-700' },
          { label: 'Sin Fecha', value: porEstado.sinFecha, color: 'bg-red-900' },
          { label: 'En Ejecución', value: porEstado.ejecucion, color: 'bg-blue-900' },
          { label: 'En Verificación', value: porEstado.verificacion, color: 'bg-purple-900' },
          { label: 'Levantadas', value: porEstado.levantada, color: 'bg-green-900' },
        ].map(card => (
          <div key={card.label} className={`${card.color} rounded-xl p-4 text-center`}>
            <div className="text-3xl font-bold">{card.value}</div>
            <div className="text-gray-300 text-sm mt-1">{card.label}</div>
          </div>
        ))}
      </div>

      {/* Gráficos fila 1 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* Pie por tipo */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Distribución por Tipo</h2>
          <ResponsiveContainer width="100%" height={260}>
            <PieChart>
                <Pie data={porTipo} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={90} label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}>
                {porTipo.map((_, i) => (
                  <Cell key={i} fill={COLORES_PIE[i % COLORES_PIE.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Barras por área */}
        <div className="bg-gray-800 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-4">Por Área y Tipo</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={porArea}>
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
              <XAxis dataKey="area" tick={{ fill: '#9ca3af', fontSize: 12 }} />
              <YAxis tick={{ fill: '#9ca3af' }} allowDecimals={false} />
              <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
              <Legend />
              {TIPOS.map(t => (
                <Bar key={t} dataKey={t} stackId="a" fill={COLORES_TIPO[t]} />
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Gráfico por mes */}
      <div className="bg-gray-800 rounded-xl p-5">
        <h2 className="text-lg font-semibold mb-4">Observaciones por Mes — {anio}</h2>
        <ResponsiveContainer width="100%" height={280}>
          <BarChart data={porMes}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis dataKey="mes" tick={{ fill: '#9ca3af' }} />
            <YAxis tick={{ fill: '#9ca3af' }} allowDecimals={false} />
            <Tooltip contentStyle={{ backgroundColor: '#1f2937', border: 'none' }} />
            <Legend />
            {TIPOS.map(t => (
              <Bar key={t} dataKey={t} stackId="a" fill={COLORES_TIPO[t]} />
            ))}
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}