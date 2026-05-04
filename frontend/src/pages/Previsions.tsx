import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import Layout from '../components/Layout'
import api from '../api/axios'
import ImportExcel from '../components/ImportExcel'

const MOIS_LABELS = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
]

const COLORS = ['#c93128', '#1d2836', '#2a5ea8', '#1f8a57', '#8e44ad', '#d08b19', '#16a085']

const cardStyle = {
  background: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #d9e0e7',
  boxShadow: '0 12px 28px rgba(19, 29, 43, 0.05)',
}

const inputStyle = {
  width: '100%',
  padding: '8px 11px',
  border: '1px solid #d9e0e7',
  borderRadius: '9px',
  fontSize: '12px',
  outline: 'none',
  background: '#fff',
  color: '#1f2937',
}

const smallInput = {
  width: '100%',
  padding: '7px 9px',
  border: '1px solid #d9e0e7',
  borderRadius: '8px',
  fontSize: '11px',
  outline: 'none',
  background: '#fff',
  color: '#1f2937',
}

const compactButton = (active: boolean) => ({
  padding: '7px 12px',
  borderRadius: '10px',
  border: active ? '1px solid #1d2836' : '1px solid #d9e0e7',
  cursor: 'pointer',
  fontSize: '11px',
  background: active ? '#1d2836' : '#fff',
  color: active ? '#fff' : '#1d2836',
  fontWeight: 700,
})

const fmtDh = (value: any) =>
  Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const getStatutTone = (statut: string) => {
  if (statut === 'traitee') return { bg: '#ebf8f2', color: '#1f8a57' }
  if (statut === 'cloturee') return { bg: '#eef2f6', color: '#667085' }
  return { bg: '#fff4df', color: '#b76b00' }
}

interface SemaineConfig {
  id: number
  semaine: number
  mois: number
  annee: number
  debut_jour: number
  fin_jour: number
  solde_debut_manuel: number | null
}

