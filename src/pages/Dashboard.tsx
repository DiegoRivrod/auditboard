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

const COLORES_AREA: Record<string, string> = {
  CALIDAD: '#c0392b',
  PRODUCCION: '#1a6fb5',
  'LOGISTICA Y ALMACEN': '#d97706',
  MANTENIMIENTO: '#16a34a',
}

interface Observacion {
  severidad: string
  estado: string
  created_at: string
  area_responsable: { nombre: string; codigo: string } | null
  subarea: { nombre: string } | null
}

// Plugin: etiquetas encima de cada barra apilada (total de la pila + % del total general)
function crearPluginTotalesApilados(totalGeneral: number) {
  return {
    id: 'totalesApilados',
    afterDraw(chart: any) {
      const ctx = chart.ctx
      const dataCount = chart.data.labels?.length || 0
      for (let i = 0; i < dataCount; i++) {
        let sumaPila = 0
        let topeY = Infinity
        let centroX = 0
        chart.data.datasets.forEach((_: any, dsIdx: number) => {
          const meta = chart.getDatasetMeta(dsIdx)
          if (meta.hidden) return
          const barra = meta.data[i]
          if (!barra) return
          const val = (chart.data.datasets[dsIdx].data[i] as number) || 0
          sumaPila += val
          centroX = barra.x
          if (barra.y < topeY) topeY = barra.y
        })
        if (sumaPila === 0 || topeY === Infinity) continue
        const pct = totalGeneral > 0 ? ((sumaPila / totalGeneral) * 100).toFixed(1) : '0'
        ctx.save()
        ctx.fillStyle = '#e2e2f0'
        ctx.font = '500 11px "DM Mono", monospace'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(`${sumaPila} (${pct}%)`, centroX, topeY - 3)
        ctx.restore()
      }
    }
  }
}

// Plugin: etiquetas al final de cada barra apilada horizontal
function crearPluginTotalesHorizontal(totalGeneral: number) {
  return {
    id: 'totalesHorizontal',
    afterDraw(chart: any) {
      const ctx = chart.ctx
      const dataCount = chart.data.labels?.length || 0
      for (let i = 0; i < dataCount; i++) {
        let sumaPila = 0
        let bordeX = -Infinity
        let centroY = 0
        chart.data.datasets.forEach((_: any, dsIdx: number) => {
          const meta = chart.getDatasetMeta(dsIdx)
          if (meta.hidden) return
          const barra = meta.data[i]
          if (!barra) return
          const val = (chart.data.datasets[dsIdx].data[i] as number) || 0
          sumaPila += val
          centroY = barra.y
          if (barra.x > bordeX) bordeX = barra.x
        })
        if (sumaPila === 0 || bordeX === -Infinity) continue
        const pct = totalGeneral > 0 ? ((sumaPila / totalGeneral) * 100).toFixed(1) : '0'
        ctx.save()
        ctx.fillStyle = '#e2e2f0'
        ctx.font = '500 10px "DM Mono", monospace'
        ctx.textAlign = 'left'
        ctx.textBaseline = 'middle'
        ctx.fillText(`${sumaPila} (${pct}%)`, bordeX + 5, centroY)
        ctx.restore()
      }
    }
  }
}

