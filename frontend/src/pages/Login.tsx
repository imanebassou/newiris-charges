import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import api from '../api/axios'

const Login = () => {
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
      if (user.role === 'admin') navigate('/dashboard')
      else if (user.role === 'technicien') navigate('/ajoute-charges')
      else navigate('/dashboard')
    } catch {
      setError('Identifiants incorrects. Veuillez réessayer.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#f5f6fa',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <div style={{
        background: '#fff',
        borderRadius: '12px',
        padding: '40px',
        width: '400px',
        border: '1px solid #e8eaed',
      }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{
            width: '56px', height: '56px',
            background: '#1a3a6b',
            borderRadius: '12px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
            fontSize: '20px', fontWeight: '700', color: '#fff'
          }}>NI</div>
          <h1 style={{ fontSize: '20px', fontWeight: '700', color: '#1a3a6b' }}>
            Newiris
          </h1>
          <p style={{ fontSize: '13px', color: '#888', marginTop: '4px' }}>
            Gestion des charges
          </p>
        </div>

        {error && (
          <div style={{
            background: '#fdeaea', border: '1px solid #f5c6c6',
            borderRadius: '6px', padding: '10px 14px',
            fontSize: '12px', color: '#c0392b', marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px' }}>
              Nom d'utilisateur
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Entrez votre nom d'utilisateur"
              required
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid #e0e0e0', borderRadius: '6px',
                fontSize: '13px', outline: 'none',
              }}
            />
          </div>

          <div style={{ marginBottom: '24px' }}>
            <label style={{ fontSize: '12px', color: '#555', display: 'block', marginBottom: '6px' }}>
              Mot de passe
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Entrez votre mot de passe"
              required
              style={{
                width: '100%', padding: '10px 14px',
                border: '1px solid #e0e0e0', borderRadius: '6px',
                fontSize: '13px', outline: 'none',
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%', padding: '12px',
              background: loading ? '#aaa' : '#1a3a6b',
              color: '#fff', border: 'none',
              borderRadius: '6px', fontSize: '14px',
              fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer',
            }}
          >
            {loading ? 'Connexion...' : 'Se connecter'}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '11px', color: '#aaa', marginTop: '24px' }}>
          Newiris Automation — Tanger © 2026
        </p>
      </div>
    </div>
  )
}

export default Login