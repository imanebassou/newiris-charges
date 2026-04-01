import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const ChargesFixes = () => {
  document.title = 'Charges fixes — Newiris'

  const [charges, setCharges] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [categories, setCategories] = useState<string[]>([
    'Loyer', 'Électricité', 'Eau', 'Internet', 'Téléphone',
    'Assurance', 'Salaires', 'Transport', 'Maintenance',
    'Fournitures bureau', 'Autres',
  ])
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [newPerson, setNewPerson] = useState('')
  const [form, setForm] = useState({
    service: '', categorie: '', montant: ''
  })

  const fetchData = async () => {
    try {
      const [chargesRes, usersRes] = await Promise.all([
        api.get('/charges-fixes/'),
        api.get('/auth/users/'),
      ])
      setCharges(chargesRes.data)
      setUsers(usersRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/charges-fixes/', {
        service: parseInt(form.service),
        categorie: form.categorie,
        montant: parseFloat(form.montant),
      })
      setShowForm(false)
      setForm({ service: '', categorie: '', montant: '' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette charge fixe ?')) return
    try {
      await api.delete(`/charges-fixes/${id}/`)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddCategory = () => {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()])
      setForm({ ...form, categorie: newCat.trim() })
      setNewCat('')
      setShowAddCat(false)
    }
  }

  const handleAddPerson = async () => {
    if (!newPerson.trim()) return
    try {
      const res = await api.post('/auth/users/', {
        username: newPerson.trim(),
        password: 'newiris1234',
        role: 'others',
      })
      setUsers([...users, res.data])
      setForm({ ...form, service: res.data.id.toString() })
      setNewPerson('')
      setShowAddPerson(false)
    } catch (err) {
      console.error(err)
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    border: '1px solid #e0e0e0', borderRadius: '6px',
    fontSize: '13px', outline: 'none',
  }

  const totalMontant = charges.reduce((sum, c) => sum + parseFloat(c.montant), 0)

  return (
    <Layout>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Charges fixes</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Gestion des charges fixes</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '8px 16px', background: '#0099cc',
              color: '#fff', border: 'none', borderRadius: '6px',
              fontSize: '12px', cursor: 'pointer', fontWeight: '600'
            }}
          >
            + Ajouter charge fixe
          </button>
        </div>

        <div style={{
          background: '#fff', borderRadius: '8px',
          padding: '16px', border: '1px solid #e8eaed',
          borderTop: '3px solid #0099cc', marginBottom: '20px',
          display: 'inline-block', minWidth: '200px'
        }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Total charges fixes</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#0099cc' }}>
            {totalMontant.toLocaleString('fr-FR')} DH
          </div>
        </div>

        {showForm && (
          <div style={{
            background: '#fff', borderRadius: '8px',
            padding: '20px', border: '1px solid #e8eaed',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>
              Nouvelle charge fixe
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>

                {/* PERSONNE */}
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>
                    Personne *
                  </label>
                  <select
                    style={inputStyle}
                    value={form.service}
                    onChange={e => {
                      if (e.target.value === '__add_person__') {
                        setShowAddPerson(true)
                      } else {
                        setForm({ ...form, service: e.target.value })
                        setShowAddPerson(false)
                      }
                    }}
                    required={!showAddPerson}
                  >
                    <option value="">Sélectionner une personne...</option>
                    {users.map(u => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                    <option value="__add_person__">➕ Add New</option>
                  </select>

                  {showAddPerson && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        value={newPerson}
                        onChange={e => setNewPerson(e.target.value)}
                        placeholder="Nom de la personne..."
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddPerson())}
                      />
                      <button
                        type="button"
                        onClick={handleAddPerson}
                        style={{
                          padding: '8px 12px', background: '#1a3a6b',
                          color: '#fff', border: 'none', borderRadius: '6px',
                          fontSize: '12px', cursor: 'pointer'
                        }}
                      >OK</button>
                      <button
                        type="button"
                        onClick={() => { setShowAddPerson(false); setNewPerson('') }}
                        style={{
                          padding: '8px 12px', background: '#fff',
                          color: '#555', border: '1px solid #e0e0e0',
                          borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
                        }}
                      >✕</button>
                    </div>
                  )}
                </div>

                {/* CATÉGORIE avec Add New */}
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>
                    Catégorie *
                  </label>
                  <select
                    style={inputStyle}
                    value={form.categorie}
                    onChange={e => {
                      if (e.target.value === '__add_new__') {
                        setShowAddCat(true)
                      } else {
                        setForm({ ...form, categorie: e.target.value })
                        setShowAddCat(false)
                      }
                    }}
                    required={!showAddCat}
                  >
                    <option value="">Sélectionner une catégorie...</option>
                    {categories.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                    <option value="__add_new__">➕ Add New</option>
                  </select>

                  {showAddCat && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        value={newCat}
                        onChange={e => setNewCat(e.target.value)}
                        placeholder="Nouvelle catégorie..."
                        onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())}
                      />
                      <button
                        type="button"
                        onClick={handleAddCategory}
                        style={{
                          padding: '8px 12px', background: '#1a3a6b',
                          color: '#fff', border: 'none', borderRadius: '6px',
                          fontSize: '12px', cursor: 'pointer'
                        }}
                      >OK</button>
                      <button
                        type="button"
                        onClick={() => { setShowAddCat(false); setNewCat('') }}
                        style={{
                          padding: '8px 12px', background: '#fff',
                          color: '#555', border: '1px solid #e0e0e0',
                          borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
                        }}
                      >✕</button>
                    </div>
                  )}
                </div>

                {/* MONTANT */}
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>
                    Montant (DH) *
                  </label>
                  <input
                    style={inputStyle}
                    type="number"
                    value={form.montant}
                    onChange={e => setForm({ ...form, montant: e.target.value })}
                    required
                    placeholder="Ex: 5000"
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" style={{
                  padding: '8px 20px', background: '#1a3a6b',
                  color: '#fff', border: 'none', borderRadius: '6px',
                  fontSize: '12px', cursor: 'pointer'
                }}>Créer</button>
                <button type="button" onClick={() => {
                  setShowForm(false)
                  setShowAddCat(false)
                  setShowAddPerson(false)
                  setNewCat('')
                  setNewPerson('')
                }} style={{
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
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Personne</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Catégorie</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Montant</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Créé le</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 14px', color: '#aaa' }}>{charge.id}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{charge.service}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '500', color: '#2c2c2c' }}>{charge.categorie}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '600', color: '#0099cc' }}>
                      {parseFloat(charge.montant).toLocaleString('fr-FR')} DH
                    </td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>
                      {new Date(charge.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        onClick={() => handleDelete(charge.id)}
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

export default ChargesFixes