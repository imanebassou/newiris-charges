import { Navigate, Route, Routes } from 'react-router-dom'

import AjouteCharges from './pages/AjouteCharges'
import Banque from './pages/Banque'
import Caisse from './pages/Caisse'
import Chantiers from './pages/Chantiers'
import ChargesFixes from './pages/ChargesFixes'
import ChargesVariables from './pages/ChargesVariables'
import Commandes from './pages/Commandes'
import Dashboard from './pages/Dashboard'
import DemandesCheques from './pages/DemandesCheques'
import Equipe from './pages/Equipe'
import Fournisseurs from './pages/Fournisseurs'
import Login from './pages/Login'
import Previsions from './pages/Previsions'
import Salaires from './pages/Salaires'
import Services from './pages/Services'
import Users from './pages/Users'
import Vehicules from './pages/Vehicules'
import PrivateRoute from './routes/PrivateRoute'

const App = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<Navigate to="/login" replace />} />

      <Route
        path="/dashboard"
        element={
          <PrivateRoute allowedPage="dashboard">
            <Dashboard />
          </PrivateRoute>
        }
      />
      <Route
        path="/users"
        element={
          <PrivateRoute allowedPage="users">
            <Users />
          </PrivateRoute>
        }
      />
      <Route
        path="/services"
        element={
          <PrivateRoute allowedPage="services">
            <Services />
          </PrivateRoute>
        }
      />
      <Route
        path="/banque"
        element={
          <PrivateRoute allowedPage="banque">
            <Banque />
          </PrivateRoute>
        }
      />
      <Route
        path="/caisse"
        element={
          <PrivateRoute allowedPage="caisse">
            <Caisse />
          </PrivateRoute>
        }
      />
      <Route
        path="/previsions"
        element={
          <PrivateRoute allowedPage="previsions">
            <Previsions />
          </PrivateRoute>
        }
      />
      <Route
        path="/charges-fixes"
        element={
          <PrivateRoute allowedPage="charges_fixes">
            <ChargesFixes />
          </PrivateRoute>
        }
      />
      <Route
        path="/charges-variables"
        element={
          <PrivateRoute allowedPage="charges_variables">
            <ChargesVariables />
          </PrivateRoute>
        }
      />
      <Route
        path="/salaires"
        element={
          <PrivateRoute allowedPage="salaires">
            <Salaires />
          </PrivateRoute>
        }
      />
      <Route
        path="/fournisseurs"
        element={
          <PrivateRoute allowedPage="fournisseurs">
            <Fournisseurs />
          </PrivateRoute>
        }
      />
      <Route
        path="/demandes-cheques"
        element={
          <PrivateRoute allowedPage="demandes_cheques">
            <DemandesCheques />
          </PrivateRoute>
        }
      />
      <Route
        path="/vehicules"
        element={
          <PrivateRoute allowedPage="vehicules">
            <Vehicules />
          </PrivateRoute>
        }
      />
      <Route
        path="/equipe"
        element={
          <PrivateRoute allowedPage="equipe">
            <Equipe />
          </PrivateRoute>
        }
      />
      <Route
        path="/chantiers"
        element={
          <PrivateRoute allowedPage="chantiers">
            <Chantiers />
          </PrivateRoute>
        }
      />
      <Route
        path="/ajoute-charges"
        element={
          <PrivateRoute allowedPage="ajoute_charges">
            <AjouteCharges />
          </PrivateRoute>
        }
      />
      <Route
        path="/commandes"
        element={
          <PrivateRoute allowedPage="commandes">
            <Commandes />
          </PrivateRoute>
        }
      />

      <Route
        path="/unauthorized"
        element={
          <div style={{ padding: '40px', textAlign: 'center', color: '#e84c3d', fontSize: '18px' }}>
            Acces non autorise
          </div>
        }
      />
    </Routes>
  )
}

export default App
