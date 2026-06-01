import type { Auditoria } from '../types'

interface Props {
  auditorias: Auditoria[]
  auditoriaId: string
  onChange: (id: string) => void
  tema?: 'claro' | 'oscuro'
}

// Etiqueta visible de cada auditoría: nombre → fecha → id como fallback.
function etiqueta(a: Auditoria): string {
  if (a.nombre) return a.nombre
  if (a.created_at) {
    const f = new Date(a.created_at)
    if (!isNaN(f.getTime())) {
      return `Auditoría ${f.toLocaleDateString('es-PE', { month: 'short', year: 'numeric' })}`
    }
  }
  return `Auditoría ${a.id.slice(0, 8)}`
}

const TEMAS = {
  claro: { bg: '#ffffff', color: '#1a2234', border: '1px solid #d0d7e2' },
  oscuro: { bg: '#1a2234', color: '#e8edf5', border: '1px solid #33415c' },
} as const

export default function SelectorAuditoria({ auditorias, auditoriaId, onChange, tema = 'claro' }: Props) {
  const estilo = TEMAS[tema]

  // Con una sola auditoría no hay nada que elegir; mostrar solo su nombre.
  if (auditorias.length <= 1) {
    const unica = auditorias[0]
    if (!unica) return null
    return (
      <span style={{
        fontSize: '12px', fontWeight: 700, color: estilo.color,
        opacity: 0.85, whiteSpace: 'nowrap',
      }}>
        {etiqueta(unica)}{unica.activa ? ' • actual' : ''}
      </span>
    )
  }

  return (
    <select
      value={auditoriaId}
      onChange={e => onChange(e.target.value)}
      title="Cambiar de auditoría"
      style={{
        background: estilo.bg,
        color: estilo.color,
        border: estilo.border,
        borderRadius: '7px',
        padding: '6px 10px',
        fontSize: '12px',
        fontWeight: 700,
        fontFamily: 'inherit',
        cursor: 'pointer',
        maxWidth: '240px',
      }}
    >
      {auditorias.map(a => (
        <option key={a.id} value={a.id}>
          {etiqueta(a)}{a.activa ? ' • actual' : ''}
        </option>
      ))}
    </select>
  )
}
