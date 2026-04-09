import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import SortableTable from '../components/SortableTable'

const ETAT_CHOICES = ['normal', 'proche', 'depasee']
const ETAT_VOITURE_CHOICES = ['active', 'inactive', 'en_panne']
const TYPE_ACTION_CHOICES = ['vidange', 'vignette', 'assurance', 'lavage', 'depannage']
const STATUT_VALIDATION_CHOICES = ['en_attente', 'valide', 'refuse']

const etatStyle = (etat: string) => {
  if (etat === 'normal') return { bg: '#e8f8ef', color: '#1a7a40' }
  if (etat === 'proche') return { bg: '#fff3e0', color: '#e65100' }
  return { bg: '#fdeaea', color: '#c0392b' }
}

const etatVoitureStyle = (etat: string) => {
  if (etat === 'active') return { bg: '#e8f8ef', color: '#1a7a40' }
  if (etat === 'inactive') return { bg: '#fff3e0', color: '#e65100' }
  return { bg: '#fdeaea', color: '#c0392b' }
}

const etatLabel: { [k: string]: string } = {
  normal: 'Normal', proche: 'Proche', depasee: 'Dépassée',
  active: 'Active', inactive: 'Inactive', en_panne: 'En panne',
  en_attente: 'En attente', valide: 'Validé', refuse: 'Refusé',
}

