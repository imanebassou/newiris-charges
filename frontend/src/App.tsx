import { Routes, Route, Navigate } from 'react-router-dom'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Users from './pages/Users'
import Services from './pages/Services'
import ChargesFixes from './pages/ChargesFixes'
import ChargesVariables from './pages/ChargesVariables'
import AjouteCharges from './pages/AjouteCharges'
import Banque from './pages/Banque'
import PrivateRoute from './routes/PrivateRoute'
import Previsions from './pages/Previsions'
import Salaires from './pages/Salaires'
import Fournisseurs from './pages/Fournisseurs'
import Caisse from './pages/Caisse'
import DemandesCheques from './pages/DemandesCheques'
import Vehicules from './pages/Vehicules'
import Equipe from './pages/Equipe'
import Chantiers from './pages/Chantiers'

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route path="/dashboard" element={
  <PrivateRoute allowedRoles={['admin', 'others']}>
    <Dashboard />
  </PrivateRoute>
} />
      <Route path="/users" element={
        <PrivateRoute allowedRoles={['super_admin']}>
          <Users />
        </PrivateRoute>
      } />

      <Route path="/services" element={
        <PrivateRoute allowedRoles={['super_admin']}>
          <Services />
        </PrivateRoute>
      } />

      <Route path="/banque" element={
        <PrivateRoute allowedRoles={['admin', 'super_admin']}>
          <Banque />
        </PrivateRoute>
      } />

      <Route path="/caisse" element={
        <PrivateRoute allowedRoles={['admin', 'super_admin', 'achat', 'responsable_technique']}>
          <Caisse />
        </PrivateRoute>
      } />

      <Route path="/previsions" element={
        <PrivateRoute allowedRoles={['admin', 'super_admin']}>
          <Previsions />
        </PrivateRoute>
      } />

      <Route path="/charges-fixes" element={
        <PrivateRoute allowedRoles={['admin', 'super_admin']}>
          <ChargesFixes />
        </PrivateRoute>
      } />

      <Route path="/charges-variables" element={
        <PrivateRoute allowedRoles={['admin', 'super_admin']}>
          <ChargesVariables />
        </PrivateRoute>
      } />

      <Route path="/salaires" element={
        <PrivateRoute allowedRoles={['admin', 'super_admin']}>
          <Salaires />
        </PrivateRoute>
      } />

      <Route path="/fournisseurs" element={
        <PrivateRoute allowedRoles={['admin', 'super_admin', 'achat']}>
          <Fournisseurs />
        </PrivateRoute>
      } />

      <Route path="/demandes-cheques" element={
        <PrivateRoute allowedRoles={['admin', 'super_admin', 'achat']}>
          <DemandesCheques />
        </PrivateRoute>
      } />

      <Route path="/vehicules" element={
        <PrivateRoute allowedRoles={['super_admin', 'responsable_technique']}>
          <Vehicules />
        </PrivateRoute>
      } />

      <Route path="/equipe" element={
        <PrivateRoute allowedRoles={['super_admin', 'responsable_technique']}>
          <Equipe />
        </PrivateRoute>
      } />

      <Route path="/chantiers" element={
        <PrivateRoute allowedRoles={['super_admin', 'responsable_technique']}>
          <Chantiers />
        </PrivateRoute>
      } />

      <Route path="/ajoute-charges" element={
        <PrivateRoute allowedRoles={['achat']}>
          <AjouteCharges />
        </PrivateRoute>
      } />

      <Route path="/unauthorized" element={
        <div style={{ padding: '40px', textAlign: 'center', color: '#e84c3d', fontSize: '18px' }}>
          Accès non autorisé
        </div>
      } />
    </Routes>
  )
}

export default App