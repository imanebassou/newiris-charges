import { useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const AjouteCharges = () => {
  const [form, setForm] = useState({
    titre: '', service: '', categorie: '',
    sous_categorie: '', montant: '', date: '',
    description: '', statut: 'en_cours'
  })
  const [photo, setPhoto] = useState<File | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  document.title = 'Ajoute des charges — Newiris'

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
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
      setForm({
        titre: '', service: '', categorie: '',
        sous_categorie: '', montant: '', date: '',
        description: '', statut: 'en_cours'
      })
      setPhoto(null)
    } catch (err) {
      setError('Erreur lors de la soumission. Vérifiez les champs.')
    } finally {
      setLoading(false)
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
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>
            Ajoute des charges
          </h1>
          <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
            Soumettre une nouvelle demande de charge
          </p>
        </div>

        {success && (
          <div style={{
            background: '#e8f8ef', border: '1px solid #a8d5b5',
            borderRadius: '6px', padding: '12px 16px',
            fontSize: '13px', color: '#1a7a40', marginBottom: '16px'
          }}>
            ✓ Charge soumise avec succès !
          </div>
        )}

        {error && (
          <div style={{
            background: '#fdeaea', border: '1px solid #f5c6c6',
            borderRadius: '6px', padding: '12px 16px',
            fontSize: '13px', color: '#c0392b', marginBottom: '16px'
          }}>
            {error}
          </div>
        )}

        <div style={{
          background: '#fff', borderRadius: '8px',
          padding: '24px', border: '1px solid #e8eaed'
        }}>
          <form onSubmit={handleSubmit}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>
                  Titre *
                </label>
                <input
                  style={inputStyle}
                  value={form.titre}
                  onChange={e => setForm({ ...form, titre: e.target.value })}
                  required
                  placeholder="Ex: Carburant véhicule"
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>
                  Service *
                </label>
                <input
                  style={inputStyle}
                  value={form.service}
                  onChange={e => setForm({ ...form, service: e.target.value })}
                  required
                  placeholder="ID du service Ex: 1"
                />
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
                  Sous-catégorie
                </label>
                <input
                  style={inputStyle}
                  value={form.sous_categorie}
                  onChange={e => setForm({ ...form, sous_categorie: e.target.value })}
                  placeholder="Ex: Carburant"
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
                  placeholder="Ex: 1200"
                />
              </div>

              <div>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>
                  Date *
                </label>
                <input
                  style={inputStyle}
                  type="date"
                  value={form.date}
                  onChange={e => setForm({ ...form, date: e.target.value })}
                  required
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>
                  Description
                </label>
                <textarea
                  style={{ ...inputStyle, height: '80px', resize: 'none' }}
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Description de la charge..."
                />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>
                  Photo (justificatif)
                </label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={e => setPhoto(e.target.files?.[0] || null)}
                  style={{ fontSize: '13px' }}
                />
                {photo && (
                  <p style={{ fontSize: '11px', color: '#0099cc', marginTop: '4px' }}>
                    ✓ {photo.name}
                  </p>
                )}
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                marginTop: '20px',
                padding: '10px 28px',
                background: loading ? '#aaa' : '#1a3a6b',
                color: '#fff', border: 'none',
                borderRadius: '6px', fontSize: '13px',
                fontWeight: '600', cursor: loading ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? 'Envoi...' : 'Soumettre la charge'}
            </button>
          </form>
        </div>
      </div>
    </Layout>
  )
}

export default AjouteCharges