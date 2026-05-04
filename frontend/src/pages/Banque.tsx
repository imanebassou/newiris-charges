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
import api from '../api/axios'
import ImportExcel from '../components/ImportExcel'
import Layout from '../components/Layout'
import SortableTable from '../components/SortableTable'


const INITIAL_CATEGORIES: string[] = []

const MOIS_LABELS = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre', 'Toute l annee'
]

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

const legendTextStyle = {
  fontSize: '11px',
  color: '#6b7280',
}

const emptyForm = {
  type: 'entree',
  date: '',
  titre: '',
  description: '',
  montant: '',
  categorie: '',
  statut: 'en_cours'
}

const fmtDh = (value: number) =>
  Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })

const Banque = () => {
  document.title = 'Banque - NEWIRIS'

  const now = new Date()
  const today = new Date().toISOString().split('T')[0]

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [activeView, setActiveView] = useState<'dashboard' | 'table'>('dashboard')

  const [actions, setActions] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [categories, setCategories] = useState<string[]>(INITIAL_CATEGORIES)
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [form, setForm] = useState(emptyForm)

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  const [editMode, setEditMode] = useState(false)
  const [selectedIds, setSelectedIds] = useState<Array<number | string>>([])

  const fetchData = async () => {
    setLoading(true)
    try {
      const actionsRes = await api.get('/banque/actions/')
      setActions(actionsRes.data)

      setCategories([])

    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  const isInSelectedPeriod = (dateValue: string) => {
    if (!dateValue) return false
    const d = new Date(dateValue)
    const month = d.getMonth() + 1
    const year = d.getFullYear()

    if (selectedMonth === 13) {
      return year === selectedYear
    }

    return month === selectedMonth && year === selectedYear
  }

  const filteredActions = useMemo(
    () => actions.filter((a: any) => isInSelectedPeriod(a.date)),
    [actions, selectedMonth, selectedYear]
  )

  const totalMontantTable = useMemo(
    () => filteredActions.reduce((sum: number, row: any) => sum + Number(row.montant || 0), 0),
    [filteredActions]
  )

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    try {
      const payload = {
        type: form.type,
        date: form.date,
        titre: form.titre,
        description: form.description,
        montant: parseFloat(form.montant),
        categorie: form.categorie,
        statut: form.statut,
      }

      if (editMode && selectedRow) {
        await api.patch(`/banque/actions/${selectedRow.id}/`, payload)
      } else {
        await api.post('/banque/actions/', payload)
      }

      setSuccess(true)
      setError('')
      setTimeout(() => setSuccess(false), 2500)

      setShowForm(false)
      setEditMode(false)
      setSelectedRow(null)
      setShowAddCat(false)
      setForm(emptyForm)
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors de l enregistrement.')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/banque/actions/${id}/`)
      if (selectedRow?.id === id) {
        setSelectedRow(null)
        setEditMode(false)
        setShowForm(false)
        setForm(emptyForm)
      }
      setSelectedIds(prev => prev.filter(item => item !== id))
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors de la suppression.')
    }
  }

  const handleDeleteFiltered = async () => {
    if (filteredActions.length === 0) return
    try {
      await Promise.all(filteredActions.map((row: any) => api.delete(`/banque/actions/${row.id}/`)))
      setSelectedIds([])
      await fetchData()
      setSuccess(true)
      setError('')
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors de la suppression globale.')
    }
  }

  const handleBatchDelete = async () => {
    if (selectedIds.length === 0) return
    try {
      await Promise.all(selectedIds.map(id => api.delete(`/banque/actions/${id}/`)))
      setSelectedIds([])
      await fetchData()
      setSuccess(true)
      setError('')
      setTimeout(() => setSuccess(false), 2500)
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors de la suppression groupee.')
    }
  }

  const handleAddCat = () => {
    const value = newCat.trim()
    if (value && !categories.includes(value)) {
      setCategories([...categories, value])
      setForm({ ...form, categorie: value })
    }
    setNewCat('')
    setShowAddCat(false)
  }

  const handleImport = async (rows: any[]) => {
    let successCount = 0
    let failCount = 0

    for (const row of rows) {
      try {
        const categorie = String(row.categorie || '').trim()
        const rawType = String(row.type || '').trim().toLowerCase()
        const rawStatut = String(row.statut || '').trim().toLowerCase()

        if (categorie && !categories.includes(categorie)) {
          setCategories(prev => [...prev, categorie])
        }

        await api.post('/banque/actions/', {
          type:
            rawType === 'entree' ||
            rawType === 'entrée'
              ? 'entree'
              : 'sortie',
          date: row.date || today,
          titre: String(row.titre || 'Sans titre').trim(),
          description: String(row.description || '').trim(),
          montant: parseFloat(String(row.montant || '0').replace(',', '.').replace(/[^0-9.-]/g, '')) || 0,
          categorie,
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
      setSuccess(true)
      setError('')
      setTimeout(() => setSuccess(false), 2500)
    } else if (successCount > 0 && failCount > 0) {
      setError(`Import partiel : ${successCount} ligne(s) importee(s), ${failCount} en erreur.`)
    } else {
      setError('Import impossible. Verifiez les colonnes du fichier.')
    }

    await fetchData()
  }

  const openCreate = () => {
    setEditMode(false)
    setSelectedRow(null)
    setForm({ ...emptyForm, date: today })
    setShowForm(true)
    setShowAddCat(false)
  }

  const openEdit = (row: any) => {
    setEditMode(true)
    setSelectedRow(row)
    setForm({
      type: row.type || 'entree',
      date: row.date || '',
      titre: row.titre || '',
      description: row.description || '',
      montant: String(row.montant || ''),
      categorie: row.categorie || '',
      statut: row.statut || 'en_cours',
    })
    setShowForm(true)
    setShowAddCat(false)
  }

  const totalEntreesTraitees = filteredActions
    .filter((a: any) => a.type === 'entree' && a.statut === 'traitee')
    .reduce((sum: number, a: any) => sum + parseFloat(a.montant), 0)

  const totalSortiesTraitees = filteredActions
    .filter((a: any) => a.type === 'sortie' && a.statut === 'traitee')
    .reduce((sum: number, a: any) => sum + parseFloat(a.montant), 0)

  const soldePeriode = totalEntreesTraitees - totalSortiesTraitees
  const totalEnCours = filteredActions.filter((a: any) => a.statut === 'en_cours').length
  const totalTraitees = filteredActions.filter((a: any) => a.statut === 'traitee').length
  const totalLignes = filteredActions.length

  const topCategorieMap = filteredActions.reduce((acc: any, action: any) => {
    const key = action.categorie || 'Sans categorie'
    acc[key] = (acc[key] || 0) + parseFloat(action.montant)
    return acc
  }, {})

  const topCategorieName = Object.keys(topCategorieMap).sort((a, b) => topCategorieMap[b] - topCategorieMap[a])[0] || '-'
  const topCategorieValue = topCategorieMap[topCategorieName] || 0

  const chartByType = [
    { name: 'Entrees', value: totalEntreesTraitees, color: '#1f8a57' },
    { name: 'Sorties', value: totalSortiesTraitees, color: '#c93128' },
  ]

  const chartByCategorie = Object.entries(
    filteredActions.reduce((acc: any, action: any) => {
      const key = action.categorie || 'Sans categorie'
      acc[key] = (acc[key] || 0) + parseFloat(action.montant)
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const chartByStatus = [
    { name: 'Traitees', value: totalTraitees },
    { name: 'En cours', value: totalEnCours },
  ]

  const chartByCategorieBar = Object.entries(
    filteredActions.reduce((acc: any, action: any) => {
      const key = action.categorie || 'Sans categorie'
      acc[key] = (acc[key] || 0) + parseFloat(action.montant)
      return acc
    }, {})
  )
    .map(([name, value]) => ({ name, montant: value }))
    .sort((a: any, b: any) => b.montant - a.montant)
    .slice(0, 6)

  const categoryTotal = chartByCategorie.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0)
  const typeTotal = chartByType.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0)
  const statusTotal = chartByStatus.reduce((sum: number, item: any) => sum + Number(item.value || 0), 0)

  const tableData = filteredActions.map((row: any) => ({
    ...row,
    date_fmt: row.date ? new Date(row.date).toLocaleDateString('fr-FR') : '-',
    montant_fmt: `${row.type === 'entree' ? '+' : '-'}${fmtDh(parseFloat(row.montant))} DH`,
  }))

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

  const toggleRow = (id: number | string) => {
    setSelectedIds(prev => (prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]))
  }

  const toggleAllRows = (ids: Array<number | string>, checked: boolean) => {
    if (checked) {
      setSelectedIds(Array.from(new Set([...selectedIds, ...ids])))
    } else {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)))
    }
  }

  return (
    <Layout>
      <div style={{ padding: '16px 18px 20px', fontSize: '14px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ ...cardStyle, padding: '18px 20px 16px', background: 'linear-gradient(135deg, #ffffff 0%, #fbfcfd 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1d2836', marginBottom: '6px' }}>
                  Gestion bancaire
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '720px' }}>
                  Pilotage des entrees, des sorties et du suivi de tresorerie bancaire.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={{ ...inputStyle, width: '104px' }}>
                  {[2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} style={{ ...inputStyle, width: '150px' }}>
                  {MOIS_LABELS.map((label, index) => (
                    <option key={label} value={index + 1}>{label}</option>
                  ))}
                </select>

                <ImportExcel
                  onImport={handleImport}
                  columns={[
                    { key: 'type', label: 'Type' },
                    { key: 'date', label: 'Date' },
                    { key: 'titre', label: 'Titre' },
                    { key: 'description', label: 'Description' },
                    { key: 'montant', label: 'Montant' },
                    { key: 'categorie', label: 'Categorie' },
                    { key: 'statut', label: 'Statut' },
                  ]}
                />

                <button
                  onClick={handleDeleteFiltered}
                  disabled={filteredActions.length === 0}
                  style={{
                    ...compactButton(false),
                    color: filteredActions.length === 0 ? '#9ca3af' : '#c93128',
                    borderColor: '#f0c7c5',
                    cursor: filteredActions.length === 0 ? 'not-allowed' : 'pointer',
                  }}
                >
                  Tout supprimer
                </button>

                <button
                  onClick={openCreate}
                  style={{ ...compactButton(true), background: '#c93128', borderColor: '#c93128' }}
                >
                  + Nouvelle operation
                </button>
              </div>
            </div>
          </div>
        </div>

        {(success || error) && (
          <div style={{ marginBottom: '12px' }}>
            {success && (
              <div style={{ ...cardStyle, padding: '10px 12px', background: '#e9f7f0', borderColor: '#ccebdc', color: '#1f8a57', fontSize: '12px', fontWeight: 600 }}>
                L operation a ete enregistree avec succes.
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
          <button onClick={() => setActiveView('dashboard')} style={compactButton(activeView === 'dashboard')}>
            Tableau de bord
          </button>
          <button onClick={() => setActiveView('table')} style={compactButton(activeView === 'table')}>
            Operations
          </button>
        </div>

        {showForm && (
          <div style={{ ...cardStyle, padding: '18px', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1d2836', marginBottom: '14px' }}>
              {editMode ? 'Modifier l operation bancaire' : 'Nouvelle operation bancaire'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Type *</label>
                  <select style={inputStyle} value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} required>
                    <option value="entree">Entree</option>
                    <option value="sortie">Sortie</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date *</label>
                  <input style={inputStyle} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Titre *</label>
                  <input style={inputStyle} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required placeholder="Ex : reglement client" />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Description</label>
                  <input style={inputStyle} value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Description complementaire" />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Montant (DH) *</label>
                  <input style={inputStyle} type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} required placeholder="0.00" />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Categorie</label>
                  <select
                    style={inputStyle}
                    value={form.categorie}
                    onChange={e => {
                      if (e.target.value === '__add_cat__') {
                        setShowAddCat(true)
                      } else {
                        setForm({ ...form, categorie: e.target.value })
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
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        value={newCat}
                        onChange={e => setNewCat(e.target.value)}
                        placeholder="Nouvelle categorie..."
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            handleAddCat()
                          }
                        }}
                      />
                      <button type="button" onClick={handleAddCat} style={compactButton(true)}>
                        OK
                      </button>
                      <button type="button" onClick={() => { setShowAddCat(false); setNewCat('') }} style={compactButton(false)}>
                        X
                      </button>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Statut</label>
                  <select style={inputStyle} value={form.statut} onChange={e => setForm({ ...form, statut: e.target.value })}>
                    <option value="en_cours">En cours</option>
                    <option value="traitee">Traitee</option>
                  </select>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button type="submit" style={compactButton(true)}>
                  {editMode ? 'Enregistrer' : 'Creer'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false)
                    setEditMode(false)
                    setSelectedRow(null)
                    setShowAddCat(false)
                    setForm(emptyForm)
                  }}
                  style={compactButton(false)}
                >
                  Annuler
                </button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ ...cardStyle, padding: '36px', textAlign: 'center', color: '#6b7280' }}>
            Chargement en cours...
          </div>
        ) : (
          <>
            {activeView === 'dashboard' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #1d2836' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Solde de la periode</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: soldePeriode >= 0 ? '#1d2836' : '#c93128', lineHeight: 1.18 }}>
                      {fmtDh(soldePeriode)} DH
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>Entrees traitees - sorties traitees</div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #1f8a57' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Entrees traitees</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#1f8a57', lineHeight: 1.18 }}>
                      +{fmtDh(totalEntreesTraitees)} DH
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>
                      {filteredActions.filter((a: any) => a.type === 'entree' && a.statut === 'traitee').length} operation(s)
                    </div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #c93128' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Sorties traitees</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#c93128', lineHeight: 1.18 }}>
                      -{fmtDh(totalSortiesTraitees)} DH
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>
                      {filteredActions.filter((a: any) => a.type === 'sortie' && a.statut === 'traitee').length} operation(s)
                    </div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #2a5ea8' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Operations traitees</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#2a5ea8', lineHeight: 1.18 }}>
                      {totalTraitees}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>
                      {totalEnCours} en cours
                    </div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #c93128' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Categorie dominante</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#c93128', lineHeight: 1.18 }}>
                      {topCategorieName}
                    </div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>
                      {fmtDh(topCategorieValue)} DH
                    </div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836' }}>Top categories</div>
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>
                        {selectedMonth === 13 ? `Vue annuelle ${selectedYear}` : 'Vue mensuelle'}
                      </div>
                    </div>

                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={chartByCategorieBar} barCategoryGap={18}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} DH`} />
                        <Bar dataKey="montant" fill="#1d2836" radius={[5, 5, 0, 0]} maxBarSize={34} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>Entrees / Sorties</div>
                    {filteredActions.length > 0 ? (
                      <>
                        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', marginBottom: '6px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#1f8a57', display: 'inline-block' }} />
                            <span style={legendTextStyle}>Entrees</span>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#c93128', display: 'inline-block' }} />
                            <span style={legendTextStyle}>Sorties</span>
                          </div>
                        </div>

                        <ResponsiveContainer width="100%" height={190}>
                          <PieChart>
                            <Pie data={chartByType} dataKey="value" nameKey="name" outerRadius={70} innerRadius={34} paddingAngle={2}>
                              {chartByType.map((item, i) => <Cell key={i} fill={item.color} />)}
                            </Pie>
                            <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} DH`} />
                          </PieChart>
                        </ResponsiveContainer>

                        <div style={{ borderTop: '1px solid #eef2f6', paddingTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                            <span>Total traite</span>
                            <strong style={{ color: '#1d2836' }}>{fmtDh(typeTotal)} DH</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280' }}>
                            <span>Solde net</span>
                            <strong style={{ color: '#1d2836' }}>{fmtDh(soldePeriode)} DH</strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '92px', fontSize: '12px' }}>Aucune donnee</div>
                    )}
                  </div>

                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>Statut des operations</div>
                    {filteredActions.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={190}>
                          <PieChart>
                            <Pie data={chartByStatus} dataKey="value" nameKey="name" outerRadius={70} innerRadius={34} paddingAngle={2}>
                              <Cell fill="#1d2836" />
                              <Cell fill="#2a5ea8" />
                            </Pie>
                            <Tooltip formatter={(v: any) => `${v} operation(s)`} />
                          </PieChart>
                        </ResponsiveContainer>

                        <div style={{ borderTop: '1px solid #eef2f6', paddingTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                            <span>Operations total</span>
                            <strong style={{ color: '#1d2836' }}>{statusTotal}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280' }}>
                            <span>Taux traite</span>
                            <strong style={{ color: '#1d2836' }}>
                              {statusTotal ? `${Math.round((totalTraitees / statusTotal) * 100)}%` : '0%'}
                            </strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '92px', fontSize: '12px' }}>Aucune donnee</div>
                    )}
                  </div>
                </div>

                <div style={{ ...cardStyle, padding: '14px' }}>
                  <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px' }}>Synthese bancaire</div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
                    <div style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d2836', marginBottom: '8px' }}>Periode selectionnee</div>
                      <div style={{ fontSize: '17px', fontWeight: '800', color: '#1d2836' }}>
                        {selectedMonth === 13 ? `Toute l annee ${selectedYear}` : `${MOIS_LABELS[selectedMonth - 1]} ${selectedYear}`}
                      </div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '6px' }}>{totalLignes} ligne(s)</div>
                    </div>

                    <div style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d2836', marginBottom: '8px' }}>Categorie dominante</div>
                      <div style={{ fontSize: '17px', fontWeight: '800', color: '#2a5ea8' }}>{topCategorieName}</div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '6px' }}>{fmtDh(topCategorieValue)} DH</div>
                    </div>

                    <div style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d2836', marginBottom: '8px' }}>Categories actives</div>
                      <div style={{ fontSize: '17px', fontWeight: '800', color: '#2a5ea8' }}>{chartByCategorie.length}</div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '6px' }}>{fmtDh(categoryTotal)} DH</div>
                    </div>

                    <div style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d2836', marginBottom: '8px' }}>Operations en cours</div>
                      <div style={{ fontSize: '17px', fontWeight: '800', color: '#c93128' }}>{totalEnCours}</div>
                      <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '6px' }}>{totalTraitees} traitee(s)</div>
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeView === 'table' && (
              <SortableTable
                emptyMessage="Aucune operation bancaire sur la periode selectionnee."
                selectableRows
                selectedRowIds={selectedIds}
                onToggleRow={toggleRow}
                onToggleAllRows={toggleAllRows}
                batchActions={
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '11px', color: '#6b7280' }}>
                      {selectedIds.length} selectionnee(s)
                    </span>
                    <button
                      onClick={handleBatchDelete}
                      disabled={selectedIds.length === 0}
                      style={{
                        ...compactButton(false),
                        color: selectedIds.length === 0 ? '#9ca3af' : '#c93128',
                        borderColor: '#f0c7c5',
                        cursor: selectedIds.length === 0 ? 'not-allowed' : 'pointer',
                      }}
                    >
                      Action groupee : supprimer
                    </button>
                  </div>
                }
                footerContent={
                  <div style={{ fontSize: '12px', fontWeight: 700, color: '#1d2836' }}>
                    Total montant : {fmtDh(totalMontantTable)} DH
                  </div>
                }
                columns={[
                  { key: 'id', label: '#', render: (_v: any, row: any) => <span style={{ color: '#9ca3af' }}>{row.id}</span> },
                  {
                    key: 'type',
                    label: 'Type',
                    render: (_v: any, row: any) => (
                      <span style={{ padding: '3px 9px', borderRadius: '999px', fontSize: '10.5px', fontWeight: '700', background: row.type === 'entree' ? '#e9f7f0' : '#fdeceb', color: row.type === 'entree' ? '#1f8a57' : '#c93128' }}>
                        {row.type === 'entree' ? 'Entree' : 'Sortie'}
                      </span>
                    )
                  },
                  { key: 'date_fmt', label: 'Date', render: (_v: any, row: any) => <span style={{ color: '#4b5563' }}>{row.date_fmt}</span> },
                  {
                    key: 'titre',
                    label: 'Titre',
                    render: (_v: any, row: any) => (
                      <div style={{ maxWidth: '130px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontWeight: '600', color: '#1f2937' }}>
                        {row.titre}
                      </div>
                    )
                  },
                  {
                    key: 'description',
                    label: 'Description',
                    render: (_v: any, row: any) => (
                      <div style={{ maxWidth: '150px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#4b5563' }}>
                        {row.description || '-'}
                      </div>
                    )
                  },
                  {
                    key: 'montant_fmt',
                    label: 'Montant',
                    render: (_v: any, row: any) => (
                      <span style={{ fontWeight: '700', color: row.statut === 'en_cours' ? '#9ca3af' : row.type === 'entree' ? '#1f8a57' : '#c93128' }}>
                        {row.montant_fmt}
                      </span>
                    )
                  },
                  {
                    key: 'categorie',
                    label: 'Categorie',
                    render: (_v: any, row: any) => (
                      <div style={{ maxWidth: '120px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', color: '#4b5563' }}>
                        {row.categorie || '-'}
                      </div>
                    )
                  },
                  {
                    key: 'statut',
                    label: 'Statut',
                    render: (_v: any, row: any) => (
                      <select
                        value={row.statut}
                        onChange={async e => {
                          try {
                            await api.patch(`/banque/actions/${row.id}/`, { statut: e.target.value })
                            await fetchData()
                          } catch (err) {
                            console.error(err)
                            setError('Une erreur est survenue lors de la mise a jour du statut.')
                          }
                        }}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '9px',
                          fontSize: '10.5px',
                          border: '1px solid #d9e0e7',
                          cursor: 'pointer',
                          background: row.statut === 'traitee' ? '#e9f7f0' : '#fff4df',
                          color: row.statut === 'traitee' ? '#1f8a57' : '#b76b00',
                          fontWeight: 600
                        }}
                      >
                        <option value="en_cours">En cours</option>
                        <option value="traitee">Traitee</option>
                      </select>
                    )
                  },
                  {
                    key: 'edit',
                    label: 'Modifier',
                    sortable: false,
                    render: (_v: any, row: any) => (
                      <button
                        onClick={() => openEdit(row)}
                        style={{ ...compactButton(false), padding: '7px 12px', color: '#2a5ea8', borderColor: '#cddcf5' }}
                      >
                        Modifier
                      </button>
                    )
                  },
                  {
                    key: 'actions',
                    label: 'Supprimer',
                    sortable: false,
                    render: (_v: any, row: any) => (
                      <button
                        onClick={() => handleDelete(row.id)}
                        style={{ ...compactButton(false), padding: '7px 12px', color: '#c93128', borderColor: '#f0c7c5' }}
                      >
                        Supprimer
                      </button>
                    )
                  },
                ]}
                data={tableData}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default Banque
