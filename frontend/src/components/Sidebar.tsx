import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const Sidebar = () => {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', roles: ['admin', 'others'] },
    { label: 'Utilisateurs', path: '/users', roles: ['admin'] },
    { label: 'Services', path: '/services', roles: ['admin'] },
    { label: 'Charges fixes', path: '/charges-fixes', roles: ['admin'] },
    { label: 'Charges variables', path: '/charges-variables', roles: ['admin'] },
   { label: 'Ajoute des charges', path: '/ajoute-charges', roles: ['achat'] },
  ]

  const filteredItems = navItems.filter(item =>
    user && item.roles.includes(user.role)
  )

  return (
    <div style={{
      width: '230px', minHeight: '100vh',
      background: '#1a3a6b', display: 'flex',
      flexDirection: 'column', flexShrink: 0,
    }}>
      <div style={{ padding: '16px', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <img
  src="/src/assets/newiris_logo.png"
  alt="Newiris"
  style={{ width: '80px', objectFit: 'contain' }}
/>
<div>
  <div style={{ color: '#fff', fontSize: '14px', fontWeight: '600' }}>Newiris</div>
  <div style={{ color: 'rgba(255,255,255,0.5)', fontSize: '10px' }}>Gestion des charges</div>
</div>
        </div>
      </div>

      <div style={{ padding: '12px 16px', borderBottom: '1px solid rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', gap: '8px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '50%',
          background: '#0099cc', display: 'flex', alignItems: 'center',
          justifyContent: 'center', fontSize: '12px', color: '#fff',
          fontWeight: '600', flexShrink: 0,
        }}>
          {user?.username?.charAt(0).toUpperCase()}
        </div>
        <div>
          <div style={{ color: '#fff', fontSize: '12px', fontWeight: '500' }}>{user?.username}</div>
          <span style={{
            background: 'rgba(0,153,204,0.3)', color: '#7dd3f0',
            fontSize: '9px', padding: '1px 6px', borderRadius: '3px',
          }}>{user?.role}</span>
        </div>
      </div>

      <nav style={{ padding: '8px 0', flex: 1 }}>
        {filteredItems.map((item) => (
          <div
            key={item.path}
            onClick={() => navigate(item.path)}
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              padding: '9px 16px', fontSize: '12px', cursor: 'pointer',
              color: location.pathname === item.path ? '#fff' : 'rgba(255,255,255,0.6)',
              background: location.pathname === item.path ? 'rgba(0,153,204,0.25)' : 'transparent',
              borderLeft: location.pathname === item.path ? '3px solid #0099cc' : '3px solid transparent',
            }}
          >
            <div style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: location.pathname === item.path ? '#0099cc' : 'rgba(255,255,255,0.3)',
              flexShrink: 0,
            }}></div>
            {item.label}
          </div>
        ))}
      </nav>

      <div
        onClick={handleLogout}
        style={{
          padding: '12px 16px', fontSize: '12px', cursor: 'pointer',
          color: 'rgba(255,255,255,0.6)', borderTop: '1px solid rgba(255,255,255,0.1)',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}
      >
        <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#e84c3d' }}></div>
        Déconnexion
      </div>
    </div>
  )
}

export default Sidebar