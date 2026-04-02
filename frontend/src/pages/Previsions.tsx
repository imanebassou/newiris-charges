import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const MOIS_LABELS = [
  'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'
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

  const fetchData = async () => {
    try {
      const [prevsRes, ecartsRes] = await Promise.all([
        api.get(`/previsions/?mois=${mois}&annee=${annee}`),
        api.get(`/previsions/ecarts/?mois=${mois}&annee=${annee}`),
      ])
      setPrevisions(prevsRes.data)
      setEcarts(ecartsRes.data.ecarts)
      setSoldeBase(ecartsRes.data.solde_base)
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

  const handleDelete = async (id: number) => {
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

  const getStatutColor = (statut: string) => {
    if (statut === 'traitee') return { bg: '#e8f8ef', color: '#1a7a40' }
    if (statut === 'cloturee') return { bg: '#e8eaed', color: '#555' }
    return { bg: '#fff3e0', color: '#e65100' }
  }

  
  const getSemaineStatus = (semaine: number) => {
    const currentWeek = Math.ceil(now.getDate() / 7)
    const currentMois = now.getMonth() + 1
    const currentAnnee = now.getFullYear()
    if (annee !== currentAnnee || mois !== currentMois) return 'prevision'
    if (semaine < currentWeek) return 'cloturee'
    if (semaine === currentWeek) return 'en_cours'
    return 'prevision'
  }

  const getSemaineLabel = (semaine: number) => {
    const status = getSemaineStatus(semaine)
    if (status === 'cloturee') return { label: 'Clôturée', color: '#555', bg: '#e8eaed' }
    if (status === 'en_cours') return { label: 'En cours', color: '#e65100', bg: '#fff3e0' }
    return { label: 'Prévision', color: '#c0392b', bg: '#fdeaea' }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    border: '1px solid #e0e0e0', borderRadius: '6px',
    fontSize: '13px', outline: 'none',
  }

  const prevsBySemaine = (semaine: number) =>
    previsions.filter(p => p.semaine === semaine)

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Gestion des prévisions</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Planification des entrées et sorties par semaine</p>
          </div>
          {/* FILTRE MOIS */}
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
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Solde de base</div>
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
              {showForm.type === 'entree' ? '↑ Nouvelle prévision entrée' : '↓ Nouvelle prévision sortie'} — Semaine {showForm.semaine}
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
                  <input style={inputStyle} value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} placeholder="Ex: Loyer" />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Description</label>
                  <input style={inputStyle} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description..." />
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
                <button type="button" onClick={() => setShowForm(null)} style={{
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
            {[1, 2, 3, 4].map(semaine => {
              const semaineInfo = getSemaineLabel(semaine)
              const ecartSemaine = ecarts?.[`semaine_${semaine}`]
              const prevsSemaine = prevsBySemaine(semaine)

              return (
                <div
                  key={semaine}
                  onDragOver={e => e.preventDefault()}
                  onDrop={() => handleDrop(semaine)}
                  style={{
                    background: '#f8f9fa', borderRadius: '8px',
                    border: '1px solid #e8eaed', overflow: 'hidden',
                    minHeight: '300px'
                  }}
                >
                  {/* SEMAINE HEADER */}
                  <div style={{
                    background: '#1a3a6b', padding: '10px 12px',
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center'
                  }}>
                    <span style={{ color: '#fff', fontWeight: '600', fontSize: '13px' }}>Semaine {semaine}</span>
                    <span style={{
                      background: semaineInfo.bg, color: semaineInfo.color,
                      fontSize: '10px', padding: '2px 6px', borderRadius: '4px', fontWeight: '600'
                    }}>{semaineInfo.label}</span>
                  </div>

                  {/* BOUTONS AJOUTER */}
                  <div style={{ padding: '8px', display: 'flex', gap: '4px' }}>
                    <button
                      onClick={() => setShowForm({ semaine, type: 'entree' })}
                      style={{
                        flex: 1, padding: '5px', background: '#e8f8ef',
                        color: '#1a7a40', border: '1px solid #a8d5b5',
                        borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '600'
                      }}
                    >↑ Entrée</button>
                    <button
                      onClick={() => setShowForm({ semaine, type: 'sortie' })}
                      style={{
                        flex: 1, padding: '5px', background: '#fdeaea',
                        color: '#c0392b', border: '1px solid #f5c6c6',
                        borderRadius: '4px', fontSize: '10px', cursor: 'pointer', fontWeight: '600'
                      }}
                    >↓ Sortie</button>
                  </div>

                  {/* CARTES PRÉVISIONS */}
                  <div style={{ padding: '0 8px 8px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {prevsSemaine.map(prev => {
                      const statutColors = getStatutColor(prev.statut)
                      return (
                        <div
                          key={prev.id}
                          draggable
                          onDragStart={() => setDraggedId(prev.id)}
                          style={{
                            background: '#fff', borderRadius: '6px',
                            padding: '10px', border: '1px solid #e8eaed',
                            borderLeft: `3px solid ${prev.type === 'entree' ? '#1a7a40' : '#c0392b'}`,
                            cursor: 'grab'
                          }}
                        >
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#2c2c2c' }}>{prev.titre}</div>
                            <button onClick={() => handleDelete(prev.id)} style={{
                              background: 'none', border: 'none', color: '#e84c3d',
                              fontSize: '12px', cursor: 'pointer', padding: '0'
                            }}>✕</button>
                          </div>
                          <div style={{ fontSize: '11px', color: prev.type === 'entree' ? '#1a7a40' : '#c0392b', fontWeight: '600', marginBottom: '4px' }}>
                            {prev.type === 'entree' ? '+' : '-'}{parseFloat(prev.montant).toLocaleString('fr-FR')} DH
                          </div>
                          <div style={{ fontSize: '10px', color: '#aaa', marginBottom: '6px' }}>
                            📅 {new Date(prev.date_prevision).toLocaleDateString('fr-FR')}
                          </div>
                          <select
                            value={prev.statut}
                            onChange={e => handleStatutChange(prev.id, e.target.value)}
                            style={{
                              width: '100%', padding: '3px 6px',
                              borderRadius: '4px', fontSize: '10px',
                              border: '1px solid #e0e0e0', cursor: 'pointer',
                              background: statutColors.bg,
                              color: statutColors.color,
                            }}
                          >
                            <option value="en_cours">En cours</option>
                            <option value="traitee">Traitée</option>
                            <option value="cloturee">Clôturée</option>
                          </select>
                        </div>
                      )
                    })}

                    {prevsSemaine.length === 0 && (
                      <div style={{ textAlign: 'center', color: '#aaa', fontSize: '11px', padding: '20px 0' }}>
                        Aucune prévision
                      </div>
                    )}
                  </div>

                  {/* ÉCART */}
                  {ecartSemaine && (
                    <div style={{
                      margin: '0 8px 8px', padding: '8px',
                      background: '#fff', borderRadius: '6px',
                      border: '1px solid #e8eaed', borderTop: `2px solid ${ecartSemaine.ecart >= 0 ? '#1a7a40' : '#c0392b'}`
                    }}>
                      <div style={{ fontSize: '10px', color: '#888', marginBottom: '2px' }}>
                        Écart S{semaine}
                      </div>
                      <div style={{
                        fontSize: '14px', fontWeight: '700',
                        color: ecartSemaine.ecart >= 0 ? '#1a7a40' : '#c0392b'
                      }}>
                        {ecartSemaine.ecart.toLocaleString('fr-FR')} DH
                      </div>
                      <div style={{ fontSize: '10px', color: '#aaa', marginTop: '2px' }}>
                        ↑ {ecartSemaine.entrees.toLocaleString('fr-FR')} | ↓ {ecartSemaine.sorties.toLocaleString('fr-FR')}
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