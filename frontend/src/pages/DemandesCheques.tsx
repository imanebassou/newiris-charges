import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const TYPES_PAIEMENT_DEFAULT = ['Chèque', 'Virement', 'Espèces', 'Carte bancaire']

const DemandesCheques = () => {
  document.title = 'Demandes Chèques — Newiris'

  const [demandes, setDemandes] = useState<any[]>([])
  const [fournisseurs, setFournisseurs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    titre: '',
    fournisseur: '',
    montant: '',
    date_souhaitee_signature: '',
  })

  const [typesPaiement, setTypesPaiement] = useState<string[]>(TYPES_PAIEMENT_DEFAULT)
  const [showAddFourn, setShowAddFourn] = useState(false)
  const [newFourn, setNewFourn] = useState('')
  const [showAddType, setShowAddType] = useState(false)
  const [newType, setNewType] = useState('')

  const [editingEcheance, setEditingEcheance] = useState<number | null>(null)
  const [echeanceInput, setEcheanceInput] = useState('')
  const [editingDate, setEditingDate] = useState<number | null>(null)
  const [dateInput, setDateInput] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [demandesRes, fournsRes] = await Promise.all([
        api.get('/cheques/demandes/'),
        api.get('/fournisseurs/'),
      ])
      setDemandes(demandesRes.data)
      setFournisseurs(fournsRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async () => {
    if (!form.titre || !form.montant || !form.date_souhaitee_signature) {
      setError('Titre, montant et date sont obligatoires.')
      return
    }
    setError('')
    try {
      await api.post('/cheques/demandes/', {
        titre: form.titre,
        fournisseur: form.fournisseur || null,
        montant: form.montant,
        date_souhaitee_signature: form.date_souhaitee_signature,
        categorie: 'Paiement fournisseur',
        etat_signature: 'en_cours',
        etat_livraison: 'en_cours',
      })
      setSuccess(true)
      setTimeout(() => setSuccess(false), 3000)
      setForm({ titre: '', fournisseur: '', montant: '', date_souhaitee_signature: '' })
      setShowForm(false)
      fetchData()
    } catch (err) {
      setError('Erreur lors de la création.')
    }
  }

  const handleDelete = async (id: number) => {
    await api.delete(`/cheques/demandes/${id}/`)
    fetchData()
  }

  const updateField = async (id: number, data: any) => {
    await api.patch(`/cheques/demandes/${id}/`, data)
    fetchData()
  }

  const handleAddFournisseur = async () => {
    if (!newFourn.trim()) return
    try {
      const today = new Date()
      const dateStr = new Date(today.setDate(today.getDate() + 180)).toISOString().split('T')[0]
      const res = await api.post('/fournisseurs/', {
        nom: newFourn.trim(),
        type_contrat: 'Autres',
        date_fin_rf: dateStr,
      })
      setFournisseurs(prev => [...prev, res.data])
      setForm(p => ({ ...p, fournisseur: res.data.id }))
      setNewFourn('')
      setShowAddFourn(false)
    } catch (err) { console.error(err) }
  }

  const handleAddType = (demandId: number) => {
    if (!newType.trim()) return
    const updated = [...typesPaiement, newType.trim()]
    setTypesPaiement(updated)
    updateField(demandId, { type_paiement: newType.trim() })
    setNewType('')
    setShowAddType(false)
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    border: '1px solid #e0e0e0', borderRadius: '6px',
    fontSize: '13px', outline: 'none',
  }

  const addNewInputStyle = { display: 'flex', gap: '6px', marginTop: '6px' }

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Demandes des chèques</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Suivi des demandes de chèques</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: '8px 16px', background: '#0099cc', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600'
          }}>+ Ajouter NV</button>
        </div>

        {/* SUCCESS / ERROR */}
        {success && (
          <div style={{ background: '#e8f8ef', border: '1px solid #a8d5b5', borderRadius: '6px', padding: '12px 16px', fontSize: '13px', color: '#1a7a40', marginBottom: '16px' }}>
            ✓ Demande créée avec succès !
          </div>
        )}
        {error && (
          <div style={{ background: '#fdeaea', border: '1px solid #f5c6c6', borderRadius: '6px', padding: '12px 16px', fontSize: '13px', color: '#c0392b', marginBottom: '16px' }}>
            {error}
          </div>
        )}

        {/* FORM */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouvelle demande de chèque</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>

              {/* TITRE */}
              <div>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Titre *</label>
                <input style={inputStyle} value={form.titre}
                  onChange={e => setForm(p => ({ ...p, titre: e.target.value }))}
                  placeholder="Ex: Paiement loyer" />
              </div>

              {/* FOURNISSEUR + Add New */}
              <div>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Fournisseur</label>
                <select style={inputStyle} value={form.fournisseur}
                  onChange={e => {
                    if (e.target.value === '__add_fourn__') { setShowAddFourn(true) }
                    else { setForm(p => ({ ...p, fournisseur: e.target.value })); setShowAddFourn(false) }
                  }}>
                  <option value="">— Aucun —</option>
                  {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                  <option value="__add_fourn__">➕ Add New</option>
                </select>
                {showAddFourn && (
                  <div style={addNewInputStyle}>
                    <input style={{ ...inputStyle, flex: 1 }} value={newFourn}
                      onChange={e => setNewFourn(e.target.value)}
                      placeholder="Nom du fournisseur..."
                      onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddFournisseur())} />
                    <button type="button" onClick={handleAddFournisseur}
                      style={{ padding: '8px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button>
                    <button type="button" onClick={() => { setShowAddFourn(false); setNewFourn('') }}
                      style={{ padding: '8px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                  </div>
                )}
              </div>

              {/* MONTANT */}
              <div>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Montant (DH) *</label>
                <input style={inputStyle} type="number" value={form.montant}
                  onChange={e => setForm(p => ({ ...p, montant: e.target.value }))}
                  placeholder="0.00" />
              </div>

              {/* DATE SOUHAITÉE SIGNATURE */}
              <div>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date souhaitée de signature *</label>
                <input style={inputStyle} type="date" value={form.date_souhaitee_signature}
                  onChange={e => setForm(p => ({ ...p, date_souhaitee_signature: e.target.value }))} />
              </div>

            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={handleSubmit} style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                Enregistrer
              </button>
              <button onClick={() => { setShowForm(false); setError(''); setShowAddFourn(false) }}
                style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>
                Annuler
              </button>
            </div>
          </div>
        )}

        {/* TABLEAU */}
        <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e8eaed', overflow: 'auto' }}>
          {loading ? (
            <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  {['ID', 'Titre', 'Fournisseur', 'Montant', 'Date souhaitée signature', 'Catégorie', 'État signature', 'État livraison', 'Date échéance', 'Type de paiement', 'Supprimer'].map(h => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left', color: '#888',
                      fontWeight: '500', borderBottom: '1px solid #e8eaed', whiteSpace: 'nowrap'
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {demandes.length === 0 ? (
                  <tr><td colSpan={11} style={{ textAlign: 'center', padding: '32px', color: '#aaa' }}>Aucune demande</td></tr>
                ) : demandes.map((d: any) => (
                  <tr key={d.id} style={{ borderBottom: '1px solid #f5f5f5' }}>

                    <td style={{ padding: '10px 14px', color: '#aaa' }}>{d.id}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '500', color: '#2c2c2c' }}>{d.titre}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{d.fournisseur_nom || '—'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '600', color: '#1a3a6b' }}>
                      {Number(d.montant).toLocaleString('fr-FR')} DH
                    </td>

                    {/* DATE SOUHAITÉE SIGNATURE modifiable */}
                    <td style={{ padding: '10px 14px' }}>
                      {editingDate === d.id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input type="date" value={dateInput}
                            onChange={e => setDateInput(e.target.value)}
                            style={{ ...inputStyle, width: '140px', padding: '4px 8px' }} />
                          <button onClick={async () => {
                            await updateField(d.id, { date_souhaitee_signature: dateInput })
                            setEditingDate(null)
                          }} style={{ padding: '4px 8px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✓</button>
                          <button onClick={() => setEditingDate(null)}
                            style={{ padding: '4px 8px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#555' }}>
                            {d.date_souhaitee_signature ? new Date(d.date_souhaitee_signature).toLocaleDateString('fr-FR') : '—'}
                          </span>
                          <button onClick={() => { setEditingDate(d.id); setDateInput(d.date_souhaitee_signature || '') }}
                            style={{ padding: '2px 6px', background: '#e8f4fb', color: '#0099cc', border: '1px solid #b3d9f0', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}>✏️</button>
                        </div>
                      )}
                    </td>

                    {/* CATÉGORIE auto */}
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ background: '#e8f4fb', color: '#0099cc', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '500' }}>
                        {d.categorie}
                      </span>
                    </td>

                    {/* ÉTAT SIGNATURE */}
                    <td style={{ padding: '10px 14px' }}>
                      <select value={d.etat_signature}
                        onChange={e => updateField(d.id, { etat_signature: e.target.value })}
                        style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '11px',
                          border: '1px solid #e0e0e0', cursor: 'pointer',
                          background: d.etat_signature === 'signe' ? '#e8f8ef' : '#fff3e0',
                          color: d.etat_signature === 'signe' ? '#1a7a40' : '#e65100'
                        }}>
                        <option value="en_cours">En cours</option>
                        <option value="signe">Signé</option>
                      </select>
                    </td>

                    {/* ÉTAT LIVRAISON */}
                    <td style={{ padding: '10px 14px' }}>
                      <select value={d.etat_livraison}
                        onChange={e => updateField(d.id, { etat_livraison: e.target.value })}
                        style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '11px',
                          border: '1px solid #e0e0e0', cursor: 'pointer',
                          background: d.etat_livraison === 'livre' ? '#e8f8ef' : '#fff3e0',
                          color: d.etat_livraison === 'livre' ? '#1a7a40' : '#e65100'
                        }}>
                        <option value="en_cours">En cours</option>
                        <option value="livre">Livré</option>
                      </select>
                    </td>

                    {/* DATE ÉCHÉANCE modifiable */}
                    <td style={{ padding: '10px 14px' }}>
                      {editingEcheance === d.id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input type="date" value={echeanceInput}
                            onChange={e => setEcheanceInput(e.target.value)}
                            style={{ ...inputStyle, width: '140px', padding: '4px 8px' }} />
                          <button onClick={async () => {
                            await updateField(d.id, { date_echeance: echeanceInput })
                            setEditingEcheance(null)
                          }} style={{ padding: '4px 8px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✓</button>
                          <button onClick={() => setEditingEcheance(null)}
                            style={{ padding: '4px 8px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <span style={{ color: '#555' }}>
                            {d.date_echeance ? new Date(d.date_echeance).toLocaleDateString('fr-FR') : '—'}
                          </span>
                          <button onClick={() => { setEditingEcheance(d.id); setEcheanceInput(d.date_echeance || '') }}
                            style={{ padding: '2px 6px', background: '#e8f4fb', color: '#0099cc', border: '1px solid #b3d9f0', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}>✏️</button>
                        </div>
                      )}
                    </td>

                    {/* TYPE PAIEMENT + Add New */}
                    <td style={{ padding: '10px 14px' }}>
                      <select value={d.type_paiement || ''}
                        onChange={e => {
                          if (e.target.value === '__add_type__') { setShowAddType(true) }
                          else { updateField(d.id, { type_paiement: e.target.value }) }
                        }}
                        style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #e0e0e0', cursor: 'pointer', minWidth: '120px' }}>
                        <option value="">— Choisir —</option>
                        {typesPaiement.map(t => <option key={t} value={t}>{t}</option>)}
                        <option value="__add_type__">➕ Add New</option>
                      </select>
                      {showAddType && (
                        <div style={addNewInputStyle}>
                          <input style={{ ...inputStyle, flex: 1 }} value={newType}
                            onChange={e => setNewType(e.target.value)}
                            placeholder="Nouveau type..."
                            onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddType(d.id))} />
                          <button type="button" onClick={() => handleAddType(d.id)}
                            style={{ padding: '6px 10px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button>
                          <button type="button" onClick={() => { setShowAddType(false); setNewType('') }}
                            style={{ padding: '6px 10px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                        </div>
                      )}
                    </td>

                    {/* SUPPRIMER */}
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => handleDelete(d.id)} style={{
                        padding: '4px 10px', background: '#fdeaea', color: '#c0392b',
                        border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer'
                      }}>🗑</button>
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

export default DemandesCheques