// Plugin: etiquetas dentro/encima de cada slice del Pie
const pluginEtiquetasPie = {
  id: 'etiquetasPie',
  afterDraw(chart: any) {
    const ctx = chart.ctx
    const meta = chart.getDatasetMeta(0)
    const dataArr = chart.data.datasets[0].data as number[]
    const dataTotal = dataArr.reduce((a: number, b: number) => a + b, 0)
    meta.data.forEach((arc: any, index: number) => {
      const value = dataArr[index]
      if (value === 0) return
      const pct = dataTotal > 0 ? ((value / dataTotal) * 100).toFixed(1) : '0'
      const { x, y } = arc.tooltipPosition(false)
      ctx.save()
      ctx.shadowColor = 'rgba(0,0,0,0.7)'
      ctx.shadowBlur = 4
      ctx.fillStyle = 'white'
      ctx.font = '500 13px "DM Mono", monospace'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${value}`, x, y - 8)
      ctx.font = '400 11px "DM Mono", monospace'
      ctx.fillText(`${pct}%`, x, y + 8)
      ctx.restore()
    })
  }
}

const MONO = "'DM Mono', monospace"
const DISPLAY = "'Syne', sans-serif"

export default function Dashboard() {
  const navigate = useNavigate()
  const [obs, setObs] = useState<Observacion[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      const { data, error } = await supabase
        .from('observaciones')
        .select('severidad, estado, created_at, area_responsable:areas!area_responsable_id(nombre, codigo), subarea:subareas(nombre)')

      if (error) {
        console.log('ERROR:', error)
        toast.error('Error al cargar los datos')
      } else if (data) {
        setObs(data as unknown as Observacion[])
        toast.success(`${data.length} observaciones cargadas`)
      }
      setLoading(false)
    }
    fetchData()
  }, [])

  const anio = new Date().getFullYear()
  const SEVERIDADES = ['critica', 'mayor', 'menor']
  const total = obs.length
  const estados = Object.keys(ESTADO_LABEL)

  const areas = [...new Set(obs.map(o => o.area_responsable?.nombre).filter(Boolean))] as string[]
  const subareas = [...new Set(obs.map(o => o.subarea?.nombre).filter(Boolean))] as string[]

  // --- Datos para gráficos ---

  const pieData = {
    labels: SEVERIDADES.map(s => SEVERIDAD_LABEL[s]),
    datasets: [{
      data: SEVERIDADES.map(s => obs.filter(o => o.severidad === s).length),
      backgroundColor: SEVERIDADES.map(s => SEVERIDAD_COLOR[s]),
      borderWidth: 2,
      borderColor: '#13131e',
    }]
  }

  const barAreaData = {
    labels: areas,
    datasets: SEVERIDADES.map(s => ({
      label: SEVERIDAD_LABEL[s],
      data: areas.map(a => obs.filter(o => o.area_responsable?.nombre === a && o.severidad === s).length),
      backgroundColor: SEVERIDAD_COLOR[s],
    }))
  }

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

  const barSubareaData = {
    labels: subareas,
    datasets: SEVERIDADES.map(s => ({
      label: SEVERIDAD_LABEL[s],
      data: subareas.map(sub => obs.filter(o => o.subarea?.nombre === sub && o.severidad === s).length),
      backgroundColor: SEVERIDAD_COLOR[s],
    }))
  }

  // --- Opciones de gráficos ---

  const monoFont = { family: MONO, size: 11 as number }

  const opcionesBar = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#e2e2f0', font: monoFont } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed.y ?? 0
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0'
            return `  ${ctx.dataset.label}: ${val} obs (${pct}% del total)`
          }
        }
      }
    },
    scales: {
      x: { stacked: true, ticks: { color: '#52526a', font: monoFont }, grid: { color: '#1e1e2e' } },
      y: { stacked: true, ticks: { color: '#52526a', font: monoFont }, grid: { color: '#1e1e2e' }, beginAtZero: true },
    }
  }

  const opcionesBarHorizontal = {
    responsive: true,
    indexAxis: 'y' as const,
    plugins: {
      legend: { labels: { color: '#e2e2f0', font: monoFont } },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed.x ?? 0
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0'
            return `  ${ctx.dataset.label}: ${val} obs (${pct}% del total)`
          }
        }
      }
    },
    scales: {
      x: { stacked: true, ticks: { color: '#52526a', font: monoFont }, grid: { color: '#1e1e2e' }, beginAtZero: true },
      y: { stacked: true, ticks: { color: '#52526a', font: { ...monoFont, size: 11 } }, grid: { color: '#1e1e2e' } },
    }
  }

  const opcionesPie = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#e2e2f0', padding: 16, font: monoFont }
      },
      tooltip: {
        callbacks: {
          label: (ctx: any) => {
            const val = ctx.parsed
            const pct = total > 0 ? ((val / total) * 100).toFixed(1) : '0'
            return `  ${val} observaciones — ${pct}% del total`
          }
        }
      }
    }
  }

  if (loading) return (
    <div style={{
      minHeight: '100vh',
      background: '#09090f',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      flexDirection: 'column', gap: '16px',
    }}>
      <style>{`
        @keyframes ambientPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #e8a020; }
          50%       { opacity: 0.3; box-shadow: 0 0 2px #e8a020; }
        }
      `}</style>
      <div style={{
        width: '10px', height: '10px', borderRadius: '50%',
        background: '#e8a020',
        animation: 'ambientPulse 1.4s ease-in-out infinite'
      }} />
      <span style={{
        fontFamily: MONO, fontSize: '11px',
        color: '#52526a', letterSpacing: '2.5px'
      }}>
        CARGANDO DATOS...
      </span>
    </div>
  )

  return (
    <div style={{
      minHeight: '100vh',
      background: 'radial-gradient(circle, #1e1e2e 1px, transparent 1px), #09090f',
      backgroundSize: '24px 24px',
      fontFamily: DISPLAY,
      color: '#e2e2f0'
    }}>
      <style>{`
        @keyframes fadeSlideUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes progressFill {
          from { width: 0%; }
          to   { width: var(--bar-width, 0%); }
        }

        .ab-kpi-card  { animation: fadeSlideUp 0.35s ease both; }
        .ab-kpi-0     { animation-delay: 0ms; }
        .ab-kpi-1     { animation-delay: 80ms; }
        .ab-kpi-2     { animation-delay: 160ms; }
        .ab-kpi-3     { animation-delay: 240ms; }
        .ab-kpi-4     { animation-delay: 320ms; }
        .ab-kpi-5     { animation-delay: 400ms; }

        .ab-chart-panel { animation: fadeSlideUp 0.4s ease both; }
        .ab-chart-0     { animation-delay: 180ms; }
        .ab-chart-1     { animation-delay: 270ms; }
        .ab-chart-2     { animation-delay: 360ms; }
        .ab-chart-3     { animation-delay: 450ms; }

        .ab-progress-bar {
          animation: progressFill 0.65s ease-out both;
          animation-delay: 0.35s;
        }

        .ab-header-btn:hover {
          background: rgba(232,160,32,0.1) !important;
          border-color: rgba(232,160,32,0.45) !important;
          color: #e8a020 !important;
        }

        .ab-sev-card {
          transition: box-shadow 0.2s ease;
        }
        .ab-sev-card:hover {
          box-shadow: 0 0 0 1px rgba(255,255,255,0.06), 0 6px 24px rgba(0,0,0,0.5);
        }
      `}</style>

      <ToastContainer position="top-right" theme="dark" />

      {/* HEADER */}
      <div style={{
        background: '#0f0f18',
        padding: '0 24px',
        height: '56px',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        position: 'sticky', top: 0, zIndex: 100,
        borderBottom: '2px solid #e8a020'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{
            width: '32px', height: '32px',
            background: '#13131e',
            border: '1px solid #e8a020',
            borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="1" width="14" height="14" stroke="#e8a020" strokeWidth="1.5" rx="1"/>
              <path d="M4 8l3 3 5-5" stroke="#e8a020" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <span style={{
            color: '#e2e2f0', fontWeight: '800', fontSize: '17px',
            fontFamily: DISPLAY, letterSpacing: '0.3px'
          }}>
            AuditBoard
          </span>
          <span style={{
            marginLeft: '6px',
            background: '#09090f',
            color: '#e8a020',
            border: '1px solid rgba(232,160,32,0.35)',
            fontSize: '10px', fontWeight: '500',
            padding: '2px 8px',
            borderRadius: '3px',
            letterSpacing: '1.2px',
            fontFamily: MONO
          }}>
            DASHBOARD {anio}
          </span>
        </div>
        <button
          onClick={() => navigate('/tablero')}
          className="ab-header-btn"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.09)',
            color: '#52526a',
            borderRadius: '3px',
            padding: '6px 14px',
            fontSize: '11px', fontWeight: '500',
            cursor: 'pointer',
            fontFamily: MONO,
            letterSpacing: '0.8px',
            transition: 'all 0.15s ease'
          }}
        >
          ← TABLERO
        </button>
      </div>

      <div style={{ padding: '24px' }}>

        {/* TARJETAS ESTADO */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <div className="ab-kpi-card ab-kpi-0" style={{
            background: '#13131e',
            border: '1px solid #1e1e2e',
            borderLeft: '3px solid #e8a020',
            borderRadius: '4px',
            padding: '16px 20px', textAlign: 'center', minWidth: '100px'
          }}>
            <div style={{ fontSize: '34px', fontWeight: '500', color: '#e8a020', fontFamily: MONO }}>
              {total}
            </div>
            <div style={{
              fontSize: '9px', color: '#52526a', marginTop: '4px',
              letterSpacing: '1.8px', fontFamily: MONO
            }}>
              TOTAL
            </div>
          </div>

          {estados.map((e, idx) => {
            const cnt = obs.filter(o => o.estado === e).length
            const pct = total > 0 ? ((cnt / total) * 100).toFixed(0) : '0'
            return (
              <div key={e} className={`ab-kpi-card ab-kpi-${idx + 1}`} style={{
                background: '#13131e',
                border: '1px solid #1e1e2e',
                borderLeft: '3px solid #1e1e2e',
                borderRadius: '4px',
                padding: '16px 20px', textAlign: 'center', minWidth: '100px', flex: 1
              }}>
                <div style={{ fontSize: '28px', fontWeight: '500', color: '#e2e2f0', fontFamily: MONO }}>
                  {cnt}
                </div>
                <div style={{
                  fontSize: '9px', color: '#52526a', marginTop: '2px',
                  textTransform: 'uppercase', letterSpacing: '0.8px',
                  fontFamily: MONO
                }}>
                  {ESTADO_LABEL[e]}
                </div>
                <div style={{
                  fontSize: '11px', color: '#52526a', marginTop: '4px',
                  fontFamily: MONO
                }}>
                  {pct}%
                </div>
              </div>
            )
          })}
        </div>

        {/* TARJETAS SEVERIDAD */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '20px', flexWrap: 'wrap' }}>
          {SEVERIDADES.map(s => {
            const cnt = obs.filter(o => o.severidad === s).length
            const pct = total > 0 ? ((cnt / total) * 100).toFixed(1) : '0'
            return (
              <div key={s} className="ab-sev-card" style={{
                flex: 1,
                background: '#13131e',
                border: `1px solid ${SEVERIDAD_COLOR[s]}28`,
                borderTop: `3px solid ${SEVERIDAD_COLOR[s]}`,
                borderRadius: '4px',
                padding: '16px 20px',
                display: 'flex', flexDirection: 'column', gap: '10px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{
                    fontSize: '34px', fontWeight: '500',
                    color: SEVERIDAD_COLOR[s], fontFamily: MONO
                  }}>
                    {cnt}
                  </div>
                  <div>
                    <div style={{
                      fontSize: '13px', fontWeight: '600',
                      color: '#e2e2f0', fontFamily: DISPLAY
                    }}>
                      {SEVERIDAD_LABEL[s]}
                    </div>
                    <div style={{
                      fontSize: '11px', color: '#52526a', marginTop: '2px',
                      fontFamily: MONO
                    }}>
                      {pct}% del total
                    </div>
                  </div>
                </div>
                <div style={{ height: '3px', background: '#1e1e2e', borderRadius: '2px', overflow: 'hidden' }}>
                  <div
                    className="ab-progress-bar"
                    style={{
                      height: '100%', borderRadius: '2px',
                      background: SEVERIDAD_COLOR[s],
                      '--bar-width': `${pct}%`,
                      width: `${pct}%`
                    } as React.CSSProperties}
                  />
                </div>
              </div>
            )
          })}
        </div>

        {/* GRÁFICOS FILA 1: Pie + Por Área */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
          <div className="ab-chart-panel ab-chart-0" style={{
            background: '#13131e', border: '1px solid #1e1e2e',
            borderRadius: '4px', padding: '20px'
          }}>
            <h2 style={{
              margin: '0 0 16px', fontSize: '11px', fontWeight: '800',
              color: '#e2e2f0', fontFamily: DISPLAY,
              letterSpacing: '1px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ color: '#e8a020', fontWeight: '400', fontSize: '14px' }}>▎</span>
              Distribución por Tipo
            </h2>
            <div style={{ maxWidth: '300px', margin: '0 auto' }}>
              <Pie data={pieData} options={opcionesPie} plugins={[pluginEtiquetasPie]} />
            </div>
          </div>

          <div className="ab-chart-panel ab-chart-1" style={{
            background: '#13131e', border: '1px solid #1e1e2e',
            borderRadius: '4px', padding: '20px'
          }}>
            <h2 style={{
              margin: '0 0 16px', fontSize: '11px', fontWeight: '800',
              color: '#e2e2f0', fontFamily: DISPLAY,
              letterSpacing: '1px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ color: '#e8a020', fontWeight: '400', fontSize: '14px' }}>▎</span>
              Por Área y Tipo
            </h2>
            <Bar data={barAreaData} options={opcionesBar} plugins={[crearPluginTotalesApilados(total)]} />
          </div>
        </div>

        {/* GRÁFICO POR MES */}
        <div className="ab-chart-panel ab-chart-2" style={{
          background: '#13131e', border: '1px solid #1e1e2e',
          borderRadius: '4px', padding: '20px', marginBottom: '16px'
        }}>
          <h2 style={{
            margin: '0 0 16px', fontSize: '11px', fontWeight: '800',
            color: '#e2e2f0', fontFamily: DISPLAY,
            letterSpacing: '1px', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span style={{ color: '#e8a020', fontWeight: '400', fontSize: '14px' }}>▎</span>
            Observaciones por Mes — {anio}
          </h2>
          <Bar data={barMesData} options={opcionesBar} plugins={[crearPluginTotalesApilados(total)]} />
        </div>

        {/* GRÁFICO POR SUBÁREA (horizontal) */}
        {subareas.length > 0 && (
          <div className="ab-chart-panel ab-chart-3" style={{
            background: '#13131e', border: '1px solid #1e1e2e',
            borderRadius: '4px', padding: '20px', marginBottom: '16px'
          }}>
            <h2 style={{
              margin: '0 0 16px', fontSize: '11px', fontWeight: '800',
              color: '#e2e2f0', fontFamily: DISPLAY,
              letterSpacing: '1px', textTransform: 'uppercase',
              display: 'flex', alignItems: 'center', gap: '8px'
            }}>
              <span style={{ color: '#e8a020', fontWeight: '400', fontSize: '14px' }}>▎</span>
              Por Subárea y Tipo
            </h2>
            <Bar
              data={barSubareaData}
              options={opcionesBarHorizontal}
              plugins={[crearPluginTotalesHorizontal(total)]}
            />
          </div>
        )}

        {/* INDICADOR DE LEVANTAMIENTO POR ÁREA Y SUBÁREA */}
        <div className="ab-chart-panel ab-chart-3" style={{
          background: '#13131e', border: '1px solid #1e1e2e',
          borderRadius: '4px', padding: '20px'
        }}>
          <h2 style={{
            margin: '0 0 20px', fontSize: '11px', fontWeight: '800',
            color: '#e2e2f0', fontFamily: DISPLAY,
            letterSpacing: '1px', textTransform: 'uppercase',
            display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span style={{ color: '#e8a020', fontWeight: '400', fontSize: '14px' }}>▎</span>
            Avance de Levantamiento por Área y Subárea
          </h2>

          {areas.length === 0 && (
            <div style={{
              color: '#52526a', fontSize: '11px', textAlign: 'center',
              padding: '20px 0', fontFamily: MONO, letterSpacing: '1.5px'
            }}>
              SIN DATOS DISPONIBLES
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {areas.map(area => {
              const obsArea = obs.filter(o => o.area_responsable?.nombre === area)
              const levArea = obsArea.filter(o => o.estado === 'levantada').length
              const pctArea = obsArea.length > 0 ? (levArea / obsArea.length * 100) : 0
              const areaCodigo = obsArea[0]?.area_responsable?.codigo || ''
              const colorArea = COLORES_AREA[areaCodigo] || '#64748b'
              const subareasDeArea = [...new Set(obsArea.map(o => o.subarea?.nombre).filter(Boolean))] as string[]
              const obsGlobPct = total > 0 ? ((obsArea.length / total) * 100).toFixed(1) : '0'

              return (
                <div key={area} style={{
                  background: '#0f0f18',
                  border: `1px solid ${colorArea}20`,
                  borderRadius: '4px',
                  padding: '16px',
                  borderLeft: `3px solid ${colorArea}`
                }}>
                  {/* Fila del área */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    marginBottom: subareasDeArea.length > 0 ? '14px' : '0'
                  }}>
                    <div style={{ minWidth: '140px' }}>
                      <div style={{
                        fontSize: '11px', fontWeight: '800', color: colorArea,
                        textTransform: 'uppercase', letterSpacing: '1px',
                        fontFamily: DISPLAY
                      }}>
                        {area}
                      </div>
                      <div style={{
                        fontSize: '10px', color: '#52526a', marginTop: '2px',
                        fontFamily: MONO
                      }}>
                        {obsArea.length} obs ({obsGlobPct}% del total)
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: '8px', background: '#1e1e2e', borderRadius: '2px', overflow: 'hidden' }}>
                        <div
                          className="ab-progress-bar"
                          style={{
                            height: '100%', borderRadius: '2px',
                            background: pctArea === 100 ? '#22c55e' : pctArea >= 50 ? colorArea : colorArea + '99',
                            '--bar-width': `${pctArea}%`,
                            width: `${pctArea}%`,
                          } as React.CSSProperties}
                        />
                      </div>
                    </div>
                    <div style={{ minWidth: '90px', textAlign: 'right' }}>
                      <span style={{
                        fontSize: '18px', fontWeight: '500',
                        color: pctArea === 100 ? '#22c55e' : '#e2e2f0',
                        fontFamily: MONO
                      }}>
                        {pctArea.toFixed(0)}%
                      </span>
                      <span style={{
                        fontSize: '11px', color: '#52526a', marginLeft: '6px',
                        fontFamily: MONO
                      }}>
                        {levArea}/{obsArea.length}
                      </span>
                    </div>
                  </div>

                  {/* Subareas */}
                  {subareasDeArea.length > 0 && (
                    <div style={{
                      display: 'flex', flexDirection: 'column', gap: '8px',
                      paddingLeft: '12px', borderLeft: '1px solid #1e1e2e'
                    }}>
                      {subareasDeArea.map(sub => {
                        const obsSub = obsArea.filter(o => o.subarea?.nombre === sub)
                        const levSub = obsSub.filter(o => o.estado === 'levantada').length
                        const pctSub = obsSub.length > 0 ? (levSub / obsSub.length * 100) : 0

                        return (
                          <div key={sub} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ minWidth: '140px' }}>
                              <div style={{
                                fontSize: '11px', color: '#52526a', fontWeight: '500',
                                fontFamily: MONO
                              }}>
                                ↳ {sub}
                              </div>
                              <div style={{ fontSize: '10px', color: '#52526a', fontFamily: MONO }}>
                                {obsSub.length} obs
                              </div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ height: '4px', background: '#1e1e2e', borderRadius: '2px', overflow: 'hidden' }}>
                                <div
                                  className="ab-progress-bar"
                                  style={{
                                    height: '100%', borderRadius: '2px',
                                    background: pctSub === 100 ? '#22c55e' : colorArea + 'bb',
                                    '--bar-width': `${pctSub}%`,
                                    width: `${pctSub}%`
                                  } as React.CSSProperties}
                                />
                              </div>
                            </div>
                            <div style={{ minWidth: '80px', textAlign: 'right' }}>
                              <span style={{
                                fontSize: '14px', fontWeight: '500',
                                color: pctSub === 100 ? '#22c55e' : '#94a3b8',
                                fontFamily: MONO
                              }}>
                                {pctSub.toFixed(0)}%
                              </span>
                              <span style={{
                                fontSize: '10px', color: '#52526a', marginLeft: '5px',
                                fontFamily: MONO
                              }}>
                                {levSub}/{obsSub.length}
                              </span>
                            </div>
                          </div>
                        )
                      })}

                      {/* Observaciones sin subárea asignada */}
                      {(() => {
                        const obsSinSub = obsArea.filter(o => !o.subarea?.nombre)
                        if (obsSinSub.length === 0) return null
                        const levSinSub = obsSinSub.filter(o => o.estado === 'levantada').length
                        const pctSinSub = obsSinSub.length > 0 ? (levSinSub / obsSinSub.length * 100) : 0
                        return (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ minWidth: '140px' }}>
                              <div style={{
                                fontSize: '11px', color: '#52526a',
                                fontStyle: 'italic', fontFamily: MONO
                              }}>
                                ↳ Sin subárea
                              </div>
                              <div style={{ fontSize: '10px', color: '#52526a', fontFamily: MONO }}>
                                {obsSinSub.length} obs
                              </div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ height: '4px', background: '#1e1e2e', borderRadius: '2px', overflow: 'hidden' }}>
                                <div
                                  className="ab-progress-bar"
                                  style={{
                                    height: '100%', borderRadius: '2px',
                                    background: pctSinSub === 100 ? '#22c55e' : '#475569',
                                    '--bar-width': `${pctSinSub}%`,
                                    width: `${pctSinSub}%`
                                  } as React.CSSProperties}
                                />
                              </div>
                            </div>
                            <div style={{ minWidth: '80px', textAlign: 'right' }}>
                              <span style={{
                                fontSize: '14px', fontWeight: '500',
                                color: '#52526a', fontFamily: MONO
                              }}>
                                {pctSinSub.toFixed(0)}%
                              </span>
                              <span style={{ fontSize: '10px', color: '#52526a', marginLeft: '5px', fontFamily: MONO }}>
                                {levSinSub}/{obsSinSub.length}
                              </span>
                            </div>
                          </div>
                        )
                      })()}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

      </div>
    </div>
  )
}
