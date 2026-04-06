import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
]

const SEMAINES_DEFAULT = [
  { debut: 1, fin: 7 },
  { debut: 8, fin: 14 },
  { debut: 15, fin: 22 },
  { debut: 23, fin: 31 },
]

const Previsions = () => {
  document.title = 'Prévisions — Newiris'

  const now = new Date()
  const [mois, setMois] = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const [previsions, setPrevisions] = useState<any[]>([])
  const [ecarts, setEcarts] = useState<any>(null)
  const [soldeBase, setSoldeBase] = useState(0)
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState<{ semaine: number; type: string } | null>(null)
  const [form, setForm] = useState({
    titre: '', description: '', montant: '',
    date_prevision: '', categorie: '', statut: 'en_cours'
  })
  const [draggedId, setDraggedId] = useState<number | null>(null)
  const [categories, setCategories] = useState<string[]>([
    'Loyer', 'Électricité', 'Eau', 'Internet', 'Téléphone',
    'Assurance', 'Salaires', 'Transport', 'Maintenance',
    'Fournitures bureau', 'Vente', 'Prestation', 'Autres',
  ])
  const [users, setUsers] = useState<any[]>([])
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [newPerson, setNewPerson] = useState('')
  const [semaines, setSemaines] = useState(SEMAINES_DEFAULT)
  const [editingSemaine, setEditingSemaine] = useState<number | null>(null)
  const [editDebutFin, setEditDebutFin] = useState({ debut: '', fin: '' })

  const fetchData = async () => {
    try {
      const [prevsRes, ecartsRes, usersRes] = await Promise.all([
        api.get(`/previsions/?mois=${mois}&annee=${annee}`),
        api.get(`/previsions/ecarts/?mois=${mois}&annee=${annee}`),
        api.get('/auth/users/'),
      ])
      setPrevisions(prevsRes.data)
      setEcarts(ecartsRes.data.ecarts)
      setSoldeBase(ecartsRes.data.solde_base)
      setUsers(usersRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [mois, annee])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showForm) return
    try {
      await api.post('/previsions/', {
        type: showForm.type,
        semaine: showForm.semaine,
        mois, annee,
        titre: form.titre,
        description: form.description,
        montant: parseFloat(form.montant),
        date_prevision: form.date_prevision,
        categorie: form.categorie,
        statut: form.statut,
      })
      setShowForm(null)
      setForm({ titre: '', description: '', montant: '', date_prevision: '', categorie: '', statut: 'en_cours' })
      setShowAddCat(false)
      setShowAddPerson(false)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleStatutChange = async (id: number, statut: string) => {
    try {
      await api.patch(`/previsions/${id}/`, { statut })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    if (!confirm('Supprimer cette prévision ?')) return
    try {
      await api.delete(`/previsions/${id}/`)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleDrop = async (semaine: number) => {
    if (!draggedId) return
    try {
      await api.patch(`/previsions/${draggedId}/`, { semaine })
      setDraggedId(null)
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

  const handleAddPerson = () => {
    if (newPerson.trim() && !users.find((u: any) => u.username === newPerson.trim())) {
      const fakeUser = { id: `new_${newPerson.trim()}`, username: newPerson.trim() }
      setUsers([...users, fakeUser])
      setForm({ ...form, description: newPerson.trim() })
      setNewPerson('')
      setShowAddPerson(false)
    }
  }

  const getStatutColor = (statut: string) => {
    if (statut === 'traitee') return { bg: '#e8f8ef', color: '#1a7a40' }
    if (statut === 'cloturee') return { bg: '#e8eaed', color: '#555' }
    return { bg: '#fff3e0', color: '#e65100' }
  }

  const getCurrentSemaine = () => {
    const day = now.getDate()
    const currentMois = now.getMonth() + 1
    const currentAnnee = now.getFullYear()
    if (annee !== currentAnnee || mois !== currentMois) return 0
    for (let i = 0; i < semaines.length; i++) {
      if (day >= semaines[i].debut && day <= semaines[i].fin) return i + 1
    }
    return 0
  }

  const getSemaineLabel = (semaineNum: number) => {
    const current = getCurrentSemaine()
    if (semaineNum < current) return { label: 'Clôturée', color: '#555', bg: '#e8eaed' }
    if (semaineNum === current) return { label: 'En cours', color: '#e65100', bg: '#fff3e0' }
    return { label: 'Prévision', color: '#c0392b', bg: '#fdeaea' }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    border: '1px solid #e0e0e0', borderRadius: '6px',
    fontSize: '13px', outline: 'none',
  }

  const addNewStyle = { display: 'flex', gap: '6px', marginTop: '6px' }

  const prevsBySemaineAndType = (semaine: number, type: string) =>
    previsions.filter(p => p.semaine === semaine && p.type === type)

  const renderCard = (prev: any) => {
    const statutColors = getStatutColor(prev.statut)
    const isEntree = prev.type === 'entree'
    return (
      <div
        key={prev.id}
        draggable
        onDragStart={() => setDraggedId(prev.id)}
        style={{
          background: '#fff', borderRadius: '6px',
          padding: '8px 10px', border: '1px solid #e8eaed',
          borderLeft: `3px solid ${isEntree ? '#1a7a40' : '#c0392b'}`,
          cursor: 'grab'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3px' }}>
          <span style={{ fontSize: '11px', fontWeight: '600', color: '#2c2c2c' }}>{prev.titre}</span>
          <button
            onClick={e => handleDelete(e, prev.id)}
            style={{
              background: '#fdeaea', border: '1px solid #f5c6c6',
              color: '#c0392b', fontSize: '10px', cursor: 'pointer',
              padding: '1px 6px', borderRadius: '3px', fontWeight: '600'
            }}
          >Supprimer</button>
        </div>
        <div style={{ fontSize: '12px', fontWeight: '700', color: isEntree ? '#1a7a40' : '#c0392b', marginBottom: '3px' }}>
          {isEntree ? '+' : '-'}{parseFloat(prev.montant).toLocaleString('fr-FR')} DH
        </div>
        <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>
          {new Date(prev.date_prevision).toLocaleDateString('fr-FR')}
          {prev.description && ` — ${prev.description}`}
          {prev.categorie && ` — ${prev.categorie}`}
        </div>
        <select
          value={prev.statut}
          onChange={e => handleStatutChange(prev.id, e.target.value)}
          style={{
            width: '100%', padding: '2px 6px',
            borderRadius: '4px', fontSize: '10px',
            border: '1px solid #e0e0e0', cursor: 'pointer',
            background: statutColors.bg, color: statutColors.color,
          }}
        >
          <option value="en_cours">En cours</option>
          <option value="traitee">Traitée</option>
          <option value="cloturee">Clôturée</option>
        </select>
      </div>
    )
  }

  const editInputStyle = {
    width: '38px',
    padding: '3px 4px',
    borderRadius: '4px',
    border: '1px solid rgba(255,255,255,0.4)',
    fontSize: '12px',
    textAlign: 'center' as const,
    color: '#fff',
    fontWeight: '700' as const,
    background: 'rgba(255,255,255,0.15)',
    outline: 'none',
  }

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Gestion des prévisions</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Planification des entrées et sorties par semaine</p>
          </div>
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

        {/* SOLDE */}
        <div style={{
          background: '#fff', borderRadius: '8px', padding: '16px',
          border: '1px solid #e8eaed', borderTop: '3px solid #1a3a6b',
          marginBottom: '20px', display: 'inline-block', minWidth: '200px'
        }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Solde (basé sur les prévisions traitées)</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a3a6b' }}>
            {soldeBase.toLocaleString('fr-FR')} DH
          </div>
        </div>

        {/* FORMULAIRE */}
        {showForm && (
          <div style={{
            background: '#fff', borderRadius: '8px', padding: '20px',
            border: '1px solid #e8eaed', marginBottom: '20px',
            borderTop: `3px solid ${showForm.type === 'entree' ? '#1a7a40' : '#c0392b'}`
          }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>
              {showForm.type === 'entree' ? 'Nouvelle prévision Entrée' : 'Nouvelle prévision Sortie'} — Semaine {showForm.semaine}
            </h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Titre *</label>
                  <input style={inputStyle} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required placeholder="Ex: Paiement fournisseur" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date de prévision *</label>
                  <input style={inputStyle} type="date" value={form.date_prevision} onChange={e => setForm({ ...form, date_prevision: e.target.value })} required />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Montant (DH) *</label>
                  <input style={inputStyle} type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} required placeholder="Ex: 5000" />
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
                    <div style={addNewStyle}>
                      <input style={{ ...inputStyle, flex: 1 }} value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nouvelle catégorie..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCat())} />
                      <button type="button" onClick={handleAddCat} style={{ padding: '8px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button>
                      <button type="button" onClick={() => { setShowAddCat(false); setNewCat('') }} style={{ padding: '8px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>X</button>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Personne</label>
                  <select style={inputStyle} value={form.description}
                    onChange={e => {
                      if (e.target.value === '__add_person__') { setShowAddPerson(true) }
                      else { setForm({ ...form, description: e.target.value }); setShowAddPerson(false) }
                    }}>
                    <option value="">Sélectionner une personne...</option>
                    {users.map((u: any) => <option key={u.id} value={u.username}>{u.username}</option>)}
                    <option value="__add_person__">+ Add New</option>
                  </select>
                  {showAddPerson && (
                    <div style={addNewStyle}>
                      <input style={{ ...inputStyle, flex: 1 }} value={newPerson} onChange={e => setNewPerson(e.target.value)} placeholder="Nom de la personne..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddPerson())} />
                      <button type="button" onClick={handleAddPerson} style={{ padding: '8px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button>
                      <button type="button" onClick={() => { setShowAddPerson(false); setNewPerson('') }} style={{ padding: '8px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>X</button>
                    </div>
                  )}
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Statut</label>
                  <select style={inputStyle} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                    <option value="en_cours">En cours</option>
                    <option value="traitee">Traitée</option>
                    <option value="cloturee">Clôturée</option>
                  </select>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" style={{
                  padding: '8px 20px',
                  background: showForm.type === 'entree' ? '#1a7a40' : '#c0392b',
                  color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
                }}>Créer</button>
                <button type="button" onClick={() => { setShowForm(null); setShowAddCat(false); setShowAddPerson(false) }} style={{
                  padding: '8px 20px', background: '#fff', color: '#555',
                  border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
                }}>Annuler</button>
              </div>
            </form>
          </div>
        )}

        {/* KANBAN BOARD */}
        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
            {[0, 1, 2, 3].map(idx => {
              const semaine = idx + 1
              const semaineInfo = getSemaineLabel(semaine)
              const ecartSemaine = ecarts?.[`semaine_${semaine}`]
              const entrees = prevsBySemaineAndType(semaine, 'entree')
              const sorties = prevsBySemaineAndType(semaine, 'sortie')
              const s = semaines[idx]

              return (
                <div
                  key={semaine}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(semaine)}
                  style={{
                    background: '#f8f9fa', borderRadius: '8px',
                    border: '1px solid #e8eaed', overflow: 'hidden',
                    minHeight: '400px'
                  }}
                >
                  {/* HEADER */}
                  <div style={{
                    background: '#1a3a6b', padding: '10px 12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flex: 1 }}>
                      <span style={{ color: '#fff', fontWeight: '700', fontSize: '12px', whiteSpace: 'nowrap' }}>S{semaine}</span>
                      {editingSemaine === idx ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '3px' }}>
                          <input
                            type="number" min="1" max="31"
                            value={editDebutFin.debut}
                            onChange={e => setEditDebutFin({ ...editDebutFin, debut: e.target.value })}
                            style={editInputStyle}
                          />
                          <span style={{ color: '#fff', fontSize: '10px' }}>au</span>
                          <input
                            type="number" min="1" max="31"
                            value={editDebutFin.fin}
                            onChange={e => setEditDebutFin({ ...editDebutFin, fin: e.target.value })}
                            style={editInputStyle}
                          />
                          <button onClick={() => {
                            const newSemaines = [...semaines]
                            newSemaines[idx] = { debut: parseInt(editDebutFin.debut), fin: parseInt(editDebutFin.fin) }
                            setSemaines(newSemaines)
                            setEditingSemaine(null)
                          }} style={{
                            padding: '2px 6px', background: '#0099cc', color: '#fff',
                            border: 'none', borderRadius: '3px', fontSize: '10px', cursor: 'pointer', fontWeight: '600'
                          }}>OK</button>
                          <button onClick={() => setEditingSemaine(null)} style={{
                            padding: '2px 6px', background: '#e84c3d', color: '#fff',
                            border: 'none', borderRadius: '3px', fontSize: '10px', cursor: 'pointer', fontWeight: '600'
                          }}>X</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                          <span style={{ color: '#ccc', fontSize: '11px', fontWeight: '600' }}>
                            du {s.debut} au {s.fin}
                          </span>
                          <button
                            onClick={() => { setEditingSemaine(idx); setEditDebutFin({ debut: String(s.debut), fin: String(s.fin) }) }}
                            style={{ background: 'none', border: 'none', color: '#ccc', fontSize: '11px', cursor: 'pointer', padding: '0 2px' }}
                          >✏️</button>
                        </div>
                      )}
                    </div>
                    <span style={{
                      background: semaineInfo.bg, color: semaineInfo.color,
                      fontSize: '10px', padding: '2px 8px', borderRadius: '4px',
                      fontWeight: '600', whiteSpace: 'nowrap', marginLeft: '4px'
                    }}>{semaineInfo.label}</span>
                  </div>

                  <div style={{ padding: '8px' }}>
                    {/* ENTREES */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 8px', background: '#e8f8ef', borderRadius: '6px',
                      marginBottom: '6px', border: '1px solid #a8d5b5'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#1a7a40' }}>ENTREES</span>
                      <button onClick={() => setShowForm({ semaine, type: 'entree' })} style={{
                        padding: '2px 8px', background: '#1a7a40', color: '#fff',
                        border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '600'
                      }}>+ Ajouter</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                      {entrees.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#aaa', fontSize: '11px', padding: '8px 0', fontStyle: 'italic' }}>Aucune entrée</div>
                      ) : entrees.map(prev => renderCard(prev))}
                    </div>

                    {/* SORTIES */}
                    <div style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '6px 8px', background: '#fdeaea', borderRadius: '6px',
                      marginBottom: '6px', border: '1px solid #f5c6c6'
                    }}>
                      <span style={{ fontSize: '11px', fontWeight: '700', color: '#c0392b' }}>SORTIES</span>
                      <button onClick={() => setShowForm({ semaine, type: 'sortie' })} style={{
                        padding: '2px 8px', background: '#c0392b', color: '#fff',
                        border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '600'
                      }}>+ Ajouter</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '8px' }}>
                      {sorties.length === 0 ? (
                        <div style={{ textAlign: 'center', color: '#aaa', fontSize: '11px', padding: '8px 0', fontStyle: 'italic' }}>Aucune sortie</div>
                      ) : sorties.map(prev => renderCard(prev))}
                    </div>
                  </div>

                  {/* ECART */}
                  {ecartSemaine && (
                    <div style={{
                      margin: '0 8px 8px', padding: '8px 10px',
                      background: '#fff', borderRadius: '6px',
                      border: '1px solid #e8eaed',
                      borderTop: `2px solid ${ecartSemaine.ecart >= 0 ? '#1a7a40' : '#c0392b'}`
                    }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#888' }}>Ecart S{semaine}</div>
                          <div style={{ fontSize: '15px', fontWeight: '700', color: ecartSemaine.ecart >= 0 ? '#1a7a40' : '#c0392b' }}>
                            {ecartSemaine.ecart.toLocaleString('fr-FR')} DH
                          </div>
                        </div>
                        <div style={{ textAlign: 'right' }}>
                          <div style={{ fontSize: '10px', color: '#1a7a40' }}>+{ecartSemaine.entrees.toLocaleString('fr-FR')}</div>
                          <div style={{ fontSize: '10px', color: '#c0392b' }}>-{ecartSemaine.sorties.toLocaleString('fr-FR')}</div>
                        </div>
                      </div>
                      <div style={{ marginTop: '4px' }}>
                        <span style={{
                          fontSize: '9px', padding: '2px 6px', borderRadius: '3px',
                          background: semaineInfo.bg, color: semaineInfo.color, fontWeight: '600'
                        }}>{semaineInfo.label}</span>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default Previsions