import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const Salaires = () => {
  document.title = 'Salaires — Newiris'

  const now = new Date()
  const [mois, setMois] = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const [salaries, setSalaries] = useState<any[]>([])
  const [etat, setEtat] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'etat' | 'salaries' | 'actions'>('etat')

  // Forms
  const [showAddSalarie, setShowAddSalarie] = useState(false)
  const [showAddAction, setShowAddAction] = useState(false)
  const [formSalarie, setFormSalarie] = useState({
    nom: '', prenom: '', salaire_base: '', date_debut: '', date_fin: ''
  })
  const [formAction, setFormAction] = useState({
    salarie: '', type: 'entree', categorie: '', montant: '', date: '', statut: 'en_cours'
  })

  // Categories
  const [categories, setCategories] = useState<string[]>([
    'Prime', 'Bonus', 'Heures supplémentaires', 'Avance', 'Déduction', 'Absence', 'Autres'
  ])
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCat, setNewCat] = useState('')

  const MOIS_LABELS = [
    'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
  ]

  const fetchData = async () => {
    try {
      const [salsRes, etatRes] = await Promise.all([
        api.get('/salaires/salaries/'),
        api.get(`/salaires/etat/?mois=${mois}&annee=${annee}`),
      ])
      setSalaries(salsRes.data)
      setEtat(etatRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [mois, annee])

  const handleAddSalarie = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/salaires/salaries/', {
        nom: formSalarie.nom,
        prenom: formSalarie.prenom,
        salaire_base: parseFloat(formSalarie.salaire_base),
        date_debut: formSalarie.date_debut,
        date_fin: formSalarie.date_fin,
      })
      setShowAddSalarie(false)
      setFormSalarie({ nom: '', prenom: '', salaire_base: '', date_debut: '', date_fin: '' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddAction = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/salaires/actions/', {
        salarie: parseInt(formAction.salarie),
        type: formAction.type,
        categorie: formAction.categorie,
        montant: parseFloat(formAction.montant),
        date: formAction.date,
        statut: formAction.statut,
      })
      setShowAddAction(false)
      setFormAction({ salarie: '', type: 'entree', categorie: '', montant: '', date: '', statut: 'en_cours' })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDeleteSalarie = async (id: number) => {
    if (!confirm('Supprimer ce salarié ?')) return
    try {
      await api.delete(`/salaires/salaries/${id}/`)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleAddCat = () => {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()])
      setFormAction({ ...formAction, categorie: newCat.trim() })
      setNewCat('')
      setShowAddCat(false)
    }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    border: '1px solid #e0e0e0', borderRadius: '6px',
    fontSize: '13px', outline: 'none',
  }

  const tabStyle = (active: boolean) => ({
    padding: '8px 20px', borderRadius: '6px', cursor: 'pointer',
    fontSize: '12px', fontWeight: '600' as const,
    background: active ? '#1a3a6b' : '#fff',
    color: active ? '#fff' : '#555',
    border: `1px solid ${active ? '#1a3a6b' : '#e0e0e0'}`,
  })

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Gestion des salaires</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Suivi des salaires et actions</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select
              value={`${annee}-${mois}`}
              onChange={e => {
                const [a, m] = e.target.value.split('-')
                setAnnee(parseInt(a))
                setMois(parseInt(m))
              }}
              style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', outline: 'none' }}
            >
              {[2025, 2026, 2027].map(a =>
                MOIS_LABELS.map((label, i) => (
                  <option key={`${a}-${i + 1}`} value={`${a}-${i + 1}`}>
                    {label} {a}
                  </option>
                ))
              )}
            </select>
          </div>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          <button style={tabStyle(activeTab === 'etat')} onClick={() => setActiveTab('etat')}>
            État des salaires
          </button>
          <button style={tabStyle(activeTab === 'salaries')} onClick={() => setActiveTab('salaries')}>
            Add Salarié
          </button>
          <button style={tabStyle(activeTab === 'actions')} onClick={() => setActiveTab('actions')}>
            ADD Actions
          </button>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div>
        ) : (
          <>
            {/* TAB: ÉTAT DES SALAIRES */}
            {activeTab === 'etat' && (
              <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e8eaed', overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                  <thead>
                    <tr style={{ background: '#f8f9fa' }}>
                      {['Mois', 'Nom et prénom', 'Salaire de base', 'Montant ajouté', 'Montant déduit', 'Salaire final', 'Écart', 'Statut'].map(h => (
                        <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {etat.map(e => (
                      <tr key={e.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                        <td style={{ padding: '10px 14px', color: '#555' }}>{MOIS_LABELS[mois - 1]} {annee}</td>
                        <td style={{ padding: '10px 14px', fontWeight: '500', color: '#2c2c2c' }}>{e.nom} {e.prenom}</td>
                        <td style={{ padding: '10px 14px', color: '#555' }}>{e.salaire_base.toLocaleString('fr-FR')} DH</td>
                        <td style={{ padding: '10px 14px', color: '#1a7a40', fontWeight: '600' }}>+{e.montant_ajoute.toLocaleString('fr-FR')} DH</td>
                        <td style={{ padding: '10px 14px', color: '#c0392b', fontWeight: '600' }}>-{e.montant_deduit.toLocaleString('fr-FR')} DH</td>
                        <td style={{ padding: '10px 14px', fontWeight: '700', color: '#1a3a6b' }}>{e.salaire_final.toLocaleString('fr-FR')} DH</td>
                        <td style={{ padding: '10px 14px', fontWeight: '600', color: e.ecart >= 0 ? '#1a7a40' : '#c0392b' }}>
                          {e.ecart.toLocaleString('fr-FR')} DH
                        </td>
                        <td style={{ padding: '10px 14px' }}>
                          <span style={{
                            padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                            background: '#fff3e0', color: '#e65100'
                          }}>En cours</span>
                        </td>
                      </tr>
                    ))}
                    {etat.length === 0 && (
                      <tr>
                        <td colSpan={8} style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
                          Aucun salarié
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            )}

            {/* TAB: ADD SALARIÉ */}
            {activeTab === 'salaries' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <button onClick={() => setShowAddSalarie(!showAddSalarie)} style={{
                    padding: '8px 16px', background: '#0099cc', color: '#fff',
                    border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600'
                  }}>+ Add Salarié</button>
                </div>

                {showAddSalarie && (
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouveau salarié</h3>
                    <form onSubmit={handleAddSalarie}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Nom *</label>
                          <input style={inputStyle} value={formSalarie.nom} onChange={e => setFormSalarie({ ...formSalarie, nom: e.target.value })} required placeholder="Nom" />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Prénom *</label>
                          <input style={inputStyle} value={formSalarie.prenom} onChange={e => setFormSalarie({ ...formSalarie, prenom: e.target.value })} required placeholder="Prénom" />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Salaire de base (DH) *</label>
                          <input style={inputStyle} type="number" value={formSalarie.salaire_base} onChange={e => setFormSalarie({ ...formSalarie, salaire_base: e.target.value })} required placeholder="Ex: 5000" />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date début *</label>
                          <input style={inputStyle} type="date" value={formSalarie.date_debut} onChange={e => setFormSalarie({ ...formSalarie, date_debut: e.target.value })} required />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date fin *</label>
                          <input style={inputStyle} type="date" value={formSalarie.date_fin} onChange={e => setFormSalarie({ ...formSalarie, date_fin: e.target.value })} required />
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button type="submit" style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                        <button type="button" onClick={() => setShowAddSalarie(false)} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                      </div>
                    </form>
                  </div>
                )}

                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e8eaed', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        {['Période', 'Nom et prénom', 'Salaire de base', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {salaries.map(s => (
                        <tr key={s.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '10px 14px', color: '#555' }}>
                            {new Date(s.date_debut).toLocaleDateString('fr-FR')} au {new Date(s.date_fin).toLocaleDateString('fr-FR')}
                          </td>
                          <td style={{ padding: '10px 14px', fontWeight: '500', color: '#2c2c2c' }}>{s.nom} {s.prenom}</td>
                          <td style={{ padding: '10px 14px', fontWeight: '600', color: '#0099cc' }}>{parseFloat(s.salaire_base).toLocaleString('fr-FR')} DH</td>
                          <td style={{ padding: '10px 14px' }}>
                            <button onClick={() => handleDeleteSalarie(s.id)} style={{ padding: '4px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Supprimer</button>
                          </td>
                        </tr>
                      ))}
                      {salaries.length === 0 && (
                        <tr>
                          <td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>Aucun salarié</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* TAB: ADD ACTIONS */}
            {activeTab === 'actions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
                  <button onClick={() => setShowAddAction(!showAddAction)} style={{
                    padding: '8px 16px', background: '#0099cc', color: '#fff',
                    border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600'
                  }}>+ ADD Actions</button>
                </div>

                {showAddAction && (
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouvelle action salarié</h3>
                    <form onSubmit={handleAddAction}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Salarié *</label>
                          <select style={inputStyle} value={formAction.salarie} onChange={e => setFormAction({ ...formAction, salarie: e.target.value })} required>
                            <option value="">Sélectionner un salarié...</option>
                            {salaries.map(s => <option key={s.id} value={s.id}>{s.nom} {s.prenom}</option>)}
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Type *</label>
                          <select style={inputStyle} value={formAction.type} onChange={e => setFormAction({ ...formAction, type: e.target.value })}>
                            <option value="entree">Entrée</option>
                            <option value="sortie">Sortie</option>
                          </select>
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Catégorie</label>
                          <select style={inputStyle} value={formAction.categorie}
                            onChange={e => {
                              if (e.target.value === '__add_cat__') { setShowAddCat(true) }
                              else { setFormAction({ ...formAction, categorie: e.target.value }); setShowAddCat(false) }
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
                          <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Montant (DH) *</label>
                          <input style={inputStyle} type="number" value={formAction.montant} onChange={e => setFormAction({ ...formAction, montant: e.target.value })} required placeholder="Ex: 500" />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date *</label>
                          <input style={inputStyle} type="date" value={formAction.date} onChange={e => setFormAction({ ...formAction, date: e.target.value })} required />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Statut</label>
                          <select style={inputStyle} value={formAction.statut} onChange={e => setFormAction({ ...formAction, statut: e.target.value })}>
                            <option value="en_cours">En cours</option>
                            <option value="traitee">Traitée</option>
                          </select>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button type="submit" style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                        <button type="button" onClick={() => { setShowAddAction(false); setShowAddCat(false) }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                      </div>
                    </form>
                  </div>
                )}

                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e8eaed', overflow: 'hidden' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        {['Salarié', 'Type', 'Catégorie', 'Montant', 'Date', 'Statut', 'Actions'].map(h => (
                          <th key={h} style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {salaries.flatMap(s => s.actions?.map((a: any) => (
                        <tr key={a.id} style={{ borderBottom: '1px solid #f5f5f5' }}>
                          <td style={{ padding: '10px 14px', fontWeight: '500', color: '#2c2c2c' }}>{s.nom} {s.prenom}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600',
                              background: a.type === 'entree' ? '#e8f8ef' : '#fdeaea',
                              color: a.type === 'entree' ? '#1a7a40' : '#c0392b',
                            }}>
                              {a.type === 'entree' ? '↑ Entrée' : '↓ Sortie'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px', color: '#555' }}>{a.categorie || '—'}</td>
                          <td style={{ padding: '10px 14px', fontWeight: '600', color: a.type === 'entree' ? '#1a7a40' : '#c0392b' }}>
                            {a.type === 'entree' ? '+' : '-'}{parseFloat(a.montant).toLocaleString('fr-FR')} DH
                          </td>
                          <td style={{ padding: '10px 14px', color: '#555' }}>{new Date(a.date).toLocaleDateString('fr-FR')}</td>
                          <td style={{ padding: '10px 14px' }}>
                            <span style={{
                              padding: '2px 8px', borderRadius: '4px', fontSize: '11px',
                              background: a.statut === 'traitee' ? '#e8f8ef' : '#fff3e0',
                              color: a.statut === 'traitee' ? '#1a7a40' : '#e65100',
                            }}>
                              {a.statut === 'traitee' ? 'Traitée' : 'En cours'}
                            </span>
                          </td>
                          <td style={{ padding: '10px 14px' }}>
                            <button onClick={async () => {
                              if (!confirm('Supprimer cette action ?')) return
                              await api.delete(`/salaires/actions/${a.id}/`)
                              fetchData()
                            }} style={{ padding: '4px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>
                              Supprimer
                            </button>
                          </td>
                        </tr>
                      )))}
                      {salaries.every(s => !s.actions?.length) && (
                        <tr>
                          <td colSpan={7} style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>Aucune action</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default Salaires