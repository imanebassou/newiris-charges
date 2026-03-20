import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Services from './pages/Services'
import ChargesFixes from './pages/ChargesFixes'
import PrivateRoute from './routes/PrivateRoute'

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route
        path="/dashboard"
        element={
          <PrivateRoute allowedRoles={['admin', 'others']}>
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <Users />
          </PrivateRoute>
        }
      />
      <Route
        path="/services"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <Services />
          </PrivateRoute>
        }
      />
      <Route
        path="/charges-fixes"
        element={
          <PrivateRoute allowedRoles={['admin']}>
            <ChargesFixes />
          </PrivateRoute>
        }
      />
      <Route
        path="/ajoute-charges"
        element={
          <PrivateRoute allowedRoles={['technicien']}>
            <div style={{ padding: '20px', color: '#1a3a6b', fontSize: '20px' }}>
              Ajoute des charges — en construction
            </div>
          </PrivateRoute>
        }
      />
      <Route path="/unauthorized" element={
        <div style={{ padding: '40px', textAlign: 'center', color: '#e84c3d', fontSize: '18px' }}>
          Accès non autorisé
        </div>
      } />
    </Routes>
  )
}

export default App