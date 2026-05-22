import { useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate } from 'react-router-dom'
import { ToastContainer } from 'react-toastify'
import 'react-toastify/dist/ReactToastify.css'
import Login from './pages/Login'
import Tablero from './pages/Tablero'
import Dashboard from './pages/Dashboard'
import DemoBanner from './components/ui/DemoBanner'
import { supabase } from './lib/supabase'
import { IS_DEMO } from './lib/env'

// Listener global: si la sesión se cierra (token expirado, signOut en otra pestaña)
// forzar redirect a /login.
function AuthListener() {
  const navigate = useNavigate()
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') navigate('/login')
    })
    return () => subscription.unsubscribe()
  }, [navigate])
  return null
}

function App() {
  return (
    <BrowserRouter>
      <AuthListener />
      {IS_DEMO && <DemoBanner />}
      <ToastContainer position="top-right" theme="dark" />
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/tablero" element={<Tablero />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App