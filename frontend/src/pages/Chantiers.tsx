import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const ETAT_CHANTIER = [
  { key: 'confirme', label: 'Confirmé', color: '#1a3a6b', bg: '#e8edf5' },
  { key: 'en_cours', label: 'En cours', color: '#e65100', bg: '#fff3e0' },
  { key: 'bloque', label: 'Bloqué', color: '#c0392b', bg: '#fdeaea' },
  { key: 'termine', label: 'Terminé', color: '#1a7a40', bg: '#e8f8ef' },
  { key: 'receptionne', label: 'Réceptionné', color: '#0099cc', bg: '#e8f4fb' },
]

const ETAT_MATERIEL = [
  { key: 'confirme', label: 'Confirmé', color: '#1a3a6b', bg: '#e8edf5' },
  { key: 'bloque', label: 'Bloqué', color: '#c0392b', bg: '#fdeaea' },
  { key: 'commande', label: 'Commandé', color: '#e65100', bg: '#fff3e0' },
  { key: 'livre', label: 'Livré', color: '#1a7a40', bg: '#e8f8ef' },
]

const Chantiers = () => {
  document.title = 'Gestion de chantier — Newiris'

  const [activeTab, setActiveTab] = useState<'chantiers' | 'planification' | 'materiels'>('chantiers')
  const [chantiers, setChantiers] = useState<any[]>([])
  const [techniciens, setTechniciens] = useState<any[]>([])
  const [planifications, setPlanifications] = useState<any[]>([])
  const [materiels, setMateriels] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showChantierForm, setShowChantierForm] = useState(false)
  const [showMaterielForm, setShowMaterielForm] = useState(false)
  const [chantierForm, setChantierForm] = useState({ nom: '', description: '' })
  const [materielForm, setMaterielForm] = useState({ nom: '' })

  const [currentDate, setCurrentDate] = useState(new Date())
  const [draggingChantier, setDraggingChantier] = useState<any | null>(null)
  const [draggingMateriel, setDraggingMateriel] = useState<any | null>(null)
  const [draggingTech, setDraggingTech] = useState<any | null>(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const dateStr = currentDate.toISOString().split('T')[0]

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [chantiersRes, techsRes, matsRes] = await Promise.all([
        api.get('/chantiers/chantiers/'),
        api.get('/equipe/techniciens/'),
        api.get('/chantiers/materiels/'),
      ])
      setChantiers(chantiersRes.data)
      setTechniciens(techsRes.data)
      setMateriels(matsRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  const fetchPlanifications = async (date: string) => {
    try {
      const res = await api.get(`/chantiers/planifications/?date=${date}`)
      setPlanifications(res.data)
    } catch (err) { console.error(err) }
  }

  useEffect(() => { fetchAll() }, [])
  useEffect(() => { fetchPlanifications(dateStr) }, [dateStr])

  // ===== CHANTIERS =====
  const handleAddChantier = async () => {
    if (!chantierForm.nom) { setError('Nom obligatoire.'); return }
    setError('')
    try {
      await api.post('/chantiers/chantiers/', chantierForm)
      setChantierForm({ nom: '', description: '' })
      setShowChantierForm(false)
      setSuccess(true); setTimeout(() => setSuccess(false), 3000)
      fetchAll()
    } catch { setError('Erreur création chantier.') }
  }

  const handleDeleteChantier = async (id: number) => {
    await api.delete(`/chantiers/chantiers/${id}/`)
    fetchAll()
  }

  const handleDropChantier = async (newEtat: string) => {
    if (!draggingChantier) return
    try {
      await api.patch(`/chantiers/chantiers/${draggingChantier.id}/`, { etat: newEtat })
      setDraggingChantier(null)
      fetchAll()
    } catch { setError('Erreur déplacement chantier.') }
  }

  // ===== PLANIFICATION =====
  const isPlanifie = (techId: number, chantierId: number) => {
    return planifications.some(p => p.technicien === techId && p.chantier === chantierId)
  }

  const handleDropTech = async (chantierId: number) => {
    if (!draggingTech) return
    if (isPlanifie(draggingTech.id, chantierId)) {
      setDraggingTech(null)
      return
    }
    try {
      await api.post('/chantiers/planifications/', {
        technicien: draggingTech.id,
        chantier: chantierId,
        date: dateStr,
      })
      setDraggingTech(null)
      fetchPlanifications(dateStr)
    } catch { setError('Erreur affectation technicien.') }
  }

  const handleRemovePlanif = async (techId: number, chantierId: number) => {
    const planif = planifications.find(p => p.technicien === techId && p.chantier === chantierId)
    if (!planif) return
    await api.delete(`/chantiers/planifications/${planif.id}/`)
    fetchPlanifications(dateStr)
  }

  const prevDay = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() - 1)
    setCurrentDate(d)
  }

  const nextDay = () => {
    const d = new Date(currentDate)
    d.setDate(d.getDate() + 1)
    setCurrentDate(d)
  }

  // ===== MATÉRIELS =====
  const handleAddMateriel = async () => {
    if (!materielForm.nom) { setError('Nom obligatoire.'); return }
    setError('')
    try {
      await api.post('/chantiers/materiels/', materielForm)
      setMaterielForm({ nom: '' })
      setShowMaterielForm(false)
      setSuccess(true); setTimeout(() => setSuccess(false), 3000)
      fetchAll()
    } catch { setError('Erreur création matériel.') }
  }

  const handleDeleteMateriel = async (id: number) => {
    await api.delete(`/chantiers/materiels/${id}/`)
    fetchAll()
  }

  const handleDropMateriel = async (newEtat: string) => {
    if (!draggingMateriel) return
    try {
      await api.patch(`/chantiers/materiels/${draggingMateriel.id}/`, { etat: newEtat })
      setDraggingMateriel(null)
      fetchAll()
    } catch { setError('Erreur déplacement matériel.') }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    border: '1px solid #e0e0e0', borderRadius: '6px',
    fontSize: '13px', outline: 'none',
  }

  // Chantiers confirmés pour planification
  const chantiersConfirmes = chantiers.filter(c => c.etat === 'confirme' || c.etat === 'en_cours')

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Gestion de chantier</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Suivi des chantiers et planification</p>
          </div>
          <button onClick={() => {
            if (activeTab === 'chantiers') setShowChantierForm(!showChantierForm)
            else if (activeTab === 'materiels') setShowMaterielForm(!showMaterielForm)
          }} style={{
            padding: '8px 16px', background: '#0099cc', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600',
            display: activeTab === 'planification' ? 'none' : 'block'
          }}>+ Ajouter NV</button>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[
            { key: 'chantiers', label: 'Chantiers en cours' },
            { key: 'planification', label: 'Planification' },
            { key: 'materiels', label: 'Matériel chantiers' },
          ].map(t => (
            <button key={t.key} onClick={() => setActiveTab(t.key as any)} style={{
              padding: '8px 20px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: activeTab === t.key ? '#1a3a6b' : '#e8edf5',
              color: activeTab === t.key ? '#fff' : '#1a3a6b',
              fontWeight: activeTab === t.key ? 700 : 400, fontSize: '13px',
            }}>{t.label}</button>
          ))}
        </div>

        {/* SUCCESS / ERROR */}
        {success && <div style={{ background: '#e8f8ef', border: '1px solid #a8d5b5', borderRadius: '6px', padding: '12px 16px', fontSize: '13px', color: '#1a7a40', marginBottom: '16px' }}>✓ Opération réussie !</div>}
        {error && <div style={{ background: '#fdeaea', border: '1px solid #f5c6c6', borderRadius: '6px', padding: '12px 16px', fontSize: '13px', color: '#c0392b', marginBottom: '16px' }}>{error}</div>}

        {/* ===== CHANTIERS EN COURS ===== */}
        {activeTab === 'chantiers' && (
          <>
            {showChantierForm && (
              <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouveau chantier</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Nom *</label>
                    <input style={inputStyle} value={chantierForm.nom}
                      onChange={e => setChantierForm(p => ({ ...p, nom: e.target.value }))}
                      placeholder="Ex: Chantier Tanger Nord" />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Description</label>
                    <input style={inputStyle} value={chantierForm.description}
                      onChange={e => setChantierForm(p => ({ ...p, description: e.target.value }))}
                      placeholder="Description optionnelle" />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button onClick={handleAddChantier} style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Enregistrer</button>
                  <button onClick={() => { setShowChantierForm(false); setError('') }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                </div>
              </div>
            )}

            {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div> : (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}>
                {ETAT_CHANTIER.map(etat => {
                  const chantiersEtat = chantiers.filter(c => c.etat === etat.key)
                  return (
                    <div key={etat.key}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDropChantier(etat.key)}
                      style={{
                        minWidth: '220px', flex: '0 0 220px',
                        background: '#f8f9fa', borderRadius: '10px',
                        padding: '12px', border: `2px solid ${etat.bg}`,
                      }}>
                      {/* COLONNE HEADER */}
                      <div style={{
                        background: etat.bg, color: etat.color,
                        borderRadius: '6px', padding: '6px 12px',
                        fontSize: '12px', fontWeight: '700',
                        marginBottom: '12px', textAlign: 'center',
                      }}>{etat.label} ({chantiersEtat.length})</div>

                      {/* CARDS */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100px' }}>
                        {chantiersEtat.length === 0 && (
                          <div style={{ fontSize: '11px', color: '#ccc', textAlign: 'center', padding: '20px' }}>
                            Glisser ici
                          </div>
                        )}
                        {chantiersEtat.map(c => (
                          <div key={c.id} draggable
                            onDragStart={() => setDraggingChantier(c)}
                            style={{
                              background: '#fff', borderRadius: '8px', padding: '12px',
                              border: '1px solid #e8eaed', cursor: 'grab',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                            }}
                            onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)')}
                            onMouseOut={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
                          >
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a6b', marginBottom: '4px' }}>{c.nom}</div>
                            {c.description && <div style={{ fontSize: '11px', color: '#888' }}>{c.description}</div>}
                            <button onClick={() => handleDeleteChantier(c.id)}
                              style={{ marginTop: '8px', padding: '2px 8px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>🗑 Supprimer</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ===== PLANIFICATION ===== */}
        {activeTab === 'planification' && (
          <>
            {/* NAVIGATION DATE */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', background: '#fff', padding: '12px 20px', borderRadius: '8px', border: '1px solid #e8eaed' }}>
              <button onClick={prevDay} style={{ padding: '6px 14px', background: '#e8edf5', color: '#1a3a6b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }}>←</button>
              <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a3a6b', flex: 1, textAlign: 'center' }}>
                {currentDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
              </div>
              <button onClick={nextDay} style={{ padding: '6px 14px', background: '#e8edf5', color: '#1a3a6b', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '16px' }}>→</button>
              <button onClick={() => setCurrentDate(new Date())} style={{ padding: '6px 14px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>Aujourd'hui</button>
            </div>

            <div style={{ display: 'flex', gap: '16px' }}>
              {/* TECHNICIENS DISPONIBLES */}
              <div style={{ minWidth: '180px', background: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e8eaed' }}>
                <div style={{ fontSize: '12px', fontWeight: '700', color: '#1a3a6b', marginBottom: '12px' }}>Techniciens</div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {techniciens.map(t => (
                    <div key={t.id} draggable onDragStart={() => setDraggingTech(t)}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px',
                        background: '#f8f9fa', borderRadius: '8px', padding: '8px',
                        cursor: 'grab', border: '1px solid #e8eaed',
                      }}>
                      {t.photo_url ? (
                        <img src={t.photo_url} alt={t.nom} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#1a3a6b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '10px', fontWeight: '700' }}>
                          {t.prenom?.charAt(0)}{t.nom?.charAt(0)}
                        </div>
                      )}
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#2c2c2c' }}>{t.prenom} {t.nom}</div>
                    </div>
                  ))}
                </div>
              </div>

              {/* CHANTIERS */}
              <div style={{ flex: 1, display: 'flex', gap: '12px', overflowX: 'auto' }}>
                {chantiersConfirmes.length === 0 ? (
                  <div style={{ flex: 1, background: '#fff', borderRadius: '10px', padding: '40px', textAlign: 'center', color: '#aaa', border: '1px solid #e8eaed' }}>
                    Aucun chantier confirmé ou en cours
                  </div>
                ) : chantiersConfirmes.map(c => {
                  const techsPlanifies = planifications.filter(p => p.chantier === c.id)
                  return (
                    <div key={c.id}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDropTech(c.id)}
                      style={{ minWidth: '200px', flex: '0 0 200px', background: '#fff', borderRadius: '10px', padding: '16px', border: '1px solid #e8eaed' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a3a6b', marginBottom: '4px' }}>{c.nom}</div>
                      <div style={{ fontSize: '10px', color: '#0099cc', marginBottom: '12px', fontWeight: '500' }}>
                        {ETAT_CHANTIER.find(e => e.key === c.etat)?.label}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', minHeight: '80px' }}>
                        {techsPlanifies.length === 0 && (
                          <div style={{ fontSize: '11px', color: '#ccc', textAlign: 'center', padding: '16px' }}>Glisser techniciens ici</div>
                        )}
                        {techsPlanifies.map(p => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: '#f8f9fa', borderRadius: '6px', padding: '6px 8px', border: '1px solid #e8eaed' }}>
                            {p.technicien_photo ? (
                              <img src={p.technicien_photo} alt="" style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }} />
                            ) : (
                              <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1a3a6b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '9px', fontWeight: '700' }}>
                                {p.technicien_nom?.charAt(0)}
                              </div>
                            )}
                            <span style={{ fontSize: '11px', flex: 1, color: '#2c2c2c' }}>{p.technicien_nom}</span>
                            <button onClick={() => handleRemovePlanif(p.technicien, c.id)}
                              style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: '12px', padding: '0' }}>✕</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </>
        )}

        {/* ===== MATÉRIEL CHANTIERS ===== */}
        {activeTab === 'materiels' && (
          <>
            {showMaterielForm && (
              <div style={{ background: '#fff', borderRadius: '8px', padding: '24px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouveau matériel</h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Nom du matériel *</label>
                    <input style={inputStyle} value={materielForm.nom}
                      onChange={e => setMaterielForm({ nom: e.target.value })}
                      placeholder="Ex: Échafaudage, Câbles..." />
                  </div>
                  <button onClick={handleAddMateriel} style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Enregistrer</button>
                  <button onClick={() => { setShowMaterielForm(false); setError('') }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                </div>
              </div>
            )}

            {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div> : (
              <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '12px' }}>
                {ETAT_MATERIEL.map(etat => {
                  const matsEtat = materiels.filter(m => m.etat === etat.key)
                  return (
                    <div key={etat.key}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDropMateriel(etat.key)}
                      style={{
                        minWidth: '220px', flex: '0 0 220px',
                        background: '#f8f9fa', borderRadius: '10px',
                        padding: '12px', border: `2px solid ${etat.bg}`,
                      }}>
                      <div style={{
                        background: etat.bg, color: etat.color,
                        borderRadius: '6px', padding: '6px 12px',
                        fontSize: '12px', fontWeight: '700',
                        marginBottom: '12px', textAlign: 'center',
                      }}>{etat.label} ({matsEtat.length})</div>

                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '100px' }}>
                        {matsEtat.length === 0 && (
                          <div style={{ fontSize: '11px', color: '#ccc', textAlign: 'center', padding: '20px' }}>Glisser ici</div>
                        )}
                        {matsEtat.map(m => (
                          <div key={m.id} draggable
                            onDragStart={() => setDraggingMateriel(m)}
                            style={{
                              background: '#fff', borderRadius: '8px', padding: '12px',
                              border: '1px solid #e8eaed', cursor: 'grab',
                              boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                            }}
                            onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.12)')}
                            onMouseOut={e => (e.currentTarget.style.boxShadow = '0 1px 4px rgba(0,0,0,0.06)')}
                          >
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a6b' }}>{m.nom}</div>
                            <button onClick={() => handleDeleteMateriel(m.id)}
                              style={{ marginTop: '8px', padding: '2px 8px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' }}>🗑 Supprimer</button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default Chantiers