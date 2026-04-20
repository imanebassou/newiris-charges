import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import SortableTable from '../components/SortableTable'
import ImportExcel from '../components/ImportExcel'

const categoriesBanque = [
  'Loyer', 'Électricité', 'Eau', 'Internet', 'Téléphone',
  'Assurance', 'Salaires', 'Transport', 'Maintenance',
  'Fournitures bureau', 'Vente', 'Prestation', 'Autres',
]

const Banque = () => {
  document.title = 'Banque — Newiris'

  const [actions, setActions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [categories, setCategories] = useState<string[]>(categoriesBanque)
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [form, setForm] = useState({
    type: 'entree', date: '', titre: '',
    description: '', montant: '', categorie: '', statut: 'en_cours'
  })

  const today = new Date().toISOString().split('T')[0]

  const fetchData = async () => {
    try {
      const actionsRes = await api.get('/banque/actions/')
      setActions(actionsRes.data)
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
        type: form.type, date: form.date, titre: form.titre,
        description: form.description, montant: parseFloat(form.montant),
        categorie: form.categorie, statut: form.statut,
      })
      setShowForm(false)
      setForm({ type: 'entree', date: '', titre: '', description: '', montant: '', categorie: '', statut: 'en_cours' })
      await fetchData()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/banque/actions/${id}/`)
      await fetchData()
    } catch (err) { console.error(err) }
  }

  const handleAddCat = () => {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()])
      setForm({ ...form, categorie: newCat.trim() })
      setNewCat(''); setShowAddCat(false)
    }
  }

  const handleImport = async (rows: any[]) => {
    for (const row of rows) {
      try {
        await api.post('/banque/actions/', {
          type: row.type === 'Entrée' || row.type === 'entree' ? 'entree' : 'sortie',
          date: row.date || today,
          titre: row.titre || 'Sans titre',
          description: row.description || '',
          montant: parseFloat(String(row.montant || '0').replace(',', '.')) || 0,
          categorie: row.categorie || '',
          statut: row.statut === 'Traitée' || row.statut === 'traitee' ? 'traitee' : 'en_cours',
        })
      } catch (err) { console.error(err) }
    }
    setLoading(true)
    await fetchData()
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    border: '1px solid #e0e0e0', borderRadius: '6px',
    fontSize: '13px', outline: 'none',
  }

  const totalEntrees = actions.filter(a => a.type === 'entree' && a.statut === 'traitee').reduce((sum, a) => sum + parseFloat(a.montant), 0)
  const totalSorties = actions.filter(a => a.type === 'sortie' && a.statut === 'traitee').reduce((sum, a) => sum + parseFloat(a.montant), 0)
  const solde = totalEntrees - totalSorties

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Banque</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Gestion des entrées et sorties bancaires</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ImportExcel
              onImport={handleImport}
              columns={[
                { key: 'type', label: 'Type' },
                { key: 'date', label: 'Date' },
                { key: 'titre', label: 'Titre' },
                { key: 'description', label: 'Description' },
                { key: 'montant', label: 'Montant' },
                { key: 'categorie', label: 'Catégorie' },
                { key: 'statut', label: 'Statut' },
              ]}
            />
            <button onClick={() => setShowForm(!showForm)} style={{
              padding: '8px 16px', background: '#0099cc', color: '#fff',
              border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600'
            }}>+ Ajouter NV</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed', borderTop: '3px solid #1a3a6b', minWidth: '200px' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Solde en DH</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a3a6b' }}>{solde.toLocaleString('fr-FR')} DH</div>
            <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>Entrées traitées - Sorties traitées</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed', borderTop: '3px solid #1a7a40', minWidth: '180px' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Total entrées traitées</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a7a40' }}>+{totalEntrees.toLocaleString('fr-FR')} DH</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed', borderTop: '3px solid #c0392b', minWidth: '180px' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Total sorties traitées</div>
            <div style={{ fontSize: '22px', fontWeight: '700', color: '#c0392b' }}>-{totalSorties.toLocaleString('fr-FR')} DH</div>
          </div>
        </div>

        {showForm && (
          <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouvelle action bancaire</h3>
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
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Catégorie</label>
                  <select style={inputStyle} value={form.categorie}
                    onChange={e => {
                      if (e.target.value === '__add_cat__') { setShowAddCat(true) }
                      else { setForm({ ...form, categorie: e.target.value }); setShowAddCat(false) }
                    }}>
                    <option value="">Sélectionner une catégorie...</option>
                    {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    <option value="__add_cat__">+ Add New</option>
                  </select>
                  {showAddCat && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input style={{ ...inputStyle, flex: 1 }} value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nouvelle catégorie..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCat())} />
                      <button type="button" onClick={handleAddCat} style={{ padding: '8px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button>
                      <button type="button" onClick={() => { setShowAddCat(false); setNewCat('') }} style={{ padding: '8px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>X</button>
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
                <button type="submit" style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                <button type="button" onClick={() => { setShowForm(false); setShowAddCat(false) }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div>
        ) : (
          <SortableTable
            emptyMessage="Aucune action bancaire"
            columns={[
              { key: 'id', label: '#', render: (_v: any, row: any) => <span style={{ color: '#aaa' }}>{row.id}</span> },
              { key: 'type', label: 'Type', render: (_v: any, row: any) => <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', background: row.type === 'entree' ? '#e8f8ef' : '#fdeaea', color: row.type === 'entree' ? '#1a7a40' : '#c0392b' }}>{row.type === 'entree' ? 'Entrée' : 'Sortie'}</span> },
              { key: 'date', label: 'Date', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{new Date(row.date).toLocaleDateString('fr-FR')}</span> },
              { key: 'titre', label: 'Titre', render: (_v: any, row: any) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{row.titre}</span> },
              { key: 'description', label: 'Description', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.description || '—'}</span> },
              { key: 'montant', label: 'Montant', render: (_v: any, row: any) => <span style={{ fontWeight: '600', color: row.statut === 'en_cours' ? '#aaa' : row.type === 'entree' ? '#1a7a40' : '#c0392b' }}>{row.type === 'entree' ? '+' : '-'}{parseFloat(row.montant).toLocaleString('fr-FR')} DH{row.statut === 'en_cours' && <span style={{ fontSize: '9px', color: '#aaa', marginLeft: '4px' }}>(en cours)</span>}</span> },
              { key: 'categorie', label: 'Catégorie', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.categorie || '—'}</span> },
              { key: 'statut', label: 'Statut', render: (_v: any, row: any) => (
                <select value={row.statut} onChange={async e => { try { await api.patch(`/banque/actions/${row.id}/`, { statut: e.target.value }); await fetchData() } catch (err) { console.error(err) } }}
                  style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #e0e0e0', cursor: 'pointer', background: row.statut === 'traitee' ? '#e8f8ef' : '#fff3e0', color: row.statut === 'traitee' ? '#1a7a40' : '#e65100' }}>
                  <option value="en_cours">En cours</option>
                  <option value="traitee">Traitée</option>
                </select>
              )},
              { key: 'actions', label: 'Actions', sortable: false, render: (_v: any, row: any) => <button onClick={() => handleDelete(row.id)} style={{ padding: '4px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Supprimer</button> },
            ]}
            data={actions}
          />
        )}
      </div>
    </Layout>
  )
}

export default Banque