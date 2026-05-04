import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import SortableTable from '../components/SortableTable'
import ImportExcel from '../components/ImportExcel'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'

const MOIS_LABELS = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
]

const COLORS = ['#1d2836', '#2a5ea8', '#1f8a57', '#c93128', '#d08b19', '#16a085']

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

const fmtDh = (value: any) =>
  Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })

const normalizeDate = (value: any) => {
  if (!value) return ''
  if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value)) return value
  const d = new Date(value)
  if (isNaN(d.getTime())) return ''
  return d.toISOString().split('T')[0]
}

const numSign = (value: any) => (Number(value || 0) >= 0 ? '+' : '-')

const Salaires = () => {
  document.title = 'Salaires - NEWIRIS'

  const now = new Date()
  const [mois, setMois] = useState(now.getMonth() + 1)
  const [annee, setAnnee] = useState(now.getFullYear())

  const [salaries, setSalaries] = useState<any[]>([])
  const [etat, setEtat] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<'dashboard' | 'etat' | 'salaries' | 'actions'>('dashboard')

  const [editingSalarieId, setEditingSalarieId] = useState<number | null>(null)
  const [editingDateDebut, setEditingDateDebut] = useState('')
  const [editingDateFin, setEditingDateFin] = useState('')

  const [editingActionId, setEditingActionId] = useState<number | null>(null)
  const [editingActionDate, setEditingActionDate] = useState('')
  const [editingActionMontant, setEditingActionMontant] = useState('')

  const [showAddSalarie, setShowAddSalarie] = useState(false)
  const [showAddAction, setShowAddAction] = useState(false)

  const [formSalarie, setFormSalarie] = useState({
    nom: '',
    prenom: '',
    salaire_base: '',
    date_debut: '',
    date_fin: ''
  })

  const [formAction, setFormAction] = useState({
    salarie: '',
    type: 'entree',
    categorie: '',
    montant: '',
    date: '',
    statut: 'en_cours'
  })

  const [categories, setCategories] = useState<string[]>([
    'Prime',
    'Bonus',
    'Heures supplementaires',
    'Avance',
    'Deduction',
    'Absence',
    'Autres'
  ])

  const [showAddCat, setShowAddCat] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [salsRes, etatRes] = await Promise.all([
        api.get('/salaires/salaries/'),
        api.get(`/salaires/etat/?mois=${mois}&annee=${annee}`),
      ])
      setSalaries(Array.isArray(salsRes.data) ? salsRes.data : [])
      setEtat(Array.isArray(etatRes.data) ? etatRes.data : [])
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [mois, annee])

  const notifySuccess = () => {
    setSuccess(true)
    setError('')
    setTimeout(() => setSuccess(false), 2500)
  }

  const handleAddSalarie = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/salaires/salaries/', {
        nom: formSalarie.nom,
        prenom: formSalarie.prenom,
        salaire_base: parseFloat(formSalarie.salaire_base),
        date_debut: formSalarie.date_debut,
        date_fin: formSalarie.date_fin
      })
      setShowAddSalarie(false)
      setFormSalarie({ nom: '', prenom: '', salaire_base: '', date_debut: '', date_fin: '' })
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Creation du salarie impossible.')
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
        statut: formAction.statut
      })
      setShowAddAction(false)
      setFormAction({ salarie: '', type: 'entree', categorie: '', montant: '', date: '', statut: 'en_cours' })
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Creation de l action impossible.')
    }
  }

  const handleDeleteSalarie = async (id: number) => {
    try {
      await api.delete(`/salaires/salaries/${id}/`)
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Suppression du salarie impossible.')
    }
  }

  const handleDeleteAction = async (id: number) => {
    try {
      await api.delete(`/salaires/actions/${id}/`)
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Suppression de l action impossible.')
    }
  }

  const handleUpdatePeriode = async (id: number) => {
    try {
      await api.patch(`/salaires/salaries/${id}/`, {
        date_debut: editingDateDebut,
        date_fin: editingDateFin
      })
      setEditingSalarieId(null)
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Modification de la periode impossible.')
    }
  }

  const handleUpdateAction = async (id: number) => {
    try {
      await api.patch(`/salaires/actions/${id}/`, {
        date: editingActionDate,
        montant: parseFloat(editingActionMontant)
      })
      setEditingActionId(null)
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Modification de l action impossible.')
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

  const handleImportSalaries = async (rows: any[]) => {
    let successCount = 0
    let failCount = 0

    for (const row of rows) {
      try {
        const dateDebut =
          normalizeDate(row.date_debut) ||
          normalizeDate(row.debut)

        const dateFin =
          normalizeDate(row.date_fin) ||
          normalizeDate(row.fin)

        await api.post('/salaires/salaries/', {
          nom: String(row.nom || '').trim(),
          prenom: String(row.prenom || '').trim(),
          salaire_base: parseFloat(String(row.salaire_base || 0).replace(',', '.').replace(/[^0-9.-]/g, '')) || 0,
          date_debut: dateDebut,
          date_fin: dateFin,
        })

        successCount += 1
      } catch (err) {
        console.error(err)
        failCount += 1
      }
    }

    if (successCount > 0 && failCount === 0) {
      notifySuccess()
    } else if (successCount > 0 && failCount > 0) {
      setError(`Import partiel : ${successCount} ligne(s) importee(s), ${failCount} en erreur.`)
    } else {
      setError('Import des salaries impossible. Verifiez les colonnes nom, prenom, salaire_base, date_debut et date_fin.')
    }

    fetchData()
  }

  const handleImportActions = async (rows: any[]) => {
    let successCount = 0
    let failCount = 0

    const normalizeName = (value: string) =>
      String(value || '')
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .toLowerCase()
        .trim()

    for (const row of rows) {
      try {
        const salarie = salaries.find(s =>
          normalizeName(`${s.nom} ${s.prenom}`) === normalizeName(String(row.salarie || ''))
        )

        if (!salarie) {
          failCount += 1
          continue
        }

        const rawType = String(row.type || '').trim().toLowerCase()
        const rawStatut = String(row.statut || '').trim().toLowerCase()

        await api.post('/salaires/actions/', {
          salarie: salarie.id,
          type:
            rawType === 'entree' ||
            rawType === 'entrée'
              ? 'entree'
              : 'sortie',
          categorie: String(row.categorie || '').trim(),
          montant: parseFloat(String(row.montant || 0).replace(',', '.').replace(/[^0-9.-]/g, '')) || 0,
          date: normalizeDate(row.date),
          statut:
            rawStatut === 'traitee' ||
            rawStatut === 'traitée'
              ? 'traitee'
              : 'en_cours',
        })

        successCount += 1
      } catch (err) {
        console.error(err)
        failCount += 1
      }
    }

    if (successCount > 0 && failCount === 0) {
      notifySuccess()
    } else if (successCount > 0 && failCount > 0) {
      setError(`Import partiel : ${successCount} ligne(s) importee(s), ${failCount} en erreur.`)
    } else {
      setError('Import des actions impossible.')
    }

    fetchData()
  }

  const compactButton = (active: boolean) => ({
    padding: '8px 14px',
    borderRadius: '10px',
    border: active ? '1px solid #1d2836' : '1px solid #d9e0e7',
    cursor: 'pointer',
    fontSize: '11px',
    background: active ? '#1d2836' : '#fff',
    color: active ? '#fff' : '#1d2836',
    fontWeight: 700,
  })

  const stateButton = {
    padding: '7px 12px',
    borderRadius: '9px',
    fontSize: '11px',
    border: '1px solid #d9e0e7',
    cursor: 'pointer',
    background: '#fff',
  }

  const etatData = etat.map((e: any) => ({
    ...e,
    mois_label: `${MOIS_LABELS[mois - 1]} ${annee}`,
    nom_complet: `${e.nom} ${e.prenom}`,
    salaire_base_fmt: `${fmtDh(e.salaire_base)} DH`,
    montant_ajoute_fmt: `+${fmtDh(e.montant_ajoute)} DH`,
    montant_deduit_fmt: `-${fmtDh(e.montant_deduit)} DH`,
    salaire_final_fmt: `${fmtDh(e.salaire_final)} DH`,
    ecart_fmt: `${numSign(e.ecart)}${fmtDh(Math.abs(Number(e.ecart || 0)))} DH`,
  }))

  const salarieData = salaries.map((s: any) => ({
    ...s,
    nom_complet: `${s.nom} ${s.prenom}`,
    salaire_base_fmt: `${fmtDh(s.salaire_base)} DH`,
    periode_fmt: `${new Date(s.date_debut).toLocaleDateString('fr-FR')} au ${new Date(s.date_fin).toLocaleDateString('fr-FR')}`,
  }))

  const actionsData = salaries.flatMap((s: any) =>
    (s.actions || []).map((a: any) => ({
      ...a,
      salarie_nom: `${s.nom} ${s.prenom}`,
      type_label: a.type === 'entree' ? 'Entree' : 'Sortie',
      montant_fmt: `${a.type === 'entree' ? '+' : '-'}${fmtDh(a.montant)} DH`,
      date_fmt: new Date(a.date).toLocaleDateString('fr-FR'),
    }))
  )

  const totalBase = useMemo(
    () => etat.reduce((sum: number, row: any) => sum + Number(row.salaire_base || 0), 0),
    [etat]
  )

  const totalAjouts = useMemo(
    () => etat.reduce((sum: number, row: any) => sum + Number(row.montant_ajoute || 0), 0),
    [etat]
  )

  const totalDeductions = useMemo(
    () => etat.reduce((sum: number, row: any) => sum + Number(row.montant_deduit || 0), 0),
    [etat]
  )

  const totalFinal = useMemo(
    () => etat.reduce((sum: number, row: any) => sum + Number(row.salaire_final || 0), 0),
    [etat]
  )

  const actionsByCategory = useMemo(() => {
    const map: { [key: string]: number } = {}
    actionsData.forEach((a: any) => {
      const key = a.categorie || 'Sans categorie'
      map[key] = (map[key] || 0) + Number(a.montant || 0)
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [actionsData])

  const actionsByType = useMemo(() => {
    const entrees = actionsData
      .filter((a: any) => a.type === 'entree')
      .reduce((sum: number, a: any) => sum + Number(a.montant || 0), 0)

    const sorties = actionsData
      .filter((a: any) => a.type === 'sortie')
      .reduce((sum: number, a: any) => sum + Number(a.montant || 0), 0)

    return [
      { name: 'Entrees', value: entrees },
      { name: 'Sorties', value: sorties },
    ]
  }, [actionsData])

  const cardStats = [
    { title: 'Salaries actifs', value: `${etat.length}`, color: '#1d2836', note: `${MOIS_LABELS[mois - 1]} ${annee}` },
    { title: 'Masse salariale base', value: `${fmtDh(totalBase)} DH`, color: '#2a5ea8', note: 'Avant ajustements' },
    { title: 'Ajouts du mois', value: `+${fmtDh(totalAjouts)} DH`, color: '#1f8a57', note: 'Primes et bonus' },
    { title: 'Deductions du mois', value: `-${fmtDh(totalDeductions)} DH`, color: '#c93128', note: 'Absences et deductions' },
    { title: 'Masse salariale finale', value: `${fmtDh(totalFinal)} DH`, color: '#1d2836', note: 'Montant net du mois' },
  ]

  return (
    <Layout>
      <div style={{ padding: '16px 18px 20px', fontSize: '14px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ ...cardStyle, padding: '18px 20px 16px', background: 'linear-gradient(135deg, #ffffff 0%, #fbfcfd 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1d2836', marginBottom: '6px' }}>
                  Gestion des salaires
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '720px' }}>
                  Pilotage des salaries, des periodes contractuelles et des ajustements mensuels.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select
                  value={annee}
                  onChange={e => setAnnee(parseInt(e.target.value))}
                  style={{ ...inputStyle, width: '104px' }}
                >
                  {[2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select
                  value={mois}
                  onChange={e => setMois(parseInt(e.target.value))}
                  style={{ ...inputStyle, width: '130px' }}
                >
                  {MOIS_LABELS.map((label, index) => (
                    <option key={label} value={index + 1}>{label}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {(success || error) && (
          <div style={{ marginBottom: '12px' }}>
            {success && (
              <div style={{ ...cardStyle, padding: '10px 12px', background: '#e9f7f0', borderColor: '#ccebdc', color: '#1f8a57', fontSize: '12px', fontWeight: 600 }}>
                Operation enregistree avec succes.
              </div>
            )}
            {error && (
              <div style={{ ...cardStyle, padding: '10px 12px', background: '#fdeceb', borderColor: '#f4cfcf', color: '#c93128', fontSize: '12px', fontWeight: 600 }}>
                {error}
              </div>
            )}
          </div>
        )}

        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <button style={compactButton(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>Dashboard</button>
          <button style={compactButton(activeTab === 'etat')} onClick={() => setActiveTab('etat')}>Etat des salaires</button>
          <button style={compactButton(activeTab === 'salaries')} onClick={() => setActiveTab('salaries')}>Salaries</button>
          <button style={compactButton(activeTab === 'actions')} onClick={() => setActiveTab('actions')}>Actions</button>
        </div>

        {loading ? (
          <div style={{ ...cardStyle, padding: '36px', textAlign: 'center', color: '#6b7280' }}>
            Chargement en cours...
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  {cardStats.map(card => (
                    <div key={card.title} style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: `3px solid ${card.color}` }}>
                      <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>{card.title}</div>
                      <div style={{ fontSize: '17px', fontWeight: '800', color: card.color, lineHeight: 1.18 }}>{card.value}</div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>{card.note}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836' }}>Salaire final par salarie</div>
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>{MOIS_LABELS[mois - 1]} {annee}</div>
                    </div>

                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={etatData.map((row: any) => ({ name: row.nom_complet, montant: Number(row.salaire_final || 0) }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: any) => `${fmtDh(v)} DH`} />
                        <Bar dataKey="montant" fill="#1d2836" radius={[5, 5, 0, 0]} maxBarSize={34} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>Actions par type</div>
                    {actionsByType.some(item => item.value > 0) ? (
                      <>
                        <ResponsiveContainer width="100%" height={210}>
                          <PieChart>
                            <Pie data={actionsByType} dataKey="value" nameKey="name" outerRadius={76} innerRadius={36} paddingAngle={2}>
                              <Cell fill="#1f8a57" />
                              <Cell fill="#c93128" />
                            </Pie>
                            <Tooltip formatter={(v: any) => `${fmtDh(v)} DH`} />
                          </PieChart>
                        </ResponsiveContainer>

                        <div style={{ borderTop: '1px solid #eef2f6', paddingTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                            <span>Total actions</span>
                            <strong style={{ color: '#1d2836' }}>{actionsData.length}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280' }}>
                            <span>Volume traite</span>
                            <strong style={{ color: '#1d2836' }}>{fmtDh(actionsByType.reduce((sum, item) => sum + Number(item.value || 0), 0))} DH</strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '92px', fontSize: '12px' }}>Aucune donnee</div>
                    )}
                  </div>

                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>Actions par categorie</div>
                    {actionsByCategory.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={210}>
                          <PieChart>
                            <Pie data={actionsByCategory} dataKey="value" nameKey="name" outerRadius={76} innerRadius={36} paddingAngle={2}>
                              {actionsByCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v: any) => `${fmtDh(v)} DH`} />
                          </PieChart>
                        </ResponsiveContainer>

                        <div style={{ borderTop: '1px solid #eef2f6', paddingTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                            <span>Categories actives</span>
                            <strong style={{ color: '#1d2836' }}>{actionsByCategory.length}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280' }}>
                            <span>Volume categorie</span>
                            <strong style={{ color: '#1d2836' }}>{fmtDh(actionsByCategory.reduce((sum, item) => sum + Number(item.value || 0), 0))} DH</strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '92px', fontSize: '12px' }}>Aucune donnee</div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeTab === 'etat' && (
              <SortableTable
                emptyMessage="Aucun salarie pour ce mois."
                columns={[
                  { key: 'mois_label', label: 'Mois', render: (_v: any, row: any) => <span style={{ color: '#4b5563' }}>{row.mois_label}</span> },
                  { key: 'nom_complet', label: 'Nom', render: (_v: any, row: any) => <span style={{ fontWeight: 600, color: '#1f2937' }}>{row.nom_complet}</span> },
                  { key: 'salaire_base_fmt', label: 'Base', render: (_v: any, row: any) => <span style={{ color: '#4b5563' }}>{row.salaire_base_fmt}</span> },
                  { key: 'montant_ajoute_fmt', label: 'Ajouts', render: (_v: any, row: any) => <span style={{ color: '#1f8a57', fontWeight: 700 }}>{row.montant_ajoute_fmt}</span> },
                  { key: 'montant_deduit_fmt', label: 'Deductions', render: (_v: any, row: any) => <span style={{ color: '#c93128', fontWeight: 700 }}>{row.montant_deduit_fmt}</span> },
                  { key: 'salaire_final_fmt', label: 'Salaire final', render: (_v: any, row: any) => <span style={{ fontWeight: 800, color: '#1d2836' }}>{row.salaire_final_fmt}</span> },
                  {
                    key: 'ecart_fmt',
                    label: 'Ecart',
                    render: (_v: any, row: any) => (
                      <span style={{ fontWeight: 700, color: Number(row.ecart) >= 0 ? '#1f8a57' : '#c93128' }}>
                        {row.ecart_fmt}
                      </span>
                    )
                  },
                ]}
                data={etatData}
              />
            )}

            {activeTab === 'salaries' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <ImportExcel
                    onImport={handleImportSalaries}
                    columns={[
                      { key: 'nom', label: 'Nom' },
                      { key: 'prenom', label: 'Prenom' },
                      { key: 'salaire_base', label: 'Salaire de base' },
                      { key: 'date_debut', label: 'Date debut' },
                      { key: 'date_fin', label: 'Date fin' },
                    ]}
                  />
                  <button onClick={() => setShowAddSalarie(!showAddSalarie)} style={{ ...compactButton(true), background: '#c93128', borderColor: '#c93128' }}>
                    + Nouveau salarie
                  </button>
                </div>

                {showAddSalarie && (
                  <div style={{ ...cardStyle, padding: '18px', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1d2836', marginBottom: '14px' }}>Nouveau salarie</h3>
                    <form onSubmit={handleAddSalarie}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nom *</label>
                          <input style={inputStyle} value={formSalarie.nom} onChange={e => setFormSalarie({ ...formSalarie, nom: e.target.value })} required />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Prenom *</label>
                          <input style={inputStyle} value={formSalarie.prenom} onChange={e => setFormSalarie({ ...formSalarie, prenom: e.target.value })} required />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Salaire de base *</label>
                          <input style={inputStyle} type="number" value={formSalarie.salaire_base} onChange={e => setFormSalarie({ ...formSalarie, salaire_base: e.target.value })} required />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date debut *</label>
                          <input style={inputStyle} type="date" value={formSalarie.date_debut} onChange={e => setFormSalarie({ ...formSalarie, date_debut: e.target.value })} required />
                        </div>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date fin *</label>
                          <input style={inputStyle} type="date" value={formSalarie.date_fin} onChange={e => setFormSalarie({ ...formSalarie, date_fin: e.target.value })} required />
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <button type="submit" style={compactButton(true)}>Creer</button>
                        <button type="button" onClick={() => setShowAddSalarie(false)} style={compactButton(false)}>Annuler</button>
                      </div>
                    </form>
                  </div>
                )}

                <SortableTable
                  emptyMessage="Aucun salarie."
                  columns={[
                    {
                      key: 'periode_fmt',
                      label: 'Periode',
                      sortable: false,
                      render: (_v: any, row: any) => editingSalarieId === row.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <input type="date" value={editingDateDebut} onChange={e => setEditingDateDebut(e.target.value)} style={{ ...inputStyle, width: '150px', padding: '6px 8px' }} />
                          <input type="date" value={editingDateFin} onChange={e => setEditingDateFin(e.target.value)} style={{ ...inputStyle, width: '150px', padding: '6px 8px' }} />
                          <div style={{ display: 'flex', gap: '6px' }}>
                            <button onClick={() => handleUpdatePeriode(row.id)} style={{ ...stateButton, background: '#1d2836', color: '#fff', borderColor: '#1d2836' }}>OK</button>
                            <button onClick={() => setEditingSalarieId(null)} style={stateButton}>Annuler</button>
                          </div>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#4b5563' }}>{row.periode_fmt}</span>
                          <button
                            onClick={() => {
                              setEditingSalarieId(row.id)
                              setEditingDateDebut(row.date_debut)
                              setEditingDateFin(row.date_fin)
                            }}
                            style={{ ...stateButton, padding: '4px 8px', fontSize: '10px' }}
                          >
                            Modifier
                          </button>
                        </div>
                      )
                    },
                    { key: 'nom_complet', label: 'Nom et prenom', render: (_v: any, row: any) => <span style={{ fontWeight: 600, color: '#1f2937' }}>{row.nom_complet}</span> },
                    { key: 'salaire_base_fmt', label: 'Salaire de base', render: (_v: any, row: any) => <span style={{ fontWeight: 700, color: '#2a5ea8' }}>{row.salaire_base_fmt}</span> },
                    {
                      key: 'delete',
                      label: 'Supprimer',
                      sortable: false,
                      render: (_v: any, row: any) => (
                        <button onClick={() => handleDeleteSalarie(row.id)} style={{ ...stateButton, color: '#c93128', borderColor: '#f0c7c5' }}>
                          Supprimer
                        </button>
                      )
                    },
                  ]}
                  data={salarieData}
                />
              </div>
            )}

            {activeTab === 'actions' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
                  <ImportExcel
                    onImport={handleImportActions}
                    columns={[
                      { key: 'salarie', label: 'Salarie' },
                      { key: 'type', label: 'Type' },
                      { key: 'categorie', label: 'Categorie' },
                      { key: 'montant', label: 'Montant' },
                      { key: 'date', label: 'Date' },
                      { key: 'statut', label: 'Statut' },
                    ]}
                  />
                  <button onClick={() => setShowAddAction(!showAddAction)} style={{ ...compactButton(true), background: '#c93128', borderColor: '#c93128' }}>
                    + Nouvelle action
                  </button>
                </div>

                {showAddAction && (
                  <div style={{ ...cardStyle, padding: '18px', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1d2836', marginBottom: '14px' }}>Nouvelle action salaire</h3>
                    <form onSubmit={handleAddAction}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Salarie *</label>
                          <select style={inputStyle} value={formAction.salarie} onChange={e => setFormAction({ ...formAction, salarie: e.target.value })} required>
                            <option value="">Selectionner un salarie...</option>
                            {salaries.map((s: any) => <option key={s.id} value={s.id}>{s.nom} {s.prenom}</option>)}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Type *</label>
                          <select style={inputStyle} value={formAction.type} onChange={e => setFormAction({ ...formAction, type: e.target.value })}>
                            <option value="entree">Entree</option>
                            <option value="sortie">Sortie</option>
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Categorie</label>
                          <select
                            style={inputStyle}
                            value={formAction.categorie}
                            onChange={e => {
                              if (e.target.value === '__add_cat__') {
                                setShowAddCat(true)
                              } else {
                                setFormAction({ ...formAction, categorie: e.target.value })
                                setShowAddCat(false)
                              }
                            }}
                          >
                            <option value="">Selectionner une categorie...</option>
                            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                            <option value="__add_cat__">+ Ajouter</option>
                          </select>

                          {showAddCat && (
                            <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                              <input style={{ ...inputStyle, flex: 1 }} value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nouvelle categorie..." />
                              <button type="button" onClick={handleAddCat} style={compactButton(true)}>OK</button>
                              <button type="button" onClick={() => { setShowAddCat(false); setNewCat('') }} style={compactButton(false)}>X</button>
                            </div>
                          )}
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Montant *</label>
                          <input style={inputStyle} type="number" value={formAction.montant} onChange={e => setFormAction({ ...formAction, montant: e.target.value })} required />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date *</label>
                          <input style={inputStyle} type="date" value={formAction.date} onChange={e => setFormAction({ ...formAction, date: e.target.value })} required />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Statut</label>
                          <select style={inputStyle} value={formAction.statut} onChange={e => setFormAction({ ...formAction, statut: e.target.value })}>
                            <option value="en_cours">En cours</option>
                            <option value="traitee">Traitee</option>
                          </select>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                        <button type="submit" style={compactButton(true)}>Creer</button>
                        <button type="button" onClick={() => { setShowAddAction(false); setShowAddCat(false) }} style={compactButton(false)}>Annuler</button>
                      </div>
                    </form>
                  </div>
                )}

                <SortableTable
                  emptyMessage="Aucune action."
                  columns={[
                    { key: 'salarie_nom', label: 'Salarie', render: (_v: any, row: any) => <span style={{ fontWeight: 600, color: '#1f2937' }}>{row.salarie_nom}</span> },
                    {
                      key: 'type_label',
                      label: 'Type',
                      render: (_v: any, row: any) => (
                        <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 700, background: row.type === 'entree' ? '#e9f7f0' : '#fdeceb', color: row.type === 'entree' ? '#1f8a57' : '#c93128' }}>
                          {row.type_label}
                        </span>
                      )
                    },
                    { key: 'categorie', label: 'Categorie', render: (_v: any, row: any) => <span style={{ color: '#4b5563' }}>{row.categorie || '-'}</span> },
                    {
                      key: 'montant_fmt',
                      label: 'Montant',
                      sortable: false,
                      render: (_v: any, row: any) => editingActionId === row.id ? (
                        <input type="number" value={editingActionMontant} onChange={e => setEditingActionMontant(e.target.value)} style={{ ...inputStyle, width: '110px', padding: '6px 8px' }} />
                      ) : (
                        <span style={{ fontWeight: 700, color: row.type === 'entree' ? '#1f8a57' : '#c93128' }}>{row.montant_fmt}</span>
                      )
                    },
                    {
                      key: 'date_fmt',
                      label: 'Date',
                      sortable: false,
                      render: (_v: any, row: any) => editingActionId === row.id ? (
                        <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                          <input type="date" value={editingActionDate} onChange={e => setEditingActionDate(e.target.value)} style={{ ...inputStyle, width: '145px', padding: '6px 8px' }} />
                          <button onClick={() => handleUpdateAction(row.id)} style={{ ...stateButton, background: '#1d2836', color: '#fff', borderColor: '#1d2836' }}>OK</button>
                          <button onClick={() => setEditingActionId(null)} style={stateButton}>X</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ color: '#4b5563' }}>{row.date_fmt}</span>
                          <button
                            onClick={() => {
                              setEditingActionId(row.id)
                              setEditingActionDate(row.date)
                              setEditingActionMontant(String(row.montant))
                            }}
                            style={{ ...stateButton, padding: '4px 8px', fontSize: '10px' }}
                          >
                            Modifier
                          </button>
                        </div>
                      )
                    },
                    {
                      key: 'delete',
                      label: 'Supprimer',
                      sortable: false,
                      render: (_v: any, row: any) => (
                        <button onClick={() => handleDeleteAction(row.id)} style={{ ...stateButton, color: '#c93128', borderColor: '#f0c7c5' }}>
                          Supprimer
                        </button>
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