const Vehicules = () => {
  document.title = 'Gestion Véhicules — Newiris'

  const [activeTab, setActiveTab] = useState<'info' | 'dossier' | 'actions'>('info')
  const [activeActionsTab, setActiveActionsTab] = useState<'general' | 'demande'>('general')
  const [vehicules, setVehicules] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [actions, setActions] = useState<any[]>([])
  const [demandes, setDemandes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ nom: '', matricule: '', service: '', personne: '', couleur: '' })
  const [showActionForm, setShowActionForm] = useState(false)
  const [actionForm, setActionForm] = useState({ vehicule: '', date: new Date().toISOString().split('T')[0], type: 'vidange', montant: '' })
  const [showDemandeForm, setShowDemandeForm] = useState(false)
  const [demandeForm, setDemandeForm] = useState({ vehicule: '', attribue_a: '', demande_par: '', date_souhaitee: new Date().toISOString().split('T')[0] })
  const [editingDossier, setEditingDossier] = useState<number | null>(null)
  const [dossierForm, setDossierForm] = useState<any>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [vRes, sRes, uRes, aRes, dRes] = await Promise.all([
        api.get('/vehicules/vehicules/'),
        api.get('/services/'),
        api.get('/auth/users/'),
        api.get('/vehicules/actions/'),
        api.get('/vehicules/demandes/'),
      ])
      setVehicules(vRes.data)
      setServices(sRes.data)
      setUsers(uRes.data)
      setActions(aRes.data)
      setDemandes(dRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  const handleAddVehicule = async () => {
    if (!form.nom || !form.matricule) { setError('Nom et matricule obligatoires.'); return }
    setError('')
    try {
      await api.post('/vehicules/vehicules/', { nom: form.nom, matricule: form.matricule, service: form.service || null, personne: form.personne || null, couleur: form.couleur })
      setSuccess(true); setTimeout(() => setSuccess(false), 3000)
      setForm({ nom: '', matricule: '', service: '', personne: '', couleur: '' })
      setShowForm(false); fetchAll()
    } catch { setError('Erreur lors de la création.') }
  }

  const handleDeleteVehicule = async (id: number) => {
    await api.delete(`/vehicules/vehicules/${id}/`); fetchAll()
  }

  const updateVehiculeEtat = async (id: number, field: string, value: string) => {
    await api.patch(`/vehicules/vehicules/${id}/`, { [field]: value }); fetchAll()
  }

  const handleAddAction = async () => {
    if (!actionForm.vehicule || !actionForm.date) { setError('Véhicule et date obligatoires.'); return }
    setError('')
    try {
      await api.post('/vehicules/actions/', { vehicule: actionForm.vehicule, date: actionForm.date, type: actionForm.type, montant: actionForm.montant || null })
      setSuccess(true); setTimeout(() => setSuccess(false), 3000)
      setActionForm({ vehicule: '', date: new Date().toISOString().split('T')[0], type: 'vidange', montant: '' })
      setShowActionForm(false); fetchAll()
    } catch { setError('Erreur lors de la création.') }
  }

  const handleDeleteAction = async (id: number) => {
    await api.delete(`/vehicules/actions/${id}/`); fetchAll()
  }

  const handleAddDemande = async () => {
    if (!demandeForm.vehicule || !demandeForm.date_souhaitee) { setError('Véhicule et date obligatoires.'); return }
    setError('')
    try {
      await api.post('/vehicules/demandes/', { vehicule: demandeForm.vehicule, attribue_a: demandeForm.attribue_a || null, demande_par: demandeForm.demande_par || null, date_souhaitee: demandeForm.date_souhaitee })
      setSuccess(true); setTimeout(() => setSuccess(false), 3000)
      setDemandeForm({ vehicule: '', attribue_a: '', demande_par: '', date_souhaitee: new Date().toISOString().split('T')[0] })
      setShowDemandeForm(false); fetchAll()
    } catch { setError('Erreur lors de la création.') }
  }

  const handleDeleteDemande = async (id: number) => {
    await api.delete(`/vehicules/demandes/${id}/`); fetchAll()
  }

  const handleEditDossier = (v: any) => {
    setEditingDossier(v.id)
    setDossierForm({
      date_echeance_assurance: v.dossier?.date_echeance_assurance || '',
      date_echeance_visite: v.dossier?.date_echeance_visite || '',
      date_echeance_vignette: v.dossier?.date_echeance_vignette || '',
      km_actuel: v.dossier?.km_actuel || '',
      km_next_vidange: v.dossier?.km_next_vidange || '',
      nombre_vidange: v.dossier?.nombre_vidange || 0,
    })
  }

  const handleSaveDossier = async (v: any) => {
    try {
      if (v.dossier?.id) {
        await api.patch(`/vehicules/dossiers/${v.dossier.id}/`, dossierForm)
      } else {
        await api.post('/vehicules/dossiers/', { vehicule: v.id, ...dossierForm })
      }
      setEditingDossier(null); fetchAll()
    } catch { setError('Erreur sauvegarde dossier.') }
  }

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none' }
  const selectStyle = (bg: string, color: string) => ({ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #e0e0e0', cursor: 'pointer', background: bg, color: color })

  // Données préparées pour SortableTable
  const vehiculesData = vehicules.map(v => ({
    ...v,
    service_nom: v.service_nom || '—',
    personne_nom: v.personne_nom || '—',
    couleur: v.couleur || '—',
    etat_vidange_label: etatLabel[v.etat_vidange] || v.etat_vidange,
    etat_assurance_label: etatLabel[v.etat_assurance] || v.etat_assurance,
    etat_vignette_label: etatLabel[v.etat_vignette] || v.etat_vignette,
    etat_revision_label: etatLabel[v.etat_revision] || v.etat_revision,
    etat_voiture_label: etatLabel[v.etat_voiture] || v.etat_voiture,
  }))

  const dossierData = vehicules.map(v => ({
    ...v,
    date_ass_fmt: v.dossier?.date_echeance_assurance ? new Date(v.dossier.date_echeance_assurance).toLocaleDateString('fr-FR') : '—',
    date_vis_fmt: v.dossier?.date_echeance_visite ? new Date(v.dossier.date_echeance_visite).toLocaleDateString('fr-FR') : '—',
    date_vig_fmt: v.dossier?.date_echeance_vignette ? new Date(v.dossier.date_echeance_vignette).toLocaleDateString('fr-FR') : '—',
    km_actuel: v.dossier?.km_actuel ?? '—',
    km_next: v.dossier?.km_next_vidange ?? '—',
    nb_vidange: v.dossier?.nombre_vidange ?? '—',
  }))

  const actionsData = actions.map(a => ({
    ...a,
    date_fmt: new Date(a.date).toLocaleDateString('fr-FR'),
    type_label: a.type.charAt(0).toUpperCase() + a.type.slice(1),
    montant_fmt: a.montant ? `${Number(a.montant).toLocaleString('fr-FR')} DH` : '—',
  }))

  const demandesData = demandes.map(d => ({
    ...d,
    attribue_a_nom: d.attribue_a_nom || '—',
    demande_par_nom: d.demande_par_nom || '—',
    date_souhaitee_fmt: new Date(d.date_souhaitee).toLocaleDateString('fr-FR'),
    date_retour_fmt: d.date_retour ? new Date(d.date_retour).toLocaleDateString('fr-FR') : '—',
    statut_label: etatLabel[d.statut_validation] || d.statut_validation,
  }))

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Gestion de véhicule</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Suivi du parc véhicules</p>
          </div>
          <button onClick={() => {
            if (activeTab === 'info') setShowForm(!showForm)
            else if (activeTab === 'actions' && activeActionsTab === 'general') setShowActionForm(!showActionForm)
            else if (activeTab === 'actions' && activeActionsTab === 'demande') setShowDemandeForm(!showDemandeForm)
          }} style={{ padding: '8px 16px', background: '#0099cc', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>+ Ajouter NV</button>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[{ key: 'info', label: 'Info général' }, { key: 'dossier', label: 'Dossier Véhicule' }, { key: 'actions', label: 'Actions' }].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{ padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer', background: activeTab === t.key ? '#1a3a6b' : '#e8edf5', color: activeTab === t.key ? '#fff' : '#1a3a6b', fontWeight: activeTab === t.key ? 700 : 400, fontSize: '13px' }}>{t.label}</button>
          ))}
        </div>

        {success && <div style={{ background: '#e8f8ef', border: '1px solid #a8d5b5', borderRadius: '6px', padding: '12px 16px', fontSize: '13px', color: '#1a7a40', marginBottom: '16px' }}>✓ Opération réussie !</div>}
        {error && <div style={{ background: '#fdeaea', border: '1px solid #f5c6c6', borderRadius: '6px', padding: '12px 16px', fontSize: '13px', color: '#c0392b', marginBottom: '16px' }}>{error}</div>}

        {/* ===== INFO GÉNÉRAL ===== */}
        {activeTab === 'info' && (
          <>
            {showForm && (
              <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouveau véhicule</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Nom *</label><input style={inputStyle} value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} placeholder="Ex: Peugeot 308" /></div>
                  <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Matricule *</label><input style={inputStyle} value={form.matricule} onChange={e => setForm(p => ({ ...p, matricule: e.target.value }))} placeholder="Ex: 12345-A-1" /></div>
                  <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Service</label><select style={inputStyle} value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))}><option value="">— Aucun —</option>{services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}</select></div>
                  <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Personne</label><select style={inputStyle} value={form.personne} onChange={e => setForm(p => ({ ...p, personne: e.target.value }))}><option value="">— Aucun —</option>{users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div>
                  <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Couleur</label><input style={inputStyle} value={form.couleur} onChange={e => setForm(p => ({ ...p, couleur: e.target.value }))} placeholder="Ex: Blanc" /></div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button onClick={handleAddVehicule} style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Enregistrer</button>
                  <button onClick={() => { setShowForm(false); setError('') }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                </div>
              </div>
            )}
            {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div> : (
              <SortableTable
                emptyMessage="Aucun véhicule"
                columns={[
                  { key: 'id', label: 'ID', render: (_v: any, row: any) => <span style={{ color: '#aaa' }}>{row.id}</span> },
                  { key: 'nom', label: 'Nom', render: (_v: any, row: any) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{row.nom}</span> },
                  { key: 'matricule', label: 'Matricule', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.matricule}</span> },
                  { key: 'service_nom', label: 'Service', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.service_nom}</span> },
                  { key: 'personne_nom', label: 'Personne', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.personne_nom}</span> },
                  { key: 'couleur', label: 'Couleur', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.couleur}</span> },
                  {
                    key: 'etat_vidange_label', label: 'État vidange',
                    render: (_v: any, row: any) => { const s = etatStyle(row.etat_vidange); return <select value={row.etat_vidange} onChange={e => updateVehiculeEtat(row.id, 'etat_vidange', e.target.value)} style={selectStyle(s.bg, s.color)}>{ETAT_CHOICES.map(e => <option key={e} value={e}>{etatLabel[e]}</option>)}</select> }
                  },
                  {
                    key: 'etat_assurance_label', label: 'État assurance',
                    render: (_v: any, row: any) => { const s = etatStyle(row.etat_assurance); return <select value={row.etat_assurance} onChange={e => updateVehiculeEtat(row.id, 'etat_assurance', e.target.value)} style={selectStyle(s.bg, s.color)}>{ETAT_CHOICES.map(e => <option key={e} value={e}>{etatLabel[e]}</option>)}</select> }
                  },
                  {
                    key: 'etat_vignette_label', label: 'État vignette',
                    render: (_v: any, row: any) => { const s = etatStyle(row.etat_vignette); return <select value={row.etat_vignette} onChange={e => updateVehiculeEtat(row.id, 'etat_vignette', e.target.value)} style={selectStyle(s.bg, s.color)}>{ETAT_CHOICES.map(e => <option key={e} value={e}>{etatLabel[e]}</option>)}</select> }
                  },
                  {
                    key: 'etat_revision_label', label: 'État révision',
                    render: (_v: any, row: any) => { const s = etatStyle(row.etat_revision); return <select value={row.etat_revision} onChange={e => updateVehiculeEtat(row.id, 'etat_revision', e.target.value)} style={selectStyle(s.bg, s.color)}>{ETAT_CHOICES.map(e => <option key={e} value={e}>{etatLabel[e]}</option>)}</select> }
                  },
                  {
                    key: 'etat_voiture_label', label: 'État voiture',
                    render: (_v: any, row: any) => { const s = etatVoitureStyle(row.etat_voiture); return <select value={row.etat_voiture} onChange={e => updateVehiculeEtat(row.id, 'etat_voiture', e.target.value)} style={selectStyle(s.bg, s.color)}>{ETAT_VOITURE_CHOICES.map(e => <option key={e} value={e}>{etatLabel[e]}</option>)}</select> }
                  },
                  { key: 'actions', label: 'Supprimer', sortable: false, render: (_v: any, row: any) => <button onClick={() => handleDeleteVehicule(row.id)} style={{ padding: '4px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>🗑</button> },
                ]}
                data={vehiculesData}
              />
            )}
          </>
        )}

        {/* ===== DOSSIER VÉHICULE ===== */}
        {activeTab === 'dossier' && (
          loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div> : (
            <SortableTable
              emptyMessage="Aucun véhicule"
              columns={[
                { key: 'id', label: 'ID', render: (_v: any, row: any) => <span style={{ color: '#aaa' }}>{row.id}</span> },
                { key: 'nom', label: 'Nom', render: (_v: any, row: any) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{row.nom}</span> },
                { key: 'matricule', label: 'Matricule', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.matricule}</span> },
                {
                  key: 'date_ass_fmt', label: 'Date éch. assurance', sortable: false,
                  render: (_v: any, row: any) => editingDossier === row.id ? (
                    <input type="date" value={dossierForm.date_echeance_assurance || ''} onChange={e => setDossierForm((p: any) => ({ ...p, date_echeance_assurance: e.target.value }))} style={{ ...inputStyle, width: '130px', padding: '4px 8px' }} />
                  ) : <span style={{ color: '#555' }}>{row.date_ass_fmt}</span>
                },
                {
                  key: 'date_vis_fmt', label: 'Date éch. visite', sortable: false,
                  render: (_v: any, row: any) => editingDossier === row.id ? (
                    <input type="date" value={dossierForm.date_echeance_visite || ''} onChange={e => setDossierForm((p: any) => ({ ...p, date_echeance_visite: e.target.value }))} style={{ ...inputStyle, width: '130px', padding: '4px 8px' }} />
                  ) : <span style={{ color: '#555' }}>{row.date_vis_fmt}</span>
                },
                {
                  key: 'date_vig_fmt', label: 'Date éch. vignette', sortable: false,
                  render: (_v: any, row: any) => editingDossier === row.id ? (
                    <input type="date" value={dossierForm.date_echeance_vignette || ''} onChange={e => setDossierForm((p: any) => ({ ...p, date_echeance_vignette: e.target.value }))} style={{ ...inputStyle, width: '130px', padding: '4px 8px' }} />
                  ) : <span style={{ color: '#555' }}>{row.date_vig_fmt}</span>
                },
                {
                  key: 'km_actuel', label: 'KM actuel', sortable: false,
                  render: (_v: any, row: any) => editingDossier === row.id ? (
                    <input type="number" value={dossierForm.km_actuel || ''} onChange={e => setDossierForm((p: any) => ({ ...p, km_actuel: e.target.value }))} style={{ ...inputStyle, width: '90px', padding: '4px 8px' }} />
                  ) : <span style={{ color: '#555' }}>{row.km_actuel}</span>
                },
                {
                  key: 'km_next', label: 'KM next vidange', sortable: false,
                  render: (_v: any, row: any) => editingDossier === row.id ? (
                    <input type="number" value={dossierForm.km_next_vidange || ''} onChange={e => setDossierForm((p: any) => ({ ...p, km_next_vidange: e.target.value }))} style={{ ...inputStyle, width: '90px', padding: '4px 8px' }} />
                  ) : <span style={{ color: '#555' }}>{row.km_next}</span>
                },
                {
                  key: 'nb_vidange', label: 'Nb vidange', sortable: false,
                  render: (_v: any, row: any) => editingDossier === row.id ? (
                    <input type="number" value={dossierForm.nombre_vidange || ''} onChange={e => setDossierForm((p: any) => ({ ...p, nombre_vidange: e.target.value }))} style={{ ...inputStyle, width: '90px', padding: '4px 8px' }} />
                  ) : <span style={{ color: '#555' }}>{row.nb_vidange}</span>
                },
                {
                  key: 'dossier_actions', label: 'Actions', sortable: false,
                  render: (_v: any, row: any) => editingDossier === row.id ? (
                    <div style={{ display: 'flex', gap: '4px' }}>
                      <button onClick={() => handleSaveDossier(row)} style={{ padding: '4px 8px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✓</button>
                      <button onClick={() => setEditingDossier(null)} style={{ padding: '4px 8px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✕</button>
                    </div>
                  ) : (
                    <button onClick={() => handleEditDossier(row)} style={{ padding: '4px 8px', background: '#e8f4fb', color: '#0099cc', border: '1px solid #b3d9f0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>✏️ Modifier</button>
                  )
                },
              ]}
              data={dossierData}
            />
          )
        )}

        {/* ===== ACTIONS ===== */}
        {activeTab === 'actions' && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              {[{ key: 'general', label: 'Actions général' }, { key: 'demande', label: 'Demande Véhicule' }].map(t => (
                <button key={t.key} onClick={() => setActiveActionsTab(t.key as any)} style={{ padding: '6px 16px', borderRadius: '6px', border: '1px solid #1a3a6b', cursor: 'pointer', background: activeActionsTab === t.key ? '#1a3a6b' : '#fff', color: activeActionsTab === t.key ? '#fff' : '#1a3a6b', fontSize: '12px', fontWeight: activeActionsTab === t.key ? 700 : 400 }}>{t.label}</button>
              ))}
            </div>

            {activeActionsTab === 'general' && (
              <>
                {showActionForm && (
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouvelle action</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Véhicule *</label><select style={inputStyle} value={actionForm.vehicule} onChange={e => setActionForm(p => ({ ...p, vehicule: e.target.value }))}><option value="">— Choisir —</option>{vehicules.map(v => <option key={v.id} value={v.id}>{v.nom} - {v.matricule}</option>)}</select></div>
                      <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Type *</label><select style={inputStyle} value={actionForm.type} onChange={e => setActionForm(p => ({ ...p, type: e.target.value }))}>{TYPE_ACTION_CHOICES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}</select></div>
                      <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date *</label><input type="date" style={inputStyle} value={actionForm.date} onChange={e => setActionForm(p => ({ ...p, date: e.target.value }))} /></div>
                      <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Montant (DH)</label><input type="number" style={inputStyle} value={actionForm.montant} onChange={e => setActionForm(p => ({ ...p, montant: e.target.value }))} placeholder="0.00" /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button onClick={handleAddAction} style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Enregistrer</button>
                      <button onClick={() => { setShowActionForm(false); setError('') }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                    </div>
                  </div>
                )}
                <SortableTable
                  emptyMessage="Aucune action"
                  columns={[
                    { key: 'id', label: 'ID', render: (_v: any, row: any) => <span style={{ color: '#aaa' }}>{row.id}</span> },
                    { key: 'vehicule_nom', label: 'Nom Véhicule', render: (_v: any, row: any) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{row.vehicule_nom}</span> },
                    { key: 'date_fmt', label: 'Date', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.date_fmt}</span> },
                    { key: 'type_label', label: 'Type', render: (_v: any, row: any) => <span style={{ background: '#e8f4fb', color: '#0099cc', padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '500' }}>{row.type_label}</span> },
                    { key: 'montant_fmt', label: 'Montant', render: (_v: any, row: any) => <span style={{ fontWeight: '600', color: '#1a3a6b' }}>{row.montant_fmt}</span> },
                    { key: 'actions', label: 'Supprimer', sortable: false, render: (_v: any, row: any) => <button onClick={() => handleDeleteAction(row.id)} style={{ padding: '4px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>🗑</button> },
                  ]}
                  data={actionsData}
                />
              </>
            )}

            {activeActionsTab === 'demande' && (
              <>
                {showDemandeForm && (
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouvelle demande véhicule</h3>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                      <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Nom Véhicule *</label><select style={inputStyle} value={demandeForm.vehicule} onChange={e => setDemandeForm(p => ({ ...p, vehicule: e.target.value }))}><option value="">— Choisir —</option>{vehicules.map(v => <option key={v.id} value={v.id}>{v.nom} - {v.matricule}</option>)}</select></div>
                      <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Attribué à</label><select style={inputStyle} value={demandeForm.attribue_a} onChange={e => setDemandeForm(p => ({ ...p, attribue_a: e.target.value }))}><option value="">— Aucun —</option>{users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div>
                      <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Demandé par</label><select style={inputStyle} value={demandeForm.demande_par} onChange={e => setDemandeForm(p => ({ ...p, demande_par: e.target.value }))}><option value="">— Aucun —</option>{users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}</select></div>
                      <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date souhaitée *</label><input type="date" style={inputStyle} value={demandeForm.date_souhaitee} onChange={e => setDemandeForm(p => ({ ...p, date_souhaitee: e.target.value }))} /></div>
                    </div>
                    <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                      <button onClick={handleAddDemande} style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Enregistrer</button>
                      <button onClick={() => { setShowDemandeForm(false); setError('') }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                    </div>
                  </div>
                )}
                <SortableTable
                  emptyMessage="Aucune demande"
                  columns={[
                    { key: 'id', label: 'ID', render: (_v: any, row: any) => <span style={{ color: '#aaa' }}>{row.id}</span> },
                    { key: 'vehicule_nom', label: 'Nom Véhicule', render: (_v: any, row: any) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{row.vehicule_nom}</span> },
                    { key: 'attribue_a_nom', label: 'Attribué à', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.attribue_a_nom}</span> },
                    { key: 'demande_par_nom', label: 'Demandé par', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.demande_par_nom}</span> },
                    { key: 'date_souhaitee_fmt', label: 'Date souhaitée', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.date_souhaitee_fmt}</span> },
                    {
                      key: 'statut_label', label: 'Statut validation',
                      render: (_v: any, row: any) => (
                        <select value={row.statut_validation} onChange={async e => { await api.patch(`/vehicules/demandes/${row.id}/`, { statut_validation: e.target.value }); fetchAll() }}
                          style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #e0e0e0', cursor: 'pointer', background: row.statut_validation === 'valide' ? '#e8f8ef' : row.statut_validation === 'refuse' ? '#fdeaea' : '#fff3e0', color: row.statut_validation === 'valide' ? '#1a7a40' : row.statut_validation === 'refuse' ? '#c0392b' : '#e65100' }}>
                          {STATUT_VALIDATION_CHOICES.map(s => <option key={s} value={s}>{etatLabel[s]}</option>)}
                        </select>
                      )
                    },
                    { key: 'date_retour_fmt', label: 'Date retour', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.date_retour_fmt}</span> },
                    { key: 'actions', label: 'Supprimer', sortable: false, render: (_v: any, row: any) => <button onClick={() => handleDeleteDemande(row.id)} style={{ padding: '4px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>🗑</button> },
                  ]}
                  data={demandesData}
                />
              </>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default Vehicules