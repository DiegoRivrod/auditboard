// Colores por área — usado en Tablero, Dashboard, DetailPanel
export const COLORES_AREA: Record<string, string> = {
  CALIDAD: '#c0392b',
  PRODUCCION: '#1a6fb5',
  'LOGISTICA Y ALMACEN': '#d97706',
  MANTENIMIENTO: '#16a34a',
}

// Tipos de observacion — usado en DetailPanel y NuevaObsModal
export const TIPOS = [
  'estructura',
  'maquinaria',
  'producto',
  'documentacion',
  'seguridad',
  'limpieza',
] as const

// Severidades con info de display — usado en Tablero, Dashboard, DetailPanel, NuevaObsModal
export const SEVERIDADES = [
  { id: 'critica',  label: 'No Conformidad',       bg: '#fee2e2', color: '#c0392b' },
  { id: 'mayor',   label: 'Observacion',           bg: '#fef3c7', color: '#b45309' },
  { id: 'menor',   label: 'Oportunidad de Mejora', bg: '#dbeafe', color: '#1a6fb5' },
] as const

// Estilos de formulario compartidos — usado en DetailPanel y NuevaObsModal
export const inputStyle = {
  width: '100%', padding: '9px 12px',
  background: '#f7f9fc', border: '1px solid #e2e8f0',
  borderRadius: '7px', fontSize: '13px',
  fontFamily: 'system-ui, sans-serif',
  color: '#1a2234', outline: 'none',
  boxSizing: 'border-box' as const,
}

export const labelStyle = {
  display: 'block' as const,
  fontSize: '11px', fontWeight: '700' as const,
  textTransform: 'uppercase' as const,
  letterSpacing: '0.5px', color: '#7a8aaa',
  marginBottom: '5px',
}
