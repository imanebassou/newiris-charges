import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const ChargesFixes = () => {
  const [charges, setCharges] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    service: '', categorie: '', montant: ''
  })

  const fetchData = async () => {
    try {
      const [chargesRes, servicesRes] = await Promise.all([
        api.get('/charges-fixes/'),
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
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>
                    Service *
                  </label>
                  <select
                    style={inputStyle}
                    value={form.service}
                    onChange={e => setForm({ ...form, service: e.target.value })}
                    required
                  >
                    <option value="">Sélectionner...</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>{s.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>
                    Catégorie *
                  </label>
                  <input
                    style={inputStyle}
                    value={form.categorie}
                    onChange={e => setForm({ ...form, categorie: e.target.value })}
                    required
                    placeholder="Ex: Véhicule"
                  />
                </div>
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
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Service</th>
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