import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const Fournisseurs = () => {
  document.title = 'Fournisseurs — Newiris'

  const [fournisseurs, setFournisseurs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingDate, setEditingDate] = useState('')
  const [form, setForm] = useState({ nom: '', type_contrat: '', date_fin_rf: '' })
  const [typesContrat, setTypesContrat] = useState<string[]>([
    'CDI', 'CDD', 'Freelance', 'Prestation', 'Maintenance', 'Autres'
  ])
  const [showAddType, setShowAddType] = useState(false)
  const [newType, setNewType] = useState('')

  const fetchData = async () => {
    try {
      const res = await api.get('/fournisseurs/')
      setFournisseurs(res.data)
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
      await api.post('/fournisseurs/', {
        nom: form.nom,
        type_contrat: form.type_contrat,
        date_fin_rf: form.date_fin_rf,
      })
      setShowForm(false)
      setForm({ nom: '', type_contrat: '', date_fin_rf: '' })
      fetchData()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/fournisseurs/${id}/`)
      fetchData()
    } catch (err) { console.error(err) }
  }

  const handleUpdateDate = async (id: number) => {
    try {
      await api.patch(`/fournisseurs/${id}/`, { date_fin_rf: editingDate })
      setEditingId(null)
      setEditingDate('')
      fetchData()
    } catch (err) { console.error(err) }
  }

  const handleAddType = () => {
    if (newType.trim() && !typesContrat.includes(newType.trim())) {
      setTypesContrat([...typesContrat, newType.trim()])
      setForm({ ...form, type_contrat: newType.trim() })
      setNewType('')
      setShowAddType(false)
    }
  }

  const handleRenouveler = async (id: number) => {
    try {
      const today = new Date()
      const newDate = new Date(today.setDate(today.getDate() + 180))
      const dateStr = newDate.toISOString().split('T')[0]
      await api.patch(`/fournisseurs/${id}/`, { date_fin_rf: dateStr })
      fetchData()
    } catch (err) { console.error(err) }
  }

  const getEtatStyle = (etat: string) => {
    if (etat === 'renouvelee') return { bg: '#e8f4fb', color: '#0099cc', label: 'Renouvelée' }
    if (etat === 'en_cours') return { bg: '#e8f8ef', color: '#1a7a40', label: 'En cours' }
    return { bg: '#fdeaea', color: '#c0392b', label: 'Dépassée' }
  }

  const getEcheanceColor = (echeance: number) => {
    if (echeance >= 180) return '#0099cc'
    if (echeance >= 1) return '#1a7a40'
    return '#c0392b'
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    border: '1px solid #e0e0e0', borderRadius: '6px',
    fontSize: '13px', outline: 'none',
  }

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Gestion des fournisseurs</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Suivi des contrats fournisseurs</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: '8px 16px', background: '#0099cc', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600'
          }}>+ ADD new fournisseur</button>
        </div>

        {/* FORMULAIRE */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouveau fournisseur</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Nom du fournisseur *</label>
                  <input style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required placeholder="Ex: Fournisseur X" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Type de contrat *</label>
                  <select style={inputStyle} value={form.type_contrat}
                    onChange={e => {
                      if (e.target.value === '__add_type__') { setShowAddType(true) }
                      else { setForm({ ...form, type_contrat: e.target.value }); setShowAddType(false) }
                    }} required={!showAddType}>
                    <option value="">Sélectionner un type...</option>
                    {typesContrat.map(t => <option key={t} value={t}>{t}</option>)}
                    <option value="__add_type__">+ Add New</option>
                  </select>
                  {showAddType && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input style={{ ...inputStyle, flex: 1 }} value={newType} onChange={e => setNewType(e.target.value)} placeholder="Nouveau type..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddType())} />
                      <button type="button" onClick={handleAddType} style={{ padding: '8px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button>
                      <button type="button" onClick={() => { setShowAddType(false); setNewType('') }} style={{ padding: '8px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>X</button>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date de fin de RF *</label>
                  <input style={inputStyle} type="date" value={form.date_fin_rf} onChange={e => setForm({ ...form, date_fin_rf: e.target.value })} required />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                <button type="button" onClick={() => { setShowForm(false); setShowAddType(false) }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </form>
          </div>
        )}

        {/* TABLEAU */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e8eaed', overflow: 'hidden' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  {['Nom du fournisseur', 'Type de contrat', 'Date de fin de RF', 'Échéance (jours)', 'État de régularité', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {fournisseurs.map(f => {
                  const etatStyle = getEtatStyle(f.etat_regularite)
                  const echeanceColor = getEcheanceColor(f.echeance)
                  return (
                    <tr key={f.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                      <td style={{ padding: '10px 14px', fontWeight: '500', color: '#2c2c2c' }}>{f.nom}</td>
                      <td style={{ padding: '10px 14px', color: '#555' }}>{f.type_contrat}</td>

                      {/* DATE MODIFIABLE */}
                      <td style={{ padding: '10px 14px' }}>
                        {editingId === f.id ? (
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <input type="date" value={editingDate} onChange={e => setEditingDate(e.target.value)}
                              style={{ ...inputStyle, width: '140px', padding: '4px 8px' }} />
                            <button onClick={() => handleUpdateDate(f.id)} style={{ padding: '4px 8px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✓</button>
                            <button onClick={() => { setEditingId(null); setEditingDate('') }} style={{ padding: '4px 8px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ color: '#555' }}>{new Date(f.date_fin_rf).toLocaleDateString('fr-FR')}</span>
                            <button onClick={() => { setEditingId(f.id); setEditingDate(f.date_fin_rf) }}
                              style={{ padding: '2px 6px', background: '#e8f4fb', color: '#0099cc', border: '1px solid #b3d9f0', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}>✏️</button>
                          </div>
                        )}
                      </td>

                      {/* ÉCHÉANCE */}
                      <td style={{ padding: '10px 14px', fontWeight: '700', color: echeanceColor }}>
                        {f.echeance} j
                      </td>

                      {/* ÉTAT AUTO */}
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          padding: '4px 12px', borderRadius: '4px', fontSize: '11px',
                          fontWeight: '600', display: 'inline-block',
                          background: etatStyle.bg, color: etatStyle.color,
                        }}>
                          {etatStyle.label}
                        </span>
                      </td>

                      {/* ACTIONS */}
                      <td style={{ padding: '10px 14px' }}>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleRenouveler(f.id)} style={{
                            padding: '4px 10px', background: '#e8f4fb', color: '#0099cc',
                            border: '1px solid #b3d9f0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer'
                          }}>Renouveler</button>
                          <button onClick={() => handleDelete(f.id)} style={{
                            padding: '4px 10px', background: '#fdeaea', color: '#c0392b',
                            border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer'
                          }}>Supprimer</button>
                        </div>
                      </td>
                    </tr>
                  )
                })}
                {fournisseurs.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>Aucun fournisseur</td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </Layout>
  )
}

export default Fournisseurs