const Previsions = () => {
  document.title = 'Previsions - NEWIRIS'

  const now = new Date()
  const [mois, setMois] = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())
  const [previsions, setPrevisions] = useState<any[]>([])
  const [ecarts, setEcarts] = useState<any>({})
  const [semaines, setSemaines] = useState<SemaineConfig[]>([])
  const [soldeBase, setSoldeBase] = useState(0)
  const [totalEntreesMois, setTotalEntreesMois] = useState(0)
  const [totalSortiesMois, setTotalSortiesMois] = useState(0)
  const [ecartMois, setEcartMois] = useState(0)
  const [soldeFinMois, setSoldeFinMois] = useState(0)
  const [loading, setLoading] = useState(true)
  const [activeView, setActiveView] = useState<'dashboard' | 1 | 2 | 3 | 4>('dashboard')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')
  const [showForm, setShowForm] = useState<{ semaine: number; type: 'entree' | 'sortie' } | null>(null)
  const [selectedCard, setSelectedCard] = useState<any | null>(null)
  const [editingSemaine, setEditingSemaine] = useState<number | null>(null)
  const [editingManualSolde, setEditingManualSolde] = useState<number | null>(null)

  const [form, setForm] = useState({
    titre: '',
    description: '',
    montant: '',
    date_prevision: '',
    categorie: '',
    statut: 'en_cours',
  })

  const [editForm, setEditForm] = useState({
    titre: '',
    description: '',
    montant: '',
    date_prevision: '',
    categorie: '',
    statut: 'en_cours',
  })

  const [semaineEditForm, setSemaineEditForm] = useState({
    debut_jour: '',
    fin_jour: '',
    solde_debut_manuel: '',
  })

  const fetchData = async () => {
    setLoading(true)
    setError('')
    try {
      const [prevsRes, ecartsRes] = await Promise.all([
        api.get(`/previsions/?mois=${mois}&annee=${annee}`),
        api.get(`/previsions/ecarts/?mois=${mois}&annee=${annee}`),
      ])

      setPrevisions(Array.isArray(prevsRes.data) ? prevsRes.data : [])
      setEcarts(ecartsRes.data.ecarts || {})
      setSemaines(ecartsRes.data.semaines || [])
      setSoldeBase(Number(ecartsRes.data.solde_base || 0))
      setTotalEntreesMois(Number(ecartsRes.data.total_entrees_mois || 0))
      setTotalSortiesMois(Number(ecartsRes.data.total_sorties_mois || 0))
      setEcartMois(Number(ecartsRes.data.ecart_mois || 0))
      setSoldeFinMois(Number(ecartsRes.data.solde_fin_mois || 0))
    } catch (err) {
      console.error(err)
      setError('Erreur de chargement des previsions.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [mois, annee])

  const flashSuccess = () => {
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2400)
  }

  const getCurrentSemaine = () => {
    const day = now.getDate()
    const currentMois = now.getMonth() + 1
    const currentAnnee = now.getFullYear()

    if (mois !== currentMois || annee !== currentAnnee) return 0

    const currentConfig = semaines.find((s) => day >= s.debut_jour && day <= s.fin_jour)
    return currentConfig?.semaine || 0
  }

  const getSemaineLabel = (semaineNum: number) => {
    const current = getCurrentSemaine()
    if (current === 0) return { label: 'Prevision', color: '#2458a6', bg: '#eaf1fd' }
    if (semaineNum < current) return { label: 'Cloturee', color: '#667085', bg: '#edf2f7' }
    if (semaineNum === current) return { label: 'En cours', color: '#b76b00', bg: '#fff3df' }
    return { label: 'Prevision', color: '#2458a6', bg: '#eaf1fd' }
  }

  const isSemaineCloturee = (semaineNum: number) => getSemaineLabel(semaineNum).label === 'Cloturee'

  const getSemaineFromDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const day = date.getDate()
    const found = semaines.find((s) => day >= s.debut_jour && day <= s.fin_jour)
    return found?.semaine || 1
  }

  const prevsBySemaineAndType = (semaine: number, type: string) =>
    previsions.filter((p: any) => p.semaine === semaine && p.type === type)

  const calculPrevisions = useMemo(
    () => previsions.filter((p: any) => !p.exclure_du_calcul),
    [previsions]
  )

  const chartByWeek = useMemo(
    () => [
      {
        name: 'S1',
        entrees: Number(ecarts?.semaine_1?.entrees || 0),
        sorties: Number(ecarts?.semaine_1?.sorties || 0),
      },
      {
        name: 'S2',
        entrees: Number(ecarts?.semaine_2?.entrees || 0),
        sorties: Number(ecarts?.semaine_2?.sorties || 0),
      },
      {
        name: 'S3',
        entrees: Number(ecarts?.semaine_3?.entrees || 0),
        sorties: Number(ecarts?.semaine_3?.sorties || 0),
      },
      {
        name: 'S4',
        entrees: Number(ecarts?.semaine_4?.entrees || 0),
        sorties: Number(ecarts?.semaine_4?.sorties || 0),
      },
    ],
    [ecarts]
  )

  const chartByCategoryMap = useMemo(() => {
    const map: Record<string, number> = {}
    calculPrevisions.forEach((p: any) => {
      const key = p.categorie || 'Autre'
      map[key] = (map[key] || 0) + Number(p.montant || 0)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [calculPrevisions])

  const chartByStatus = useMemo(() => {
    const traitees = previsions.filter((p: any) => p.statut === 'traitee').length
    const enCours = previsions.filter((p: any) => p.statut === 'en_cours').length
    const cloturees = previsions.filter((p: any) => p.statut === 'cloturee').length
    return [
      { name: 'Traitees', value: traitees },
      { name: 'En cours', value: enCours },
      { name: 'Cloturees', value: cloturees },
    ]
  }, [previsions])

  const dashboardCards = [
    {
      title: 'Solde initial',
      value: `${fmtDh(soldeBase)} DH`,
      color: '#1d2836',
      note: `Debut ${MOIS_LABELS[mois - 1]} ${annee}`,
    },
    {
      title: 'Entrees mois',
      value: `+${fmtDh(totalEntreesMois)} DH`,
      color: '#1f8a57',
      note: `${calculPrevisions.filter((p: any) => p.type === 'entree').length} ligne(s)`,
    },
    {
      title: 'Sorties mois',
      value: `-${fmtDh(totalSortiesMois)} DH`,
      color: '#c93128',
      note: `${calculPrevisions.filter((p: any) => p.type === 'sortie').length} ligne(s)`,
    },
    {
      title: 'Ecart net',
      value: `${ecartMois >= 0 ? '+' : ''}${fmtDh(ecartMois)} DH`,
      color: ecartMois >= 0 ? '#2a5ea8' : '#c93128',
      note: `Projection mensuelle`,
    },
    {
      title: 'Solde fin projete',
      value: `${fmtDh(soldeFinMois)} DH`,
      color: '#c93128',
      note: `Fin du mois`,
    },
  ]

  const importColumns = [
    { key: 'titre', label: 'Titre' },
    { key: 'montant', label: 'Montant' },
    { key: 'date', label: 'Date' },
    { key: 'categorie', label: 'Categorie' },
    { key: 'description', label: 'Description' },
    { key: 'statut', label: 'Statut' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!showForm) return

    try {
      const dateObj = new Date(form.date_prevision)
      const semaine = getSemaineFromDate(form.date_prevision)

      await api.post('/previsions/', {
        type: showForm.type,
        semaine,
        mois: dateObj.getMonth() + 1,
        annee: dateObj.getFullYear(),
        titre: form.titre,
        description: form.description,
        montant: parseFloat(form.montant),
        date_prevision: form.date_prevision,
        categorie: form.categorie,
        statut: form.statut,
        exclure_du_calcul: false,
      })

      setShowForm(null)
      setForm({
        titre: '',
        description: '',
        montant: '',
        date_prevision: '',
        categorie: '',
        statut: 'en_cours',
      })
      flashSuccess()
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Erreur lors de la creation du ticket.')
    }
  }

  const handleImportPrevisions = async (type: 'entree' | 'sortie', rows: any[]) => {
    try {
      for (const row of rows) {
        const rawDate = row.date || row.date_prevision || ''
        const dateObj = rawDate ? new Date(rawDate) : new Date(annee, mois - 1, 1)
        const semaine = rawDate ? getSemaineFromDate(rawDate) : 1

        await api.post('/previsions/', {
          type,
          semaine,
          mois: dateObj.getMonth() + 1,
          annee: dateObj.getFullYear(),
          titre: row.titre || 'Sans titre',
          description: row.description || row.personne || '',
          montant: parseFloat(String(row.montant || '0').replace(',', '.')) || 0,
          date_prevision: rawDate || dateObj.toISOString().split('T')[0],
          categorie: row.categorie || '',
          statut:
            row.statut === 'traitee' ||
            row.statut === 'Traitee' ||
            row.statut === 'TraitÃ©e'
              ? 'traitee'
              : 'en_cours',
          exclure_du_calcul: false,
        })
      }

      flashSuccess()
      await fetchData()
    } catch (err) {
      console.error(err)
      setError("Erreur lors de l'import des tickets.")
    }
  }

  const openCard = (prev: any) => {
    setSelectedCard(prev)
    setEditForm({
      titre: prev.titre || '',
      description: prev.description || '',
      montant: String(prev.montant ?? ''),
      date_prevision: prev.date_prevision || '',
      categorie: prev.categorie || '',
      statut: prev.statut || 'en_cours',
    })
  }

  const handleEditSave = async () => {
    if (!selectedCard) return
    try {
      const dateObj = new Date(editForm.date_prevision)
      const semaine = getSemaineFromDate(editForm.date_prevision)

      await api.patch(`/previsions/${selectedCard.id}/`, {
        titre: editForm.titre,
        description: editForm.description,
        montant: parseFloat(editForm.montant),
        date_prevision: editForm.date_prevision,
        categorie: editForm.categorie,
        statut: editForm.statut,
        semaine,
        mois: dateObj.getMonth() + 1,
        annee: dateObj.getFullYear(),
        exclure_du_calcul: selectedCard.exclure_du_calcul,
      })

      setSelectedCard(null)
      flashSuccess()
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Erreur lors de la modification du ticket.')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/previsions/${id}/`)
      setSelectedCard(null)
      flashSuccess()
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Erreur lors de la suppression du ticket.')
    }
  }

  const startEditSemaine = (config: SemaineConfig) => {
    setEditingSemaine(config.id)
    setSemaineEditForm({
      debut_jour: String(config.debut_jour),
      fin_jour: String(config.fin_jour),
      solde_debut_manuel: config.solde_debut_manuel != null ? String(config.solde_debut_manuel) : '',
    })
  }

  const saveSemaineDays = async (config: SemaineConfig) => {
    try {
      await api.patch(`/previsions/semaines/${config.id}/`, {
        debut_jour: parseInt(semaineEditForm.debut_jour),
        fin_jour: parseInt(semaineEditForm.fin_jour),
      })
      setEditingSemaine(null)
      flashSuccess()
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Erreur lors de la mise a jour des jours de semaine.')
    }
  }

  const saveManualSolde = async (config: SemaineConfig) => {
    try {
      await api.patch(`/previsions/semaines/${config.id}/`, {
        solde_debut_manuel:
          semaineEditForm.solde_debut_manuel.trim() === ''
            ? null
            : parseFloat(semaineEditForm.solde_debut_manuel),
      })
      setEditingManualSolde(null)
      flashSuccess()
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Erreur lors de la mise a jour du solde debut.')
    }
  }

  const renderPopup = () => {
    if (!selectedCard) return null
    const isEntree = selectedCard.type === 'entree'
    const tone = isEntree
      ? { border: '#cfe9db', text: '#147a52' }
      : { border: '#f1d3cf', text: '#c93128' }

    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(13, 18, 28, 0.45)',
          zIndex: 1000,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '18px',
        }}
        onClick={() => setSelectedCard(null)}
      >
        <div
          style={{
            width: '560px',
            maxWidth: '94vw',
            background: '#fff',
            borderRadius: '14px',
            padding: '18px',
            border: `1px solid ${tone.border}`,
            boxShadow: '0 28px 70px rgba(10, 16, 28, 0.22)',
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', gap: '14px', marginBottom: '14px' }}>
            <div>
              <div style={{ fontSize: '10px', fontWeight: 800, letterSpacing: '0.04em', textTransform: 'uppercase', color: tone.text, marginBottom: '5px' }}>
                {isEntree ? 'Entree' : 'Sortie'}
              </div>
              <div style={{ fontSize: '15px', fontWeight: 800, color: '#172033', marginBottom: '4px' }}>
                {editForm.titre || selectedCard.titre}
              </div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: tone.text }}>
                {isEntree ? '+' : '-'}{fmtDh(editForm.montant || selectedCard.montant)} DH
              </div>
              {selectedCard.exclure_du_calcul && (
                <div style={{ marginTop: '8px', display: 'inline-block', padding: '4px 8px', borderRadius: '999px', background: '#eef2f6', color: '#667085', fontSize: '10px', fontWeight: 800 }}>
                  Affichage uniquement
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedCard(null)}
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                border: 'none',
                cursor: 'pointer',
                background: '#eef2f6',
                color: '#516070',
                fontWeight: 800,
                fontSize: '14px',
              }}
            >
              X
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Titre</label>
              <input style={smallInput} value={editForm.titre} onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Montant (DH)</label>
              <input style={smallInput} type="number" value={editForm.montant} onChange={(e) => setEditForm({ ...editForm, montant: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date</label>
              <input style={smallInput} type="date" value={editForm.date_prevision} onChange={(e) => setEditForm({ ...editForm, date_prevision: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Categorie</label>
              <input style={smallInput} value={editForm.categorie} onChange={(e) => setEditForm({ ...editForm, categorie: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Personne / Description</label>
              <input style={smallInput} value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} />
            </div>

            <div style={{ gridColumn: '1 / -1' }}>
              <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Statut</label>
              <select style={smallInput} value={editForm.statut} onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}>
                <option value="en_cours">En cours</option>
                <option value="traitee">Traitee</option>
                <option value="cloturee">Cloturee</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
            <button onClick={handleEditSave} style={{ ...compactButton(true), flex: 1 }}>
              Sauvegarder
            </button>
            <button onClick={() => handleDelete(selectedCard.id)} style={{ ...compactButton(false), color: '#c93128', borderColor: '#f0c7c5' }}>
              Supprimer
            </button>
          </div>
        </div>
      </div>
    )
  }

  const renderWeekTicket = (prev: any) => {
    const isEntree = prev.type === 'entree'
    const tone = isEntree
      ? { border: '#1f8a57', text: '#147a52' }
      : { border: '#d63d31', text: '#c93128' }
    const statut = getStatutTone(prev.statut)

    return (
      <div
        key={prev.id}
        onClick={() => openCard(prev)}
        style={{
          background: '#fff',
          borderRadius: '9px',
          border: '1px solid #eef2f6',
          borderLeft: `4px solid ${tone.border}`,
          padding: '10px 10px 9px',
          cursor: 'pointer',
          minHeight: '88px',
          boxShadow: '0 6px 14px rgba(19, 29, 43, 0.035)',
        }}
      >
        <div style={{ fontSize: '12px', fontWeight: 800, color: '#263248', marginBottom: '6px', lineHeight: 1.2 }}>
          {prev.titre}
        </div>

        <div style={{ fontSize: '10px', fontWeight: 800, color: tone.text, marginBottom: '6px' }}>
          {isEntree ? '+' : '-'}{fmtDh(prev.montant)} DH
        </div>

        <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center', marginBottom: '6px' }}>
          <span style={{ fontSize: '10px', color: '#6b7280' }}>{prev.categorie || 'Autre'}</span>
          <span style={{ padding: '3px 7px', borderRadius: '999px', background: statut.bg, color: statut.color, fontSize: '9px', fontWeight: 800 }}>
            {prev.statut}
          </span>
        </div>

        <div style={{ fontSize: '10px', color: '#7b8797' }}>
          {new Date(prev.date_prevision).toLocaleDateString('fr-FR')}
        </div>

        {prev.exclure_du_calcul && (
          <div style={{ marginTop: '6px', display: 'inline-block', padding: '3px 7px', borderRadius: '999px', background: '#eef2f6', color: '#667085', fontSize: '9px', fontWeight: 800 }}>
            Hors calcul
          </div>
        )}
      </div>
    )
  }

  const renderWeekSection = (type: 'entree' | 'sortie', semaineNum: number, items: any[]) => {
    const isEntree = type === 'entree'
    const title = isEntree ? 'Entrees' : 'Sorties'
    const headerBg = isEntree ? '#1f8a57' : '#c93128'
    const total = items
      .filter((item: any) => !item.exclure_du_calcul)
      .reduce((sum: number, item: any) => sum + Number(item.montant || 0), 0)
    const countLabel = `${items.length} ticket(s)`

    return (
      <div style={{ borderRadius: '12px', overflow: 'hidden', border: '1px solid #e6edf5' }}>
        <div style={{ background: headerBg, color: '#fff', padding: '10px 12px', display: 'flex', justifyContent: 'space-between', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <div>
            <div style={{ fontSize: '14px', fontWeight: 800 }}>{title}</div>
            <div style={{ fontSize: '12px', fontWeight: 800 }}>
              {isEntree ? '+' : '-'}{fmtDh(total)} DH
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ fontSize: '10px', opacity: 0.95 }}>{countLabel}</div>
            <ImportExcel onImport={(rows: any[]) => handleImportPrevisions(type, rows)} columns={importColumns} />
            <button
              onClick={() => setShowForm({ semaine: semaineNum, type })}
              style={{
                padding: '6px 10px',
                background: '#fff',
                color: headerBg,
                border: 'none',
                borderRadius: '7px',
                fontSize: '10px',
                fontWeight: 800,
                cursor: 'pointer',
              }}
            >
              + Ajouter
            </button>
          </div>
        </div>

        <div style={{ padding: '10px' }}>
          {items.length === 0 ? (
            <div style={{ minHeight: '92px' }} />
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
              {items.map(renderWeekTicket)}
            </div>
          )}
        </div>
      </div>
    )
  }

  const renderWeekForm = () => {
    if (!showForm) return null

    return (
      <div style={{ ...cardStyle, padding: '16px', marginBottom: '14px' }}>
        <div style={{ fontSize: '15px', fontWeight: 800, color: '#1d2836', marginBottom: '12px' }}>
          Nouvelle {showForm.type === 'entree' ? 'entree' : 'sortie'} - Semaine {showForm.semaine}
        </div>

        <form onSubmit={handleSubmit}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '9px' }}>
            <div>
              <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Titre *</label>
              <input style={inputStyle} value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date *</label>
              <input style={inputStyle} type="date" value={form.date_prevision} onChange={(e) => setForm({ ...form, date_prevision: e.target.value })} required />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Montant *</label>
              <input style={inputStyle} type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} required />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Categorie</label>
              <input style={inputStyle} value={form.categorie} onChange={(e) => setForm({ ...form, categorie: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Personne / Description</label>
              <input style={inputStyle} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>

            <div>
              <label style={{ fontSize: '10px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Statut</label>
              <select style={inputStyle} value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                <option value="en_cours">En cours</option>
                <option value="traitee">Traitee</option>
                <option value="cloturee">Cloturee</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '8px', marginTop: '10px' }}>
            <button type="submit" style={compactButton(true)}>Creer</button>
            <button type="button" onClick={() => setShowForm(null)} style={compactButton(false)}>Annuler</button>
          </div>
        </form>
      </div>
    )
  }

  const renderSemaineView = (semaineNum: number) => {
    const semaineInfo = getSemaineLabel(semaineNum)
    const config = semaines.find((s) => s.semaine === semaineNum)
    const weekData = ecarts?.[`semaine_${semaineNum}`]
    const entrees = prevsBySemaineAndType(semaineNum, 'entree')
    const sorties = prevsBySemaineAndType(semaineNum, 'sortie')

    if (!config || !weekData) return null

    return (
      <div>
        {renderWeekForm()}

        <div style={{ ...cardStyle, padding: '0', overflow: 'hidden', marginBottom: '14px' }}>
          <div
            style={{
              background: '#253f72',
              color: '#fff',
              padding: '12px 18px',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              gap: '10px',
              flexWrap: 'wrap',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
              <div style={{ fontSize: '15px', fontWeight: 800 }}>Semaine {semaineNum}</div>
              {editingSemaine === config.id ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '7px', flexWrap: 'wrap' }}>
                  <input
                    style={{ ...smallInput, width: '68px' }}
                    type="number"
                    min="1"
                    max="31"
                    value={semaineEditForm.debut_jour}
                    onChange={(e) => setSemaineEditForm({ ...semaineEditForm, debut_jour: e.target.value })}
                  />
                  <span style={{ fontSize: '11px' }}>au</span>
                  <input
                    style={{ ...smallInput, width: '68px' }}
                    type="number"
                    min="1"
                    max="31"
                    value={semaineEditForm.fin_jour}
                    onChange={(e) => setSemaineEditForm({ ...semaineEditForm, fin_jour: e.target.value })}
                  />
                  <button onClick={() => saveSemaineDays(config)} style={{ ...compactButton(true), background: '#fff', color: '#253f72', borderColor: '#fff', padding: '5px 9px', fontSize: '10px' }}>OK</button>
                  <button onClick={() => setEditingSemaine(null)} style={{ ...compactButton(false), background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.35)', padding: '5px 9px', fontSize: '10px' }}>X</button>
                </div>
              ) : (
                <div style={{ fontSize: '11px', opacity: 0.95 }}>
                  du {config.debut_jour} au {config.fin_jour}
                </div>
              )}
              {editingSemaine !== config.id && (
                <button
                  onClick={() => startEditSemaine(config)}
                  style={{ ...compactButton(false), background: 'transparent', color: '#fff', borderColor: 'rgba(255,255,255,0.35)', padding: '5px 10px', fontSize: '10px' }}
                >
                  Modifier jours
                </button>
              )}
            </div>

            <span style={{ fontSize: '10px', padding: '6px 10px', borderRadius: '8px', background: '#fff', color: '#253f72', fontWeight: 800 }}>
              {semaineInfo.label}
            </span>
          </div>

          <div style={{ padding: '8px 10px', borderBottom: '1px solid #edf2f7' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '8px' }}>
              <div style={{ borderRadius: '10px', border: '1px solid #e6edf5', padding: '8px 10px', background: '#fbfcfe', minHeight: '86px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#7b8797', marginBottom: '4px', fontWeight: 700 }}>
                  Solde debut
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1a2740', lineHeight: 1.05 }}>
                  {fmtDh(weekData.solde_debut)}
                </div>
                <div style={{ fontSize: '8px', color: '#7b8797', marginTop: '1px' }}>DH</div>

                {isSemaineCloturee(semaineNum) && (
                  <div style={{ marginTop: '6px' }}>
                    {editingManualSolde === config.id ? (
                      <div style={{ display: 'flex', gap: '4px' }}>
                        <input
                          style={{ ...smallInput, flex: 1, padding: '6px 8px', fontSize: '10px' }}
                          value={semaineEditForm.solde_debut_manuel}
                          onChange={(e) => setSemaineEditForm({ ...semaineEditForm, solde_debut_manuel: e.target.value })}
                          placeholder="Solde manuel"
                        />
                        <button onClick={() => saveManualSolde(config)} style={{ ...compactButton(true), padding: '4px 8px', fontSize: '9px' }}>OK</button>
                        <button onClick={() => setEditingManualSolde(null)} style={{ ...compactButton(false), padding: '4px 8px', fontSize: '9px' }}>X</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingManualSolde(config.id)
                          setSemaineEditForm({
                            debut_jour: String(config.debut_jour),
                            fin_jour: String(config.fin_jour),
                            solde_debut_manuel: config.solde_debut_manuel != null ? String(config.solde_debut_manuel) : '',
                          })
                        }}
                        style={{ ...compactButton(false), padding: '4px 8px', marginTop: '2px', fontSize: '9px' }}
                      >
                        Modifier
                      </button>
                    )}
                  </div>
                )}
              </div>

              <div style={{ borderRadius: '10px', border: '1px solid #e6edf5', padding: '8px 10px', background: '#fbfcfe', minHeight: '86px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#7b8797', marginBottom: '4px', fontWeight: 700 }}>
                  Ecart semaine
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: weekData.net >= 0 ? '#1f8a57' : '#c93128', lineHeight: 1.05 }}>
                  {weekData.net > 0 ? '+' : ''}{fmtDh(weekData.net)}
                </div>
                <div style={{ fontSize: '8px', color: '#7b8797', marginTop: '1px' }}>DH</div>
              </div>

              <div style={{ borderRadius: '10px', border: '1px solid #e6edf5', padding: '8px 10px', background: '#fbfcfe', minHeight: '86px' }}>
                <div style={{ fontSize: '9px', textTransform: 'uppercase', color: '#7b8797', marginBottom: '4px', fontWeight: 700 }}>
                  Solde fin
                </div>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#2458a6', lineHeight: 1.05 }}>
                  {fmtDh(weekData.solde_fin)}
                </div>
                <div style={{ fontSize: '8px', color: '#7b8797', marginTop: '1px' }}>DH</div>
              </div>
            </div>
          </div>

          <div style={{ padding: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
            {renderWeekSection('entree', semaineNum, entrees)}
            {renderWeekSection('sortie', semaineNum, sorties)}
          </div>
        </div>
      </div>
    )
  }

  const renderDashboard = () => (
    <>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
        {dashboardCards.map((card) => (
          <div key={card.title} style={{ ...cardStyle, padding: '12px 16px', borderTop: `3px solid ${card.color}`, minHeight: '94px' }}>
            <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '4px' }}>{card.title}</div>
            <div style={{ fontSize: '16px', fontWeight: 800, color: card.color, lineHeight: 1.15 }}>{card.value}</div>
            <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>{card.note}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginBottom: '18px' }}>
        <div style={{ ...cardStyle, padding: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px' }}>Flux hebdomadaire</div>
          <ResponsiveContainer width="100%" height={230}>
            <BarChart data={chartByWeek}>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
              <XAxis dataKey="name" tick={{ fontSize: 10 }} />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} DH`} />
              <Bar dataKey="entrees" fill="#1f8a57" radius={[4, 4, 0, 0]} />
              <Bar dataKey="sorties" fill="#c93128" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div style={{ ...cardStyle, padding: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>Repartition par categorie</div>
          {chartByCategoryMap.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={chartByCategoryMap} dataKey="value" nameKey="name" outerRadius={78} innerRadius={34} paddingAngle={2}>
                  {chartByCategoryMap.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} DH`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '92px', fontSize: '12px' }}>Aucune donnee</div>
          )}
        </div>

        <div style={{ ...cardStyle, padding: '14px' }}>
          <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>Statut des tickets</div>
          {previsions.length > 0 ? (
            <ResponsiveContainer width="100%" height={230}>
              <PieChart>
                <Pie data={chartByStatus} dataKey="value" nameKey="name" outerRadius={78} innerRadius={34} paddingAngle={2}>
                  <Cell fill="#1d2836" />
                  <Cell fill="#2a5ea8" />
                  <Cell fill="#c93128" />
                </Pie>
                <Tooltip formatter={(v: any) => `${v} ticket(s)`} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '92px', fontSize: '12px' }}>Aucune donnee</div>
          )}
        </div>
      </div>

      <div style={{ ...cardStyle, padding: '14px' }}>
        <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px' }}>Synthese des semaines</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
          {[1, 2, 3, 4].map((s) => {
            const week = ecarts?.[`semaine_${s}`]
            const config = semaines.find((item) => item.semaine === s)
            return (
              <div key={s} onClick={() => setActiveView(s as 1 | 2 | 3 | 4)} style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px', cursor: 'pointer' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d2836' }}>Semaine {s}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>
                    {config ? `${config.debut_jour}-${config.fin_jour}` : '-'}
                  </div>
                </div>
                <div style={{ fontSize: '17px', fontWeight: '800', color: '#2a5ea8', marginTop: '8px' }}>
                  {week ? fmtDh(week.solde_fin) : '0,00'} DH
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '7px', fontSize: '10.5px' }}>
                  <span style={{ color: '#1f8a57' }}>+{week ? fmtDh(week.entrees) : '0,00'}</span>
                  <span style={{ color: '#c93128' }}>-{week ? fmtDh(week.sorties) : '0,00'}</span>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </>
  )

  return (
    <Layout>
      <div style={{ padding: '16px 18px 20px' }}>
        {renderPopup()}

        <div style={{ ...cardStyle, padding: '18px 20px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1d2836', marginBottom: '6px' }}>
                Previsions
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '760px' }}>
                Pilotage mensuel des previsions, lecture hebdomadaire claire, KPI management, et synchronisation banque automatique.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select style={{ ...inputStyle, width: '150px' }} value={mois} onChange={(e) => setMois(parseInt(e.target.value))}>
                {MOIS_LABELS.map((label, index) => (
                  <option key={label} value={index + 1}>{label}</option>
                ))}
              </select>
              <input style={{ ...inputStyle, width: '120px' }} type="number" value={annee} onChange={(e) => setAnnee(parseInt(e.target.value || '0'))} />
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveView('dashboard')} style={compactButton(activeView === 'dashboard')}>Dashboard</button>
          {[1, 2, 3, 4].map((s) => (
            <button key={s} onClick={() => { setActiveView(s as 1 | 2 | 3 | 4); setShowForm(null) }} style={compactButton(activeView === s)}>
              Semaine {s}
            </button>
          ))}
        </div>

        {success && (
          <div style={{ ...cardStyle, padding: '12px 16px', marginBottom: '12px', borderColor: '#cfe9db', background: '#ebf8f2', color: '#1f8a57', fontSize: '13px', fontWeight: 700 }}>
            Operation reussie.
          </div>
        )}

        {error && (
          <div style={{ ...cardStyle, padding: '12px 16px', marginBottom: '12px', borderColor: '#f1d3cf', background: '#fdf1ef', color: '#c93128', fontSize: '13px', fontWeight: 700 }}>
            {error}
          </div>
        )}

        {loading ? (
          <div style={{ ...cardStyle, padding: '36px', textAlign: 'center', color: '#6b7280' }}>Chargement en cours...</div>
        ) : (
          <>
            {activeView === 'dashboard' ? renderDashboard() : renderSemaineView(activeView as 1 | 2 | 3 | 4)}
          </>
        )}
      </div>
    </Layout>
  )
}

export default Previsions
