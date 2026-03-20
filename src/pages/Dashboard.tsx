import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { ToastContainer, toast } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import {
  Chart as ChartJS,
  CategoryScale, LinearScale, BarElement,
  ArcElement, Tooltip, Legend, Title
} from 'chart.js'
import { Bar, Pie } from 'react-chartjs-2'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend, Title)

const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic']

const SEVERIDAD_LABEL: Record<string, string> = {
  critica: 'No Conformidad',
  mayor: 'Observacion',
  menor: 'Oportunidad de Mejora',
}

const SEVERIDAD_COLOR: Record<string, string> = {
  critica: '#ef4444',
  mayor: '#f59e0b',
  menor: '#3b82f6',
}

const ESTADO_LABEL: Record<string, string> = {
  sin_fecha: 'Sin Fecha',
  fecha_comprometida: 'Fecha Comprometida',
  en_ejecucion: 'En Ejecución',
  en_verificacion: 'En Verificación',
  levantada: 'Levantada',
}

interface Observacion {
  severidad: string
  estado: string
  created_at: string
  area_responsable: { nombre: string }[] | null
}

export default function Dashboard() {
  const navigate = useNavigate()
  const [obs, setObs] = useState<Observacion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('observaciones')
        .select('severidad, estado, created_at, area_responsable:areas(nombre)')

      if (error) {
        toast.error('Error al cargar los datos')
      } else if (data) {
        setObs(data as Observacion[])
        toast.success(`${data.length} observaciones cargadas`)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const anio = new Date().getFullYear()
  const SEVERIDADES = ['critica', 'mayor', 'menor']
  const areas = [...new Set(obs.map(o => o.area_responsable?.[0]?.nombre).filter(Boolean))] as string[]

  // --- PIE: por severidad ---
  const pieData = {
    labels: SEVERIDADES.map(s => SEVERIDAD_LABEL[s]),
    datasets: [{
      data: SEVERIDADES.map(s => obs.filter(o => o.severidad === s).length),
      backgroundColor: SEVERIDADES.map(s => SEVERIDAD_COLOR[s]),
      borderWidth: 2,
      borderColor: '#1a2234',
    }]
  }

  // --- BARRAS: por área y severidad ---
  const barAreaData = {
    labels: areas,
    datasets: SEVERIDADES.map(s => ({
      label: SEVERIDAD_LABEL[s],
      data: areas.map(a => obs.filter(o => o.area_responsable?.[0]?.nombre === a && o.severidad === s).length),
      backgroundColor: SEVERIDAD_COLOR[s],
    }))
  }

  // --- BARRAS: por mes ---
  const barMesData = {
    labels: MESES,
    datasets: SEVERIDADES.map(s => ({
      label: SEVERIDAD_LABEL[s],
      data: MESES.map((_, i) =>
        obs.filter(o => {
          const d = new Date(o.created_at)
          return d.getFullYear() === anio && d.getMonth() === i && o.severidad === s
        }).length
      ),
      backgroundColor: SEVERIDAD_COLOR[s],
    }))
  }

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#cbd5e1' } },
    },
    scales: {
      x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#2d3748' } },
      y: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#2d3748' }, beginAtZero: true },
    }
  }

  const pieOptions = {
    responsive: true,
    plugins: {
      legend: { position: 'bottom' as const, labels: { color: '#cbd5e1' } },
    }
  }

  const total = obs.length
  const estados = Object.keys(ESTADO_LABEL)

  if (loading) return (
    <div style={{
      minHeight: '100vh', background: '#0f1623',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif', fontSize: '14px', color: '#7a8aaa'
    }}>
      Cargando dashboard...
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0f1623', fontFamily: 'system-ui, sans-serif', color: 'white' }}>
      <ToastContainer position="top-right" theme="dark" />

      {/* HEADER */}
      <div style={{
        background: '#1a2234', padding: '0 24px', height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100, borderBottom: '1px solid #2d3748'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px', background: '#c0392b',
            borderRadius: '7px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', fontSize: '16px'
          }}>🔍</div>
          <span style={{ color: 'white', fontWeight: '800', fontSize: '18px' }}>AuditBoard</span>
          <span style={{
            marginLeft: '8px', background: '#1e3a5f', color: '#60a5fa',
            fontSize: '10px', fontWeight: '700', padding: '2px 8px',
            borderRadius: '20px', letterSpacing: '0.5px'
          }}>DASHBOARD {anio}</span>
        </div>
        <button
          onClick={() => navigate('/tablero')}
          style={{
            background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)',
            color: 'rgba(255,255,255,0.7)', borderRadius: '7px', padding: '6px 14px',
            fontSize: '12px', fontWeight: '700', cursor: 'pointer'
          }}
        >
          ← Volver al Tablero
        </button>
      </div>

      <div style={{ padding: '24px' }}>

        {/* TARJETAS ESTADO */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          <div style={{
            background: '#1a2234', border: '1px solid #2d3748', borderRadius: '12px',
            padding: '16px 20px', textAlign: 'center', minWidth: '110px'
          }}>
            <div style={{ fontSize: '32px', fontWeight: '800', color: 'white' }}>{total}</div>
            <div style={{ fontSize: '11px', color: '#94a3b8', marginTop: '4px' }}>TOTAL</div>
          </div>
          {estados.map(e => (
            <div key={e} style={{
              background: '#1a2234', border: '1px solid #2d3748', borderRadius: '12px',
              padding: '16px 20px', textAlign: 'center', minWidth: '110px', flex: 1
            }}>
              <div style={{ fontSize: '28px', fontWeight: '800', color: 'white' }}>
                {obs.filter(o => o.estado === e).length}
              </div>
              <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', textTransform: 'uppercase' }}>
                {ESTADO_LABEL[e]}
              </div>
            </div>
          ))}
        </div>

        {/* TARJETAS SEVERIDAD */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {SEVERIDADES.map(s => (
            <div key={s} style={{
              flex: 1, background: '#1a2234',
              border: `1px solid ${SEVERIDAD_COLOR[s]}40`,
              borderLeft: `4px solid ${SEVERIDAD_COLOR[s]}`,
              borderRadius: '12px', padding: '16px 20px',
              display: 'flex', alignItems: 'center', gap: '14px'
            }}>
              <div style={{ fontSize: '32px', fontWeight: '800', color: SEVERIDAD_COLOR[s] }}>
                {obs.filter(o => o.severidad === s).length}
              </div>
              <div>
                <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>
                  {SEVERIDAD_LABEL[s]}
                </div>
                <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px', textTransform: 'uppercase' }}>
                  {s}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* GRÁFICOS FILA 1 */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#e2e8f0' }}>
              Distribución por Tipo
            </h2>
            <div style={{ maxWidth: '300px', margin: '0 auto' }}>
              <Pie data={pieData} options={pieOptions} />
            </div>
          </div>

          <div style={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#e2e8f0' }}>
              Por Área y Tipo
            </h2>
            <Bar data={barAreaData} options={chartOptions} />
          </div>
        </div>

        {/* GRÁFICO POR MES */}
        <div style={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#e2e8f0' }}>
            Observaciones por Mes — {anio}
          </h2>
          <Bar data={barMesData} options={chartOptions} />
        </div>

      </div>
    </div>
  )
}