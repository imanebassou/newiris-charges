import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import Layout from '../components/Layout'
import api from '../api/axios'
import SortableTable from '../components/SortableTable'
import ImportExcel from '../components/ImportExcel'

const TYPES_PAIEMENT_DEFAULT = ['Chèque', 'Virement', 'Espèces', 'Carte bancaire']

const CHOIX_LABELS: Record<string, string> = { en_attente: 'En attente', ok: 'OK', nok: 'NOK' }
const choixStyle = (val: string) => {
  if (val === 'ok') return { bg: '#e8f8ef', color: '#1a7a40' }
  if (val === 'nok') return { bg: '#fdeaea', color: '#c0392b' }
  return { bg: '#fff3e0', color: '#e65100' }
}

const DemandesCheques = () => {
  document.title = 'Demandes Chèques — Newiris'
  const navigate = useNavigate()

  const [demandes, setDemandes] = useState<any[]>([])
  const [commandes, setCommandes] = useState<any[]>([])
  const [fournisseurs, setFournisseurs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [expandedCommande, setExpandedCommande] = useState<number | null>(null)
  const [form, setForm] = useState({ titre: '', fournisseur: '', montant: '', date_souhaitee_signature: '' })
  const [typesPaiement, setTypesPaiement] = useState<string[]>(TYPES_PAIEMENT_DEFAULT)
  const [showAddFourn, setShowAddFourn] = useState(false)
  const [newFourn, setNewFourn] = useState('')
  const [showAddType, setShowAddType] = useState(false)
  const [newType, setNewType] = useState('')
  const [editingEcheance, setEditingEcheance] = useState<number | null>(null)
  const [echeanceInput, setEcheanceInput] = useState('')
  const [editingDate, setEditingDate] = useState<number | null>(null)
  const [dateInput, setDateInput] = useState('')
  const [editingMontant, setEditingMontant] = useState<number | null>(null)
  const [montantInput, setMontantInput] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [demandesRes, fournsRes, commandesRes] = await Promise.all([
        api.get('/cheques/demandes/'),
        api.get('/fournisseurs/'),
        api.get('/commandes/'),
      ])
      setDemandes(demandesRes.data)
      setFournisseurs(fournsRes.data)
      const commandesValidees = commandesRes.data.filter(
        (c: any) => c.validation_finance === 'ok' && c.validation_direction === 'ok'
      )
      setCommandes(commandesValidees)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  // ─── KPI TOTAUX DYNAMIQUES ───
  const totalTout = demandes.reduce((sum, d) => sum + Number(d.montant), 0)
  const totalSigne = demandes.filter(d => d.etat_signature === 'signe').reduce((sum, d) => sum + Number(d.montant), 0)
  const totalLivre = demandes.filter(d => d.etat_livraison === 'livre').reduce((sum, d) => sum + Number(d.montant), 0)
  const totalEnCours = demandes.filter(d => d.etat_signature !== 'signe' || d.etat_livraison !== 'livre').reduce((sum, d) => sum + Number(d.montant), 0)
  const countSigne = demandes.filter(d => d.etat_signature === 'signe').length
  const countLivre = demandes.filter(d => d.etat_livraison === 'livre').length
  const countEnCours = demandes.filter(d => d.etat_signature !== 'signe' || d.etat_livraison !== 'livre').length

  const handleSubmit = async () => {
    if (!form.titre || !form.montant || !form.date_souhaitee_signature) {
      setError('Titre, montant et date sont obligatoires.'); return
    }
    setError('')
    try {
      await api.post('/cheques/demandes/', {
        titre: form.titre, fournisseur: form.fournisseur || null,
        montant: form.montant, date_souhaitee_signature: form.date_souhaitee_signature,
        categorie: 'Paiement fournisseur', etat_signature: 'en_cours', etat_livraison: 'en_cours',
      })
      setSuccess(true); setTimeout(() => setSuccess(false), 3000)
      setForm({ titre: '', fournisseur: '', montant: '', date_souhaitee_signature: '' })
      setShowForm(false); fetchData()
    } catch { setError('Erreur lors de la création.') }
  }

  const handleDelete = async (id: number) => {
    await api.delete(`/cheques/demandes/${id}/`); fetchData()
  }

  const updateField = async (id: number, data: any) => {
    await api.patch(`/cheques/demandes/${id}/`, data); fetchData()
  }

  const handleAddFournisseur = async () => {
    if (!newFourn.trim()) return
    try {
      const today = new Date()
      const dateStr = new Date(today.setDate(today.getDate() + 180)).toISOString().split('T')[0]
      const res = await api.post('/fournisseurs/', { nom: newFourn.trim(), type_contrat: 'Autres', date_fin_rf: dateStr })
      setFournisseurs(prev => [...prev, res.data])
      setForm(p => ({ ...p, fournisseur: res.data.id }))
      setNewFourn(''); setShowAddFourn(false)
    } catch (err) { console.error(err) }
  }

  const handleAddType = (demandId: number) => {
    if (!newType.trim()) return
    setTypesPaiement([...typesPaiement, newType.trim()])
    updateField(demandId, { type_paiement: newType.trim() })
    setNewType(''); setShowAddType(false)
  }

  const handleImport = async (rows: any[]) => {
    const today = new Date().toISOString().split('T')[0]
    for (const row of rows) {
      try {
        await api.post('/cheques/demandes/', {
          titre: row.titre || 'Sans titre',
          fournisseur: null,
          montant: parseFloat(String(row.montant || '0').replace(',', '.')) || 0,
          date_souhaitee_signature: row.date_souhaitee_signature || row.date || today,
          categorie: row.categorie || 'Paiement fournisseur',
          etat_signature: row.etat_signature === 'Signé' || row.etat_signature === 'signe' ? 'signe' : 'en_cours',
          etat_livraison: row.etat_livraison === 'Livré' || row.etat_livraison === 'livre' ? 'livre' : 'en_cours',
        })
      } catch (err) { console.error(err) }
    }
    setLoading(true)
    await fetchData()
  }

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none' }
  const addNewInputStyle = { display: 'flex', gap: '6px', marginTop: '6px' }

  const tableData = demandes.map(d => ({
    ...d,
    fournisseur_nom: d.fournisseur_nom || '—',
    montant_fmt: `${Number(d.montant).toLocaleString('fr-FR')} DH`,
    date_signature_fmt: d.date_souhaitee_signature ? new Date(d.date_souhaitee_signature).toLocaleDateString('fr-FR') : '—',
    date_echeance_fmt: d.date_echeance ? new Date(d.date_echeance).toLocaleDateString('fr-FR') : '—',
    etat_signature_label: d.etat_signature === 'signe' ? 'Signé' : 'En cours',
    etat_livraison_label: d.etat_livraison === 'livre' ? 'Livré' : 'En cours',
  }))

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Demandes des chèques</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Suivi des demandes de chèques</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ImportExcel
              onImport={handleImport}
              columns={[
                { key: 'titre', label: 'Titre' },
                { key: 'montant', label: 'Montant' },
                { key: 'date_souhaitee_signature', label: 'Date souhaitée signature' },
                { key: 'categorie', label: 'Catégorie' },
                { key: 'etat_signature', label: 'État signature' },
                { key: 'etat_livraison', label: 'État livraison' },
              ]}
            />
            <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', background: '#0099cc', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>+ Ajouter NV</button>
          </div>
        </div>

        {success && <div style={{ background: '#e8f8ef', border: '1px solid #a8d5b5', borderRadius: '6px', padding: '12px 16px', fontSize: '13px', color: '#1a7a40', marginBottom: '16px' }}>✓ Demande créée avec succès !</div>}
        {error && <div style={{ background: '#fdeaea', border: '1px solid #f5c6c6', borderRadius: '6px', padding: '12px 16px', fontSize: '13px', color: '#c0392b', marginBottom: '16px' }}>{error}</div>}

        {/* ─── KPI TOTAUX DYNAMIQUES ─── */}
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '14px 18px', border: '1px solid #e8eaed', borderTop: '3px solid #1a3a6b', minWidth: '160px' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Total toutes demandes</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a3a6b' }}>{totalTout.toLocaleString('fr-FR')} DH</div>
            <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>{demandes.length} demande{demandes.length > 1 ? 's' : ''}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '14px 18px', border: '1px solid #e8eaed', borderTop: '3px solid #1a7a40', minWidth: '160px' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Total signées</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#1a7a40' }}>{totalSigne.toLocaleString('fr-FR')} DH</div>
            <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>{countSigne} demande{countSigne > 1 ? 's' : ''}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '14px 18px', border: '1px solid #e8eaed', borderTop: '3px solid #0099cc', minWidth: '160px' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Total livrées</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#0099cc' }}>{totalLivre.toLocaleString('fr-FR')} DH</div>
            <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>{countLivre} demande{countLivre > 1 ? 's' : ''}</div>
          </div>
          <div style={{ background: '#fff', borderRadius: '8px', padding: '14px 18px', border: '1px solid #e8eaed', borderTop: '3px solid #e65100', minWidth: '160px' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Total en cours</div>
            <div style={{ fontSize: '20px', fontWeight: '700', color: '#e65100' }}>{totalEnCours.toLocaleString('fr-FR')} DH</div>
            <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>{countEnCours} demande{countEnCours > 1 ? 's' : ''}</div>
          </div>
        </div>

        {/* ─── COMMANDES VALIDÉES ─── */}
        {commandes.length > 0 && (
          <div style={{ marginBottom: '24px' }}>
            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a6b', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ background: '#e8f8ef', color: '#1a7a40', padding: '3px 10px', borderRadius: '4px', fontSize: '11px' }}>✓ Direction OK + Finance OK</span>
              Commandes validées ({commandes.length})
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {commandes.map(commande => {
                const isExpanded = expandedCommande === commande.id
                return (
                  <div key={commande.id} style={{ border: '1px solid #e8eaed', borderRadius: '8px', overflow: 'hidden', background: '#fff' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 20px', background: '#f8f9fa' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '15px', fontWeight: '700', color: '#1a3a6b' }}>{commande.titre}</span>
                        {commande.montant && <span style={{ fontSize: '13px', fontWeight: '600', color: '#0099cc' }}>{Number(commande.montant).toLocaleString('fr-FR')} DH</span>}
                        {commande.fournisseur_nom && commande.fournisseur_nom !== '—' && <span style={{ fontSize: '11px', color: '#888', background: '#e8eaed', padding: '2px 8px', borderRadius: '4px' }}>{commande.fournisseur_nom}</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <button onClick={() => setExpandedCommande(isExpanded ? null : commande.id)} style={{ padding: '6px 14px', background: '#fff', color: '#1a3a6b', border: '1px solid #1a3a6b', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                          {isExpanded ? 'Masquer' : 'View details'}
                        </button>
                        <button onClick={() => navigate('/commandes')} style={{ padding: '6px 14px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                          + Add new cheque
                        </button>
                      </div>
                    </div>
                    {isExpanded && (
                      <div style={{ padding: '16px 20px', borderTop: '1px solid #e8eaed' }}>
                        {/* Afficher détails de commande (Page gestion de commande) */}
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                          <thead>
                            <tr style={{ background: '#f8f9fa' }}>
                              {['ID', 'Titre', 'Fournisseur', 'Montant', 'Échéance', 'Mode de livraison', 'Type de paiement', 'Demande Achat (Doc)', 'Validation Direction', 'Validation Finance', 'Actions'].map(h => (
                                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', color: '#1a3a6b', fontWeight: '600', borderBottom: '2px solid #e8eaed', fontSize: '11px', whiteSpace: 'nowrap' }}>{h}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            <tr style={{ borderBottom: '1px solid #f5f5f5' }}>
                              <td style={{ padding: '8px 12px', color: '#aaa' }}>{commande.id}</td>
                              <td style={{ padding: '8px 12px', fontWeight: '500', color: '#2c2c2c' }}>{commande.titre}</td>
                              <td style={{ padding: '8px 12px', color: '#555' }}>{commande.fournisseur_nom || '—'}</td>
                              <td style={{ padding: '8px 12px', fontWeight: '600', color: '#1a3a6b' }}>{commande.montant ? `${Number(commande.montant).toLocaleString('fr-FR')} DH` : '—'}</td>
                              <td style={{ padding: '8px 12px', color: '#555' }}>{commande.echeance || '—'}</td>
                              <td style={{ padding: '8px 12px', color: '#555' }}>{commande.mode_livraison || '—'}</td>
                              <td style={{ padding: '8px 12px', color: '#555' }}>{commande.type_paiement || '—'}</td>
                              <td style={{ padding: '8px 12px' }}>
                                {commande.doc_url
                                  ? <a href={commande.doc_url} target="_blank" rel="noreferrer" style={{ padding: '3px 8px', background: '#e8f4fb', color: '#0099cc', border: '1px solid #b3d9f0', borderRadius: '4px', fontSize: '11px', textDecoration: 'none' }}>📄 Voir</a>
                                  : <span style={{ color: '#aaa', fontSize: '11px' }}>—</span>}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                {(() => { const s = choixStyle(commande.validation_direction); return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{CHOIX_LABELS[commande.validation_direction] || commande.validation_direction}</span> })()}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                {(() => { const s = choixStyle(commande.validation_finance); return <span style={{ background: s.bg, color: s.color, padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '600' }}>{CHOIX_LABELS[commande.validation_finance] || commande.validation_finance}</span> })()}
                              </td>
                              <td style={{ padding: '8px 12px' }}>
                                <button onClick={() => navigate('/commandes')} style={{ padding: '4px 10px', background: '#e8f4fb', color: '#0099cc', border: '1px solid #b3d9f0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Gérer</button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ─── FORMULAIRE ─── */}
        {showForm && (
          <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouvelle demande de chèque</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Titre *</label>
                <input style={inputStyle} value={form.titre} onChange={e => setForm(p => ({ ...p, titre: e.target.value }))} placeholder="Ex: Paiement loyer" />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Fournisseur</label>
                <select style={inputStyle} value={form.fournisseur} onChange={e => { if (e.target.value === '__add_fourn__') { setShowAddFourn(true) } else { setForm(p => ({ ...p, fournisseur: e.target.value })); setShowAddFourn(false) } }}>
                  <option value="">— Aucun —</option>
                  {fournisseurs.map(f => <option key={f.id} value={f.id}>{f.nom}</option>)}
                  <option value="__add_fourn__">➕ Add New</option>
                </select>
                {showAddFourn && (
                  <div style={addNewInputStyle}>
                    <input style={{ ...inputStyle, flex: 1 }} value={newFourn} onChange={e => setNewFourn(e.target.value)} placeholder="Nom du fournisseur..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddFournisseur())} />
                    <button type="button" onClick={handleAddFournisseur} style={{ padding: '8px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button>
                    <button type="button" onClick={() => { setShowAddFourn(false); setNewFourn('') }} style={{ padding: '8px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                  </div>
                )}
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Montant (DH) *</label>
                <input style={inputStyle} type="number" value={form.montant} onChange={e => setForm(p => ({ ...p, montant: e.target.value }))} placeholder="0.00" />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date souhaitée de signature *</label>
                <input style={inputStyle} type="date" value={form.date_souhaitee_signature} onChange={e => setForm(p => ({ ...p, date_souhaitee_signature: e.target.value }))} />
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={handleSubmit} style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Enregistrer</button>
              <button onClick={() => { setShowForm(false); setError(''); setShowAddFourn(false) }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        )}

        {/* ─── TABLEAU ─── */}
        <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a6b', marginBottom: '10px' }}>
          Toutes les demandes de chèques
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div>
        ) : (
          <SortableTable
            emptyMessage="Aucune demande"
            columns={[
              { key: 'id', label: 'ID', render: (_v: any, row: any) => <span style={{ color: '#aaa' }}>{row.id}</span> },
              { key: 'titre', label: 'Titre', render: (_v: any, row: any) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{row.titre}</span> },
              { key: 'fournisseur_nom', label: 'Fournisseur', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.fournisseur_nom}</span> },
              {
                key: 'montant_fmt', label: 'Montant', sortable: false,
                render: (_v: any, row: any) => editingMontant === row.id ? (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input type="number" value={montantInput} onChange={e => setMontantInput(e.target.value)}
                      style={{ ...inputStyle, width: '100px', padding: '4px 8px' }}
                      onKeyDown={e => { if (e.key === 'Enter') { updateField(row.id, { montant: parseFloat(montantInput) }); setEditingMontant(null) } }}
                    />
                    <button onClick={() => { updateField(row.id, { montant: parseFloat(montantInput) }); setEditingMontant(null) }} style={{ padding: '4px 8px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✓</button>
                    <button onClick={() => setEditingMontant(null)} style={{ padding: '4px 8px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontWeight: '600', color: '#1a3a6b' }}>{row.montant_fmt}</span>
                    <button onClick={() => { setEditingMontant(row.id); setMontantInput(String(row.montant)) }}
                      style={{ padding: '2px 6px', background: '#e8f4fb', color: '#0099cc', border: '1px solid #b3d9f0', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}>✏️</button>
                  </div>
                )
              },
              {
                key: 'date_signature_fmt', label: 'Date souhaitée signature', sortable: false,
                render: (_v: any, row: any) => editingDate === row.id ? (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input type="date" value={dateInput} onChange={e => setDateInput(e.target.value)} style={{ ...inputStyle, width: '140px', padding: '4px 8px' }} />
                    <button onClick={async () => { await updateField(row.id, { date_souhaitee_signature: dateInput }); setEditingDate(null) }} style={{ padding: '4px 8px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✓</button>
                    <button onClick={() => setEditingDate(null)} style={{ padding: '4px 8px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#555' }}>{row.date_signature_fmt}</span>
                    <button onClick={() => { setEditingDate(row.id); setDateInput(row.date_souhaitee_signature || '') }} style={{ padding: '2px 6px', background: '#e8f4fb', color: '#0099cc', border: '1px solid #b3d9f0', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}>✏️</button>
                  </div>
                )
              },
              { key: 'categorie', label: 'Catégorie', render: (_v: any, row: any) => <span style={{ background: '#e8f4fb', color: '#0099cc', padding: '3px 10px', borderRadius: '4px', fontSize: '11px', fontWeight: '500' }}>{row.categorie}</span> },
              { key: 'etat_signature_label', label: 'État signature', render: (_v: any, row: any) => (
                <select value={row.etat_signature} onChange={e => updateField(row.id, { etat_signature: e.target.value })}
                  style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #e0e0e0', cursor: 'pointer', background: row.etat_signature === 'signe' ? '#e8f8ef' : '#fff3e0', color: row.etat_signature === 'signe' ? '#1a7a40' : '#e65100' }}>
                  <option value="en_cours">En cours</option>
                  <option value="signe">Signé</option>
                </select>
              )},
              { key: 'etat_livraison_label', label: 'État livraison', render: (_v: any, row: any) => (
                <select value={row.etat_livraison} onChange={e => updateField(row.id, { etat_livraison: e.target.value })}
                  style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #e0e0e0', cursor: 'pointer', background: row.etat_livraison === 'livre' ? '#e8f8ef' : '#fff3e0', color: row.etat_livraison === 'livre' ? '#1a7a40' : '#e65100' }}>
                  <option value="en_cours">En cours</option>
                  <option value="livre">Livré</option>
                </select>
              )},
              {
                key: 'date_echeance_fmt', label: 'Date échéance', sortable: false,
                render: (_v: any, row: any) => editingEcheance === row.id ? (
                  <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                    <input type="date" value={echeanceInput} onChange={e => setEcheanceInput(e.target.value)} style={{ ...inputStyle, width: '140px', padding: '4px 8px' }} />
                    <button onClick={async () => { await updateField(row.id, { date_echeance: echeanceInput }); setEditingEcheance(null) }} style={{ padding: '4px 8px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✓</button>
                    <button onClick={() => setEditingEcheance(null)} style={{ padding: '4px 8px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                  </div>
                ) : (
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ color: '#555' }}>{row.date_echeance_fmt}</span>
                    <button onClick={() => { setEditingEcheance(row.id); setEcheanceInput(row.date_echeance || '') }} style={{ padding: '2px 6px', background: '#e8f4fb', color: '#0099cc', border: '1px solid #b3d9f0', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }}>✏️</button>
                  </div>
                )
              },
              {
                key: 'type_paiement', label: 'Type de paiement', sortable: false,
                render: (_v: any, row: any) => (
                  <div>
                    <select value={row.type_paiement || ''} onChange={e => { if (e.target.value === '__add_type__') { setShowAddType(true) } else { updateField(row.id, { type_paiement: e.target.value }) } }}
                      style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #e0e0e0', cursor: 'pointer', minWidth: '120px' }}>
                      <option value="">— Choisir —</option>
                      {typesPaiement.map(t => <option key={t} value={t}>{t}</option>)}
                      <option value="__add_type__">➕ Add New</option>
                    </select>
                    {showAddType && (
                      <div style={addNewInputStyle}>
                        <input style={{ ...inputStyle, flex: 1 }} value={newType} onChange={e => setNewType(e.target.value)} placeholder="Nouveau type..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddType(row.id))} />
                        <button type="button" onClick={() => handleAddType(row.id)} style={{ padding: '6px 10px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button>
                        <button type="button" onClick={() => { setShowAddType(false); setNewType('') }} style={{ padding: '6px 10px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                      </div>
                    )}
                  </div>
                )
              },
              { key: 'actions', label: 'Supprimer', sortable: false, render: (_v: any, row: any) => <button onClick={() => handleDelete(row.id)} style={{ padding: '4px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>🗑</button> },
            ]}
            data={tableData}
          />
        )}
      </div>
    </Layout>
  )
}

export default DemandesCheques