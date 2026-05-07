import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Tablero from './pages/Tablero'
import Dashboard from './pages/Dashboard'
import DemoBanner from './components/ui/DemoBanner'

function App() {
  return (
    <BrowserRouter>
      {import.meta.env.VITE_DEMO_MODE === 'true' && <DemoBanner />}
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