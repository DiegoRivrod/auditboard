import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

export default function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (error) {
      setError('Email o contrasena incorrectos')
    } else {
      navigate('/tablero')
    }
    setLoading(false)
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#0d1117',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontFamily: 'system-ui, sans-serif'
    }}>
      <div style={{
        background: 'white',
        borderRadius: '16px',
        padding: '40px',
        width: '380px',
        boxShadow: '0 25px 60px rgba(0,0,0,0.4)'
      }}>
        <div style={{ marginBottom: '28px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            marginBottom: '6px'
          }}>
            <div style={{
              width: '36px', height: '36px',
              background: '#c0392b',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '18px'
            }}>🔍</div>
            <span style={{ fontSize: '22px', fontWeight: '800', color: '#1a2234' }}>
              AuditBoard
            </span>
          </div>
          <p style={{ fontSize: '13px', color: '#7a8aaa', marginLeft: '46px' }}>
            Gestion de observaciones de auditoria
          </p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#7a8aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Correo
            </label>
            <input
              type="email"
              placeholder="correo@empresa.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
              style={{
                width: '100%', marginTop: '5px',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div>
            <label style={{ fontSize: '11px', fontWeight: '700', color: '#7a8aaa', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              Contrasena
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
              style={{
                width: '100%', marginTop: '5px',
                padding: '10px 12px',
                border: '1px solid #e2e8f0',
                borderRadius: '8px',
                fontSize: '14px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
          </div>

          {error && (
            <div style={{
              background: '#fef2f2',
              border: '1px solid #fecaca',
              borderRadius: '8px',
              padding: '10px 12px',
              fontSize: '13px',
              color: '#c0392b'
            }}>
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{
              background: loading ? '#999' : '#c0392b',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              padding: '12px',
              fontSize: '14px',
              fontWeight: '700',
              cursor: loading ? 'not-allowed' : 'pointer',
              marginTop: '4px'
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#b0bdd4', marginTop: '20px' }}>
          Sistema interno - Solo personal autorizado
        </p>
      </div>
    </div>
  )
}