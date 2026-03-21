import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const ChargesVariables = () => {
    document.title = 'Charges variables — Newiris'
  const [charges, setCharges] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    titre: '', service: '', categorie: '',
    sous_categorie: '', montant: '', date: '',
    description: '', statut: 'en_cours'
  })

  const fetchData = async () => {
    try {
      const [chargesRes, servicesRes] = await Promise.all([
        api.get('/charges-variables/'),
        api.get('/services/'),
      ])
      setCharges(chargesRes.data)
      setServices(servicesRes.data)
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
      await api.post('/charges-variables/', {
        titre: form.titre,
        service: parseInt(form.service),
        categorie: form.categorie,
        sous_categorie: form.sous_categorie,
        montant: parseFloat(form.montant),
        date: form.date,
        description: form.description,
        statut: form.statut,
      })
      setShowForm(false)
      setForm({
        titre: '', service: '', categorie: '',
        sous_categorie: '', montant: '', date: '',
        description: '', statut: 'en_cours'
      })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette charge variable ?')) return
    try {
      await api.delete(`/charges-variables/${id}/`)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleStatutChange = async (id: number, statut: string) => {
    try {
      await api.patch(`/charges-variables/${id}/`, { statut })
      fetchData()
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
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Charges variables</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Gestion des charges variables</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '8px 16px', background: '#0099cc',
              color: '#fff', border: 'none', borderRadius: '6px',
              fontSize: '12px', cursor: 'pointer', fontWeight: '600'
            }}
          >
            + Ajouter charge variable
          </button>
        </div>

        <div style={{
          background: '#fff', borderRadius: '8px',
          padding: '16px', border: '1px solid #e8eaed',
          borderTop: '3px solid #e84c3d', marginBottom: '20px',
          display: 'inline-block', minWidth: '200px'
        }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Total charges variables</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#e84c3d' }}>
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
              Nouvelle charge variable
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Titre *</label>
                  <input style={inputStyle} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required placeholder="Ex: Carburant Mars" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Service *</label>
                  <select style={inputStyle} value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} required>
                    <option value="">Sélectionner...</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Catégorie *</label>
                  <input style={inputStyle} value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} required placeholder="Ex: Véhicule" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Sous-catégorie</label>
                  <input style={inputStyle} value={form.sous_categorie} onChange={e => setForm({ ...form, sous_categorie: e.target.value })} placeholder="Ex: Carburant" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Montant (DH) *</label>
                  <input style={inputStyle} type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} required placeholder="Ex: 1200" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date *</label>
                  <input style={inputStyle} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Statut</label>
                  <select style={inputStyle} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                    <option value="en_cours">En cours</option>
                    <option value="traitee">Traitée</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Description</label>
                  <input style={inputStyle} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description optionnelle" />
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
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Titre</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Service</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Catégorie</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Montant</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Date</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Statut</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 14px', color: '#aaa' }}>{charge.id}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '500', color: '#2c2c2c' }}>{charge.titre}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{charge.service}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{charge.categorie}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '600', color: '#e84c3d' }}>
                      {parseFloat(charge.montant).toLocaleString('fr-FR')} DH
                    </td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>
                      {new Date(charge.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <select
                        value={charge.statut}
                        onChange={e => handleStatutChange(charge.id, e.target.value)}
                        style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '11px',
                          border: '1px solid #e0e0e0', cursor: 'pointer',
                          background: charge.statut === 'traitee' ? '#e8f8ef' : '#fff3e0',
                          color: charge.statut === 'traitee' ? '#1a7a40' : '#e65100',
                        }}
                      >
                        <option value="en_cours">En cours</option>
                        <option value="traitee">Traitée</option>
                      </select>
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

export default ChargesVariables