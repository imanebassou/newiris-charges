import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import ImportExcel from '../components/ImportExcel'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

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

const COLORS_ENTREE = ['#1a3a6b', '#0099cc', '#1a7a40', '#e84c3d', '#f39c12', '#8e44ad', '#16a085']
const COLORS_SORTIE = ['#c0392b', '#e84c3d', '#e67e22', '#f39c12', '#d35400', '#922b21', '#e74c3c']

const Previsions = () => {
  document.title = 'Prévisions — Newiris'

  const now = new Date()
  const [mois, setMois] = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const [previsions, setPrevisions] = useState<any[]>([])
  const [ecarts, setEcarts] = useState<any>(null)
  const [soldeBase, setSoldeBase] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'dashboard' | 1 | 2 | 3 | 4>('dashboard')
  const [showForm, setShowForm] = useState<{ semaine: number; type: string } | null>(null)
  const [form, setForm] = useState({ titre: '', description: '', montant: '', date_prevision: '', categorie: '', statut: 'en_cours' })
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
  const [editingCard, setEditingCard] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({ titre: '', description: '', montant: '', date_prevision: '', categorie: '', statut: 'en_cours' })

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
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [mois, annee])

  const getSemaineFromDate = (dateStr: string) => {
    const day = new Date(dateStr).getDate()
    for (let i = 0; i < semaines.length; i++) {
      if (day >= semaines[i].debut && day <= semaines[i].fin) return i + 1
    }
    return 1
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showForm) return
    try {
      await api.post('/previsions/', {
        type: showForm.type, semaine: showForm.semaine, mois, annee,
        titre: form.titre, description: form.description,
        montant: parseFloat(form.montant), date_prevision: form.date_prevision,
        categorie: form.categorie, statut: form.statut,
      })
      setShowForm(null)
      setForm({ titre: '', description: '', montant: '', date_prevision: '', categorie: '', statut: 'en_cours' })
      fetchData()
    } catch (err) { console.error(err) }
  }

  const handleEditSave = async (id: number) => {
    try {
      const newSemaine = editForm.date_prevision ? getSemaineFromDate(editForm.date_prevision) : undefined
      await api.patch(`/previsions/${id}/`, {
        titre: editForm.titre, description: editForm.description,
        montant: parseFloat(editForm.montant), date_prevision: editForm.date_prevision,
        categorie: editForm.categorie, statut: editForm.statut,
        ...(newSemaine && { semaine: newSemaine }),
      })
      setEditingCard(null); fetchData()
    } catch (err) { console.error(err) }
  }

  const handleStatutChange = async (id: number, statut: string) => {
    try { await api.patch(`/previsions/${id}/`, { statut }); fetchData() } catch (err) { console.error(err) }
  }

  const handleDelete = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation()
    try { await api.delete(`/previsions/${id}/`); fetchData() } catch (err) { console.error(err) }
  }

  const handleAddCat = () => {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()])
      setForm({ ...form, categorie: newCat.trim() })
      setNewCat(''); setShowAddCat(false)
    }
  }

  const handleAddPerson = () => {
    if (newPerson.trim() && !users.find((u: any) => u.username === newPerson.trim())) {
      setUsers([...users, { id: `new_${newPerson.trim()}`, username: newPerson.trim() }])
      setForm({ ...form, description: newPerson.trim() })
      setNewPerson(''); setShowAddPerson(false)
    }
  }

  const handleImportPrevisions = async (type: string, semaineNum: number, rows: any[]) => {
    for (const row of rows) {
      try {
        await api.post('/previsions/', {
          type,
          semaine: semaineNum,
          mois, annee,
          titre: row.titre || '',
          description: row.personne || row.description || '',
          montant: parseFloat(String(row.montant).replace(',', '.')),
          date_prevision: row.date || '',
          categorie: row.categorie || '',
          statut: row.statut === 'Traitée' || row.statut === 'traitee' ? 'traitee' : 'en_cours',
        })
      } catch (err) { console.error(err) }
    }
    fetchData()
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

  const getPieData = (type: string) => {
    const filtered = previsions.filter(p => p.type === type)
    const catMap: { [k: string]: number } = {}
    filtered.forEach(p => {
      const cat = p.categorie || 'Autres'
      catMap[cat] = (catMap[cat] || 0) + parseFloat(p.montant)
    })
    return Object.entries(catMap).map(([name, value]) => ({ name, value }))
  }

  const importColumns = [
    { key: 'titre', label: 'Titre' },
    { key: 'montant', label: 'Montant' },
    { key: 'date', label: 'Date' },
    { key: 'categorie', label: 'Catégorie' },
    { key: 'description', label: 'Personne' },
    { key: 'statut', label: 'Statut' },
  ]

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none' }
  const smallInput = { width: '100%', padding: '4px 8px', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '11px', outline: 'none' }
  const addNewStyle = { display: 'flex', gap: '6px', marginTop: '6px' }
  const editInputStyle = { width: '38px', padding: '3px 4px', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.4)', fontSize: '12px', textAlign: 'center' as const, color: '#fff', fontWeight: '700' as const, background: 'rgba(255,255,255,0.15)', outline: 'none' }
  const tabBtn = (active: boolean) => ({ padding: '6px 16px', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' as const, background: active ? '#1a3a6b' : '#fff', color: active ? '#fff' : '#555', border: `1px solid ${active ? '#1a3a6b' : '#e0e0e0'}` })
  const prevsBySemaineAndType = (semaine: number, type: string) => previsions.filter(p => p.semaine === semaine && p.type === type)

  const renderCard = (prev: any) => {
    const isEntree = prev.type === 'entree'
    const isEditing = editingCard === prev.id

    if (isEditing) {
      return (
        <div key={prev.id} style={{ background: '#fff', borderRadius: '8px', padding: '14px', border: '2px solid #0099cc', borderLeft: `4px solid ${isEntree ? '#1a7a40' : '#c0392b'}`, marginBottom: '8px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div><label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '2px' }}>Titre</label><input style={smallInput} value={editForm.titre} onChange={e => setEditForm({ ...editForm, titre: e.target.value })} /></div>
            <div><label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '2px' }}>Montant (DH)</label><input style={smallInput} type="number" value={editForm.montant} onChange={e => setEditForm({ ...editForm, montant: e.target.value })} /></div>
            <div><label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '2px' }}>Date (change la semaine auto)</label><input style={smallInput} type="date" value={editForm.date_prevision} onChange={e => setEditForm({ ...editForm, date_prevision: e.target.value })} /></div>
            <div><label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '2px' }}>Catégorie</label><select style={smallInput} value={editForm.categorie} onChange={e => setEditForm({ ...editForm, categorie: e.target.value })}><option value="">Aucune</option>{categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}</select></div>
            <div><label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '2px' }}>Personne</label><select style={smallInput} value={editForm.description} onChange={e => setEditForm({ ...editForm, description: e.target.value })}><option value="">Aucune</option>{users.map((u: any) => <option key={u.id} value={u.username}>{u.username}</option>)}</select></div>
            <div><label style={{ fontSize: '11px', color: '#888', display: 'block', marginBottom: '2px' }}>Statut</label><select style={smallInput} value={editForm.statut} onChange={e => setEditForm({ ...editForm, statut: e.target.value })}><option value="en_cours">En cours</option><option value="traitee">Traitée</option><option value="cloturee">Clôturée</option></select></div>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button onClick={() => handleEditSave(prev.id)} style={{ flex: 1, padding: '6px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer', fontWeight: '600' }}>Sauvegarder</button>
              <button onClick={() => setEditingCard(null)} style={{ flex: 1, padding: '6px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Annuler</button>
            </div>
          </div>
        </div>
      )
    }

    return (
      <div key={prev.id} style={{ background: '#fff', borderRadius: '8px', padding: '12px 14px', marginBottom: '8px', border: '1px solid #e8eaed', borderLeft: `4px solid ${isEntree ? '#1a7a40' : '#c0392b'}`, boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '13px', fontWeight: '700', color: '#2c2c2c' }}>{prev.titre}</span>
          <div style={{ display: 'flex', gap: '4px' }}>
            <button onClick={e => { e.stopPropagation(); setEditingCard(prev.id); setEditForm({ titre: prev.titre, description: prev.description || '', montant: String(prev.montant), date_prevision: prev.date_prevision, categorie: prev.categorie || '', statut: prev.statut }) }} style={{ background: '#e8f4fb', border: '1px solid #b3d9f0', color: '#0099cc', fontSize: '11px', cursor: 'pointer', padding: '2px 8px', borderRadius: '4px' }}>✏️</button>
            <button onClick={e => handleDelete(e, prev.id)} style={{ background: '#fdeaea', border: '1px solid #f5c6c6', color: '#c0392b', fontSize: '11px', cursor: 'pointer', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>Supprimer</button>
          </div>
        </div>
        <div style={{ fontSize: '16px', fontWeight: '800', color: isEntree ? '#1a7a40' : '#c0392b', marginBottom: '4px' }}>
          {isEntree ? '+' : '-'}{parseFloat(prev.montant).toLocaleString('fr-FR')} DH
        </div>
        <div style={{ fontSize: '11px', color: '#888', marginBottom: '8px' }}>
          {new Date(prev.date_prevision).toLocaleDateString('fr-FR')}
          {prev.description && <span style={{ marginLeft: '6px', background: '#f0f4f8', padding: '1px 6px', borderRadius: '3px' }}>👤 {prev.description}</span>}
          {prev.categorie && <span style={{ marginLeft: '6px', background: '#f0f4f8', padding: '1px 6px', borderRadius: '3px' }}>🏷️ {prev.categorie}</span>}
        </div>
        <select value={prev.statut} onChange={e => handleStatutChange(prev.id, e.target.value)}
          style={{ width: '100%', padding: '4px 8px', borderRadius: '4px', fontSize: '11px', border: '1px solid #e0e0e0', cursor: 'pointer', background: getStatutColor(prev.statut).bg, color: getStatutColor(prev.statut).color, fontWeight: '600' }}>
          <option value="en_cours">En cours</option>
          <option value="traitee">Traitée</option>
          <option value="cloturee">Clôturée</option>
        </select>
      </div>
    )
  }

  const renderSemaineView = (semaineNum: number) => {
    const semaineInfo = getSemaineLabel(semaineNum)
    const ecartSemaine = ecarts?.[`semaine_${semaineNum}`]
    const entrees = prevsBySemaineAndType(semaineNum, 'entree')
    const sorties = prevsBySemaineAndType(semaineNum, 'sortie')
    const s = semaines[semaineNum - 1]
    const idx = semaineNum - 1

    return (
      <div>
        <div style={{ background: '#1a3a6b', borderRadius: '10px', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <span style={{ color: '#fff', fontWeight: '700', fontSize: '16px' }}>Semaine {semaineNum}</span>
            {editingSemaine === idx ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input type="number" min="1" max="31" value={editDebutFin.debut} onChange={e => setEditDebutFin({ ...editDebutFin, debut: e.target.value })} style={editInputStyle} />
                <span style={{ color: '#fff', fontSize: '12px' }}>au</span>
                <input type="number" min="1" max="31" value={editDebutFin.fin} onChange={e => setEditDebutFin({ ...editDebutFin, fin: e.target.value })} style={editInputStyle} />
                <button onClick={() => { const newSemaines = [...semaines]; newSemaines[idx] = { debut: parseInt(editDebutFin.debut), fin: parseInt(editDebutFin.fin) }; setSemaines(newSemaines); setEditingSemaine(null) }} style={{ padding: '3px 8px', background: '#0099cc', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>OK</button>
                <button onClick={() => setEditingSemaine(null)} style={{ padding: '3px 8px', background: '#e84c3d', color: '#fff', border: 'none', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>X</button>
              </div>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#ccc', fontSize: '13px' }}>du {s.debut} au {s.fin}</span>
                <button onClick={() => { setEditingSemaine(idx); setEditDebutFin({ debut: String(s.debut), fin: String(s.fin) }) }} style={{ background: 'none', border: 'none', color: '#ccc', fontSize: '13px', cursor: 'pointer' }}>✏️</button>
              </div>
            )}
          </div>
          <span style={{ background: semaineInfo.bg, color: semaineInfo.color, fontSize: '12px', padding: '4px 12px', borderRadius: '6px', fontWeight: '700' }}>{semaineInfo.label}</span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' }}>
          {/* ENTREES */}
          <div style={{ background: '#f8f9fa', borderRadius: '10px', border: '1px solid #e8eaed', overflow: 'hidden' }}>
            <div style={{ background: '#1a7a40', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>ENTREES</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#a8d5b5', fontSize: '12px' }}>{entrees.length} prévision{entrees.length > 1 ? 's' : ''}</span>
                <ImportExcel
                  onImport={(rows) => handleImportPrevisions('entree', semaineNum, rows)}
                  columns={importColumns}
                />
                <button onClick={() => setShowForm({ semaine: semaineNum, type: 'entree' })}
                  style={{ padding: '4px 12px', background: '#fff', color: '#1a7a40', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>+ Ajouter</button>
              </div>
            </div>
            <div style={{ padding: '12px' }}>
              {entrees.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#aaa', fontSize: '12px', padding: '30px 0', fontStyle: 'italic' }}>Aucune entrée</div>
              ) : entrees.map(prev => renderCard(prev))}
            </div>
          </div>

          {/* SORTIES */}
          <div style={{ background: '#f8f9fa', borderRadius: '10px', border: '1px solid #e8eaed', overflow: 'hidden' }}>
            <div style={{ background: '#c0392b', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#fff', fontWeight: '700', fontSize: '14px' }}>SORTIES</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ color: '#f5c6c6', fontSize: '12px' }}>{sorties.length} prévision{sorties.length > 1 ? 's' : ''}</span>
                <ImportExcel
                  onImport={(rows) => handleImportPrevisions('sortie', semaineNum, rows)}
                  columns={importColumns}
                />
                <button onClick={() => setShowForm({ semaine: semaineNum, type: 'sortie' })}
                  style={{ padding: '4px 12px', background: '#fff', color: '#c0392b', border: 'none', borderRadius: '4px', fontSize: '12px', cursor: 'pointer', fontWeight: '700' }}>+ Ajouter</button>
              </div>
            </div>
            <div style={{ padding: '12px' }}>
              {sorties.length === 0 ? (
                <div style={{ textAlign: 'center', color: '#aaa', fontSize: '12px', padding: '30px 0', fontStyle: 'italic' }}>Aucune sortie</div>
              ) : sorties.map(prev => renderCard(prev))}
            </div>
          </div>
        </div>

        {ecartSemaine && (
          <div style={{ background: '#fff', borderRadius: '10px', padding: '16px 20px', border: '1px solid #e8eaed', borderTop: `3px solid ${ecartSemaine.ecart >= 0 ? '#1a7a40' : '#c0392b'}` }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>Ecart S{semaineNum}</div>
                <div style={{ fontSize: '24px', fontWeight: '800', color: ecartSemaine.ecart >= 0 ? '#1a7a40' : '#c0392b' }}>{ecartSemaine.ecart.toLocaleString('fr-FR')} DH</div>
                <div style={{ marginTop: '6px' }}><span style={{ fontSize: '10px', padding: '3px 8px', borderRadius: '4px', background: semaineInfo.bg, color: semaineInfo.color, fontWeight: '700' }}>{semaineInfo.label}</span></div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '14px', color: '#1a7a40', fontWeight: '600' }}>+{ecartSemaine.entrees.toLocaleString('fr-FR')} DH</div>
                <div style={{ fontSize: '14px', color: '#c0392b', fontWeight: '600' }}>-{ecartSemaine.sorties.toLocaleString('fr-FR')} DH</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '4px' }}>Solde</div>
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Gestion des prévisions</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Planification des entrées et sorties par semaine</p>
          </div>
          <select value={`${annee}-${mois}`} onChange={e => { const [a, m] = e.target.value.split('-'); setAnnee(parseInt(a)); setMois(parseInt(m)) }}
            style={{ padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', outline: 'none' }}>
            {[2025, 2026, 2027].map(a => MOIS_LABELS.map((label, i) => (
              <option key={`${a}-${i + 1}`} value={`${a}-${i + 1}`}>{label} {a}</option>
            )))}
          </select>
        </div>

        <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed', borderTop: '3px solid #1a3a6b', marginBottom: '20px', display: 'inline-block', minWidth: '200px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Solde (basé sur les prévisions traitées)</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a3a6b' }}>{soldeBase.toLocaleString('fr-FR')} DH</div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveView('dashboard')} style={tabBtn(activeView === 'dashboard')}>Dashboard</button>
          {[1, 2, 3, 4].map(s => (
            <button key={s} onClick={() => { setActiveView(s as 1 | 2 | 3 | 4); setShowForm(null) }} style={tabBtn(activeView === s)}>
              S{s} — du {semaines[s - 1].debut} au {semaines[s - 1].fin}
            </button>
          ))}
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div>
        ) : (
          <>
            {activeView === 'dashboard' && (
              <div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '20px' }}>
                  {[0, 1, 2, 3].map(idx => {
                    const semaine = idx + 1
                    const semaineInfo = getSemaineLabel(semaine)
                    const ecartSemaine = ecarts?.[`semaine_${semaine}`]
                    const s = semaines[idx]
                    return (
                      <div key={semaine} onClick={() => setActiveView(semaine as 1 | 2 | 3 | 4)}
                        style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e8eaed', overflow: 'hidden', cursor: 'pointer' }}
                        onMouseOver={e => (e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)')}
                        onMouseOut={e => (e.currentTarget.style.boxShadow = 'none')}>
                        <div style={{ background: '#1a3a6b', padding: '10px 14px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: '#fff', fontWeight: '700', fontSize: '13px' }}>S{semaine} du {s.debut} au {s.fin}</span>
                          <span style={{ background: semaineInfo.bg, color: semaineInfo.color, fontSize: '10px', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>{semaineInfo.label}</span>
                        </div>
                        <div style={{ padding: '14px' }}>
                          {ecartSemaine ? (
                            <>
                              <div style={{ fontSize: '10px', color: '#888', marginBottom: '4px' }}>Ecart S{semaine}</div>
                              <div style={{ fontSize: '20px', fontWeight: '800', color: ecartSemaine.ecart >= 0 ? '#1a7a40' : '#c0392b' }}>{ecartSemaine.ecart.toLocaleString('fr-FR')} DH</div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
                                <span style={{ fontSize: '11px', color: '#1a7a40', fontWeight: '600' }}>+{ecartSemaine.entrees.toLocaleString('fr-FR')}</span>
                                <span style={{ fontSize: '11px', color: '#c0392b', fontWeight: '600' }}>-{ecartSemaine.sorties.toLocaleString('fr-FR')}</span>
                              </div>
                              <div style={{ fontSize: '10px', color: '#888', marginTop: '4px' }}>Solde</div>
                            </>
                          ) : <div style={{ color: '#aaa', fontSize: '12px' }}>Aucune donnée</div>}
                        </div>
                      </div>
                    )
                  })}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '12px' }}>
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a6b', marginBottom: '12px' }}>Écarts par semaine</div>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={[1, 2, 3, 4].map(s => ({ name: `S${s}`, ecart: ecarts?.[`semaine_${s}`]?.ecart || 0 }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                        <YAxis tick={{ fontSize: 11 }} />
                        <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} DH`} />
                        <Bar dataKey="ecart" radius={[4, 4, 0, 0]}>
                          {[1, 2, 3, 4].map(s => <Cell key={s} fill={(ecarts?.[`semaine_${s}`]?.ecart || 0) >= 0 ? '#1a7a40' : '#c0392b'} />)}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a6b', marginBottom: '12px', textAlign: 'center' }}>ENTREES PAR CATEGORIE</div>
                    {getPieData('entree').length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={getPieData('entree')} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${Math.round((percent || 0) * 100)}%`} labelLine={false}>
                            {getPieData('entree').map((_: any, i: number) => <Cell key={i} fill={COLORS_ENTREE[i % COLORS_ENTREE.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} DH`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <div style={{ textAlign: 'center', color: '#aaa', fontSize: '12px', paddingTop: '60px' }}>Aucune entrée</div>}
                  </div>
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed' }}>
                    <div style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a6b', marginBottom: '12px', textAlign: 'center' }}>SORTIES PAR CATEGORIE</div>
                    {getPieData('sortie').length > 0 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <PieChart>
                          <Pie data={getPieData('sortie')} cx="50%" cy="50%" innerRadius={50} outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${Math.round((percent || 0) * 100)}%`} labelLine={false}>
                            {getPieData('sortie').map((_: any, i: number) => <Cell key={i} fill={COLORS_SORTIE[i % COLORS_SORTIE.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} DH`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : <div style={{ textAlign: 'center', color: '#aaa', fontSize: '12px', paddingTop: '60px' }}>Aucune sortie</div>}
                  </div>
                </div>
              </div>
            )}

            {(activeView === 1 || activeView === 2 || activeView === 3 || activeView === 4) && (
              <div>
                {showForm && (
                  <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8eaed', marginBottom: '20px', borderTop: `3px solid ${showForm.type === 'entree' ? '#1a7a40' : '#c0392b'}` }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>
                      {showForm.type === 'entree' ? 'Nouvelle prévision Entrée' : 'Nouvelle prévision Sortie'} — Semaine {showForm.semaine}
                    </h3>
                    <form onSubmit={handleSubmit}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                        <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Titre *</label><input style={inputStyle} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required placeholder="Ex: Paiement fournisseur" /></div>
                        <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date de prévision *</label><input style={inputStyle} type="date" value={form.date_prevision} onChange={e => setForm({ ...form, date_prevision: e.target.value })} required /></div>
                        <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Montant (DH) *</label><input style={inputStyle} type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} required placeholder="Ex: 5000" /></div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Catégorie</label>
                          <select style={inputStyle} value={form.categorie} onChange={e => { if (e.target.value === '__add_cat__') { setShowAddCat(true) } else { setForm({ ...form, categorie: e.target.value }); setShowAddCat(false) } }}>
                            <option value="">Sélectionner une catégorie...</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            <option value="__add_cat__">+ Add New</option>
                          </select>
                          {showAddCat && (<div style={addNewStyle}><input style={{ ...inputStyle, flex: 1 }} value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nouvelle catégorie..." /><button type="button" onClick={handleAddCat} style={{ padding: '8px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button><button type="button" onClick={() => { setShowAddCat(false); setNewCat('') }} style={{ padding: '8px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>X</button></div>)}
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Personne</label>
                          <select style={inputStyle} value={form.description} onChange={e => { if (e.target.value === '__add_person__') { setShowAddPerson(true) } else { setForm({ ...form, description: e.target.value }); setShowAddPerson(false) } }}>
                            <option value="">Sélectionner une personne...</option>
                            {users.map((u: any) => <option key={u.id} value={u.username}>{u.username}</option>)}
                            <option value="__add_person__">+ Add New</option>
                          </select>
                          {showAddPerson && (<div style={addNewStyle}><input style={{ ...inputStyle, flex: 1 }} value={newPerson} onChange={e => setNewPerson(e.target.value)} placeholder="Nom de la personne..." /><button type="button" onClick={handleAddPerson} style={{ padding: '8px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button><button type="button" onClick={() => { setShowAddPerson(false); setNewPerson('') }} style={{ padding: '8px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>X</button></div>)}
                        </div>
                        <div><label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Statut</label><select style={inputStyle} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}><option value="en_cours">En cours</option><option value="traitee">Traitée</option><option value="cloturee">Clôturée</option></select></div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                        <button type="submit" style={{ padding: '8px 20px', background: showForm.type === 'entree' ? '#1a7a40' : '#c0392b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                        <button type="button" onClick={() => { setShowForm(null); setShowAddCat(false); setShowAddPerson(false) }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                      </div>
                    </form>
                  </div>
                )}
                {renderSemaineView(activeView as number)}
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default Previsions