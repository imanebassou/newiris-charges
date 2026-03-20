import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const Services = () => {
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', responsable: '' })

  const fetchServices = async () => {
    try {
      const res = await api.get('/services/')
      setServices(res.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchServices() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/services/', {
        nom: form.nom,
        responsable: form.responsable || null
      })
      setShowForm(false)
      setForm({ nom: '', responsable: '' })
      fetchServices()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer ce service ?')) return
    try {
      await api.delete(`/services/${id}/`)
      fetchServices()
    } catch (err) {
      console.error(err)
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    border: '1px solid #e0e0e0', borderRadius: '6px',
    fontSize: '13px', outline: 'none',
  }

  return (
    <Layout>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Services</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Gestion des services</p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            style={{
              padding: '8px 16px', background: '#0099cc',
              color: '#fff', border: 'none', borderRadius: '6px',
              fontSize: '12px', cursor: 'pointer', fontWeight: '600'
            }}
          >
            + Ajouter service
          </button>
        </div>

        {showForm && (
          <div style={{
            background: '#fff', borderRadius: '8px',
            padding: '20px', border: '1px solid #e8eaed',
            marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>
              Nouveau service
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>
                    Nom du service *
                  </label>
                  <input
                    style={inputStyle}
                    value={form.nom}
                    onChange={e => setForm({ ...form, nom: e.target.value })}
                    required
                    placeholder="Ex: Service Technique"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>
                    Responsable (ID utilisateur)
                  </label>
                  <input
                    style={inputStyle}
                    value={form.responsable}
                    onChange={e => setForm({ ...form, responsable: e.target.value })}
                    placeholder="Ex: 1"
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
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Nom</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Responsable</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Créé le</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {services.map((service) => (
                  <tr key={service.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 14px', color: '#aaa' }}>{service.id}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '500', color: '#2c2c2c' }}>{service.nom}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{service.responsable || '—'}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>
                      {new Date(service.created_at).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button
                        onClick={() => handleDelete(service.id)}
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

export default Services