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
import SortableTable from '../components/SortableTable'
import ImportExcel from '../components/ImportExcel'

const MOIS_LABELS = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre',
]

const COLORS = ['#c93128', '#1d2836', '#2a5ea8', '#1f8a57', '#8e44ad', '#d08b19', '#16a085']

const CATEGORY_STORAGE_KEY = 'newiris_charges_variables_categories_v2'

type CategoryConfig = {
  nom: string
  sousCategories: string[]
}

const defaultCategoryConfigs: CategoryConfig[] = [
  { nom: 'Vehicule', sousCategories: ['Carburant', 'Maintenance voiture', 'Lavage', 'Vidange'] },
  { nom: 'Transport', sousCategories: ['Transport', 'Deplacement'] },
  { nom: 'Administratif', sousCategories: ['Frais bancaires', 'Douane'] },
  { nom: 'Equipe', sousCategories: ['Restauration', 'Soin medical', 'Activites sportives'] },
  { nom: 'Entretien', sousCategories: ['Menage', 'Materiel consommable'] },
  { nom: 'Autre', sousCategories: [] },
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

const fmt = (value: any) =>
  Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const normalizeText = (value: string) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

const loadCategoryConfigs = (): CategoryConfig[] => {
  try {
    const raw = localStorage.getItem(CATEGORY_STORAGE_KEY)
    if (!raw) return defaultCategoryConfigs
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return defaultCategoryConfigs
    return parsed
      .filter((item: any) => item && typeof item.nom === 'string')
      .map((item: any) => ({
        nom: String(item.nom).trim(),
        sousCategories: Array.isArray(item.sousCategories)
          ? item.sousCategories.map((v: any) => String(v).trim()).filter(Boolean)
          : [],
      }))
      .filter((item: CategoryConfig) => item.nom)
  } catch {
    return defaultCategoryConfigs
  }
}

const saveCategoryConfigs = (items: CategoryConfig[]) => {
  localStorage.setItem(CATEGORY_STORAGE_KEY, JSON.stringify(items))
}

const mapCategoryFromApi = (value: string, categories: CategoryConfig[]) => {
  const normalized = normalizeText(value)
  const found = categories.find((cat) => normalizeText(cat.nom) === normalized)
  if (found) return found.nom

  if (value === 'administratif') return 'Administratif'
  if (value === 'transport') return 'Transport'
  if (value === 'entretien') return 'Entretien'
  if (value === 'equipe') return 'Equipe'
  if (value === 'vehicule') return 'Vehicule'
  return value || 'Autre'
}

const mapCategoryToApi = (value: string) => {
  if (value === 'Administratif') return 'administratif'
  if (value === 'Transport') return 'transport'
  if (value === 'Entretien') return 'entretien'
  if (value === 'Equipe') return 'equipe'
  if (value === 'Vehicule') return 'vehicule'
  return normalizeText(value).replace(/\s+/g, '_') || 'autre'
}

const ChargesVariables = () => {
  document.title = 'Charges variables - NEWIRIS'

  const now = new Date()
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table' | 'categories'>('dashboard')
  const [charges, setCharges] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [photo, setPhoto] = useState<File | null>(null)
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedCharge, setSelectedCharge] = useState<any | null>(null)
  const [editPhoto, setEditPhoto] = useState<File | null>(null)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

  const [categoryConfigs, setCategoryConfigs] = useState<CategoryConfig[]>(loadCategoryConfigs())
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showSubCategoryForm, setShowSubCategoryForm] = useState(false)

  const [categoryForm, setCategoryForm] = useState({ nom: '' })
  const [subCategoryForm, setSubCategoryForm] = useState({ categorie: '', nom: '' })

  const [form, setForm] = useState({
    titre: '',
    service: '',
    categorie: 'Autre',
    sous_categorie: '',
    montant: '',
    date: '',
    personne: '',
    statut: 'en_cours',
  })

  const [editForm, setEditForm] = useState({
    titre: '',
    service: '',
    categorie: 'Autre',
    sous_categorie: '',
    montant: '',
    date: '',
    personne: '',
    statut: 'en_cours',
  })

  useEffect(() => {
    saveCategoryConfigs(categoryConfigs)
  }, [categoryConfigs])

  const notifySuccess = (message: string) => {
    setSuccess(message)
    setError('')
    setTimeout(() => setSuccess(''), 2500)
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [chargesRes, servicesRes] = await Promise.all([
        api.get('/charges-variables/'),
        api.get('/services/'),
      ])
      setCharges(Array.isArray(chargesRes.data) ? chargesRes.data : [])
      setServices(Array.isArray(servicesRes.data) ? servicesRes.data : [])
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

  const categories = useMemo(
    () => categoryConfigs.reduce((acc: Record<string, string[]>, item) => {
      acc[item.nom] = item.sousCategories
      return acc
    }, {}),
    [categoryConfigs]
  )

  const availableSubCategories = useMemo(
    () => categories[form.categorie] || [],
    [categories, form.categorie]
  )

  const availableEditSubCategories = useMemo(
    () => categories[editForm.categorie] || [],
    [categories, editForm.categorie]
  )

  const resetCreateForm = () => {
    setForm({
      titre: '',
      service: '',
      categorie: categoryConfigs[0]?.nom || 'Autre',
      sous_categorie: '',
      montant: '',
      date: '',
      personne: '',
      statut: 'en_cours',
    })
    setPhoto(null)
  }

  const openEditModal = (row: any) => {
    setSelectedCharge(row)
    setEditPhoto(null)
    const mappedCategory = mapCategoryFromApi(row.categorie || 'autre', categoryConfigs)
    setEditForm({
      titre: row.titre || '',
      service: row.service ? String(row.service) : '',
      categorie: mappedCategory,
      sous_categorie: row.sous_categorie || '',
      montant: String(row.montant || ''),
      date: row.date || '',
      personne: row.description || '',
      statut: row.statut || 'en_cours',
    })
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const formData = new FormData()
      formData.append('titre', form.titre)
      formData.append('service', form.service)
      formData.append('categorie', mapCategoryToApi(form.categorie))
      formData.append('sous_categorie', form.sous_categorie)
      formData.append('montant', form.montant)
      formData.append('date', form.date)
      formData.append('description', form.personne)
      formData.append('statut', form.statut)
      if (photo) formData.append('photo', photo)

      await api.post('/charges-variables/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setShowForm(false)
      resetCreateForm()
      notifySuccess('Charge variable creee avec succes.')
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Creation de la charge variable impossible.')
    }
  }

  const handleEditSave = async () => {
    if (!selectedCharge) return
    try {
      const formData = new FormData()
      formData.append('titre', editForm.titre)
      formData.append('service', editForm.service)
      formData.append('categorie', mapCategoryToApi(editForm.categorie))
      formData.append('sous_categorie', editForm.sous_categorie)
      formData.append('montant', editForm.montant)
      formData.append('date', editForm.date)
      formData.append('description', editForm.personne)
      formData.append('statut', editForm.statut)
      if (editPhoto) formData.append('photo', editPhoto)

      await api.patch(`/charges-variables/${selectedCharge.id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setSelectedCharge(null)
      notifySuccess('Charge variable modifiee avec succes.')
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Modification de la charge variable impossible.')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/charges-variables/${id}/`)
      if (selectedCharge?.id === id) setSelectedCharge(null)
      notifySuccess('Charge variable supprimee avec succes.')
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Suppression de la charge variable impossible.')
    }
  }

  const handleStatutChange = async (id: number, statut: string) => {
    try {
      await api.patch(`/charges-variables/${id}/`, { statut })
      await fetchData()
    } catch (err) {
      console.error(err)
      setError('Mise a jour du statut impossible.')
    }
  }

  const handleImport = async (rows: any[]) => {
    const today = new Date().toISOString().split('T')[0]
    for (const row of rows) {
      try {
        const rawCategory = String(row.categorie || 'Autre').trim()
        const normalizedCategory = categoryConfigs.find(
          (cat) => normalizeText(cat.nom) === normalizeText(rawCategory)
        )?.nom || rawCategory || 'Autre'

        const subCategoryValue = String(row.sous_categorie || '').trim()

        const formData = new FormData()
        formData.append('titre', row.titre || 'Sans titre')
        formData.append('service', row.service || (services[0]?.id ? String(services[0].id) : ''))
        formData.append('categorie', mapCategoryToApi(normalizedCategory))
        formData.append('sous_categorie', subCategoryValue)
        formData.append('montant', String(parseFloat(String(row.montant || '0').replace(',', '.')) || 0))
        formData.append('date', row.date || today)
        formData.append('description', row.personne || row.description || '')
        formData.append('statut', row.statut === 'Traitee' || row.statut === 'traitee' ? 'traitee' : 'en_cours')

        await api.post('/charges-variables/', formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } catch (err) {
        console.error(err)
      }
    }
    notifySuccess('Import des charges variables termine.')
    await fetchData()
  }

  const handleCategoryImport = async (rows: any[]) => {
    const next = [...categoryConfigs]

    rows.forEach((row) => {
      const categoryName = String(row.categorie || row.nom_categorie || row.nom || '').trim()
      const subCategoryName = String(row.sous_categorie || row.nom_sous_categorie || '').trim()

      if (!categoryName) return

      const existingCategory = next.find((item) => normalizeText(item.nom) === normalizeText(categoryName))

      if (!existingCategory) {
        next.push({
          nom: categoryName,
          sousCategories: subCategoryName ? [subCategoryName] : [],
        })
        return
      }

      if (
        subCategoryName &&
        !existingCategory.sousCategories.some((item) => normalizeText(item) === normalizeText(subCategoryName))
      ) {
        existingCategory.sousCategories.push(subCategoryName)
      }
    })

    setCategoryConfigs(
      next.sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    )
    notifySuccess('Import des categories termine.')
  }

  const handleCreateCategory = (e: React.FormEvent) => {
    e.preventDefault()
    const nom = categoryForm.nom.trim()
    if (!nom) {
      setError('Le nom de la categorie est obligatoire.')
      return
    }

    if (categoryConfigs.some((item) => normalizeText(item.nom) === normalizeText(nom))) {
      setError('Cette categorie existe deja.')
      return
    }

    const next = [...categoryConfigs, { nom, sousCategories: [] }].sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
    setCategoryConfigs(next)
    setCategoryForm({ nom: '' })
    setShowCategoryForm(false)
    notifySuccess('Categorie ajoutee avec succes.')
  }

  const handleCreateSubCategory = (e: React.FormEvent) => {
    e.preventDefault()
    const categorie = subCategoryForm.categorie.trim()
    const nom = subCategoryForm.nom.trim()

    if (!categorie || !nom) {
      setError('La categorie et la sous-categorie sont obligatoires.')
      return
    }

    const next = categoryConfigs.map((item) => {
      if (item.nom !== categorie) return item
      if (item.sousCategories.some((sub) => normalizeText(sub) === normalizeText(nom))) {
        return item
      }
      return {
        ...item,
        sousCategories: [...item.sousCategories, nom].sort((a, b) => a.localeCompare(b, 'fr')),
      }
    })

    setCategoryConfigs(next)
    setSubCategoryForm({ categorie: '', nom: '' })
    setShowSubCategoryForm(false)
    notifySuccess('Sous-categorie ajoutee avec succes.')
  }

  const handleDeleteCategory = (categoryName: string) => {
    const next = categoryConfigs.filter((item) => item.nom !== categoryName)
    setCategoryConfigs(next)
    notifySuccess('Categorie supprimee avec succes.')
  }

  const handleDeleteSubCategory = (categoryName: string, subCategoryName: string) => {
    const next = categoryConfigs.map((item) => {
      if (item.nom !== categoryName) return item
      return {
        ...item,
        sousCategories: item.sousCategories.filter((sub) => sub !== subCategoryName),
      }
    })
    setCategoryConfigs(next)
    notifySuccess('Sous-categorie supprimee avec succes.')
  }

  const filteredCharges = useMemo(() => {
    return charges.filter((row: any) => {
      if (!row.date) return false
      const d = new Date(row.date)
      const monthMatch = d.getMonth() + 1 === selectedMonth
      const yearMatch = d.getFullYear() === selectedYear
      const exactDateMatch = selectedDate ? row.date === selectedDate : true
      return monthMatch && yearMatch && exactDateMatch
    })
  }, [charges, selectedMonth, selectedYear, selectedDate])

  const totalMontant = filteredCharges
    .filter((c: any) => c.statut === 'traitee')
    .reduce((sum: number, c: any) => sum + parseFloat(c.montant), 0)

  const totalTraitees = filteredCharges.filter((c: any) => c.statut === 'traitee').length
  const totalEnCours = filteredCharges.filter((c: any) => c.statut === 'en_cours').length
  const totalLignes = filteredCharges.length

  const topServiceMap = filteredCharges.reduce((acc: Record<string, number>, row: any) => {
    const serviceName = services.find((s: any) => s.id === row.service)?.nom || 'Sans service'
    acc[serviceName] = (acc[serviceName] || 0) + Number(row.montant || 0)
    return acc
  }, {})

  const topServiceName = Object.keys(topServiceMap).sort((a, b) => topServiceMap[b] - topServiceMap[a])[0] || '-'
  const topServiceValue = topServiceMap[topServiceName] || 0

  const chartByCategoryMap = filteredCharges.reduce((acc: Record<string, number>, row: any) => {
    const key = mapCategoryFromApi(row.categorie || 'autre', categoryConfigs)
    acc[key] = (acc[key] || 0) + Number(row.montant || 0)
    return acc
  }, {})

  const chartByCategory = Object.entries(chartByCategoryMap).map(([name, value]) => ({ name, value }))

  const chartByStatus = [
    { name: 'Traitees', value: totalTraitees },
    { name: 'En cours', value: totalEnCours },
  ]

  const chartByDayMap = filteredCharges.reduce((acc: Record<string, number>, row: any) => {
    acc[row.date] = (acc[row.date] || 0) + Number(row.montant || 0)
    return acc
  }, {})

  const chartByDay = Object.entries(chartByDayMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({
      name: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      montant: value,
    }))

  const dashboardCards = [
    {
      title: `Charges traitees - ${MOIS_LABELS[selectedMonth - 1]} ${selectedYear}`,
      value: `${fmt(totalMontant)} DH`,
      color: '#c93128',
      note: `${totalTraitees} ligne(s) traitee(s)`,
    },
    {
      title: 'Lignes total',
      value: `${totalLignes}`,
      color: '#1d2836',
      note: `${totalEnCours} en cours`,
    },
    {
      title: 'Montant moyen',
      value: `${fmt(totalLignes ? totalMontant / Math.max(totalTraitees || 1, 1) : 0)} DH`,
      color: '#2a5ea8',
      note: 'Par charge traitee',
    },
    {
      title: 'Service le plus charge',
      value: topServiceName,
      color: '#1f8a57',
      note: `${fmt(topServiceValue)} DH`,
    },
  ]

  const totalConfiguredSubCategories = categoryConfigs.reduce((sum, item) => sum + item.sousCategories.length, 0)

  return (
    <Layout>
      <div style={{ padding: '16px 18px 20px' }}>
        {selectedPhoto && (
          <div
            onClick={() => setSelectedPhoto(null)}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(10, 15, 22, 0.72)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
            }}
          >
            <img src={selectedPhoto} alt="Justificatif" style={{ maxWidth: '88vw', maxHeight: '84vh', borderRadius: '14px' }} />
          </div>
        )}

        {selectedCharge && (
          <div
            onClick={() => setSelectedCharge(null)}
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
          >
            <div
              style={{
                width: '620px',
                maxWidth: '94vw',
                background: '#fff',
                borderRadius: '14px',
                padding: '18px',
                border: '1px solid #d9e0e7',
                boxShadow: '0 28px 70px rgba(10, 16, 28, 0.22)',
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ fontSize: '16px', fontWeight: 800, color: '#1d2836', marginBottom: '14px' }}>
                Modifier charge variable
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Titre</label>
                  <input style={inputStyle} value={editForm.titre} onChange={(e) => setEditForm({ ...editForm, titre: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Service</label>
                  <select style={inputStyle} value={editForm.service} onChange={(e) => setEditForm({ ...editForm, service: e.target.value })}>
                    <option value="">Selectionner...</option>
                    {services.map((s: any) => (
                      <option key={s.id} value={s.id}>{s.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Categorie</label>
                  <select
                    style={inputStyle}
                    value={editForm.categorie}
                    onChange={(e) => setEditForm({ ...editForm, categorie: e.target.value, sous_categorie: '' })}
                  >
                    {categoryConfigs.map((cat) => (
                      <option key={cat.nom} value={cat.nom}>{cat.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Sous-categorie</label>
                  <select
                    style={inputStyle}
                    value={editForm.sous_categorie}
                    onChange={(e) => setEditForm({ ...editForm, sous_categorie: e.target.value })}
                  >
                    <option value="">Selectionner...</option>
                    {availableEditSubCategories.map((sub) => (
                      <option key={sub} value={sub}>{sub}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Montant</label>
                  <input style={inputStyle} type="number" value={editForm.montant} onChange={(e) => setEditForm({ ...editForm, montant: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date</label>
                  <input style={inputStyle} type="date" value={editForm.date} onChange={(e) => setEditForm({ ...editForm, date: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Personne / Description</label>
                  <input style={inputStyle} value={editForm.personne} onChange={(e) => setEditForm({ ...editForm, personne: e.target.value })} />
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Statut</label>
                  <select style={inputStyle} value={editForm.statut} onChange={(e) => setEditForm({ ...editForm, statut: e.target.value })}>
                    <option value="en_cours">En cours</option>
                    <option value="traitee">Traitee</option>
                  </select>
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Justificatif</label>
                  <input type="file" accept="image/*" onChange={(e) => setEditPhoto(e.target.files?.[0] || null)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={handleEditSave} style={compactButton(true)}>Sauvegarder</button>
                <button onClick={() => setSelectedCharge(null)} style={compactButton(false)}>Annuler</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ ...cardStyle, padding: '18px 20px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1d2836', marginBottom: '6px' }}>
                Charges variables
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Suivi des charges variables, justificatifs, categories et traitement.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              <select style={{ ...inputStyle, width: '150px' }} value={selectedMonth} onChange={(e) => setSelectedMonth(parseInt(e.target.value))}>
                {MOIS_LABELS.map((label, index) => (
                  <option key={label} value={index + 1}>{label}</option>
                ))}
              </select>
              <input style={{ ...inputStyle, width: '120px' }} type="number" value={selectedYear} onChange={(e) => setSelectedYear(parseInt(e.target.value || '0'))} />
            </div>
          </div>
        </div>

        {(success || error) && (
          <div style={{ marginBottom: '12px' }}>
            {success && (
              <div style={{ ...cardStyle, padding: '10px 12px', background: '#e9f7f0', borderColor: '#ccebdc', color: '#1f8a57', fontSize: '12px', fontWeight: 600 }}>
                {success}
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
          <button onClick={() => setActiveTab('dashboard')} style={compactButton(activeTab === 'dashboard')}>Dashboard</button>
          <button onClick={() => setActiveTab('table')} style={compactButton(activeTab === 'table')}>Charges variables</button>
          <button onClick={() => setActiveTab('categories')} style={compactButton(activeTab === 'categories')}>Gestion des categories</button>
        </div>

        {activeTab === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
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
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px' }}>Montant par jour</div>
                {chartByDay.length > 0 ? (
                  <ResponsiveContainer width="100%" height={230}>
                    <BarChart data={chartByDay}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} DH`} />
                      <Bar dataKey="montant" radius={[4, 4, 0, 0]}>
                        {chartByDay.map((_, i) => <Cell key={i} fill="#c93128" />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '92px', fontSize: '12px' }}>Aucune donnee</div>
                )}
              </div>

              <div style={{ ...cardStyle, padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>Repartition par categorie</div>
                {chartByCategory.length > 0 ? (
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie data={chartByCategory} dataKey="value" nameKey="name" outerRadius={78} innerRadius={34} paddingAngle={2}>
                        {chartByCategory.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} DH`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '92px', fontSize: '12px' }}>Aucune donnee</div>
                )}
              </div>

              <div style={{ ...cardStyle, padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>Statut des charges</div>
                {totalLignes > 0 ? (
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie data={chartByStatus} dataKey="value" nameKey="name" outerRadius={78} innerRadius={34} paddingAngle={2}>
                        <Cell fill="#1d2836" />
                        <Cell fill="#2a5ea8" />
                      </Pie>
                      <Tooltip formatter={(v: any) => `${v} ligne(s)`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '92px', fontSize: '12px' }}>Aucune donnee</div>
                )}
              </div>
            </div>

            <div style={{ ...cardStyle, padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px' }}>Synthese de la periode</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px' }}>
                <div style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d2836' }}>Charges traitees</div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#c93128', marginTop: '8px' }}>{fmt(totalMontant)} DH</div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '6px' }}>{totalTraitees} ligne(s)</div>
                </div>
                <div style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d2836' }}>En cours</div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#2a5ea8', marginTop: '8px' }}>{totalEnCours}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '6px' }}>A traiter</div>
                </div>
                <div style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d2836' }}>Total lignes</div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#1d2836', marginTop: '8px' }}>{totalLignes}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '6px' }}>Sur la periode</div>
                </div>
                <div style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d2836' }}>Top service</div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#1f8a57', marginTop: '8px' }}>{topServiceName}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '6px' }}>{fmt(topServiceValue)} DH</div>
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'categories' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '12px', marginBottom: '14px' }}>
              <div style={{ ...cardStyle, padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px' }}>Structure de classification</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '10px' }}>
                  <div style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Categories</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#1d2836', marginTop: '6px' }}>{categoryConfigs.length}</div>
                  </div>
                  <div style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Sous-categories</div>
                    <div style={{ fontSize: '18px', fontWeight: 800, color: '#2a5ea8', marginTop: '6px' }}>{totalConfiguredSubCategories}</div>
                  </div>
                  <div style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Derniere logique</div>
                    <div style={{ fontSize: '14px', fontWeight: 800, color: '#1f8a57', marginTop: '8px' }}>Locale</div>
                  </div>
                </div>
              </div>

              <div style={{ ...cardStyle, padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px' }}>Importer la structure</div>
                <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '10px' }}>
                  Colonnes attendues: `categorie`, `sous_categorie`
                </div>
                <ImportExcel
                  onImport={handleCategoryImport}
                  columns={[
                    { key: 'categorie', label: 'Categorie' },
                    { key: 'sous_categorie', label: 'Sous-categorie' },
                  ]}
                />
              </div>

              <div style={{ ...cardStyle, padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px' }}>Actions</div>
                <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                  <button onClick={() => setShowCategoryForm(!showCategoryForm)} style={compactButton(true)}>
                    + Ajouter categorie
                  </button>
                  <button onClick={() => setShowSubCategoryForm(!showSubCategoryForm)} style={compactButton(false)}>
                    + Ajouter sous-categorie
                  </button>
                </div>
              </div>
            </div>

            {showCategoryForm && (
              <div style={{ ...cardStyle, padding: '18px', marginBottom: '14px' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1d2836', marginBottom: '12px' }}>Nouvelle categorie</div>
                <form onSubmit={handleCreateCategory}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nom de la categorie</label>
                      <input
                        style={inputStyle}
                        value={categoryForm.nom}
                        onChange={(e) => setCategoryForm({ nom: e.target.value })}
                        placeholder="Ex : Achats chantier"
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button type="submit" style={compactButton(true)}>Creer</button>
                    <button type="button" onClick={() => setShowCategoryForm(false)} style={compactButton(false)}>Annuler</button>
                  </div>
                </form>
              </div>
            )}

            {showSubCategoryForm && (
              <div style={{ ...cardStyle, padding: '18px', marginBottom: '14px' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1d2836', marginBottom: '12px' }}>Nouvelle sous-categorie</div>
                <form onSubmit={handleCreateSubCategory}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Categorie parente</label>
                      <select
                        style={inputStyle}
                        value={subCategoryForm.categorie}
                        onChange={(e) => setSubCategoryForm({ ...subCategoryForm, categorie: e.target.value })}
                        required
                      >
                        <option value="">Selectionner...</option>
                        {categoryConfigs.map((cat) => (
                          <option key={cat.nom} value={cat.nom}>{cat.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nom de la sous-categorie</label>
                      <input
                        style={inputStyle}
                        value={subCategoryForm.nom}
                        onChange={(e) => setSubCategoryForm({ ...subCategoryForm, nom: e.target.value })}
                        placeholder="Ex : Fournitures electriques"
                        required
                      />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button type="submit" style={compactButton(true)}>Creer</button>
                    <button type="button" onClick={() => setShowSubCategoryForm(false)} style={compactButton(false)}>Annuler</button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ ...cardStyle, padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '12px' }}>
                Categories et sous-categories
              </div>

              {categoryConfigs.length === 0 ? (
                <div style={{ color: '#9ca3af', fontSize: '12px' }}>Aucune categorie configuree.</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  {categoryConfigs.map((category) => (
                    <div
                      key={category.nom}
                      style={{
                        border: '1px solid #e5eaf0',
                        borderRadius: '12px',
                        padding: '14px',
                        background: '#fbfcfd',
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#1d2836' }}>{category.nom}</div>
                          <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '4px' }}>
                            {category.sousCategories.length} sous-categorie(s)
                          </div>
                        </div>
                        <button
                          onClick={() => handleDeleteCategory(category.nom)}
                          style={{ ...compactButton(false), padding: '7px 12px', color: '#c93128', borderColor: '#f0c7c5' }}
                        >
                          Supprimer
                        </button>
                      </div>

                      {category.sousCategories.length > 0 ? (
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          {category.sousCategories.map((sub) => (
                            <div
                              key={`${category.nom}-${sub}`}
                              style={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px',
                                padding: '6px 10px',
                                borderRadius: '999px',
                                background: '#ffffff',
                                border: '1px solid #d9e0e7',
                                fontSize: '11px',
                                color: '#334155',
                              }}
                            >
                              <span>{sub}</span>
                              <button
                                onClick={() => handleDeleteSubCategory(category.nom, sub)}
                                style={{
                                  border: 'none',
                                  background: 'transparent',
                                  color: '#c93128',
                                  cursor: 'pointer',
                                  fontSize: '11px',
                                  fontWeight: 700,
                                  padding: 0,
                                }}
                              >
                                X
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div style={{ fontSize: '11px', color: '#9ca3af' }}>Aucune sous-categorie rattachee.</div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}

        {activeTab === 'table' && (
          <>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '14px' }}>
              <input style={{ ...inputStyle, width: '160px' }} type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
              <button onClick={() => setSelectedDate('')} style={compactButton(false)}>Reset date</button>
              <ImportExcel
                onImport={handleImport}
                columns={[
                  { key: 'titre', label: 'Titre' },
                  { key: 'service', label: 'Service' },
                  { key: 'categorie', label: 'Categorie' },
                  { key: 'sous_categorie', label: 'Sous-categorie' },
                  { key: 'montant', label: 'Montant' },
                  { key: 'date', label: 'Date' },
                  { key: 'description', label: 'Personne' },
                  { key: 'statut', label: 'Statut' },
                ]}
              />
              <button
                onClick={() => {
                  setShowForm(!showForm)
                  if (!showForm) resetCreateForm()
                }}
                style={{ ...compactButton(true), background: '#c93128', borderColor: '#c93128' }}
              >
                + Nouvelle charge
              </button>
            </div>

            <div style={{ ...cardStyle, padding: '12px 16px', borderTop: '3px solid #c93128', marginBottom: '14px', display: 'inline-block', minWidth: '220px' }}>
              <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '4px' }}>Total traite sur la periode</div>
              <div style={{ fontSize: '18px', fontWeight: 800, color: '#c93128' }}>{fmt(totalMontant)} DH</div>
            </div>

            {showForm && (
              <div style={{ ...cardStyle, padding: '18px', marginBottom: '14px' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1d2836', marginBottom: '12px' }}>Nouvelle charge variable</div>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Titre</label>
                      <input style={inputStyle} value={form.titre} onChange={(e) => setForm({ ...form, titre: e.target.value })} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Service</label>
                      <select style={inputStyle} value={form.service} onChange={(e) => setForm({ ...form, service: e.target.value })} required>
                        <option value="">Selectionner...</option>
                        {services.map((s: any) => (
                          <option key={s.id} value={s.id}>{s.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Categorie</label>
                      <select
                        style={inputStyle}
                        value={form.categorie}
                        onChange={(e) => setForm({ ...form, categorie: e.target.value, sous_categorie: '' })}
                      >
                        {categoryConfigs.map((cat) => (
                          <option key={cat.nom} value={cat.nom}>{cat.nom}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Sous-categorie</label>
                      <select
                        style={inputStyle}
                        value={form.sous_categorie}
                        onChange={(e) => setForm({ ...form, sous_categorie: e.target.value })}
                      >
                        <option value="">Selectionner...</option>
                        {availableSubCategories.map((sub) => (
                          <option key={sub} value={sub}>{sub}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Montant</label>
                      <input style={inputStyle} type="number" value={form.montant} onChange={(e) => setForm({ ...form, montant: e.target.value })} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date</label>
                      <input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Personne / Description</label>
                      <input style={inputStyle} value={form.personne} onChange={(e) => setForm({ ...form, personne: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Statut</label>
                      <select style={inputStyle} value={form.statut} onChange={(e) => setForm({ ...form, statut: e.target.value })}>
                        <option value="en_cours">En cours</option>
                        <option value="traitee">Traitee</option>
                      </select>
                    </div>
                    <div style={{ gridColumn: '1 / -1' }}>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Justificatif</label>
                      <input type="file" accept="image/*" onChange={(e) => setPhoto(e.target.files?.[0] || null)} />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                    <button type="submit" style={compactButton(true)}>Creer</button>
                    <button type="button" onClick={() => setShowForm(false)} style={compactButton(false)}>Annuler</button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div style={{ ...cardStyle, padding: '36px', textAlign: 'center', color: '#6b7280' }}>Chargement...</div>
            ) : (
              <SortableTable
                emptyMessage="Aucune charge variable"
                columns={[
                  { key: 'titre', label: 'Titre', render: (_: any, row: any) => <span style={{ fontWeight: 600 }}>{row.titre}</span> },
                  { key: 'service_nom', label: 'Service', render: (_: any, row: any) => <span>{services.find((s: any) => s.id === row.service)?.nom || row.service}</span> },
                  { key: 'categorie', label: 'Categorie', render: (_: any, row: any) => <span>{mapCategoryFromApi(row.categorie, categoryConfigs)}</span> },
                  { key: 'sous_categorie', label: 'Sous-categorie', render: (_: any, row: any) => <span>{row.sous_categorie || '-'}</span> },
                  { key: 'montant', label: 'Montant', render: (_: any, row: any) => <span style={{ fontWeight: 700, color: '#c93128' }}>{fmt(row.montant)} DH</span> },
                  { key: 'date', label: 'Date', render: (_: any, row: any) => <span>{new Date(row.date).toLocaleDateString('fr-FR')}</span> },
                  { key: 'description', label: 'Personne', render: (_: any, row: any) => <span>{row.description || '-'}</span> },
                  {
                    key: 'photo',
                    label: 'Justificatif',
                    sortable: false,
                    render: (_: any, row: any) =>
                      row.photo ? (
                        <div onClick={() => setSelectedPhoto(row.photo)} style={{ cursor: 'pointer', display: 'inline-block' }}>
                          <img src={row.photo} alt="justificatif" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #d9e0e7' }} />
                          <div style={{ fontSize: '10px', color: '#2a5ea8', marginTop: '3px', textAlign: 'center', fontWeight: 600 }}>Voir</div>
                        </div>
                      ) : (
                        <span style={{ fontSize: '10.5px', color: '#9ca3af' }}>Aucun</span>
                      ),
                  },
                  {
                    key: 'statut',
                    label: 'Statut',
                    render: (_: any, row: any) => (
                      <select
                        value={row.statut}
                        onChange={(e) => handleStatutChange(row.id, e.target.value)}
                        style={{
                          padding: '5px 8px',
                          borderRadius: '9px',
                          fontSize: '10.5px',
                          border: '1px solid #d9e0e7',
                          cursor: 'pointer',
                          background: row.statut === 'traitee' ? '#e9f7f0' : '#fff4df',
                          color: row.statut === 'traitee' ? '#1f8a57' : '#b76b00',
                          fontWeight: 600,
                        }}
                      >
                        <option value="en_cours">En cours</option>
                        <option value="traitee">Traitee</option>
                      </select>
                    ),
                  },
                  {
                    key: 'edit',
                    label: 'Modifier',
                    sortable: false,
                    render: (_: any, row: any) => (
                      <button
                        onClick={() => openEditModal(row)}
                        style={{ ...compactButton(false), padding: '7px 12px', color: '#2a5ea8', borderColor: '#cddcf5' }}
                      >
                        Modifier
                      </button>
                    ),
                  },
                  {
                    key: 'delete',
                    label: 'Supprimer',
                    sortable: false,
                    render: (_: any, row: any) => (
                      <button
                        onClick={() => handleDelete(row.id)}
                        style={{ ...compactButton(false), padding: '7px 12px', color: '#c93128', borderColor: '#f0c7c5' }}
                      >
                        Supprimer
                      </button>
                    ),
                  },
                ]}
                data={filteredCharges}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default ChargesVariables
