import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import SortableTable from '../components/SortableTable'

const Salaires = () => {
  document.title = 'Salaires — Newiris'

  const now = new Date()
  const [mois, setMois] = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const [salaries, setSalaries] = useState<any[]>([])
  const [etat, setEtat] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'etat' | 'salaries' | 'actions'>('etat')
  const [statutEtat, setStatutEtat] = useState<{ [key: number]: string }>({})
  const [editingSalarieId, setEditingSalarieId] = useState<number | null>(null)
  const [editingDateDebut, setEditingDateDebut] = useState('')
  const [editingDateFin, setEditingDateFin] = useState('')
  const [editingActionId, setEditingActionId] = useState<number | null>(null)
  const [editingActionDate, setEditingActionDate] = useState('')
  const [editingActionMontant, setEditingActionMontant] = useState('')
  const [showAddSalarie, setShowAddSalarie] = useState(false)
  const [showAddAction, setShowAddAction] = useState(false)
  const [formSalarie, setFormSalarie] = useState({ nom: '', prenom: '', salaire_base: '', date_debut: '', date_fin: '' })
  const [formAction, setFormAction] = useState({ salarie: '', type: 'entree', categorie: '', montant: '', date: '', statut: 'en_cours' })
  const [categories, setCategories] = useState<string[]>(['Prime', 'Bonus', 'Heures supplémentaires', 'Avance', 'Déduction', 'Absence', 'Autres'])
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCat, setNewCat] = useState('')

  const MOIS_LABELS = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre']

  const fetchData = async () => {
    try {
      const [salsRes, etatRes] = await Promise.all([
        api.get('/salaires/salaries/'),
        api.get(`/salaires/etat/?mois=${mois}&annee=${annee}`),
      ])
      setSalaries(salsRes.data)
      setEtat(etatRes.data)
      const initialStatuts: { [key: number]: string } = {}
      etatRes.data.forEach((e: any) => { initialStatuts[e.id] = 'en_cours' })
      setStatutEtat(initialStatuts)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [mois, annee])

  const handleAddSalarie = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/salaires/salaries/', { nom: formSalarie.nom, prenom: formSalarie.prenom, salaire_base: parseFloat(formSalarie.salaire_base), date_debut: formSalarie.date_debut, date_fin: formSalarie.date_fin })
      setShowAddSalarie(false)
      setFormSalarie({ nom: '', prenom: '', salaire_base: '', date_debut: '', date_fin: '' })
      fetchData()
    } catch (err) { console.error(err) }
  }

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/salaires/actions/', { salarie: parseInt(formAction.salarie), type: formAction.type, categorie: formAction.categorie, montant: parseFloat(formAction.montant), date: formAction.date, statut: formAction.statut })
      setShowAddAction(false)
      setFormAction({ salarie: '', type: 'entree', categorie: '', montant: '', date: '', statut: 'en_cours' })
      fetchData()
    } catch (err) { console.error(err) }
  }

  const handleDeleteSalarie = async (id: number) => {
    try { await api.delete(`/salaires/salaries/${id}/`); fetchData() } catch (err) { console.error(err) }
  }

  const handleDeleteAction = async (id: number) => {
    try { await api.delete(`/salaires/actions/${id}/`); fetchData() } catch (err) { console.error(err) }
  }

  const handleUpdatePeriode = async (id: number) => {
    try {
      await api.patch(`/salaires/salaries/${id}/`, { date_debut: editingDateDebut, date_fin: editingDateFin })
      setEditingSalarieId(null); fetchData()
    } catch (err) { console.error(err) }
  }

  const handleUpdateAction = async (id: number) => {
    try {
      await api.patch(`/salaires/actions/${id}/`, { date: editingActionDate, montant: parseFloat(editingActionMontant) })
      setEditingActionId(null); fetchData()
    } catch (err) { console.error(err) }
  }

  const handleAddCat = () => {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()])
      setFormAction({ ...formAction, categorie: newCat.trim() })
      setNewCat(''); setShowAddCat(false)
    }
  }

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none' }
  const tabStyle = (active: boolean) => ({ padding: '8px 20px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: '600' as const, background: active ? '#1a3a6b' : '#fff', color: active ? '#fff' : '#555', border: `1px solid ${active ? '#1a3a6b' : '#e0e0e0'}` })
  const btnEdit = { padding: '2px 6px', background: '#e8f4fb', color: '#0099cc', border: '1px solid #b3d9f0', borderRadius: '3px', fontSize: '10px', cursor: 'pointer' }
  const btnOk = { padding: '4px 8px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }
  const btnCancel = { padding: '4px 8px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }

  // Données pour SortableTable
  const etatData = etat.map(e => ({
    ...e,
    mois_label: `${MOIS_LABELS[mois - 1]} ${annee}`,
    nom_complet: `${e.nom} ${e.prenom}`,
    salaire_base_fmt: `${e.salaire_base.toLocaleString('fr-FR')} DH`,
    montant_ajoute_fmt: `+${e.montant_ajoute.toLocaleString('fr-FR')} DH`,
    montant_deduit_fmt: `-${e.montant_deduit.toLocaleString('fr-FR')} DH`,
    salaire_final_fmt: `${e.salaire_final.toLocaleString('fr-FR')} DH`,
    ecart_fmt: `${e.ecart.toLocaleString('fr-FR')} DH`,
  }))

  const salarieData = salaries.map(s => ({
    ...s,
    nom_complet: `${s.nom} ${s.prenom}`,
    salaire_base_fmt: `${parseFloat(s.salaire_base).toLocaleString('fr-FR')} DH`,
    periode_fmt: `${new Date(s.date_debut).toLocaleDateString('fr-FR')} au ${new Date(s.date_fin).toLocaleDateString('fr-FR')}`,
  }))

  const actionsData = salaries.flatMap(s =>
    (s.actions || []).map((a: any) => ({
      ...a,
      salarie_nom: `${s.nom} ${s.prenom}`,
      type_label: a.type === 'entree' ? 'Entrée' : 'Sortie',
      montant_fmt: `${a.type === 'entree' ? '+' : '-'}${parseFloat(a.montant).toLocaleString('fr-FR')} DH`,
      date_fmt: new Date(a.date).toLocaleDateString('fr-FR'),
    }))
  )

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Gestion des salaires</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Suivi des salaires et actions</p>
          </div>
          <select value={`${annee}-${mois}`} onChange={e => { const [a, m] = e.target.value.split('-'); setAnnee(parseInt(a)); setMois(parseInt(m)) }}
            style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', outline: 'none' }}>
            {[2025, 2026, 2027].map(a => MOIS_LABELS.map((label, i) => (
              <option key={`${a}-${i + 1}`} value={`${a}-${i + 1}`}>{label} {a}</option>
            )))}
          </select>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button style={tabStyle(activeTab === 'etat')} onClick={() => setActiveTab('etat')}>État des salaires</button>
          <button style={tabStyle(activeTab === 'salaries')} onClick={() => setActiveTab('salaries')}>Add Salarié</button>
          <button style={tabStyle(activeTab === 'actions')} onClick={() => setActiveTab('actions')}>ADD Actions</button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div>
        ) : (
          <>
            {/* ÉTAT DES SALAIRES */}
            {activeTab === 'etat' && (
              <SortableTable
                emptyMessage="Aucun salarié pour ce mois"
                columns={[
                  { key: 'mois_label', label: 'Mois', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.mois_label}</span> },
                  { key: 'nom_complet', label: 'Nom et prénom', render: (_v: any, row: any) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{row.nom_complet}</span> },
                  { key: 'salaire_base_fmt', label: 'Salaire de base', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.salaire_base_fmt}</span> },
                  { key: 'montant_ajoute_fmt', label: 'Montant ajouté', render: (_v: any, row: any) => <span style={{ color: '#1a7a40', fontWeight: '600' }}>{row.montant_ajoute_fmt}</span> },
                  { key: 'montant_deduit_fmt', label: 'Montant déduit', render: (_v: any, row: any) => <span style={{ color: '#c0392b', fontWeight: '600' }}>{row.montant_deduit_fmt}</span> },
                  { key: 'salaire_final_fmt', label: 'Salaire final', render: (_v: any, row: any) => <span style={{ fontWeight: '700', color: '#1a3a6b' }}>{row.salaire_final_fmt}</span> },
                  { key: 'ecart_fmt', label: 'Écart', render: (_v: any, row: any) => <span style={{ fontWeight: '600', color: row.ecart >= 0 ? '#1a7a40' : '#c0392b' }}>{row.ecart_fmt}</span> },
                  {
                    key: 'statut', label: 'Statut', sortable: false,
                    render: (_v: any, row: any) => (
                      <select value={statutEtat[row.id] || 'en_cours'} onChange={ev => setStatutEtat({ ...statutEtat, [row.id]: ev.target.value })}
                        style={{ padding: '3px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #e0e0e0', cursor: 'pointer', background: statutEtat[row.id] === 'traitee' ? '#e8f8ef' : '#fff3e0', color: statutEtat[row.id] === 'traitee' ? '#1a7a40' : '#e65100' }}>
                        <option value="en_cours">En cours</option>
                        <option value="traitee">Traitée</option>
                      </select>
                    )
                  },
                ]}
                data={etatData}
              />
            )}

            {/* ADD SALARIÉ */}
            {activeTab === 'salaries' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <button onClick={() => setShowAddSalarie(!showAddSalarie)} style={{ padding: '8px 16px', background: '#0099cc', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>+ Add Salarié</button>
                </div>
                {showAddSalarie && (
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouveau salarié</h3>
                    <form onSubmit={handleAddSalarie}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Nom *</label><input style={inputStyle} value={formSalarie.nom} onChange={e => setFormSalarie({ ...formSalarie, nom: e.target.value })} required placeholder="Nom" /></div>
                        <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Prénom *</label><input style={inputStyle} value={formSalarie.prenom} onChange={e => setFormSalarie({ ...formSalarie, prenom: e.target.value })} required placeholder="Prénom" /></div>
                        <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Salaire de base (DH) *</label><input style={inputStyle} type="number" value={formSalarie.salaire_base} onChange={e => setFormSalarie({ ...formSalarie, salaire_base: e.target.value })} required placeholder="Ex: 5000" /></div>
                        <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date début *</label><input style={inputStyle} type="date" value={formSalarie.date_debut} onChange={e => setFormSalarie({ ...formSalarie, date_debut: e.target.value })} required /></div>
                        <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date fin *</label><input style={inputStyle} type="date" value={formSalarie.date_fin} onChange={e => setFormSalarie({ ...formSalarie, date_fin: e.target.value })} required /></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button type="submit" style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                        <button type="button" onClick={() => setShowAddSalarie(false)} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                      </div>
                    </form>
                  </div>
                )}
                <SortableTable
                  emptyMessage="Aucun salarié"
                  columns={[
                    {
                      key: 'periode_fmt', label: 'Période', sortable: false,
                      render: (_v: any, row: any) => editingSalarieId === row.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#888', width: '50px' }}>Début :</span>
                            <input type="date" value={editingDateDebut} onChange={e => setEditingDateDebut(e.target.value)} style={{ ...inputStyle, width: '140px', padding: '4px 8px' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                            <span style={{ fontSize: '10px', color: '#888', width: '50px' }}>Fin :</span>
                            <input type="date" value={editingDateFin} onChange={e => setEditingDateFin(e.target.value)} style={{ ...inputStyle, width: '140px', padding: '4px 8px' }} />
                          </div>
                          <div style={{ display: 'flex', gap: '4px', marginTop: '2px' }}>
                            <button onClick={() => handleUpdatePeriode(row.id)} style={btnOk}>✓ OK</button>
                            <button onClick={() => setEditingSalarieId(null)} style={btnCancel}>✕</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#555' }}>{row.periode_fmt}</span>
                          <button onClick={() => { setEditingSalarieId(row.id); setEditingDateDebut(row.date_debut); setEditingDateFin(row.date_fin) }} style={btnEdit}>✏️</button>
                        </div>
                      )
                    },
                    { key: 'nom_complet', label: 'Nom et prénom', render: (_v: any, row: any) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{row.nom_complet}</span> },
                    { key: 'salaire_base_fmt', label: 'Salaire de base', render: (_v: any, row: any) => <span style={{ fontWeight: '600', color: '#0099cc' }}>{row.salaire_base_fmt}</span> },
                    {
                      key: 'actions', label: 'Actions', sortable: false,
                      render: (_v: any, row: any) => (
                        <button onClick={() => handleDeleteSalarie(row.id)} style={{ padding: '4px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Supprimer</button>
                      )
                    },
                  ]}
                  data={salarieData}
                />
              </div>
            )}

            {/* ADD ACTIONS */}
            {activeTab === 'actions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <button onClick={() => setShowAddAction(!showAddAction)} style={{ padding: '8px 16px', background: '#0099cc', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>+ ADD Actions</button>
                </div>
                {showAddAction && (
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouvelle action salarié</h3>
                    <form onSubmit={handleAddAction}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Salarié *</label><select style={inputStyle} value={formAction.salarie} onChange={e => setFormAction({ ...formAction, salarie: e.target.value })} required><option value="">Sélectionner un salarié...</option>{salaries.map(s => <option key={s.id} value={s.id}>{s.nom} {s.prenom}</option>)}</select></div>
                        <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Type *</label><select style={inputStyle} value={formAction.type} onChange={e => setFormAction({ ...formAction, type: e.target.value })}><option value="entree">Entrée</option><option value="sortie">Sortie</option></select></div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Catégorie</label>
                          <select style={inputStyle} value={formAction.categorie} onChange={e => { if (e.target.value === '__add_cat__') { setShowAddCat(true) } else { setFormAction({ ...formAction, categorie: e.target.value }); setShowAddCat(false) } }}>
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
                        <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Montant (DH) *</label><input style={inputStyle} type="number" value={formAction.montant} onChange={e => setFormAction({ ...formAction, montant: e.target.value })} required placeholder="Ex: 500" /></div>
                        <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date *</label><input style={inputStyle} type="date" value={formAction.date} onChange={e => setFormAction({ ...formAction, date: e.target.value })} required /></div>
                        <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Statut</label><select style={inputStyle} value={formAction.statut} onChange={e => setFormAction({ ...formAction, statut: e.target.value })}><option value="en_cours">En cours</option><option value="traitee">Traitée</option></select></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button type="submit" style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                        <button type="button" onClick={() => { setShowAddAction(false); setShowAddCat(false) }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                      </div>
                    </form>
                  </div>
                )}
                <SortableTable
                  emptyMessage="Aucune action"
                  columns={[
                    { key: 'salarie_nom', label: 'Salarié', render: (_v: any, row: any) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{row.salarie_nom}</span> },
                    {
                      key: 'type_label', label: 'Type',
                      render: (_v: any, row: any) => (
                        <span style={{ padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600', background: row.type === 'entree' ? '#e8f8ef' : '#fdeaea', color: row.type === 'entree' ? '#1a7a40' : '#c0392b' }}>
                          {row.type === 'entree' ? '↑ Entrée' : '↓ Sortie'}
                        </span>
                      )
                    },
                    { key: 'categorie', label: 'Catégorie', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.categorie || '—'}</span> },
                    {
                      key: 'montant_fmt', label: 'Montant', sortable: false,
                      render: (_v: any, row: any) => editingActionId === row.id ? (
                        <input type="number" value={editingActionMontant} onChange={e => setEditingActionMontant(e.target.value)} style={{ ...inputStyle, width: '100px', padding: '4px 8px' }} />
                      ) : (
                        <span style={{ fontWeight: '600', color: row.type === 'entree' ? '#1a7a40' : '#c0392b' }}>{row.montant_fmt}</span>
                      )
                    },
                    {
                      key: 'date_fmt', label: 'Date', sortable: false,
                      render: (_v: any, row: any) => editingActionId === row.id ? (
                        <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                          <input type="date" value={editingActionDate} onChange={e => setEditingActionDate(e.target.value)} style={{ ...inputStyle, width: '140px', padding: '4px 8px' }} />
                          <button onClick={() => handleUpdateAction(row.id)} style={btnOk}>✓</button>
                          <button onClick={() => setEditingActionId(null)} style={btnCancel}>✕</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#555' }}>{row.date_fmt}</span>
                          <button onClick={() => { setEditingActionId(row.id); setEditingActionDate(row.date); setEditingActionMontant(String(row.montant)) }} style={btnEdit}>✏️</button>
                        </div>
                      )
                    },
                    {
                      key: 'del', label: 'Actions', sortable: false,
                      render: (_v: any, row: any) => (
                        <button onClick={() => handleDeleteAction(row.id)} style={{ padding: '4px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Supprimer</button>
                      )
                    },
                  ]}
                  data={actionsData}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default Salaires