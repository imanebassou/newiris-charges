import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
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
            <div style={{ padding: '20px', color: '#1a3a6b', fontSize: '20px' }}>
              Dashboard — en construction
            </div>
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
    </Routes>
  )
}

export default App