import { useLocation, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import logo from '../assets/newiris_logo.jpg'

const Sidebar = () => {
  const { canViewPage, logout, user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const navItems = [
    { code: 'users', label: 'Utilisateurs', path: '/users' },
    { code: 'services', label: 'Services', path: '/services' },
    { code: 'dashboard', label: 'Dashboard', path: '/dashboard' },
    { code: 'banque', label: 'Banque', path: '/banque' },
    { code: 'caisse', label: 'Caisse', path: '/caisse' },
    { code: 'previsions', label: 'Previsions', path: '/previsions' },
    { code: 'charges_fixes', label: 'Charges fixes', path: '/charges-fixes' },
    { code: 'charges_variables', label: 'Charges variables', path: '/charges-variables' },
    { code: 'salaires', label: 'Salaires', path: '/salaires' },
    { code: 'fournisseurs', label: 'Fournisseurs', path: '/fournisseurs' },
    { code: 'demandes_cheques', label: 'Demandes cheques', path: '/demandes-cheques' },
    { code: 'vehicules', label: 'Vehicules', path: '/vehicules' },
    { code: 'equipe', label: 'Etat equipe', path: '/equipe' },
    { code: 'chantiers', label: 'Chantiers', path: '/chantiers' },
    { code: 'ajoute_charges', label: 'Ajouter charge variable', path: '/ajoute-charges' },
    { code: 'commandes', label: 'Gestion de commandes', path: '/commandes' },
  ]

  const filteredItems = navItems.filter((item) => canViewPage(item.code))

  return (
    <aside
      style={{
        width: '274px',
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #172233 0%, #1e2b3d 55%, #182434 100%)',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        color: '#fff',
        borderRight: '1px solid rgba(12, 22, 38, 0.08)',
        boxShadow: '18px 0 40px rgba(16, 24, 40, 0.10)',
      }}
    >
      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          background: 'linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0.01) 100%)',
        }}
      >
        <div
          style={{
            background: '#ffffff',
            borderRadius: '14px',
            padding: '12px 14px',
            border: '1px solid #e4e9f0',
            boxShadow: '0 10px 24px rgba(15, 23, 42, 0.08)',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            minHeight: '84px',
          }}
        >
          <img
            src={logo}
            alt="Newiris"
            style={{
              width: '72px',
              height: '56px',
              objectFit: 'contain',
              display: 'block',
              flexShrink: 0,
            }}
          />

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: '11px',
                fontWeight: 700,
                color: '#cb3128',
                letterSpacing: '0.04em',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              NEWIRIS
            </div>
            <div
              style={{
                fontSize: '18px',
                lineHeight: 1.05,
                fontWeight: 800,
                color: '#1f2b38',
              }}
            >
              DASHBOARD
            </div>
            <div
              style={{
                fontSize: '10px',
                color: '#265dad',
                fontWeight: 700,
                marginTop: '5px',
              }}
            >
              Batiments intelligents
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          padding: '14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <div
          style={{
            borderRadius: '14px',
            padding: '12px',
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.07)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <div
            style={{
              width: '38px',
              height: '38px',
              borderRadius: '11px',
              background: '#cb3128',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '13px',
              color: '#fff',
              fontWeight: 800,
              flexShrink: 0,
              boxShadow: '0 8px 18px rgba(203, 49, 40, 0.22)',
            }}
          >
            {user?.username?.charAt(0).toUpperCase()}
          </div>

          <div style={{ minWidth: 0 }}>
            <div
              style={{
                color: '#ffffff',
                fontSize: '12px',
                fontWeight: 700,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {user?.username}
            </div>
            <div
              style={{
                display: 'inline-flex',
                marginTop: '4px',
                padding: '3px 7px',
                borderRadius: '999px',
                background: 'rgba(38, 93, 173, 0.22)',
                color: '#c8dcff',
                fontSize: '9px',
                fontWeight: 700,
              }}
            >
              {user?.role}
            </div>
          </div>
        </div>
      </div>

      <nav
        style={{
          padding: '12px 10px',
          flex: 1,
          overflowY: 'auto',
        }}
      >
        <div
          style={{
            fontSize: '10px',
            color: 'rgba(226,232,240,0.52)',
            fontWeight: 700,
            padding: '0 10px 10px',
          }}
        >
          NAVIGATION
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          {filteredItems.map((item) => {
            const active = location.pathname === item.path

            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                style={{
                  width: '100%',
                  border: 'none',
                  textAlign: 'left',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  cursor: 'pointer',
                  background: active
                    ? 'linear-gradient(135deg, rgba(38,93,173,0.28) 0%, rgba(203,49,40,0.18) 100%)'
                    : 'transparent',
                  color: active ? '#ffffff' : 'rgba(226,232,240,0.80)',
                  boxShadow: active ? 'inset 0 0 0 1px rgba(255,255,255,0.08)' : 'none',
                }}
              >
                <div
                  style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '999px',
                    background: active ? '#cb3128' : 'rgba(255,255,255,0.20)',
                    flexShrink: 0,
                    boxShadow: active ? '0 0 0 4px rgba(203,49,40,0.12)' : 'none',
                  }}
                />
                <span
                  style={{
                    fontSize: '12px',
                    fontWeight: active ? 700 : 600,
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}
                >
                  {item.label}
                </span>
              </button>
            )
          })}
        </div>
      </nav>

      <div
        style={{
          padding: '14px 10px 18px',
          borderTop: '1px solid rgba(255,255,255,0.06)',
        }}
      >
        <button
          onClick={handleLogout}
          style={{
            width: '100%',
            border: '1px solid rgba(255,255,255,0.08)',
            background: 'rgba(255,255,255,0.03)',
            color: '#f8fafc',
            padding: '11px 12px',
            borderRadius: '12px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '12px',
            fontWeight: 700,
          }}
        >
          <div
            style={{
              width: '8px',
              height: '8px',
              borderRadius: '999px',
              background: '#cb3128',
              flexShrink: 0,
            }}
          />
          Deconnexion
        </button>
      </div>
    </aside>
  )
}

export default Sidebar
