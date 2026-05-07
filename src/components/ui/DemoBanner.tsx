/**
 * Banner fijo en la parte inferior que indica al visitante que está en modo demo.
 * Solo se renderiza cuando VITE_DEMO_MODE=true.
 */
import { useState } from 'react'

export default function DemoBanner() {
  const [visible, setVisible] = useState(true)
  if (!visible) return null

  return (
    <div style={{
      position: 'fixed',
      bottom: 0, left: 0, right: 0,
      zIndex: 9999,
      background: 'linear-gradient(90deg, #1a2234 0%, #1e2d45 100%)',
      borderTop: '2px solid #c0392b',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '10px 24px',
      fontFamily: 'system-ui, sans-serif',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.3)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <span style={{
          background: '#c0392b', color: 'white',
          fontSize: '10px', fontWeight: '800',
          padding: '2px 8px', borderRadius: '4px',
          letterSpacing: '0.8px', textTransform: 'uppercase',
        }}>
          DEMO
        </span>
        <span style={{ color: 'rgba(255,255,255,0.75)', fontSize: '13px' }}>
          Datos ficticios para demostración — los cambios realizados no se guardan.
        </span>
      </div>
      <button
        onClick={() => setVisible(false)}
        style={{
          background: 'transparent',
          border: '1px solid rgba(255,255,255,0.2)',
          color: 'rgba(255,255,255,0.5)',
          borderRadius: '6px',
          padding: '4px 12px',
          fontSize: '12px',
          cursor: 'pointer',
          flexShrink: 0,
        }}
      >
        Cerrar
      </button>
    </div>
  )
}
