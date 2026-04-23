import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import SortableTable from '../components/SortableTable'
import ImportExcel from '../components/ImportExcel'

const CHOIX = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'ok', label: 'OK' },
  { value: 'nok', label: 'NOK' },
]

const TYPES_PAIEMENT = ['Chèque', 'Virement', 'Espèces', 'Carte bancaire', 'Traite', 'Autres']

const choixStyle = (val: string) => {
  if (val === 'ok') return { bg: '#e8f8ef', color: '#1a7a40' }
  if (val === 'nok') return { bg: '#fdeaea', color: '#c0392b' }
  return { bg: '#fff3e0', color: '#e65100' }
}

const Commandes = () => {
  document.title = 'Gestion de commandes — Newiris'

  const [commandes, setCommandes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [typesPaiement, setTypesPaiement] = useState<string[]>(TYPES_PAIEMENT)
  const [showAddType, setShowAddType] = useState(false)
  const [newType, setNewType] = useState('')
  const [form, setForm] = useState({
    titre: '', fournisseur: '', montant: '',
    echeance: '', mode_livraison: '', type_paiement: '',
  })
  const [docFile, setDocFile] = useState<File | null>(null)

  const fetchData = async () => {
    try {
      const cmdRes = await api.get('/commandes/')
      setCommandes(cmdRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const fd = new FormData()
      fd.append('titre', form.titre)
      if (form.fournisseur) fd.append('fournisseur_nom', form.fournisseur)
      if (form.montant) fd.append('montant', form.montant)
      if (form.echeance) fd.append('echeance', form.echeance)
      fd.append('mode_livraison', form.mode_livraison)
      fd.append('type_paiement', form.type_paiement)
      fd.append('validation_direction', 'en_attente')
      fd.append('validation_finance', 'en_attente')
      if (docFile) fd.append('demande_achat', docFile)
      await api.post('/commandes/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setShowForm(false)
      setForm({ titre: '', fournisseur: '', montant: '', echeance: '', mode_livraison: '', type_paiement: '' })
      setDocFile(null)
      await fetchData()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: number) => {
    try { await api.delete(`/commandes/${id}/`); await fetchData() } catch (err) { console.error(err) }
  }

  const updateField = async (id: number, data: any) => {
    try { await api.patch(`/commandes/${id}/`, data); await fetchData() } catch (err) { console.error(err) }
  }

  const uploadDoc = async (id: number, file: File) => {
    try {
      const fd = new FormData()
      fd.append('demande_achat', file)
      await api.patch(`/commandes/${id}/`, fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      await fetchData()
    } catch (err) { console.error(err) }
  }

  const handleImport = async (rows: any[]) => {
    for (const row of rows) {
      try {
        await api.post('/commandes/', {
          titre: row.titre || 'Sans titre',
          fournisseur: null,
          montant: row.montant ? parseFloat(String(row.montant).replace(',', '.')) : null,
          echeance: row.echeance || null,
          mode_livraison: row.mode_livraison || '',
          type_paiement: row.type_paiement || '',
          validation_direction: 'en_attente',
          validation_finance: 'en_attente',
        })
      } catch (err) { console.error(err) }
    }
    setLoading(true)
    await fetchData()
  }

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none' }
  const addNewStyle = { display: 'flex', gap: '6px', marginTop: '6px' }

  const tableData = commandes.map(c => ({
    ...c,
    fournisseur_nom: c.fournisseur_nom || '—',
    montant_fmt: c.montant ? `${Number(c.montant).toLocaleString('fr-FR')} DH` : '—',
    doc_url: c.doc_url || null,
  }))

  const ChoixSelect = ({ id, field, value }: { id: number, field: string, value: string }) => {
    const s = choixStyle(value)
    return (
      <select value={value} onChange={e => updateField(id, { [field]: e.target.value })}
        style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #e0e0e0', cursor: 'pointer', background: s.bg, color: s.color, fontWeight: '600' }}>
        {CHOIX.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
      </select>
    )
  }

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Gestion de commandes</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Suivi des commandes et validations</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ImportExcel
              onImport={handleImport}
              columns={[
                { key: 'titre', label: 'Titre' },
                { key: 'fournisseur', label: 'Fournisseur' },
                { key: 'montant', label: 'Montant' },
                { key: 'echeance', label: 'Échéance (jours)' },
                { key: 'mode_livraison', label: 'Durée de livraison (jours)' },
                { key: 'type_paiement', label: 'Type de paiement' },
              ]}
            />
            <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', background: '#0099cc', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>+ Ajouter NV</button>
          </div>
        </div>

        {showForm && (
          <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouvelle commande</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Titre *</label>
                  <input style={inputStyle} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required placeholder="Ex: Commande matériel" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Fournisseur</label>
                  <input style={inputStyle} value={form.fournisseur} onChange={e => setForm({ ...form, fournisseur: e.target.value })} placeholder="Nom du fournisseur" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Montant (DH)</label>
                  <input style={inputStyle} type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} placeholder="0.00" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Échéance (jours)</label>
                  <input style={inputStyle} value={form.echeance} onChange={e => setForm({ ...form, echeance: e.target.value })} placeholder="Ex: 30" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Durée de livraison (jours)</label>
                  <input style={inputStyle} value={form.mode_livraison} onChange={e => setForm({ ...form, mode_livraison: e.target.value })} placeholder="Ex: 7" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Type de paiement</label>
                  <select style={inputStyle} value={form.type_paiement}
                    onChange={e => { if (e.target.value === '__add__') { setShowAddType(true) } else { setForm({ ...form, type_paiement: e.target.value }); setShowAddType(false) } }}>
                    <option value="">— Choisir —</option>
                    {typesPaiement.map(t => <option key={t} value={t}>{t}</option>)}
                    <option value="__add__">➕ Add New</option>
                  </select>
                  {showAddType && (
                    <div style={addNewStyle}>
                      <input style={{ ...inputStyle, flex: 1 }} value={newType} onChange={e => setNewType(e.target.value)} placeholder="Nouveau type..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), newType.trim() && (setTypesPaiement([...typesPaiement, newType.trim()]), setForm({ ...form, type_paiement: newType.trim() }), setNewType(''), setShowAddType(false)))} />
                      <button type="button" onClick={() => { if (newType.trim()) { setTypesPaiement([...typesPaiement, newType.trim()]); setForm({ ...form, type_paiement: newType.trim() }); setNewType(''); setShowAddType(false) } }} style={{ padding: '8px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button>
                      <button type="button" onClick={() => { setShowAddType(false); setNewType('') }} style={{ padding: '8px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                    </div>
                  )}
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Demande Achat (Document)</label>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', border: '2px dashed #e0e0e0', borderRadius: '8px', cursor: 'pointer', background: docFile ? '#e8f4fb' : '#fafafa', borderColor: docFile ? '#0099cc' : '#e0e0e0' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: docFile ? '#0099cc' : '#e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, color: '#fff' }}>{docFile ? '✓' : '📎'}</div>
                    <div>
                      <div style={{ fontSize: '12px', fontWeight: '600', color: docFile ? '#0099cc' : '#555' }}>{docFile ? docFile.name : 'Cliquer pour uploader un document'}</div>
                      <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>{docFile ? `${(docFile.size / 1024).toFixed(1)} KB` : 'PDF, JPG, PNG, DOC'}</div>
                    </div>
                    <input type="file" accept=".pdf,.jpg,.png,.doc,.docx" onChange={e => setDocFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  </label>
                  {docFile && <button type="button" onClick={() => setDocFile(null)} style={{ marginTop: '6px', padding: '3px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Supprimer</button>}
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                <button type="button" onClick={() => { setShowForm(false); setShowAddType(false); setDocFile(null) }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div>
        ) : (
          <SortableTable
            emptyMessage="Aucune commande"
            columns={[
              { key: 'id', label: 'ID', render: (_v: any, row: any) => <span style={{ color: '#aaa' }}>{row.id}</span> },
              { key: 'titre', label: 'Titre', render: (_v: any, row: any) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{row.titre}</span> },
              { key: 'fournisseur_nom', label: 'Fournisseur', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.fournisseur_nom}</span> },
              { key: 'montant_fmt', label: 'Montant', render: (_v: any, row: any) => <span style={{ fontWeight: '600', color: '#1a3a6b' }}>{row.montant_fmt}</span> },
              {
                key: 'echeance', label: 'Échéance (jours)', sortable: false,
                render: (_v: any, row: any) => (
                  <input
                    defaultValue={row.echeance || ''}
                    onBlur={e => { if (e.target.value !== String(row.echeance || '')) updateField(row.id, { echeance: e.target.value }) }}
                    style={{ padding: '3px 8px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '11px', width: '80px', outline: 'none' }}
                    placeholder="Ex: 30"
                  />
                )
              },
              {
                key: 'mode_livraison', label: 'Durée de livraison (jours)', sortable: false,
                render: (_v: any, row: any) => (
                  <input
                    defaultValue={row.mode_livraison || ''}
                    onBlur={e => { if (e.target.value !== String(row.mode_livraison || '')) updateField(row.id, { mode_livraison: e.target.value }) }}
                    style={{ padding: '3px 8px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '11px', width: '80px', outline: 'none' }}
                    placeholder="Ex: 7"
                  />
                )
              },
              {
                key: 'type_paiement', label: 'Type de paiement', sortable: false,
                render: (_v: any, row: any) => (
                  <select value={row.type_paiement || ''} onChange={e => updateField(row.id, { type_paiement: e.target.value })}
                    style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #e0e0e0', cursor: 'pointer', minWidth: '120px' }}>
                    <option value="">— Choisir —</option>
                    {typesPaiement.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                )
              },
              {
                key: 'demande_achat', label: 'Demande Achat (Doc)', sortable: false,
                render: (_v: any, row: any) => (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    {row.doc_url ? (
                      <>
                        <a href={row.doc_url} target="_blank" rel="noreferrer"
                          style={{ padding: '3px 8px', background: '#e8f4fb', color: '#0099cc', border: '1px solid #b3d9f0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', textDecoration: 'none' }}>
                          📄 Voir
                        </a>
                        <label style={{ padding: '3px 8px', background: '#fff3e0', color: '#e65100', border: '1px solid #ffd08a', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                          🔄
                          <input type="file" accept=".pdf,.jpg,.png,.doc,.docx" style={{ display: 'none' }}
                            onChange={async e => { const file = e.target.files?.[0]; if (file) await uploadDoc(row.id, file) }} />
                        </label>
                      </>
                    ) : (
                      <label style={{ padding: '3px 10px', background: '#f8f9fa', color: '#555', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                        📎 Uploader
                        <input type="file" accept=".pdf,.jpg,.png,.doc,.docx" style={{ display: 'none' }}
                          onChange={async e => { const file = e.target.files?.[0]; if (file) await uploadDoc(row.id, file) }} />
                      </label>
                    )}
                  </div>
                )
              },
              { key: 'validation_direction', label: 'Validation Direction', render: (_v: any, row: any) => <ChoixSelect id={row.id} field="validation_direction" value={row.validation_direction} /> },
              { key: 'validation_finance', label: 'Validation Finance', render: (_v: any, row: any) => <ChoixSelect id={row.id} field="validation_finance" value={row.validation_finance} /> },
              {
                key: 'actions', label: 'Actions', sortable: false,
                render: (_v: any, row: any) => (
                  <button onClick={() => handleDelete(row.id)} style={{ padding: '4px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Supprimer</button>
                )
              },
            ]}
            data={tableData}
          />
        )}
      </div>
    </Layout>
  )
}

export default Commandes