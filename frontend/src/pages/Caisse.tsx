import { useState, useEffect, useRef } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import SortableTable from '../components/SortableTable'
import ImportExcel from '../components/ImportExcel'

const CATEGORIES = [
  { value: 'charge_variable', label: 'Charge Variable' },
  { value: 'vehicule', label: 'Véhicule' },
  { value: 'transport', label: 'Transport' },
  { value: 'administratif', label: 'Charges administratives' },
  { value: 'equipe', label: 'Dépenses équipe' },
  { value: 'entretien', label: 'Entretien & nettoyage' },
  { value: 'autre', label: 'Autre' },
]

const fmt = (n: any) => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })

const Caisse = () => {
  document.title = 'Caisse — Newiris'

  const [activeTab, setActiveTab] = useState<'principale' | number>('principale')
  const [soldeCaisse, setSoldeCaisse] = useState<any>(null)
  const [caisses, setCaisses] = useState<any[]>([])
  const [actionsPrincipale, setActionsPrincipale] = useState<any[]>([])
  const [actionsPerso, setActionsPerso] = useState<{ [key: number]: any[] }>({})
  const [services, setServices] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showAddCaisse, setShowAddCaisse] = useState(false)
  const [showAddAction, setShowAddAction] = useState(false)
  const [editSolde, setEditSolde] = useState(false)
  const [soldeInput, setSoldeInput] = useState('')
  const [editSoldePerso, setEditSoldePerso] = useState<number | null>(null)
  const [soldePersoInput, setSoldePersoInput] = useState('')
  const [newCaisse, setNewCaisse] = useState({ nom: '', solde_initial: '' })
  const [newAction, setNewAction] = useState({
    type: 'entree', titre: '', service: '', categorie: 'autre',
    montant: '', date: new Date().toISOString().split('T')[0],
    description: '', personne: '', photo: null as File | null,
  })
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [newPerson, setNewPerson] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  useEffect(() => { fetchAll() }, [])

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [soldeRes, caissesRes, servicesRes, usersRes, actionsPRes] = await Promise.all([
        api.get('/caisse/solde/'),
        api.get('/caisse/caisses/'),
        api.get('/services/'),
        api.get('/auth/users/'),
        api.get('/caisse/actions/?principale=true'),
      ])
      setSoldeCaisse(soldeRes.data)
      setSoldeInput(soldeRes.data.montant_initial)
      setCaisses(caissesRes.data)
      setServices(servicesRes.data)
      setUsers(usersRes.data)
      setActionsPrincipale(actionsPRes.data)
      const persoData: { [key: number]: any[] } = {}
      for (const c of caissesRes.data) {
        const res = await api.get(`/caisse/actions/?caisse=${c.id}`)
        persoData[c.id] = res.data
      }
      setActionsPerso(persoData)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchActions = async (caisseId?: number) => {
    if (!caisseId) {
      const res = await api.get('/caisse/actions/?principale=true')
      setActionsPrincipale(res.data)
    } else {
      const res = await api.get(`/caisse/actions/?caisse=${caisseId}`)
      setActionsPerso(prev => ({ ...prev, [caisseId]: res.data }))
    }
    const soldeRes = await api.get('/caisse/solde/')
    setSoldeCaisse(soldeRes.data)
  }

  const saveSolde = async () => {
    await api.put('/caisse/solde/', { montant: soldeInput })
    setEditSolde(false); fetchAll()
  }

  const saveSoldePerso = async (id: number) => {
    await api.patch(`/caisse/caisses/${id}/`, { solde_initial: soldePersoInput })
    setEditSoldePerso(null); fetchAll()
  }

  const addCaisse = async () => {
    if (!newCaisse.nom) return
    await api.post('/caisse/caisses/', { nom: newCaisse.nom, solde_initial: newCaisse.solde_initial || 0 })
    setNewCaisse({ nom: '', solde_initial: '' }); setShowAddCaisse(false); fetchAll()
  }

  const deleteCaisse = async (id: number) => {
    await api.delete(`/caisse/caisses/${id}/`)
    if (activeTab === id) setActiveTab('principale')
    fetchAll()
  }

  const addAction = async () => {
    if (!newAction.titre || !newAction.montant) { setError('Titre et montant sont obligatoires.'); return }
    setError('')
    try {
      const fd = new FormData()
      fd.append('type', newAction.type)
      fd.append('titre', newAction.titre)
      fd.append('categorie', newAction.categorie)
      fd.append('montant', newAction.montant)
      fd.append('date', newAction.date)
      fd.append('description', newAction.description)
      fd.append('personne', newAction.personne)
      fd.append('statut', 'en_cours')
      if (newAction.service) fd.append('service', newAction.service)
      if (newAction.photo) fd.append('photo', newAction.photo)
      if (activeTab === 'principale') {
        fd.append('is_caisse_principale', 'true')
      } else {
        fd.append('caisse', String(activeTab))
        const caisse = caisses.find(c => c.id === activeTab)
        if (caisse) fd.append('personne', caisse.nom)
      }
      await api.post('/caisse/actions/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setSuccess(true); setTimeout(() => setSuccess(false), 3000)
      setNewAction({ type: 'entree', titre: '', service: '', categorie: 'autre', montant: '', date: new Date().toISOString().split('T')[0], description: '', personne: '', photo: null })
      if (fileRef.current) fileRef.current.value = ''
      setShowAddAction(false)
      fetchActions(activeTab === 'principale' ? undefined : activeTab as number)
    } catch { setError('Erreur lors de l\'ajout.') }
  }

  const handleImport = async (rows: any[]) => {
    for (const row of rows) {
      try {
        const fd = new FormData()
        fd.append('type', row.type === 'Entrée' || row.type === 'entree' ? 'entree' : 'sortie')
        fd.append('titre', row.titre || '')
        fd.append('categorie', row.categorie || 'autre')
        fd.append('montant', String(parseFloat(String(row.montant).replace(',', '.'))))
        fd.append('date', row.date || '')
        fd.append('description', row.description || '')
        fd.append('personne', row.personne || '')
        fd.append('statut', row.statut === 'Traitée' || row.statut === 'traitee' ? 'traitee' : 'en_cours')
        if (activeTab === 'principale') {
          fd.append('is_caisse_principale', 'true')
        } else {
          fd.append('caisse', String(activeTab))
        }
        await api.post('/caisse/actions/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      } catch (err) { console.error(err) }
    }
    fetchAll()
  }

  const handleAddPerson = () => {
    if (newPerson.trim()) {
      setUsers([...users, { id: `new_${newPerson.trim()}`, username: newPerson.trim() }])
      setNewAction(p => ({ ...p, personne: newPerson.trim() }))
      setNewPerson(''); setShowAddPerson(false)
    }
  }

  const updateStatut = async (actionId: number, statut: string, caisseId?: number) => {
    await api.patch(`/caisse/actions/${actionId}/`, { statut })
    fetchActions(caisseId)
  }

  const deleteAction = async (actionId: number, caisseId?: number) => {
    await api.delete(`/caisse/actions/${actionId}/`)
    fetchActions(caisseId)
  }

  const currentCaisse = activeTab !== 'principale' ? caisses.find(c => c.id === activeTab) : null
  const currentActions = activeTab === 'principale' ? actionsPrincipale : (actionsPerso[activeTab as number] || [])

  const soldePersoCalc = (caisse: any) => {
    const actions = actionsPerso[caisse.id] || []
    let total = Number(caisse.solde_initial || 0)
    for (const a of actions.filter((x: any) => x.statut === 'traitee')) {
      total += a.type === 'entree' ? Number(a.montant) : -Number(a.montant)
    }
    return total
  }

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none' }
  const addNewInputStyle = { display: 'flex', gap: '6px', marginTop: '6px' }

  const tableData = currentActions.map((a: any) => ({
    ...a,
    type_label: a.type === 'entree' ? 'Entrée' : 'Sortie',
    categorie_label: CATEGORIES.find(c => c.value === a.categorie)?.label || a.categorie,
    montant_fmt: `${a.type === 'entree' ? '+' : '-'}${fmt(a.montant)} DH`,
    statut_label: a.statut === 'traitee' ? 'Traitée' : 'En cours',
    service_nom: a.service_nom || '—',
    personne: a.personne || '—',
    description: a.description || '—',
  }))

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        {selectedPhoto && (
          <div onClick={() => setSelectedPhoto(null)} style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.75)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <div style={{ position: 'relative' }}>
              <img src={selectedPhoto} alt="justificatif" style={{ maxWidth: '90vw', maxHeight: '85vh', borderRadius: '8px' }} />
              <button onClick={() => setSelectedPhoto(null)} style={{ position: 'absolute', top: '-12px', right: '-12px', width: '28px', height: '28px', borderRadius: '50%', background: '#e84c3d', color: '#fff', border: 'none', fontSize: '14px', cursor: 'pointer', fontWeight: '700' }}>✕</button>
            </div>
          </div>
        )}

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Gestion de Caisse</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Suivi des soldes et transactions</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ImportExcel
              onImport={handleImport}
              columns={[
                { key: 'type', label: 'Type' },
                { key: 'titre', label: 'Titre' },
                { key: 'categorie', label: 'Catégorie' },
                { key: 'montant', label: 'Montant' },
                { key: 'date', label: 'Date' },
                { key: 'personne', label: 'Personne' },
                { key: 'description', label: 'Description' },
                { key: 'statut', label: 'Statut' },
              ]}
            />
            <button onClick={() => setShowAddAction(!showAddAction)} style={{ padding: '8px 16px', background: '#0099cc', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>+ Ajouter NV</button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
          <button onClick={() => setActiveTab('principale')} style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', background: activeTab === 'principale' ? '#1a3a6b' : '#e8edf5', color: activeTab === 'principale' ? '#fff' : '#1a3a6b', fontWeight: activeTab === 'principale' ? 700 : 400 }}>Solde Caisse</button>
          {caisses.map(c => (
            <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <button onClick={() => setActiveTab(c.id)} style={{ padding: '7px 16px', borderRadius: '6px', border: 'none', cursor: 'pointer', fontSize: '12px', background: activeTab === c.id ? '#1a3a6b' : '#e8edf5', color: activeTab === c.id ? '#fff' : '#1a3a6b', fontWeight: activeTab === c.id ? 700 : 400 }}>{c.nom}</button>
              <button onClick={() => deleteCaisse(c.id)} style={{ background: '#e84c3d', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', cursor: 'pointer', fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>×</button>
            </div>
          ))}
          <button onClick={() => setShowAddCaisse(!showAddCaisse)} style={{ padding: '7px 14px', background: '#fff', color: '#1a3a6b', border: '1px solid #1a3a6b', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>+ Caisse</button>
        </div>

        {showAddCaisse && (
          <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed', marginBottom: '16px', display: 'flex', gap: '12px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Nom de la caisse</label><input style={{ ...inputStyle, width: '180px' }} value={newCaisse.nom} onChange={e => setNewCaisse(p => ({ ...p, nom: e.target.value }))} placeholder="Ex: Caisse Ahmed" /></div>
            <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Solde initial (DH)</label><input style={{ ...inputStyle, width: '140px' }} type="number" value={newCaisse.solde_initial} onChange={e => setNewCaisse(p => ({ ...p, solde_initial: e.target.value }))} placeholder="0.00" /></div>
            <button onClick={addCaisse} style={{ padding: '8px 16px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
            <button onClick={() => setShowAddCaisse(false)} style={{ padding: '8px 16px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
          </div>
        )}

        {activeTab === 'principale' ? (
          <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed', borderTop: '3px solid #1a3a6b', marginBottom: '20px', display: 'inline-block', minWidth: '220px' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Solde Caisse</div>
            {editSolde ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <input type="number" value={soldeInput} onChange={e => setSoldeInput(e.target.value)} style={{ ...inputStyle, width: '120px' }} />
                <button onClick={saveSolde} style={{ padding: '6px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✓</button>
                <button onClick={() => setEditSolde(false)} style={{ padding: '6px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✗</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a3a6b' }}>{fmt(soldeCaisse?.solde_calcule)} DH</div>
                <button onClick={() => setEditSolde(true)} style={{ marginTop: '6px', padding: '3px 10px', background: 'none', border: '1px solid #0099cc', color: '#0099cc', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>✏️ Modifier solde initial</button>
              </>
            )}
          </div>
        ) : currentCaisse && (
          <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed', borderTop: '3px solid #0099cc', marginBottom: '20px', display: 'inline-block', minWidth: '220px' }}>
            <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Solde {currentCaisse.nom}</div>
            {editSoldePerso === currentCaisse.id ? (
              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                <input type="number" value={soldePersoInput} onChange={e => setSoldePersoInput(e.target.value)} style={{ ...inputStyle, width: '120px' }} />
                <button onClick={() => saveSoldePerso(currentCaisse.id)} style={{ padding: '6px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✓</button>
                <button onClick={() => setEditSoldePerso(null)} style={{ padding: '6px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✗</button>
              </div>
            ) : (
              <>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a3a6b' }}>{fmt(soldePersoCalc(currentCaisse))} DH</div>
                <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>Indépendant du solde caisse</div>
                <button onClick={() => { setEditSoldePerso(currentCaisse.id); setSoldePersoInput(currentCaisse.solde_initial) }} style={{ marginTop: '6px', padding: '3px 10px', background: 'none', border: '1px solid #0099cc', color: '#0099cc', borderRadius: '4px', cursor: 'pointer', fontSize: '11px' }}>✏️ Modifier solde initial</button>
              </>
            )}
          </div>
        )}

        {success && <div style={{ background: '#e8f8ef', border: '1px solid #a8d5b5', borderRadius: '6px', padding: '12px 16px', fontSize: '13px', color: '#1a7a40', marginBottom: '16px' }}>✓ Transaction ajoutée avec succès !</div>}
        {error && <div style={{ background: '#fdeaea', border: '1px solid #f5c6c6', borderRadius: '6px', padding: '12px 16px', fontSize: '13px', color: '#c0392b', marginBottom: '16px' }}>{error}</div>}

        {showAddAction && (
          <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouvelle transaction</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Type *</label><select style={inputStyle} value={newAction.type} onChange={e => setNewAction(p => ({ ...p, type: e.target.value }))}><option value="entree">Entrée</option><option value="sortie">Sortie</option></select></div>
              <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Titre *</label><input style={inputStyle} value={newAction.titre} onChange={e => setNewAction(p => ({ ...p, titre: e.target.value }))} placeholder="Ex: Règlement fournisseur" /></div>
              <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Service</label><select style={inputStyle} value={newAction.service} onChange={e => setNewAction(p => ({ ...p, service: e.target.value }))}><option value="">— Aucun —</option>{services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></div>
              <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Catégorie</label><select style={inputStyle} value={newAction.categorie} onChange={e => setNewAction(p => ({ ...p, categorie: e.target.value }))}>{CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}</select></div>
              <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Montant (DH) *</label><input style={inputStyle} type="number" value={newAction.montant} onChange={e => setNewAction(p => ({ ...p, montant: e.target.value }))} placeholder="0.00" /></div>
              <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date *</label><input style={inputStyle} type="date" value={newAction.date} onChange={e => setNewAction(p => ({ ...p, date: e.target.value }))} /></div>
              <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Description</label><input style={inputStyle} value={newAction.description} onChange={e => setNewAction(p => ({ ...p, description: e.target.value }))} placeholder="Description optionnelle" /></div>
              <div>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Personne</label>
                <select style={inputStyle} value={newAction.personne} onChange={e => { if (e.target.value === '__add_person__') { setShowAddPerson(true) } else { setNewAction(p => ({ ...p, personne: e.target.value })); setShowAddPerson(false) } }}>
                  <option value="">Sélectionner une personne...</option>
                  {users.map((u: any) => <option key={u.id} value={u.username}>{u.username}</option>)}
                  <option value="__add_person__">➕ Add New</option>
                </select>
                {showAddPerson && (
                  <div style={addNewInputStyle}>
                    <input style={{ ...inputStyle, flex: 1 }} value={newPerson} onChange={e => setNewPerson(e.target.value)} placeholder="Nom de la personne..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddPerson())} />
                    <button type="button" onClick={handleAddPerson} style={{ padding: '8px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button>
                    <button type="button" onClick={() => { setShowAddPerson(false); setNewPerson('') }} style={{ padding: '8px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>✕</button>
                  </div>
                )}
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Photo (justificatif)</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 16px', border: '2px dashed #e0e0e0', borderRadius: '8px', cursor: 'pointer', background: newAction.photo ? '#e8f4fb' : '#fafafa', borderColor: newAction.photo ? '#0099cc' : '#e0e0e0' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '8px', background: newAction.photo ? '#0099cc' : '#e8eaed', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0, color: '#fff' }}>{newAction.photo ? '✓' : '📎'}</div>
                  <div>
                    <div style={{ fontSize: '12px', fontWeight: '600', color: newAction.photo ? '#0099cc' : '#555' }}>{newAction.photo ? newAction.photo.name : 'Cliquer pour ajouter une photo'}</div>
                    <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>{newAction.photo ? `${(newAction.photo.size / 1024).toFixed(1)} KB` : 'JPG, PNG — max 5MB'}</div>
                  </div>
                  <input type="file" accept="image/*" ref={fileRef} onChange={e => setNewAction(p => ({ ...p, photo: e.target.files?.[0] || null }))} style={{ display: 'none' }} />
                </label>
                {newAction.photo && <button type="button" onClick={() => { setNewAction(p => ({ ...p, photo: null })); if (fileRef.current) fileRef.current.value = '' }} style={{ marginTop: '6px', padding: '3px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Supprimer la photo</button>}
              </div>
            </div>
            <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
              <button onClick={addAction} style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Enregistrer</button>
              <button onClick={() => { setShowAddAction(false); setError('') }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div>
        ) : (
          <SortableTable
            emptyMessage="Aucune transaction"
            columns={[
              { key: 'id', label: '#', render: (_v: any, row: any) => <span style={{ color: '#aaa' }}>{row.id}</span> },
              { key: 'type_label', label: 'Type', render: (_v: any, row: any) => <span style={{ background: row.type === 'entree' ? '#e8f8ef' : '#fdeaea', color: row.type === 'entree' ? '#1a7a40' : '#e84c3d', padding: '2px 8px', borderRadius: '12px', fontSize: '11px', fontWeight: 600 }}>{row.type === 'entree' ? '↑ Entrée' : '↓ Sortie'}</span> },
              { key: 'titre', label: 'Titre', render: (_v: any, row: any) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{row.titre}</span> },
              { key: 'service_nom', label: 'Service', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.service_nom}</span> },
              { key: 'categorie_label', label: 'Catégorie', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.categorie_label}</span> },
              { key: 'montant_fmt', label: 'Montant', render: (_v: any, row: any) => <span style={{ fontWeight: '600', color: row.type === 'entree' ? '#1a7a40' : '#e84c3d' }}>{row.montant_fmt}</span> },
              { key: 'date', label: 'Date', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.date}</span> },
              { key: 'personne', label: 'Personne', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.personne}</span> },
              { key: 'photo_url', label: 'Photo', sortable: false, render: (_v: any, row: any) => row.photo_url ? (
                <div onClick={() => setSelectedPhoto(row.photo_url)} style={{ cursor: 'pointer', display: 'inline-block' }}>
                  <img src={row.photo_url} alt="justificatif" style={{ width: '44px', height: '44px', objectFit: 'cover', borderRadius: '6px', border: '2px solid #e0e0e0' }} onMouseOver={e => (e.currentTarget.style.borderColor = '#0099cc')} onMouseOut={e => (e.currentTarget.style.borderColor = '#e0e0e0')} />
                  <div style={{ fontSize: '10px', color: '#0099cc', marginTop: '2px', textAlign: 'center' }}>Voir</div>
                </div>
              ) : <span style={{ fontSize: '11px', color: '#aaa', background: '#f8f9fa', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e8eaed' }}>Aucune</span> },
              { key: 'statut_label', label: 'Statut', render: (_v: any, row: any) => (
                <select value={row.statut} onChange={e => updateStatut(row.id, e.target.value, activeTab === 'principale' ? undefined : activeTab as number)} style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #e0e0e0', cursor: 'pointer', background: row.statut === 'traitee' ? '#e8f8ef' : '#fff3e0', color: row.statut === 'traitee' ? '#1a7a40' : '#e65100' }}>
                  <option value="en_cours">En cours</option>
                  <option value="traitee">Traitée</option>
                </select>
              )},
              { key: 'description', label: 'Description', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.description}</span> },
              { key: 'actions', label: 'Supprimer', sortable: false, render: (_v: any, row: any) => <button onClick={() => deleteAction(row.id, activeTab === 'principale' ? undefined : activeTab as number)} style={{ background: '#fdeaea', color: '#e84c3d', border: '1px solid #f5c6c6', borderRadius: '4px', padding: '3px 8px', cursor: 'pointer', fontSize: '11px' }}>🗑</button> },
            ]}
            data={tableData}
          />
        )}
      </div>
    </Layout>
  )
}

export default Caisse