import { useState, useEffect } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const categories: { [key: string]: string[] } = {
  'Véhicule': ['Carburant', 'Maintenance voiture', 'Lavage', 'Vidange'],
  'Transport': ['Transport', 'Déplacement'],
  'Charges administratives': ['Frais bancaires', 'Douane'],
  'Dépenses équipe & bien-être': ['Restauration', 'Soin/visite médicale', 'Activités sportives'],
  'Entretien & nettoyage': ['Ménage', 'Matériel consommable'],
}

const AjouteCharges = () => {
  document.title = 'Ajouter charge variable — Newiris'

  const [charges, setCharges] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({
    titre: '', service: '', categorie: '',
    sous_categorie: '', montant: '', date: '',
    description: '', statut: 'en_cours'
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)

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

  const handleCategorieChange = (cat: string) => {
    setForm({ ...form, categorie: cat, sous_categorie: '' })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')
    setSuccess(false)

    try {
      const formData = new FormData()
      formData.append('titre', form.titre)
      formData.append('service', form.service)
      formData.append('categorie', form.categorie)
      formData.append('sous_categorie', form.sous_categorie)
      formData.append('montant', form.montant)
      formData.append('date', form.date)
      formData.append('description', form.description)
      formData.append('statut', form.statut)
      if (photo) formData.append('photo', photo)

      await api.post('/charges-variables/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess(true)
      setShowForm(false)
      setForm({
        titre: '', service: '', categorie: '',
        sous_categorie: '', montant: '', date: '',
        description: '', statut: 'en_cours'
      })
      setPhoto(null)
      fetchData()
    } catch (err) {
      setError('Erreur lors de la soumission. Vérifiez les champs.')
    } finally {
      setSubmitting(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    border: '1px solid #e0e0e0', borderRadius: '6px',
    fontSize: '13px', outline: 'none',
  }

  const totalMontant = charges
    .filter(c => c.statut === 'traitee')
    .reduce((sum, c) => sum + parseFloat(c.montant), 0)

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            style={{
              position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
              background: 'rgba(0,0,0,0.75)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer'
            }}
          >
            <div style={{ position: 'relative' }}>
              <img
                src={selectedPhoto}
                alt="justificatif"
                style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '8px' }}
              />
              <button
                onClick={() => setSelectedPhoto(null)}
                style={{
                  position: 'absolute', top: '-12px', right: '-12px',
                  width: '28px', height: '28px', borderRadius: '50%',
                  background: '#e84c3d', color: '#fff', border: 'none',
                  fontSize: '14px', cursor: 'pointer', fontWeight: '700'
                }}
              >✕</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Ajouter charge variable</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Soumettre et suivre les charges variables</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: '8px 16px', background: '#0099cc', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600'
          }}>
            + Nouvelle charge
          </button>
        </div>

        <div style={{
          background: '#fff', borderRadius: '8px', padding: '16px',
          border: '1px solid #e8eaed', borderTop: '3px solid #e84c3d',
          marginBottom: '20px', display: 'inline-block', minWidth: '200px'
        }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Total mes charges traitées</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#e84c3d' }}>
            {totalMontant.toLocaleString('fr-FR')} DH
          </div>
        </div>

        {success && (
          <div style={{
            background: '#e8f8ef', border: '1px solid #a8d5b5', borderRadius: '6px',
            padding: '12px 16px', fontSize: '13px', color: '#1a7a40', marginBottom: '16px'
          }}>✓ Charge soumise avec succès !</div>
        )}

        {error && (
          <div style={{
            background: '#fdeaea', border: '1px solid #f5c6c6', borderRadius: '6px',
            padding: '12px 16px', fontSize: '13px', color: '#c0392b', marginBottom: '16px'
          }}>{error}</div>
        )}

        {showForm && (
          <div style={{
            background: '#fff', borderRadius: '8px', padding: '24px',
            border: '1px solid #e8eaed', marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>
              Nouvelle charge variable
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Titre *</label>
                  <input style={inputStyle} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required placeholder="Ex: Carburant véhicule" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Service *</label>
                  <select style={inputStyle} value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} required>
                    <option value="">Sélectionner un service...</option>
                    {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Catégorie *</label>
                  <select style={inputStyle} value={form.categorie} onChange={e => handleCategorieChange(e.target.value)} required>
                    <option value="">Sélectionner une catégorie...</option>
                    {Object.keys(categories).map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Sous-catégorie</label>
                  <select style={inputStyle} value={form.sous_categorie} onChange={e => setForm({ ...form, sous_categorie: e.target.value })} disabled={!form.categorie}>
                    <option value="">Sélectionner une sous-catégorie...</option>
                    {form.categorie && categories[form.categorie]?.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
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
                  <input style={inputStyle} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description de la charge" />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Photo (justificatif)</label>
                  <label style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '12px 16px', border: '2px dashed #e0e0e0',
                    borderRadius: '8px', cursor: 'pointer',
                    background: photo ? '#e8f4fb' : '#fafafa',
                    borderColor: photo ? '#0099cc' : '#e0e0e0',
                  }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '8px',
                      background: photo ? '#0099cc' : '#e8eaed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '18px', flexShrink: 0, color: '#fff'
                    }}>
                      {photo ? '✓' : '📎'}
                    </div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: photo ? '#0099cc' : '#555' }}>
                        {photo ? photo.name : 'Cliquer pour ajouter une photo'}
                      </div>
                      <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
                        {photo ? `${(photo.size / 1024).toFixed(1)} KB` : 'JPG, PNG — max 5MB'}
                      </div>
                    </div>
                    <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  </label>
                  {photo && (
                    <button type="button" onClick={() => setPhoto(null)} style={{
                      marginTop: '6px', padding: '3px 10px', background: '#fdeaea',
                      color: '#c0392b', border: '1px solid #f5c6c6',
                      borderRadius: '4px', fontSize: '11px', cursor: 'pointer'
                    }}>Supprimer la photo</button>
                  )}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" disabled={submitting} style={{
                  padding: '8px 20px', background: submitting ? '#aaa' : '#1a3a6b',
                  color: '#fff', border: 'none', borderRadius: '6px',
                  fontSize: '12px', cursor: submitting ? 'not-allowed' : 'pointer'
                }}>
                  {submitting ? 'Envoi...' : 'Soumettre'}
                </button>
                <button type="button" onClick={() => setShowForm(false)} style={{
                  padding: '8px 20px', background: '#fff', color: '#555',
                  border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
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
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Sous-catégorie</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Montant</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Date</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Photo</th>
                  <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Statut</th>
                </tr>
              </thead>
              <tbody>
                {charges.map((charge) => (
                  <tr key={charge.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 14px', color: '#aaa' }}>{charge.id}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '500', color: '#2c2c2c' }}>{charge.titre}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{charge.service}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{charge.categorie}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{charge.sous_categorie || '—'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '600', color: '#e84c3d' }}>
                      {parseFloat(charge.montant).toLocaleString('fr-FR')} DH
                    </td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>
                      {new Date(charge.date).toLocaleDateString('fr-FR')}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {charge.photo ? (
                        <div onClick={() => setSelectedPhoto(charge.photo)} style={{ cursor: 'pointer', display: 'inline-block' }}>
                          <img
                            src={charge.photo}
                            alt="justificatif"
                            style={{
                              width: '44px', height: '44px', objectFit: 'cover',
                              borderRadius: '6px', border: '2px solid #e0e0e0',
                            }}
                            onMouseOver={e => (e.currentTarget.style.borderColor = '#0099cc')}
                            onMouseOut={e => (e.currentTarget.style.borderColor = '#e0e0e0')}
                          />
                          <div style={{ fontSize: '10px', color: '#0099cc', marginTop: '2px', textAlign: 'center' }}>Voir</div>
                        </div>
                      ) : (
                        <span style={{
                          fontSize: '11px', color: '#aaa', background: '#f8f9fa',
                          padding: '4px 8px', borderRadius: '4px', border: '1px solid #e8eaed'
                        }}>Aucune</span>
                      )}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <select
                        value={charge.statut}
                        onChange={async e => {
                          try {
                            await api.patch(`/charges-variables/${charge.id}/`, { statut: e.target.value })
                            fetchData()
                          } catch (err) {
                            console.error(err)
                          }
                        }}
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

export default AjouteCharges