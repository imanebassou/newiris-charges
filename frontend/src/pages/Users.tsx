import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const Users = () => {
    document.title = 'Utilisateurs — Newiris'
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    username: '', email: '', password: '',
    first_name: '', last_name: '',
    role: 'others', fonction: '', phone: ''
  })

  const fetchUsers = async () => {
    try {
      const res = await api.get('/auth/users/')
      setUsers(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchUsers() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/auth/users/', form)
      setShowForm(false)
      setForm({ username: '', email: '', password: '', first_name: '', last_name: '', role: 'others', fonction: '', phone: '' })
      fetchUsers()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cet utilisateur ?')) return
    try {
      await api.delete(`/auth/users/${id}/`)
      fetchUsers()
    } catch (err) {
      console.error(err)
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    border: '1px solid #e0e0e0', borderRadius: '6px',
    fontSize: '13px', outline: 'none',
  }

  const roleColor: { [key: string]: string } = {
    admin: '#1a3a6b', technicien: '#0099cc', others: '#888'
  }

  return (
    <Layout>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Utilisateurs</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Gestion des comptes</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '8px 16px', background: '#0099cc',
              color: '#fff', border: 'none', borderRadius: '6px',
              fontSize: '12px', cursor: 'pointer', fontWeight: '600'
            }}
          >
            + Ajouter utilisateur
          </button>
        </div>

        {showForm && (
          <div style={{
            background: '#fff', borderRadius: '8px',
            padding: '20px', border: '1px solid #e8eaed',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>
              Nouvel utilisateur
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Nom d'utilisateur *</label>
                  <input style={inputStyle} value={form.username} onChange={e => setForm({ ...form, username: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Email</label>
                  <input style={inputStyle} type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Prénom</label>
                  <input style={inputStyle} value={form.first_name} onChange={e => setForm({ ...form, first_name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Nom</label>
                  <input style={inputStyle} value={form.last_name} onChange={e => setForm({ ...form, last_name: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Mot de passe *</label>
                  <input style={inputStyle} type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Rôle</label>
                  <select style={inputStyle} value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                    <option value="admin">Admin</option>
<option value="achat">Achat</option>
<option value="others">Others</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Fonction</label>
                  <input style={inputStyle} value={form.fonction} onChange={e => setForm({ ...form, fonction: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Téléphone</label>
                  <input style={inputStyle} value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" style={{
                  padding: '8px 20px', background: '#1a3a6b',
                  color: '#fff', border: 'none', borderRadius: '6px',
                  fontSize: '12px', cursor: 'pointer'
                }}>Créer</button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '8px 20px', background: '#fff',
                  color: '#555', border: '1px solid #e0e0e0',
                  borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
                }}>Annuler</button>
              </div>
            </form>
          </div>
        )}

        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e8eaed', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>#</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Nom</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Email</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Rôle</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Fonction</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 14px', color: '#aaa' }}>{user.id}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '500', color: '#2c2c2c' }}>
                      {user.first_name || user.username} {user.last_name}
                    </td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{user.email || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                        background: `${roleColor[user.role]}20`,
                        color: roleColor[user.role], fontWeight: '600'
                      }}>
                        {user.role}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{user.fonction || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        onClick={() => handleDelete(user.id)}
                        style={{
                          padding: '4px 10px', background: '#fdeaea',
                          color: '#c0392b', border: '1px solid #f5c6c6',
                          borderRadius: '4px', fontSize: '11px', cursor: 'pointer'
                        }}
                      >
                        Supprimer
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Users