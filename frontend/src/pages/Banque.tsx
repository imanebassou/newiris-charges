import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const categoriesBanque = [
  'Loyer', 'Électricité', 'Eau', 'Internet', 'Téléphone',
  'Assurance', 'Salaires', 'Transport', 'Maintenance',
  'Fournitures bureau', 'Vente', 'Prestation', 'Autres',
]

const Banque = () => {
  document.title = 'Banque — Newiris'

  const [actions, setActions] = useState<any[]>([])
  const [soldeInfo, setSoldeInfo] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingSolde, setEditingSolde] = useState(false)
  const [newSolde, setNewSolde] = useState('')
  const [categories, setCategories] = useState<string[]>(categoriesBanque)
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [form, setForm] = useState({
    type: 'entree', date: '', titre: '',
    description: '', montant: '', categorie: '', statut: 'en_cours'
  })

  const fetchData = async () => {
    try {
      const [actionsRes, soldeRes] = await Promise.all([
        api.get('/banque/actions/'),
        api.get('/banque/solde-calcule/'),
      ])
      setActions(actionsRes.data)
      setSoldeInfo(soldeRes.data)
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
      await api.post('/banque/actions/', {
        type: form.type,
        date: form.date,
        titre: form.titre,
        description: form.description,
        montant: parseFloat(form.montant),
        categorie: form.categorie,
        statut: form.statut,
      })
      setShowForm(false)
      setForm({ type: 'entree', date: '', titre: '', description: '', montant: '', categorie: '', statut: 'en_cours' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (id: number) => {
    if (!confirm('Supprimer cette action ?')) return
    try {
      await api.delete(`/banque/actions/${id}/`)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleSoldeUpdate = async () => {
    try {
      await api.put('/banque/solde/', { montant: parseFloat(newSolde) })
      setEditingSolde(false)
      setNewSolde('')
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddCat = () => {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()])
      setForm({ ...form, categorie: newCat.trim() })
      setNewCat('')
      setShowAddCat(false)
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

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Banque</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Gestion des entrées et sorties bancaires</p>
          </div>
          <button onClick={() => setShowForm(!showForm)} style={{
            padding: '8px 16px', background: '#0099cc', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600'
          }}>+ Ajouter NV</button>
        </div>

        {/* SOLDE CARD */}
        <div style={{
          background: '#fff', borderRadius: '8px', padding: '20px',
          border: '1px solid #e8eaed', borderTop: '3px solid #1a3a6b',
          marginBottom: '20px', display: 'inline-block', minWidth: '280px'
        }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Solde en DH</div>
          {editingSolde ? (
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '8px' }}>
              <input
                style={{ ...inputStyle, width: '160px' }}
                type="number"
                value={newSolde}
                onChange={e => setNewSolde(e.target.value)}
                placeholder="Nouveau solde..."
                autoFocus
              />
              <button onClick={handleSoldeUpdate} style={{
                padding: '8px 14px', background: '#1a3a6b', color: '#fff',
                border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
              }}>OK</button>
              <button onClick={() => { setEditingSolde(false); setNewSolde('') }} style={{
                padding: '8px 14px', background: '#fff', color: '#555',
                border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
              }}>✕</button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ fontSize: '26px', fontWeight: '700', color: '#1a3a6b' }}>
                {soldeInfo ? soldeInfo.solde_final.toLocaleString('fr-FR') : '—'} DH
              </div>
              <button onClick={() => { setEditingSolde(true); setNewSolde(soldeInfo?.solde_base?.toString() || '') }} style={{
                padding: '4px 10px', background: '#e8f4fb', color: '#0099cc',
                border: '1px solid #b3d9f0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer'
              }}>✏️ edit</button>
            </div>
          )}
          {soldeInfo && (
            <div style={{ marginTop: '8px', fontSize: '11px', color: '#aaa' }}>
              ↑ Entrées : {soldeInfo.entrees.toLocaleString('fr-FR')} DH &nbsp;|&nbsp;
              ↓ Sorties : {soldeInfo.sorties.toLocaleString('fr-FR')} DH
            </div>
          )}
        </div>

        {/* FORMULAIRE */}
        {showForm && (
          <div style={{
            background: '#fff', borderRadius: '8px', padding: '20px',
            border: '1px solid #e8eaed', marginBottom: '20px'
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>
              Nouvelle action bancaire
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>

                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Type *</label>
                  <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
                    <option value="entree">Entrée</option>
                    <option value="sortie">Sortie</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date *</label>
                  <input style={inputStyle} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Titre *</label>
                  <input style={inputStyle} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required placeholder="Ex: Entrée X" />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Description</label>
                  <input style={inputStyle} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description..." />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Montant (DH) *</label>
                  <input style={inputStyle} type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} required placeholder="Ex: 2000" />
                </div>

                {/* CATÉGORIE + Add New */}
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Catégorie</label>
                  <select style={inputStyle} value={form.categorie}
                    onChange={e => {
                      if (e.target.value === '__add_cat__') { setShowAddCat(true) }
                      else { setForm({ ...form, categorie: e.target.value }); setShowAddCat(false) }
                    }}>
                    <option value="">Sélectionner une catégorie...</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="__add_cat__">➕ Add New</option>
                  </select>
                  {showAddCat && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input style={{ ...inputStyle, flex: 1 }} value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nouvelle catégorie..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCat())} />
                      <button type="button" onClick={handleAddCat} style={{ padding: '8px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button>
                      <button type="button" onClick={() => { setShowAddCat(false); setNewCat('') }} style={{ padding: '8px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Statut</label>
                  <select style={inputStyle} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                    <option value="en_cours">En cours</option>
                    <option value="traitee">Traitée</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" style={{
                  padding: '8px 20px', background: '#1a3a6b', color: '#fff',
                  border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
                }}>Créer</button>
                <button type="button" onClick={() => { setShowForm(false); setShowAddCat(false) }} style={{
                  padding: '8px 20px', background: '#fff', color: '#555',
                  border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
                }}>Annuler</button>
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
                  {['#', 'Type', 'Date', 'Titre', 'Description', 'Montant', 'Catégorie', 'Statut', 'Actions'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {actions.map(action => (
                  <tr key={action.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                    <td style={{ padding: '10px 14px', color: '#aaa' }}>{action.id}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                        background: action.type === 'entree' ? '#e8f8ef' : '#fdeaea',
                        color: action.type === 'entree' ? '#1a7a40' : '#c0392b',
                      }}>
                        {action.type === 'entree' ? '↑ Entrée' : '↓ Sortie'}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{new Date(action.date).toLocaleDateString('fr-FR')}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '500', color: '#2c2c2c' }}>{action.titre}</td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{action.description || '—'}</td>
                    <td style={{ padding: '10px 14px', fontWeight: '600', color: action.type === 'entree' ? '#1a7a40' : '#c0392b' }}>
                      {action.type === 'entree' ? '+' : '-'}{parseFloat(action.montant).toLocaleString('fr-FR')} DH
                    </td>
                    <td style={{ padding: '10px 14px', color: '#555' }}>{action.categorie || '—'}</td>
                    <td style={{ padding: '10px 14px' }}>
                      <select
                        value={action.statut}
                        onChange={async e => {
                          try {
                            await api.patch(`/banque/actions/${action.id}/`, { statut: e.target.value })
                            fetchData()
                          } catch (err) { console.error(err) }
                        }}
                        style={{
                          padding: '3px 8px', borderRadius: '4px', fontSize: '11px',
                          border: '1px solid #e0e0e0', cursor: 'pointer',
                          background: action.statut === 'traitee' ? '#e8f8ef' : '#fff3e0',
                          color: action.statut === 'traitee' ? '#1a7a40' : '#e65100',
                        }}>
                        <option value="en_cours">En cours</option>
                        <option value="traitee">Traitée</option>
                      </select>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <button onClick={() => handleDelete(action.id)} style={{
                        padding: '4px 10px', background: '#fdeaea', color: '#c0392b',
                        border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer'
                      }}>Supprimer</button>
                    </td>
                  </tr>
                ))}
                {actions.length === 0 && (
                  <tr>
                    <td colSpan={9} style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
                      Aucune action bancaire
                    </td>
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

export default Banque