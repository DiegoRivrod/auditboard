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
        ctx.fillStyle = '#e2e8f0'
        ctx.font = 'bold 11px system-ui'
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
        ctx.fillStyle = '#e2e8f0'
        ctx.font = 'bold 10px system-ui'
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
      ctx.font = 'bold 13px system-ui'
      ctx.textAlign = 'center'
      ctx.textBaseline = 'middle'
      ctx.fillText(`${value}`, x, y - 8)
      ctx.font = '11px system-ui'
      ctx.fillText(`${pct}%`, x, y + 8)
      ctx.restore()
    })
  }
}

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
      borderColor: '#1a2234',
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

  const opcionesBar = {
    responsive: true,
    plugins: {
      legend: { labels: { color: '#cbd5e1' } },
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
      x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#2d3748' } },
      y: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#2d3748' }, beginAtZero: true },
    }
  }

  const opcionesBarHorizontal = {
    responsive: true,
    indexAxis: 'y' as const,
    plugins: {
      legend: { labels: { color: '#cbd5e1' } },
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
      x: { stacked: true, ticks: { color: '#94a3b8' }, grid: { color: '#2d3748' }, beginAtZero: true },
      y: { stacked: true, ticks: { color: '#94a3b8', font: { size: 11 } }, grid: { color: '#2d3748' } },
    }
  }

  const opcionesPie = {
    responsive: true,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: { color: '#cbd5e1', padding: 16 }
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
          {estados.map(e => {
            const cnt = obs.filter(o => o.estado === e).length
            const pct = total > 0 ? ((cnt / total) * 100).toFixed(0) : '0'
            return (
              <div key={e} style={{
                background: '#1a2234', border: '1px solid #2d3748', borderRadius: '12px',
                padding: '16px 20px', textAlign: 'center', minWidth: '110px', flex: 1
              }}>
                <div style={{ fontSize: '28px', fontWeight: '800', color: 'white' }}>{cnt}</div>
                <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '2px', textTransform: 'uppercase' }}>
                  {ESTADO_LABEL[e]}
                </div>
                <div style={{ fontSize: '11px', color: '#64748b', marginTop: '4px' }}>{pct}%</div>
              </div>
            )
          })}
        </div>

        {/* TARJETAS SEVERIDAD */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '24px', flexWrap: 'wrap' }}>
          {SEVERIDADES.map(s => {
            const cnt = obs.filter(o => o.severidad === s).length
            const pct = total > 0 ? ((cnt / total) * 100).toFixed(1) : '0'
            return (
              <div key={s} style={{
                flex: 1, background: '#1a2234',
                border: `1px solid ${SEVERIDAD_COLOR[s]}40`,
                borderLeft: `4px solid ${SEVERIDAD_COLOR[s]}`,
                borderRadius: '12px', padding: '16px 20px',
                display: 'flex', alignItems: 'center', gap: '14px'
              }}>
                <div style={{ fontSize: '32px', fontWeight: '800', color: SEVERIDAD_COLOR[s] }}>{cnt}</div>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: 'white' }}>{SEVERIDAD_LABEL[s]}</div>
                  <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>{pct}% del total</div>
                </div>
              </div>
            )
          })}
        </div>

        {/* GRÁFICOS FILA 1: Pie + Por Área */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          <div style={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#e2e8f0' }}>
              Distribución por Tipo
            </h2>
            <div style={{ maxWidth: '300px', margin: '0 auto' }}>
              <Pie data={pieData} options={opcionesPie} plugins={[pluginEtiquetasPie]} />
            </div>
          </div>

          <div style={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: '12px', padding: '20px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#e2e8f0' }}>
              Por Área y Tipo
            </h2>
            <Bar data={barAreaData} options={opcionesBar} plugins={[crearPluginTotalesApilados(total)]} />
          </div>
        </div>

        {/* GRÁFICO POR MES */}
        <div style={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
          <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#e2e8f0' }}>
            Observaciones por Mes — {anio}
          </h2>
          <Bar data={barMesData} options={opcionesBar} plugins={[crearPluginTotalesApilados(total)]} />
        </div>

        {/* GRÁFICO POR SUBÁREA (horizontal) */}
        {subareas.length > 0 && (
          <div style={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: '12px', padding: '20px', marginBottom: '20px' }}>
            <h2 style={{ margin: '0 0 16px', fontSize: '14px', fontWeight: '700', color: '#e2e8f0' }}>
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
        <div style={{ background: '#1a2234', border: '1px solid #2d3748', borderRadius: '12px', padding: '20px' }}>
          <h2 style={{ margin: '0 0 20px', fontSize: '14px', fontWeight: '700', color: '#e2e8f0' }}>
            Avance de Levantamiento por Área y Subárea
          </h2>

          {areas.length === 0 && (
            <div style={{ color: '#64748b', fontSize: '13px', textAlign: 'center', padding: '20px 0' }}>
              Sin datos disponibles
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
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
                  background: '#0f1623', border: `1px solid ${colorArea}30`,
                  borderRadius: '10px', padding: '16px', borderLeft: `4px solid ${colorArea}`
                }}>
                  {/* Fila del área */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: subareasDeArea.length > 0 ? '14px' : '0' }}>
                    <div style={{ minWidth: '130px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '800', color: colorArea, textTransform: 'uppercase', letterSpacing: '0.4px' }}>
                        {area}
                      </div>
                      <div style={{ fontSize: '10px', color: '#64748b', marginTop: '2px' }}>
                        {obsArea.length} obs ({obsGlobPct}% del total)
                      </div>
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ height: '10px', background: '#2d3748', borderRadius: '6px', overflow: 'hidden' }}>
                        <div style={{
                          height: '100%', borderRadius: '6px',
                          background: pctArea === 100 ? '#22c55e' : pctArea >= 50 ? colorArea : colorArea + '99',
                          width: `${pctArea}%`,
                          transition: 'width 0.4s ease'
                        }} />
                      </div>
                    </div>
                    <div style={{ minWidth: '90px', textAlign: 'right' }}>
                      <span style={{ fontSize: '18px', fontWeight: '800', color: pctArea === 100 ? '#22c55e' : 'white' }}>
                        {pctArea.toFixed(0)}%
                      </span>
                      <span style={{ fontSize: '11px', color: '#64748b', marginLeft: '6px' }}>
                        {levArea}/{obsArea.length}
                      </span>
                    </div>
                  </div>

                  {/* Subareas */}
                  {subareasDeArea.length > 0 && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', paddingLeft: '12px', borderLeft: '1px solid #2d3748' }}>
                      {subareasDeArea.map(sub => {
                        const obsSub = obsArea.filter(o => o.subarea?.nombre === sub)
                        const levSub = obsSub.filter(o => o.estado === 'levantada').length
                        const pctSub = obsSub.length > 0 ? (levSub / obsSub.length * 100) : 0

                        return (
                          <div key={sub} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ minWidth: '130px' }}>
                              <div style={{ fontSize: '11px', color: '#94a3b8', fontWeight: '600' }}>
                                ↳ {sub}
                              </div>
                              <div style={{ fontSize: '10px', color: '#475569' }}>
                                {obsSub.length} observaciones
                              </div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ height: '6px', background: '#2d3748', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', borderRadius: '4px',
                                  background: pctSub === 100 ? '#22c55e' : colorArea + 'bb',
                                  width: `${pctSub}%`,
                                  transition: 'width 0.4s ease'
                                }} />
                              </div>
                            </div>
                            <div style={{ minWidth: '80px', textAlign: 'right' }}>
                              <span style={{ fontSize: '14px', fontWeight: '700', color: pctSub === 100 ? '#22c55e' : '#cbd5e1' }}>
                                {pctSub.toFixed(0)}%
                              </span>
                              <span style={{ fontSize: '10px', color: '#64748b', marginLeft: '5px' }}>
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
                            <div style={{ minWidth: '130px' }}>
                              <div style={{ fontSize: '11px', color: '#475569', fontStyle: 'italic' }}>
                                ↳ Sin subárea
                              </div>
                              <div style={{ fontSize: '10px', color: '#334155' }}>
                                {obsSinSub.length} observaciones
                              </div>
                            </div>
                            <div style={{ flex: 1 }}>
                              <div style={{ height: '6px', background: '#2d3748', borderRadius: '4px', overflow: 'hidden' }}>
                                <div style={{
                                  height: '100%', borderRadius: '4px',
                                  background: pctSinSub === 100 ? '#22c55e' : '#475569',
                                  width: `${pctSinSub}%`
                                }} />
                              </div>
                            </div>
                            <div style={{ minWidth: '80px', textAlign: 'right' }}>
                              <span style={{ fontSize: '14px', fontWeight: '700', color: '#64748b' }}>
                                {pctSinSub.toFixed(0)}%
                              </span>
                              <span style={{ fontSize: '10px', color: '#475569', marginLeft: '5px' }}>
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
