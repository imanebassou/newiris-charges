import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'
import logo from '../assets/newiris_logo.jpg'

const Login = () => {
  document.title = 'Connexion - NEWIRIS'

  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await api.post('/auth/login/', { username, password })
      const { access, refresh, user } = response.data

      login(user, access, refresh)

      if (user.role === 'super_admin') navigate('/users')
      else navigate('/dashboard')

    } catch {
      setError('Identifiants incorrects. Verifiez vos informations et reessayez.')
    } finally {
      setLoading(false)
    }
  }
    
  const inputStyle = {
    width: '100%',
    padding: '13px 14px',
    border: '1px solid #d9e0e7',
    borderRadius: '10px',
    fontSize: '13px',
    outline: 'none',
    background: '#f8fbff',
    color: '#1f2937',
  } as const

  return (
    <div
      style={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: '1.15fr 0.95fr',
        background: 'linear-gradient(135deg, #182434 0%, #1f2d40 45%, #223553 100%)',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(circle at 18% 18%, rgba(203,49,40,0.22) 0%, rgba(203,49,40,0) 28%), radial-gradient(circle at 82% 78%, rgba(38,93,173,0.20) 0%, rgba(38,93,173,0) 26%), linear-gradient(180deg, rgba(255,255,255,0.02) 0%, rgba(255,255,255,0) 100%)',
          pointerEvents: 'none',
        }}
      />

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '48px',
        }}
      >
        <div
          style={{
            maxWidth: '560px',
            width: '100%',
            color: '#ffffff',
          }}
        >
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              marginBottom: '18px',
              padding: '8px 12px',
              borderRadius: '999px',
              background: 'rgba(255,255,255,0.08)',
              border: '1px solid rgba(255,255,255,0.10)',
              fontSize: '11px',
              fontWeight: 700,
              color: '#dbeafe',
            }}
          >
            <span
              style={{
                width: '8px',
                height: '8px',
                borderRadius: '999px',
                background: '#cb3128',
                boxShadow: '0 0 0 4px rgba(203,49,40,0.18)',
              }}
            />
            NEWIRIS DASHBOARD
          </div>

          <h1
            style={{
              fontSize: '44px',
              lineHeight: 1.05,
              fontWeight: 800,
              marginBottom: '16px',
              letterSpacing: 0,
            }}
          >
            Le dashboard central
            <br />
            de votre entreprise.
          </h1>

          <p
            style={{
              fontSize: '15px',
              lineHeight: 1.7,
              color: 'rgba(226,232,240,0.82)',
              maxWidth: '500px',
              marginBottom: '28px',
            }}
          >
            Pilotez les operations, la finance, les achats, les services, les validations
            et le suivi quotidien dans une interface claire, rapide et unifiee.
          </p>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, minmax(0, 1fr))',
              gap: '12px',
            }}
          >
            {[
              { title: 'Operations', note: 'Suivi quotidien' },
              { title: 'Pilotage', note: 'Vision centralisee' },
              { title: 'Departements', note: 'Coordination unifiee' },
            ].map((item) => (
              <div
                key={item.title}
                style={{
                  borderRadius: '14px',
                  padding: '14px 14px 12px',
                  background: 'rgba(255,255,255,0.06)',
                  border: '1px solid rgba(255,255,255,0.09)',
                  boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
                }}
              >
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#ffffff', marginBottom: '4px' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '11px', color: 'rgba(226,232,240,0.70)' }}>
                  {item.note}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px',
        }}
      >
        <div
          style={{
            width: '100%',
            maxWidth: '430px',
            background: '#ffffff',
            borderRadius: '18px',
            border: '1px solid #d9e0e7',
            boxShadow: '0 30px 80px rgba(10, 16, 28, 0.24)',
            overflow: 'hidden',
          }}
        >
          <div
            style={{
              height: '6px',
              background: 'linear-gradient(90deg, #cb3128 0%, #265dad 100%)',
            }}
          />

          <div style={{ padding: '26px 28px 28px' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div
                style={{
                  width: '92px',
                  height: '92px',
                  margin: '0 auto 14px',
                  borderRadius: '18px',
                  background: '#f8fafc',
                  border: '1px solid #e5eaf0',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 22px rgba(15, 23, 42, 0.06)',
                }}
              >
                <img
                  src={logo}
                  alt="Newiris"
                  style={{
                    width: '72px',
                    height: '72px',
                    objectFit: 'contain',
                    display: 'block',
                  }}
                />
              </div>

              <div
                style={{
                  fontSize: '22px',
                  fontWeight: 800,
                  color: '#1d2836',
                  marginBottom: '6px',
                }}
              >
                Bienvenue
              </div>

              <p
                style={{
                  fontSize: '12px',
                  color: '#6b7280',
                  lineHeight: 1.6,
                  maxWidth: '280px',
                  margin: '0 auto',
                }}
              >
                Connectez-vous pour acceder au dashboard central NEWIRIS.
              </p>
            </div>

            {error && (
              <div
                style={{
                  background: '#fdeaea',
                  border: '1px solid #f1c3c0',
                  borderRadius: '10px',
                  padding: '11px 13px',
                  fontSize: '12px',
                  color: '#b42318',
                  marginBottom: '16px',
                }}
              >
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '14px' }}>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: 700,
                  }}
                >
                  Nom d'utilisateur
                </label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Votre identifiant"
                  required
                  style={inputStyle}
                />
              </div>

              <div style={{ marginBottom: '18px' }}>
                <label
                  style={{
                    fontSize: '11px',
                    color: '#6b7280',
                    display: 'block',
                    marginBottom: '6px',
                    fontWeight: 700,
                  }}
                >
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Votre mot de passe"
                  required
                  style={inputStyle}
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                style={{
                  width: '100%',
                  padding: '13px 14px',
                  background: loading
                    ? '#9aa5b1'
                    : 'linear-gradient(135deg, #265dad 0%, #1d2836 100%)',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '10px',
                  fontSize: '14px',
                  fontWeight: 800,
                  cursor: loading ? 'not-allowed' : 'pointer',
                  boxShadow: loading ? 'none' : '0 14px 28px rgba(38, 93, 173, 0.22)',
                }}
              >
                {loading ? 'Connexion en cours...' : 'Se connecter'}
              </button>
            </form>

            <div
              style={{
                marginTop: '18px',
                paddingTop: '14px',
                borderTop: '1px solid #eef2f6',
                textAlign: 'center',
                fontSize: '11px',
                color: '#94a3b8',
              }}
            >
              NEWIRIS Automation - Tanger - 2026
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Login
