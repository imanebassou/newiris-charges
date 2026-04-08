import { useEffect, useState, useRef } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'

const NIVEAU_CHOICES = [
  { value: 'confirme', label: 'Technicien Confirmé' },
  { value: 'operationnel', label: 'Technicien Opérationnel' },
  { value: 'junior', label: 'Technicien Junior' },
]

const COULEUR_CHOICES = [
  { value: 'vert', label: 'Vert', bg: '#4CAF50', color: '#fff' },
  { value: 'orange', label: 'Orange', bg: '#FF9800', color: '#fff' },
  { value: 'rouge', label: 'Rouge', bg: '#f44336', color: '#fff' },
  { value: 'gris', label: 'Gris', bg: '#e0e0e0', color: '#555' },
]

const Equipe = () => {
  document.title = 'État d\'équipe — Newiris'

  const [activeTab, setActiveTab] = useState<'equipe' | 'materiel'>('equipe')
  const [chefs, setChefs] = useState<any[]>([])
  const [techniciens, setTechniciens] = useState<any[]>([])
  const [materiels, setMateriels] = useState<any[]>([])
  const [etats, setEtats] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  // Forms
  const [showChefForm, setShowChefForm] = useState(false)
  const [showTechForm, setShowTechForm] = useState<number | null>(null) // chef id
  const [showMaterielForm, setShowMaterielForm] = useState(false)

  const [chefForm, setChefForm] = useState({ nom: '', prenom: '', photo: null as File | null })
  const [techForm, setTechForm] = useState({ nom: '', prenom: '', niveau: 'junior', photo: null as File | null })
  const [materielForm, setMaterielForm] = useState({ nom: '' })

  // Drag & drop
  const [draggingTech, setDraggingTech] = useState<any | null>(null)

  const chefPhotoRef = useRef<HTMLInputElement>(null)
  const techPhotoRef = useRef<HTMLInputElement>(null)

  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [chefsRes, techsRes, matsRes, etatsRes] = await Promise.all([
        api.get('/equipe/chefs/'),
        api.get('/equipe/techniciens/'),
        api.get('/equipe/materiels/'),
        api.get('/equipe/etats/'),
      ])
      setChefs(chefsRes.data)
      setTechniciens(techsRes.data)
      setMateriels(matsRes.data)
      setEtats(etatsRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchAll() }, [])

  // ===== CHEFS =====
  const handleAddChef = async () => {
    if (!chefForm.nom || !chefForm.prenom) { setError('Nom et prénom obligatoires.'); return }
    setError('')
    try {
      const fd = new FormData()
      fd.append('nom', chefForm.nom)
      fd.append('prenom', chefForm.prenom)
      if (chefForm.photo) fd.append('photo', chefForm.photo)
      await api.post('/equipe/chefs/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setChefForm({ nom: '', prenom: '', photo: null })
      if (chefPhotoRef.current) chefPhotoRef.current.value = ''
      setShowChefForm(false)
      setSuccess(true); setTimeout(() => setSuccess(false), 3000)
      fetchAll()
    } catch { setError('Erreur création chef.') }
  }

  const handleDeleteChef = async (id: number) => {
    await api.delete(`/equipe/chefs/${id}/`)
    fetchAll()
  }

  // ===== TECHNICIENS =====
  const handleAddTech = async (chefId: number) => {
    if (!techForm.nom || !techForm.prenom) { setError('Nom et prénom obligatoires.'); return }
    setError('')
    try {
      const fd = new FormData()
      fd.append('nom', techForm.nom)
      fd.append('prenom', techForm.prenom)
      fd.append('niveau', techForm.niveau)
      fd.append('chef', String(chefId))
      if (techForm.photo) fd.append('photo', techForm.photo)
      await api.post('/equipe/techniciens/', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      setTechForm({ nom: '', prenom: '', niveau: 'junior', photo: null })
      if (techPhotoRef.current) techPhotoRef.current.value = ''
      setShowTechForm(null)
      setSuccess(true); setTimeout(() => setSuccess(false), 3000)
      fetchAll()
    } catch { setError('Erreur création technicien.') }
  }

  const handleDeleteTech = async (id: number) => {
    await api.delete(`/equipe/techniciens/${id}/`)
    fetchAll()
  }

  // ===== DRAG & DROP =====
  const handleDrop = async (chefId: number | null) => {
    if (!draggingTech) return
    try {
      await api.patch(`/equipe/techniciens/${draggingTech.id}/`, { chef: chefId })
      setDraggingTech(null)
      fetchAll()
    } catch { setError('Erreur déplacement technicien.') }
  }

  // ===== MATERIELS =====
  const handleAddMateriel = async () => {
    if (!materielForm.nom) { setError('Nom obligatoire.'); return }
    setError('')
    try {
      await api.post('/equipe/materiels/', { nom: materielForm.nom })
      setMaterielForm({ nom: '' })
      setShowMaterielForm(false)
      setSuccess(true); setTimeout(() => setSuccess(false), 3000)
      fetchAll()
    } catch { setError('Erreur création matériel.') }
  }

  const handleDeleteMateriel = async (id: number) => {
    await api.delete(`/equipe/materiels/${id}/`)
    fetchAll()
  }

  // ===== ÉTATS MATÉRIEL =====
  const getEtat = (techId: number, matId: number) => {
    return etats.find(e => e.technicien === techId && e.materiel === matId)
  }

  const handleEtatChange = async (techId: number, matId: number, couleur: string) => {
    const existing = getEtat(techId, matId)
    try {
      if (existing) {
        await api.patch(`/equipe/etats/${existing.id}/`, { couleur })
      } else {
        await api.post('/equipe/etats/', { technicien: techId, materiel: matId, couleur })
      }
      fetchAll()
    } catch { setError('Erreur mise à jour état.') }
  }

  const inputStyle = {
    width: '100%', padding: '8px 12px',
    border: '1px solid #e0e0e0', borderRadius: '6px',
    fontSize: '13px', outline: 'none',
  }

  const niveauLabel: { [k: string]: string } = {
    confirme: 'Confirmé', operationnel: 'Opérationnel', junior: 'Junior'
  }

  const niveauColor: { [k: string]: string } = {
    confirme: '#1a3a6b', operationnel: '#0099cc', junior: '#888'
  }

  // Techniciens sans chef
  const techsSansChef = techniciens.filter(t => !t.chef)

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>État d'équipe</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Gestion des équipes et matériels</p>
          </div>
          <button onClick={() => {
            if (activeTab === 'equipe') setShowChefForm(!showChefForm)
            else setShowMaterielForm(!showMaterielForm)
          }} style={{
            padding: '8px 16px', background: '#0099cc', color: '#fff',
            border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600'
          }}>+ Ajouter NV</button>
        </div>

        {/* TABS */}
        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px' }}>
          {[{ key: 'equipe', label: 'État d\'équipe' }, { key: 'materiel', label: 'État matériel et EPI' }].map(t => (
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

        {/* ===== ÉTAT D'ÉQUIPE ===== */}
        {activeTab === 'equipe' && (
          <>
            {/* FORM CHEF */}
            {showChefForm && (
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouveau chef d'équipe</h3>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Prénom *</label>
                    <input style={inputStyle} value={chefForm.prenom} onChange={e => setChefForm(p => ({ ...p, prenom: e.target.value }))} placeholder="Prénom" />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Nom *</label>
                    <input style={inputStyle} value={chefForm.nom} onChange={e => setChefForm(p => ({ ...p, nom: e.target.value }))} placeholder="Nom" />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Photo</label>
                    <input type="file" accept="image/*" ref={chefPhotoRef}
                      onChange={e => setChefForm(p => ({ ...p, photo: e.target.files?.[0] || null }))}
                      style={{ fontSize: '12px' }} />
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button onClick={handleAddChef} style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                  <button onClick={() => { setShowChefForm(false); setError('') }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                </div>
              </div>
            )}

            {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div> : (
              <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'flex-start' }}>

                {/* TECHNICIENS SANS CHEF */}
                {techsSansChef.length > 0 && (
                  <div
                    onDragOver={e => e.preventDefault()}
                    onDrop={() => handleDrop(null)}
                    style={{
                      background: '#f8f9fa', borderRadius: '10px', padding: '16px',
                      minWidth: '200px', border: '2px dashed #ddd',
                    }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#888', marginBottom: '12px' }}>
                      Sans équipe
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {techsSansChef.map(t => (
                        <TechCard key={t.id} tech={t} niveauLabel={niveauLabel} niveauColor={niveauColor}
                          onDragStart={() => setDraggingTech(t)}
                          onDelete={() => handleDeleteTech(t.id)} />
                      ))}
                    </div>
                  </div>
                )}

                {/* CHEFS */}
                {chefs.map(chef => {
                  const techsChef = techniciens.filter(t => t.chef === chef.id)
                  return (
                    <div key={chef.id}
                      onDragOver={e => e.preventDefault()}
                      onDrop={() => handleDrop(chef.id)}
                      style={{
                        background: '#fff', borderRadius: '10px', padding: '16px',
                        minWidth: '220px', border: '1px solid #e8eaed',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}>

                      {/* CHEF HEADER */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', paddingBottom: '12px', borderBottom: '1px solid #f0f0f0' }}>
                        {chef.photo_url ? (
                          <img src={chef.photo_url} alt={chef.nom}
                            style={{ width: '44px', height: '44px', borderRadius: '50%', objectFit: 'cover', border: '2px solid #1a3a6b' }} />
                        ) : (
                          <div style={{ width: '44px', height: '44px', borderRadius: '50%', background: '#1a3a6b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '16px', fontWeight: '700' }}>
                            {chef.prenom?.charAt(0)}{chef.nom?.charAt(0)}
                          </div>
                        )}
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1a3a6b' }}>{chef.prenom} {chef.nom}</div>
                          <div style={{ fontSize: '10px', color: '#0099cc', fontWeight: '500' }}>Chef d'équipe</div>
                        </div>
                        <button onClick={() => handleDeleteChef(chef.id)}
                          style={{ background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer' }}>🗑</button>
                      </div>

                      {/* TECHNICIENS */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', minHeight: '60px' }}>
                        {techsChef.length === 0 && (
                          <div style={{ fontSize: '11px', color: '#ccc', textAlign: 'center', padding: '12px' }}>
                            Glisser des techniciens ici
                          </div>
                        )}
                        {techsChef.map(t => (
                          <TechCard key={t.id} tech={t} niveauLabel={niveauLabel} niveauColor={niveauColor}
                            onDragStart={() => setDraggingTech(t)}
                            onDelete={() => handleDeleteTech(t.id)} />
                        ))}
                      </div>

                      {/* BOUTON AJOUTER TECH */}
                      {showTechForm === chef.id ? (
                        <div style={{ marginTop: '12px', background: '#f8f9fa', borderRadius: '8px', padding: '12px' }}>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            <input style={inputStyle} value={techForm.prenom}
                              onChange={e => setTechForm(p => ({ ...p, prenom: e.target.value }))} placeholder="Prénom *" />
                            <input style={inputStyle} value={techForm.nom}
                              onChange={e => setTechForm(p => ({ ...p, nom: e.target.value }))} placeholder="Nom *" />
                            <select style={inputStyle} value={techForm.niveau}
                              onChange={e => setTechForm(p => ({ ...p, niveau: e.target.value }))}>
                              {NIVEAU_CHOICES.map(n => <option key={n.value} value={n.value}>{n.label}</option>)}
                            </select>
                            <input type="file" accept="image/*" ref={techPhotoRef}
                              onChange={e => setTechForm(p => ({ ...p, photo: e.target.files?.[0] || null }))}
                              style={{ fontSize: '11px' }} />
                            <div style={{ display: 'flex', gap: '6px' }}>
                              <button onClick={() => handleAddTech(chef.id)}
                                style={{ flex: 1, padding: '6px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                              <button onClick={() => { setShowTechForm(null); setError('') }}
                                style={{ flex: 1, padding: '6px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                            </div>
                          </div>
                        </div>
                      ) : (
                        <button onClick={() => setShowTechForm(chef.id)} style={{
                          marginTop: '12px', width: '100%', padding: '6px',
                          background: '#e8f4fb', color: '#0099cc',
                          border: '1px dashed #0099cc', borderRadius: '6px',
                          fontSize: '12px', cursor: 'pointer'
                        }}>+ Ajouter technicien</button>
                      )}
                    </div>
                  )
                })}
              </div>
            )}
          </>
        )}

        {/* ===== ÉTAT MATÉRIEL ET EPI ===== */}
        {activeTab === 'materiel' && (
          <>
            {showMaterielForm && (
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouveau matériel</h3>
                <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-end' }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Nom du matériel *</label>
                    <input style={inputStyle} value={materielForm.nom}
                      onChange={e => setMaterielForm({ nom: e.target.value })} placeholder="Ex: Perceuse, Casque EPI..." />
                  </div>
                  <button onClick={handleAddMateriel} style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                  <button onClick={() => { setShowMaterielForm(false); setError('') }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                </div>
              </div>
            )}

            {loading ? <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div> : (
              techniciens.length === 0 || materiels.length === 0 ? (
                <div style={{ background: '#fff', borderRadius: '8px', padding: '40px', textAlign: 'center', color: '#aaa', border: '1px solid #e8eaed' }}>
                  {techniciens.length === 0 ? 'Aucun technicien — créez des techniciens dans l\'onglet État d\'équipe.' : 'Aucun matériel — cliquez sur + Ajouter NV.'}
                </div>
              ) : (
                <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e8eaed', overflow: 'auto' }}>
                  <table style={{ borderCollapse: 'collapse', fontSize: '12px' }}>
                    <thead>
                      <tr style={{ background: '#f8f9fa' }}>
                        <th style={{ padding: '10px 14px', textAlign: 'left', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed', borderRight: '1px solid #e8eaed', minWidth: '140px' }}>Matériel / Tech</th>
                        {techniciens.map(t => (
                          <th key={t.id} style={{ padding: '8px 12px', textAlign: 'center', color: '#1a3a6b', fontWeight: '600', borderBottom: '1px solid #e8eaed', borderRight: '1px solid #f0f0f0', minWidth: '100px' }}>
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '4px' }}>
                              {t.photo_url ? (
                                <img src={t.photo_url} alt={t.nom} style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
                              ) : (
                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#1a3a6b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: '700' }}>
                                  {t.prenom?.charAt(0)}{t.nom?.charAt(0)}
                                </div>
                              )}
                              <span style={{ fontSize: '10px' }}>{t.prenom} {t.nom}</span>
                            </div>
                          </th>
                        ))}
                        <th style={{ padding: '10px 14px', textAlign: 'center', color: '#888', fontWeight: '500', borderBottom: '1px solid #e8eaed' }}>Suppr.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {materiels.map((m, mi) => (
                        <tr key={m.id} style={{ background: mi % 2 === 0 ? '#fff' : '#fafafa' }}>
                          <td style={{ padding: '10px 14px', fontWeight: '500', color: '#2c2c2c', borderRight: '1px solid #e8eaed', borderBottom: '1px solid #f0f0f0' }}>{m.nom}</td>
                          {techniciens.map(t => {
                            const etat = getEtat(t.id, m.id)
                            const couleur = etat?.couleur || 'vert'
                            const couleurInfo = COULEUR_CHOICES.find(c => c.value === couleur)
                            return (
                              <td key={t.id} style={{ padding: '6px', textAlign: 'center', borderRight: '1px solid #f0f0f0', borderBottom: '1px solid #f0f0f0' }}>
                                <select value={couleur}
                                  onChange={e => handleEtatChange(t.id, m.id, e.target.value)}
                                  style={{
                                    padding: '4px 6px', borderRadius: '4px', fontSize: '11px',
                                    border: 'none', cursor: 'pointer', fontWeight: '600',
                                    background: couleurInfo?.bg || '#4CAF50',
                                    color: couleurInfo?.color || '#fff',
                                    width: '80px',
                                  }}>
                                  {COULEUR_CHOICES.map(c => (
                                    <option key={c.value} value={c.value}>{c.label}</option>
                                  ))}
                                </select>
                              </td>
                            )
                          })}
                          <td style={{ padding: '6px', textAlign: 'center', borderBottom: '1px solid #f0f0f0' }}>
                            <button onClick={() => handleDeleteMateriel(m.id)}
                              style={{ padding: '3px 8px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>🗑</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

// Composant TechCard
const TechCard = ({ tech, niveauLabel, niveauColor, onDragStart, onDelete }: any) => (
  <div draggable onDragStart={onDragStart}
    style={{
      background: '#f8f9fa', borderRadius: '8px', padding: '10px 12px',
      display: 'flex', alignItems: 'center', gap: '8px',
      cursor: 'grab', border: '1px solid #e8eaed',
      transition: 'box-shadow 0.2s',
    }}
    onMouseOver={e => (e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)')}
    onMouseOut={e => (e.currentTarget.style.boxShadow = 'none')}
  >
    {tech.photo_url ? (
      <img src={tech.photo_url} alt={tech.nom}
        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
    ) : (
      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: niveauColor[tech.niveau] || '#888', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: '11px', fontWeight: '700', flexShrink: 0 }}>
        {tech.prenom?.charAt(0)}{tech.nom?.charAt(0)}
      </div>
    )}
    <div style={{ flex: 1, minWidth: 0 }}>
      <div style={{ fontSize: '12px', fontWeight: '600', color: '#2c2c2c', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
        {tech.prenom} {tech.nom}
      </div>
      <span style={{
        fontSize: '10px', padding: '1px 6px', borderRadius: '3px',
        background: `${niveauColor[tech.niveau]}20`, color: niveauColor[tech.niveau], fontWeight: '500'
      }}>{niveauLabel[tech.niveau]}</span>
    </div>
    <button onClick={onDelete}
      style={{ background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', padding: '2px 6px', fontSize: '11px', cursor: 'pointer', flexShrink: 0 }}>🗑</button>
  </div>
)

export default Equipe