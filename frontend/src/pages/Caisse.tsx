import { useEffect, useMemo, useRef, useState } from 'react'
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

const PROTECTED_CAISSES = ['DRISS', 'MUSTAPHA', 'NABIL']

const MOIS_LABELS = [
  'Janvier', 'Fevrier', 'Mars', 'Avril', 'Mai', 'Juin',
  'Juillet', 'Aout', 'Septembre', 'Octobre', 'Novembre', 'Decembre'
]

const COLORS = ['#c93128', '#1d2836', '#2a5ea8', '#1f8a57', '#8e44ad', '#d08b19', '#16a085']

const VARIABLE_CATEGORY_STORAGE_KEY = 'newiris_charges_variables_categories_v2'

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

const fmt = (n: any) => Number(n || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })

const MOVEMENT_OPTIONS = [
  { value: 'entree', label: 'Approvisionnement' },
  { value: 'sortie', label: 'Decaissement' },
]

const TYPE_CHARGE_OPTIONS = [
  { value: 'charge_variable', label: 'Charge variable' },
  { value: 'charge_fixe', label: 'Charge fixe' },
]

type VariableCategoryConfig = {
  nom: string
  sousCategories: string[]
}

const defaultVariableCategories: VariableCategoryConfig[] = [
  { nom: 'Vehicule', sousCategories: ['Carburant', 'Maintenance voiture', 'Lavage', 'Vidange'] },
  { nom: 'Transport', sousCategories: ['Transport', 'Deplacement'] },
  { nom: 'Administratif', sousCategories: ['Frais bancaires', 'Douane'] },
  { nom: 'Equipe', sousCategories: ['Restauration', 'Soin medical', 'Activites sportives'] },
  { nom: 'Entretien', sousCategories: ['Menage', 'Materiel consommable'] },
  { nom: 'Autre', sousCategories: [] },
]

const loadVariableCategories = (): VariableCategoryConfig[] => {
  try {
    const raw = localStorage.getItem(VARIABLE_CATEGORY_STORAGE_KEY)
    if (!raw) return defaultVariableCategories
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return defaultVariableCategories
    return parsed
      .filter((item: any) => item && typeof item.nom === 'string')
      .map((item: any) => ({
        nom: String(item.nom).trim(),
        sousCategories: Array.isArray(item.sousCategories)
          ? item.sousCategories.map((v: any) => String(v).trim()).filter(Boolean)
          : [],
      }))
      .filter((item: VariableCategoryConfig) => item.nom)
  } catch {
    return defaultVariableCategories
  }
}

const Caisse = () => {
  document.title = 'Caisse - NEWIRIS'

  const now = new Date()

  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())
  const [activeTab, setActiveTab] = useState<'dashboard' | 'principale' | number>('dashboard')

  const [soldeCaisse, setSoldeCaisse] = useState<any>(null)
  const [caisses, setCaisses] = useState<any[]>([])
  const [actionsPrincipale, setActionsPrincipale] = useState<any[]>([])
  const [actionsPerso, setActionsPerso] = useState<{ [key: number]: any[] }>({})
  const [services, setServices] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [fixedCategories, setFixedCategories] = useState<any[]>([])
  const [variableCategories, setVariableCategories] = useState<VariableCategoryConfig[]>([])
  const [loading, setLoading] = useState(true)

  const [showAddCaisse, setShowAddCaisse] = useState(false)
  const [showAddAction, setShowAddAction] = useState(false)
  const [editSolde, setEditSolde] = useState(false)
  const [soldeInput, setSoldeInput] = useState('')
  const [editSoldePerso, setEditSoldePerso] = useState<number | null>(null)
  const [soldePersoInput, setSoldePersoInput] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null)
  const [selectedRow, setSelectedRow] = useState<any | null>(null)

  const [newCaisse, setNewCaisse] = useState({ nom: '', solde_initial: '' })
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [newAction, setNewAction] = useState({
    type: 'entree',
    titre: '',
    service: '',
    type_charge: 'charge_variable',
    categorie: '',
    sous_categorie: '',
    montant: '',
    date: new Date().toISOString().split('T')[0],
    personne: '',
    photo: null as File | null,
  })

  const [editAction, setEditAction] = useState({
    type: 'entree',
    titre: '',
    service: '',
    type_charge: 'charge_variable',
    categorie: '',
    sous_categorie: '',
    montant: '',
    date: '',
    personne: '',
    statut: 'traitee',
    photo: null as File | null,
  })

  const [showAddPerson, setShowAddPerson] = useState(false)
  const [newPerson, setNewPerson] = useState('')
  const [editPhoto, setEditPhoto] = useState<File | null>(null)

  const fileRef = useRef<HTMLInputElement>(null)
  const editFileRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    const variableData = loadVariableCategories()
    setVariableCategories(variableData)
  }, [])

  useEffect(() => {
    fetchAll()
  }, [])

  const variableCategoryOptions = variableCategories.map((item) => item.nom)

  const variableSubCategoryOptions = useMemo(() => {
    const category = variableCategories.find((item) => item.nom === newAction.categorie)
    return category?.sousCategories || []
  }, [variableCategories, newAction.categorie])

  const editVariableSubCategoryOptions = useMemo(() => {
    const category = variableCategories.find((item) => item.nom === editAction.categorie)
    return category?.sousCategories || []
  }, [variableCategories, editAction.categorie])

  const caisseFixedCategoryOptions = useMemo(() => {
    return fixedCategories
      .filter((item: any) => item.type_traitement === 'traitee_par_caisse')
      .map((item: any) => item.nom)
  }, [fixedCategories])

  const availableCategoriesForCreate =
    newAction.type_charge === 'charge_fixe'
      ? caisseFixedCategoryOptions
      : variableCategoryOptions

  const availableCategoriesForEdit =
    editAction.type_charge === 'charge_fixe'
      ? caisseFixedCategoryOptions
      : variableCategoryOptions

  const resetNewAction = () => {
    setNewAction({
      type: 'entree',
      titre: '',
      service: '',
      type_charge: 'charge_variable',
      categorie: variableCategoryOptions[0] || '',
      sous_categorie: '',
      montant: '',
      date: new Date().toISOString().split('T')[0],
      personne: '',
      photo: null,
    })
  }

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [soldeRes, caissesRes, servicesRes, usersRes, actionsPRes, fixedCategoriesRes] = await Promise.all([
        api.get('/caisse/solde/'),
        api.get('/caisse/caisses/'),
        api.get('/services/'),
        api.get('/auth/users/'),
        api.get('/caisse/actions/?principale=true'),
        api.get('/charges-fixes/categories/'),
      ])

      setSoldeCaisse(soldeRes.data)
      setSoldeInput(soldeRes.data.montant_initial)
      setCaisses(caissesRes.data)
      setServices(servicesRes.data)
      setUsers(usersRes.data)
      setActionsPrincipale(actionsPRes.data)
      setFixedCategories(Array.isArray(fixedCategoriesRes.data) ? fixedCategoriesRes.data : [])

      const persoData: { [key: number]: any[] } = {}
      for (const c of caissesRes.data) {
        const res = await api.get(`/caisse/actions/?caisse=${c.id}`)
        persoData[c.id] = res.data
      }
      setActionsPerso(persoData)
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  const saveSolde = async () => {
    await api.put('/caisse/solde/', { montant: soldeInput })
    setEditSolde(false)
    fetchAll()
  }

  const saveSoldePerso = async (id: number) => {
    await api.patch(`/caisse/caisses/${id}/`, { solde_initial: soldePersoInput })
    setEditSoldePerso(null)
    fetchAll()
  }

  const addCaisse = async () => {
    if (!newCaisse.nom) return
    await api.post('/caisse/caisses/', {
      nom: newCaisse.nom,
      solde_initial: newCaisse.solde_initial || 0,
    })
    setNewCaisse({ nom: '', solde_initial: '' })
    setShowAddCaisse(false)
    fetchAll()
  }

  const deleteCaisse = async (id: number) => {
    await api.delete(`/caisse/caisses/${id}/`)
    if (activeTab === id) setActiveTab('dashboard')
    fetchAll()
  }

  const addAction = async () => {
    if (!newAction.titre || !newAction.montant || !newAction.categorie) {
      setError('La nature du mouvement, le titre, la categorie et le montant sont obligatoires.')
      return
    }

    setError('')

    try {
      const fd = new FormData()
      fd.append('type', newAction.type)
      fd.append('titre', newAction.titre)
      fd.append('service', newAction.service || '')
      fd.append('type_charge', newAction.type_charge)
      fd.append('categorie', newAction.categorie)
      fd.append('sous_categorie', newAction.type_charge === 'charge_variable' ? newAction.sous_categorie : '')
      fd.append('montant', newAction.montant)
      fd.append('date', newAction.date)
      fd.append('personne', newAction.personne)
      fd.append('description', '')
      fd.append('statut', 'traitee')

      if (newAction.photo) fd.append('photo', newAction.photo)

      if (activeTab === 'principale' || activeTab === 'dashboard') {
        fd.append('is_caisse_principale', 'true')
      } else {
        fd.append('caisse', String(activeTab))
        const caisse = caisses.find(c => c.id === activeTab)
        if (caisse) fd.append('personne', caisse.nom)
      }

      await api.post('/caisse/actions/', fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSuccess(true)
      setTimeout(() => setSuccess(false), 2500)
      resetNewAction()
      if (fileRef.current) fileRef.current.value = ''
      setShowAddAction(false)
      fetchAll()
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors de l ajout.')
    }
  }

  const openEditModal = (row: any) => {
    setSelectedRow(row)
    setEditPhoto(null)
    setEditAction({
      type: row.type || 'entree',
      titre: row.titre || '',
      service: row.service ? String(row.service) : '',
      type_charge: row.type_charge || 'charge_variable',
      categorie: row.categorie || '',
      sous_categorie: row.sous_categorie || '',
      montant: String(row.montant || ''),
      date: row.date || '',
      personne: row.personne === '-' ? '' : (row.personne || ''),
      statut: row.statut || 'traitee',
      photo: null,
    })
    if (editFileRef.current) editFileRef.current.value = ''
  }

  const saveEditAction = async () => {
    if (!selectedRow) return

    try {
      const fd = new FormData()
      fd.append('type', editAction.type)
      fd.append('titre', editAction.titre)
      fd.append('service', editAction.service || '')
      fd.append('type_charge', editAction.type_charge)
      fd.append('categorie', editAction.categorie)
      fd.append('sous_categorie', editAction.type_charge === 'charge_variable' ? editAction.sous_categorie : '')
      fd.append('montant', editAction.montant)
      fd.append('date', editAction.date)
      fd.append('personne', editAction.personne)
      fd.append('description', '')
      fd.append('statut', editAction.statut)
      if (editPhoto) fd.append('photo', editPhoto)

      await api.patch(`/caisse/actions/${selectedRow.id}/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      setSelectedRow(null)
      fetchAll()
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors de la modification.')
    }
  }

  const handleImport = async (rows: any[]) => {
    const today = new Date().toISOString().split('T')[0]
    let successCount = 0
    let failCount = 0

    for (const row of rows) {
      try {
        const fd = new FormData()

        const rawType = String(row.type || row.nature || row.nature_mouvement || '').trim().toLowerCase()
        const rawTypeCharge = String(row.type_charge || '').trim().toLowerCase()
        const rawService = String(row.service || row.service_nom || '').trim()
        const rawCategorie = String(row.categorie || '').trim()
        const rawSousCategorie = String(row.sous_categorie || '').trim()

        const matchedService = services.find(
          s => String(s.nom || '').trim().toLowerCase() === rawService.toLowerCase()
        )

        const movement =
          rawType === 'entree' ||
          rawType === 'approvisionnement'
            ? 'entree'
            : 'sortie'

        const chargeType =
          rawTypeCharge === 'charge_fixe' || rawTypeCharge === 'charge fixe'
            ? 'charge_fixe'
            : 'charge_variable'

        fd.append('type', movement)
        fd.append('titre', String(row.titre || 'Sans titre').trim())
        fd.append('type_charge', chargeType)
        fd.append('categorie', rawCategorie || '')
        fd.append('sous_categorie', chargeType === 'charge_variable' ? rawSousCategorie : '')
        fd.append('montant', String(parseFloat(String(row.montant || '0').replace(',', '.').replace(/[^0-9.-]/g, '')) || 0))
        fd.append('date', row.date || today)
        fd.append('personne', String(row.personne || '').trim())
        fd.append('description', '')
        fd.append('statut', 'traitee')

        if (matchedService?.id) fd.append('service', String(matchedService.id))

        if (activeTab === 'principale' || activeTab === 'dashboard') {
          fd.append('is_caisse_principale', 'true')
        } else {
          fd.append('caisse', String(activeTab))
          const caisse = caisses.find(c => c.id === activeTab)
          fd.append('personne', caisse?.nom || String(row.personne || '').trim())
        }

        await api.post('/caisse/actions/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' }
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

    await fetchAll()
  }

  const handleAddPerson = () => {
    if (newPerson.trim()) {
      setUsers([...users, { id: `new_${newPerson.trim()}`, username: newPerson.trim() }])
      setNewAction(p => ({ ...p, personne: newPerson.trim() }))
      setNewPerson('')
      setShowAddPerson(false)
    }
  }

  const updateStatut = async (actionId: number, statut: string) => {
    try {
      await api.patch(`/caisse/actions/${actionId}/`, { statut })
      await fetchAll()
    } catch (err) {
      console.error(err)
      setError('Impossible de modifier le statut.')
    }
  }

  const deleteAction = async (actionId: number, caisseId?: number) => {
    try {
      await api.delete(`/caisse/actions/${actionId}/`)
      if (typeof caisseId === 'number') {
        const res = await api.get(`/caisse/actions/?caisse=${caisseId}`)
        setActionsPerso(prev => ({ ...prev, [caisseId]: res.data }))
      } else {
        await fetchAll()
      }
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors de la suppression.')
    }
  }

  const currentCaisse = typeof activeTab === 'number' ? caisses.find(c => c.id === activeTab) : null

  const soldePersoCalc = (caisse: any) => {
    const actions = actionsPerso[caisse.id] || []
    let total = Number(caisse.solde_initial || 0)
    for (const a of actions.filter((x: any) => x.statut === 'traitee')) {
      total += a.type === 'entree' ? Number(a.montant) : -Number(a.montant)
    }
    return total
  }

  const isInSelectedPeriod = (dateValue: string) => {
    if (!dateValue) return false
    const d = new Date(dateValue)
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear
  }

  const filteredPrincipale = actionsPrincipale.filter((a: any) => isInSelectedPeriod(a.date))
  const filteredPersoMap: { [key: number]: any[] } = {}
  caisses.forEach(c => {
    filteredPersoMap[c.id] = (actionsPerso[c.id] || []).filter((a: any) => isInSelectedPeriod(a.date))
  })

  const filteredCurrentActions =
    activeTab === 'principale'
      ? filteredPrincipale
      : typeof activeTab === 'number'
      ? (filteredPersoMap[activeTab] || [])
      : []

  const allFilteredActions = [...filteredPrincipale, ...Object.values(filteredPersoMap).flat()]

  const getProcessedStats = (actions: any[]) => {
    const processed = actions.filter((a: any) => a.statut === 'traitee')
    const entrees = processed
      .filter((a: any) => a.type === 'entree')
      .reduce((sum: number, a: any) => sum + Number(a.montant || 0), 0)
    const sorties = processed
      .filter((a: any) => a.type === 'sortie')
      .reduce((sum: number, a: any) => sum + Number(a.montant || 0), 0)

    return {
      entrees,
      sorties,
      ecart: entrees - sorties,
    }
  }

  const totalEntreesPeriod = allFilteredActions
    .filter((a: any) => a.type === 'entree' && a.statut === 'traitee')
    .reduce((sum: number, a: any) => sum + Number(a.montant || 0), 0)

  const totalSortiesPeriod = allFilteredActions
    .filter((a: any) => a.type === 'sortie' && a.statut === 'traitee')
    .reduce((sum: number, a: any) => sum + Number(a.montant || 0), 0)

  const totalTraiteesPeriod = allFilteredActions.filter((a: any) => a.statut === 'traitee').length
  const totalEnCoursPeriod = allFilteredActions.filter((a: any) => a.statut === 'en_cours').length
  const totalLignesPeriod = allFilteredActions.length

  const caisseCards = caisses.map((c: any) => {
    const actions = filteredPersoMap[c.id] || []
    const stats = getProcessedStats(actions)
    return {
      ...c,
      actionsCount: actions.length,
      solde: soldePersoCalc(c),
      ...stats,
    }
  })

  const principaleStats = getProcessedStats(filteredPrincipale)

  const topServices = allFilteredActions.reduce((acc: any, action: any) => {
    const key = action.service_nom || 'Sans service'
    acc[key] = (acc[key] || 0) + Number(action.montant || 0)
    return acc
  }, {})

  const topServiceName = Object.keys(topServices).sort((a, b) => topServices[b] - topServices[a])[0] || '-'
  const topServiceValue = topServices[topServiceName] || 0

  const chartByCaisse = [
    {
      name: 'Principale',
      entrees: principaleStats.entrees,
      sorties: principaleStats.sorties,
    },
    ...caisses.map(c => ({
      name: c.nom,
      entrees: getProcessedStats(filteredPersoMap[c.id] || []).entrees,
      sorties: getProcessedStats(filteredPersoMap[c.id] || []).sorties,
    }))
  ]

  const chartByCategoryMap = allFilteredActions.reduce((acc: any, action: any) => {
    const key = action.categorie || 'Autre'
    acc[key] = (acc[key] || 0) + Number(action.montant || 0)
    return acc
  }, {})

  const chartByCategory = Object.entries(chartByCategoryMap).map(([name, value]) => ({ name, value }))

  const chartByStatus = [
    { name: 'Traitees', value: totalTraiteesPeriod },
    { name: 'En cours', value: totalEnCoursPeriod },
  ]

  const dashboardCards = [
    { title: 'Solde caisse principale', value: `${fmt(soldeCaisse?.solde_calcule)} DH`, color: '#1d2836', note: 'Valeur actuelle' },
    { title: `Approvisionnements - ${MOIS_LABELS[selectedMonth - 1]} ${selectedYear}`, value: `+${fmt(totalEntreesPeriod)} DH`, color: '#1f8a57', note: `${allFilteredActions.filter((a: any) => a.type === 'entree').length} operation(s)` },
    { title: `Decaissements - ${MOIS_LABELS[selectedMonth - 1]} ${selectedYear}`, value: `-${fmt(totalSortiesPeriod)} DH`, color: '#c93128', note: `${allFilteredActions.filter((a: any) => a.type === 'sortie').length} operation(s)` },
    { title: 'Operations traitees', value: `${totalTraiteesPeriod}`, color: '#2a5ea8', note: `${totalEnCoursPeriod} en cours` },
    { title: 'Service le plus actif', value: topServiceName, color: '#c93128', note: `${fmt(topServiceValue)} DH` },
  ]

  const tableData = filteredCurrentActions.map((a: any) => ({
    ...a,
    movement_label: a.type === 'entree' ? 'Approvisionnement' : 'Decaissement',
    type_charge_label: a.type_charge === 'charge_fixe' ? 'Charge fixe' : 'Charge variable',
    montant_fmt: `${a.type === 'entree' ? '+' : '-'}${fmt(a.montant)} DH`,
    statut_label: a.statut === 'traitee' ? 'Traitee' : 'En cours',
    service_nom: a.service_nom || '-',
    personne: a.personne || '-',
    sous_categorie: a.sous_categorie || '-',
  }))

  const detailCard = activeTab === 'principale'
    ? {
        title: 'Solde de la caisse principale',
        balance: soldeCaisse?.solde_calcule,
        stats: principaleStats,
        note: 'Caisse centrale',
      }
    : currentCaisse
    ? {
        title: `Solde de ${currentCaisse.nom}`,
        balance: soldePersoCalc(currentCaisse),
        stats: getProcessedStats(filteredPersoMap[currentCaisse.id] || []),
        note: 'Caisse individuelle',
      }
    : null

  return (
    <Layout>
      <div style={{ padding: '16px 18px 20px', fontSize: '14px' }}>
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
              cursor: 'pointer'
            }}
          >
            <div style={{ position: 'relative' }}>
              <img src={selectedPhoto} alt="Justificatif" style={{ maxWidth: '88vw', maxHeight: '84vh', borderRadius: '14px' }} />
              <button
                onClick={() => setSelectedPhoto(null)}
                style={{
                  position: 'absolute',
                  top: '-10px',
                  right: '-10px',
                  width: '28px',
                  height: '28px',
                  borderRadius: '50%',
                  background: '#c93128',
                  color: '#fff',
                  border: 'none',
                  fontSize: '13px',
                  cursor: 'pointer',
                  fontWeight: '700'
                }}
              >
                X
              </button>
            </div>
          </div>
        )}

        {selectedRow && (
          <div
            onClick={() => setSelectedRow(null)}
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
                width: '680px',
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
                Modifier l operation de caisse
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nature du mouvement</label>
                  <select style={inputStyle} value={editAction.type} onChange={e => setEditAction(p => ({ ...p, type: e.target.value }))}>
                    {MOVEMENT_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Titre</label>
                  <input style={inputStyle} value={editAction.titre} onChange={e => setEditAction(p => ({ ...p, titre: e.target.value }))} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Service</label>
                  <select style={inputStyle} value={editAction.service} onChange={e => setEditAction(p => ({ ...p, service: e.target.value }))}>
                    <option value="">- Aucun -</option>
                    {services.map((s: any) => <option key={s.id} value={s.id}>{s.nom}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Type de charge</label>
                  <select
                    style={inputStyle}
                    value={editAction.type_charge}
                    onChange={e => setEditAction(p => ({
                      ...p,
                      type_charge: e.target.value,
                      categorie: '',
                      sous_categorie: '',
                    }))}
                  >
                    {TYPE_CHARGE_OPTIONS.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Categorie</label>
                  <select style={inputStyle} value={editAction.categorie} onChange={e => setEditAction(p => ({ ...p, categorie: e.target.value, sous_categorie: '' }))}>
                    <option value="">Selectionner...</option>
                    {availableCategoriesForEdit.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Sous-categorie</label>
                  <select
                    style={{
                      ...inputStyle,
                      background: editAction.type_charge === 'charge_fixe' ? '#f3f4f6' : '#fff',
                      color: editAction.type_charge === 'charge_fixe' ? '#9ca3af' : '#1f2937',
                    }}
                    value={editAction.sous_categorie}
                    onChange={e => setEditAction(p => ({ ...p, sous_categorie: e.target.value }))}
                    disabled={editAction.type_charge === 'charge_fixe'}
                  >
                    <option value="">{editAction.type_charge === 'charge_fixe' ? 'Non applicable' : 'Selectionner...'}</option>
                    {editVariableSubCategoryOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Montant (DH)</label>
                  <input style={inputStyle} type="number" value={editAction.montant} onChange={e => setEditAction(p => ({ ...p, montant: e.target.value }))} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date</label>
                  <input style={inputStyle} type="date" value={editAction.date} onChange={e => setEditAction(p => ({ ...p, date: e.target.value }))} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Personne</label>
                  <input style={inputStyle} value={editAction.personne} onChange={e => setEditAction(p => ({ ...p, personne: e.target.value }))} />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Statut</label>
                  <select style={inputStyle} value={editAction.statut} onChange={e => setEditAction(p => ({ ...p, statut: e.target.value }))}>
                    <option value="en_cours">En cours</option>
                    <option value="traitee">Traitee</option>
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Justificatif</label>
                  <input type="file" accept="image/*" ref={editFileRef} onChange={e => setEditPhoto(e.target.files?.[0] || null)} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={saveEditAction} style={compactButton(true)}>Sauvegarder</button>
                <button onClick={() => setSelectedRow(null)} style={compactButton(false)}>Annuler</button>
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <div style={{ ...cardStyle, padding: '18px 20px 16px', background: 'linear-gradient(135deg, #ffffff 0%, #fbfcfd 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1d2836', marginBottom: '6px' }}>
                  Gestion de caisse
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '720px' }}>
                  Pilotage operationnel des soldes, des mouvements de caisse et des justificatifs.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <select value={selectedYear} onChange={e => setSelectedYear(parseInt(e.target.value))} style={{ ...inputStyle, width: '104px' }}>
                  {[2025, 2026, 2027, 2028].map(y => <option key={y} value={y}>{y}</option>)}
                </select>

                <select value={selectedMonth} onChange={e => setSelectedMonth(parseInt(e.target.value))} style={{ ...inputStyle, width: '130px' }}>
                  {MOIS_LABELS.map((label, index) => (
                    <option key={label} value={index + 1}>{label}</option>
                  ))}
                </select>

                {(activeTab === 'principale' || typeof activeTab === 'number') && (
                  <>
                    <ImportExcel
                      onImport={handleImport}
                      columns={[
                        { key: 'type', label: 'Nature du mouvement' },
                        { key: 'titre', label: 'Titre' },
                        { key: 'service', label: 'Service' },
                        { key: 'type_charge', label: 'Type de charge' },
                        { key: 'categorie', label: 'Categorie' },
                        { key: 'sous_categorie', label: 'Sous-categorie' },
                        { key: 'montant', label: 'Montant' },
                        { key: 'date', label: 'Date' },
                        { key: 'personne', label: 'Personne' },
                      ]}
                    />
                    <button onClick={() => { setShowAddAction(!showAddAction); if (!showAddAction) resetNewAction() }} style={{ ...compactButton(true), background: '#c93128', borderColor: '#c93128' }}>
                      + Nouvelle operation
                    </button>
                  </>
                )}
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
          <button onClick={() => setActiveTab('dashboard')} style={compactButton(activeTab === 'dashboard')}>
            Tableau de bord
          </button>
          <button onClick={() => setActiveTab('principale')} style={compactButton(activeTab === 'principale')}>
            Caisse principale
          </button>
          {caisses.map((c: any) => (
            <button key={c.id} onClick={() => setActiveTab(c.id)} style={compactButton(activeTab === c.id)}>
              {c.nom}
            </button>
          ))}
          <button onClick={() => setShowAddCaisse(!showAddCaisse)} style={compactButton(false)}>
            + Nouvelle caisse
          </button>
        </div>

        {showAddCaisse && (
          <div style={{ ...cardStyle, padding: '16px', marginBottom: '14px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 160px auto', gap: '10px', alignItems: 'end' }}>
              <div>
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nom</label>
                <input style={inputStyle} value={newCaisse.nom} onChange={e => setNewCaisse(p => ({ ...p, nom: e.target.value }))} />
              </div>
              <div>
                <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Solde initial</label>
                <input style={inputStyle} type="number" value={newCaisse.solde_initial} onChange={e => setNewCaisse(p => ({ ...p, solde_initial: e.target.value }))} />
              </div>
              <button onClick={addCaisse} style={compactButton(true)}>Creer</button>
            </div>
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
              {dashboardCards.map(card => (
                <div key={card.title} style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: `3px solid ${card.color}` }}>
                  <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>{card.title}</div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: card.color, lineHeight: 1.18 }}>{card.value}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>{card.note}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
              <div style={{ ...cardStyle, padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px' }}>Flux par caisse</div>
                <ResponsiveContainer width="100%" height={230}>
                  <BarChart data={chartByCaisse}>
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
                <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>Statut des operations</div>
                {totalLignesPeriod > 0 ? (
                  <ResponsiveContainer width="100%" height={230}>
                    <PieChart>
                      <Pie data={chartByStatus} dataKey="value" nameKey="name" outerRadius={78} innerRadius={34} paddingAngle={2}>
                        <Cell fill="#1d2836" />
                        <Cell fill="#2a5ea8" />
                      </Pie>
                      <Tooltip formatter={(v: any) => `${v} operation(s)`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '92px', fontSize: '12px' }}>Aucune donnee</div>
                )}
              </div>
            </div>

            <div style={{ ...cardStyle, padding: '14px' }}>
              <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px' }}>Synthese des caisses</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '10px' }}>
                <div onClick={() => setActiveTab('principale')} style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px', cursor: 'pointer' }}>
                  <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d2836', marginBottom: '8px' }}>Caisse principale</div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#1d2836' }}>{fmt(soldeCaisse?.solde_calcule)} DH</div>
                  <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '6px' }}>{filteredPrincipale.length} operation(s)</div>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '10px', fontSize: '10px' }}>
                    <div><span style={{ color: '#6b7280' }}>Entrees</span><div style={{ color: '#1f8a57', fontWeight: 700 }}>+{fmt(principaleStats.entrees)}</div></div>
                    <div><span style={{ color: '#6b7280' }}>Sorties</span><div style={{ color: '#c93128', fontWeight: 700 }}>-{fmt(principaleStats.sorties)}</div></div>
                    <div><span style={{ color: '#6b7280' }}>Ecart</span><div style={{ color: '#1d2836', fontWeight: 700 }}>{fmt(principaleStats.ecart)}</div></div>
                  </div>
                </div>

                {caisseCards.map(card => (
                  <div key={card.id} onClick={() => setActiveTab(card.id)} style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px', cursor: 'pointer' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', alignItems: 'center' }}>
                      <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d2836' }}>{card.nom}</div>
                      {!PROTECTED_CAISSES.includes(card.nom.toUpperCase()) && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            deleteCaisse(card.id)
                          }}
                          style={{ ...compactButton(false), padding: '4px 8px', color: '#c93128', borderColor: '#f0c7c5' }}
                        >
                          X
                        </button>
                      )}
                    </div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#2a5ea8', marginTop: '8px' }}>{fmt(card.solde)} DH</div>
                    <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '6px' }}>{card.actionsCount} ligne(s)</div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px', marginTop: '10px', fontSize: '10px' }}>
                      <div><span style={{ color: '#6b7280' }}>Entrees</span><div style={{ color: '#1f8a57', fontWeight: 700 }}>+{fmt(card.entrees)}</div></div>
                      <div><span style={{ color: '#6b7280' }}>Sorties</span><div style={{ color: '#c93128', fontWeight: 700 }}>-{fmt(card.sorties)}</div></div>
                      <div><span style={{ color: '#6b7280' }}>Ecart</span><div style={{ color: '#1d2836', fontWeight: 700 }}>{fmt(card.ecart)}</div></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </>
        )}

        {(activeTab === 'principale' || typeof activeTab === 'number') && detailCard && (
          <>
            <div style={{ marginBottom: '14px' }}>
              <div style={{ ...cardStyle, padding: '14px', borderTop: '3px solid #2a5ea8' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr 1fr', gap: '10px', alignItems: 'start' }}>
                  <div>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '4px' }}>{detailCard.title}</div>
                    <div style={{ fontSize: '24px', fontWeight: '800', color: '#1d2836' }}>{fmt(detailCard.balance)} DH</div>
                    <div style={{ fontSize: '10px', color: '#6b7280', marginTop: '4px' }}>{detailCard.note}</div>

                    {activeTab === 'principale' ? (
                      !editSolde ? (
                        <button onClick={() => setEditSolde(true)} style={{ ...compactButton(false), marginTop: '10px', color: '#2a5ea8', borderColor: '#bfd0ea' }}>
                          Modifier le solde initial
                        </button>
                      ) : (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                          <input style={{ ...inputStyle, width: '120px', padding: '6px 8px' }} type="number" value={soldeInput} onChange={e => setSoldeInput(e.target.value)} />
                          <button style={compactButton(true)} onClick={saveSolde}>OK</button>
                          <button style={{ ...compactButton(false), color: '#c93128', borderColor: '#f0c7c5' }} onClick={() => setEditSolde(false)}>X</button>
                        </div>
                      )
                    ) : currentCaisse ? (
                      editSoldePerso !== currentCaisse.id ? (
                        <button onClick={() => { setEditSoldePerso(currentCaisse.id); setSoldePersoInput(currentCaisse.solde_initial) }} style={{ ...compactButton(false), marginTop: '10px', color: '#2a5ea8', borderColor: '#bfd0ea' }}>
                          Modifier le solde initial
                        </button>
                      ) : (
                        <div style={{ marginTop: '10px', display: 'flex', gap: '6px' }}>
                          <input style={{ ...inputStyle, width: '120px', padding: '6px 8px' }} type="number" value={soldePersoInput} onChange={e => setSoldePersoInput(e.target.value)} />
                          <button style={compactButton(true)} onClick={() => saveSoldePerso(currentCaisse.id)}>OK</button>
                          <button style={{ ...compactButton(false), color: '#c93128', borderColor: '#f0c7c5' }} onClick={() => setEditSoldePerso(null)}>X</button>
                        </div>
                      )
                    ) : null}
                  </div>

                  <div style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Entrees traitees</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#1f8a57', marginTop: '8px' }}>+{fmt(detailCard.stats.entrees)} DH</div>
                  </div>

                  <div style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Sorties traitees</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#c93128', marginTop: '8px' }}>-{fmt(detailCard.stats.sorties)} DH</div>
                  </div>

                  <div style={{ background: '#fafbfc', border: '1px solid #e5eaf0', borderRadius: '11px', padding: '13px' }}>
                    <div style={{ fontSize: '11px', color: '#6b7280' }}>Ecart</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#1d2836', marginTop: '8px' }}>{fmt(detailCard.stats.ecart)} DH</div>
                  </div>
                </div>
              </div>
            </div>

            {showAddAction && (
              <div style={{ ...cardStyle, padding: '18px', marginBottom: '14px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1d2836', marginBottom: '14px' }}>Nouvelle operation</h3>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nature du mouvement *</label>
                    <select style={inputStyle} value={newAction.type} onChange={e => setNewAction(p => ({ ...p, type: e.target.value }))}>
                      {MOVEMENT_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Titre *</label>
                    <input style={inputStyle} value={newAction.titre} onChange={e => setNewAction(p => ({ ...p, titre: e.target.value }))} placeholder="Ex : reglement fournisseur" />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Service</label>
                    <select style={inputStyle} value={newAction.service} onChange={e => setNewAction(p => ({ ...p, service: e.target.value }))}>
                      <option value="">- Aucun -</option>
                      {services.map((s: any) => <option key={s.id} value={s.id}>{s.nom}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Type de charge *</label>
                    <select
                      style={inputStyle}
                      value={newAction.type_charge}
                      onChange={e => setNewAction(p => ({
                        ...p,
                        type_charge: e.target.value,
                        categorie: '',
                        sous_categorie: '',
                      }))}
                    >
                      {TYPE_CHARGE_OPTIONS.map(option => (
                        <option key={option.value} value={option.value}>{option.label}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Categorie *</label>
                    <select style={inputStyle} value={newAction.categorie} onChange={e => setNewAction(p => ({ ...p, categorie: e.target.value, sous_categorie: '' }))}>
                      <option value="">Selectionner...</option>
                      {availableCategoriesForCreate.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Sous-categorie</label>
                    <select
                      style={{
                        ...inputStyle,
                        background: newAction.type_charge === 'charge_fixe' ? '#f3f4f6' : '#fff',
                        color: newAction.type_charge === 'charge_fixe' ? '#9ca3af' : '#1f2937',
                      }}
                      value={newAction.sous_categorie}
                      onChange={e => setNewAction(p => ({ ...p, sous_categorie: e.target.value }))}
                      disabled={newAction.type_charge === 'charge_fixe'}
                    >
                      <option value="">{newAction.type_charge === 'charge_fixe' ? 'Non applicable' : 'Selectionner...'}</option>
                      {variableSubCategoryOptions.map(sub => <option key={sub} value={sub}>{sub}</option>)}
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Montant (DH) *</label>
                    <input style={inputStyle} type="number" value={newAction.montant} onChange={e => setNewAction(p => ({ ...p, montant: e.target.value }))} placeholder="0.00" />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date *</label>
                    <input style={inputStyle} type="date" value={newAction.date} onChange={e => setNewAction(p => ({ ...p, date: e.target.value }))} />
                  </div>

                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Personne</label>
                    <select
                      style={inputStyle}
                      value={newAction.personne}
                      onChange={e => {
                        if (e.target.value === '__add_person__') {
                          setShowAddPerson(true)
                        } else {
                          setNewAction(p => ({ ...p, personne: e.target.value }))
                          setShowAddPerson(false)
                        }
                      }}
                      disabled={typeof activeTab === 'number'}
                    >
                      <option value="">Selectionner une personne...</option>
                      {users.map((u: any) => <option key={u.id} value={u.username}>{u.username}</option>)}
                      {activeTab !== 'principale' ? null : <option value="__add_person__">+ Ajouter</option>}
                    </select>

                    {showAddPerson && activeTab === 'principale' && (
                      <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                        <input style={{ ...inputStyle, flex: 1 }} value={newPerson} onChange={e => setNewPerson(e.target.value)} placeholder="Nom de la personne..." />
                        <button type="button" style={compactButton(true)} onClick={handleAddPerson}>OK</button>
                        <button type="button" style={compactButton(false)} onClick={() => { setShowAddPerson(false); setNewPerson('') }}>X</button>
                      </div>
                    )}
                  </div>
                </div>

                <div style={{ marginTop: '12px' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Justificatif</label>
                  <label style={{ display: 'block', border: '1px dashed #cfd7df', borderRadius: '10px', padding: '11px', cursor: 'pointer', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '34px', height: '44px', background: '#eef2f7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '11px', fontWeight: '700' }}>DOC</div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: newAction.photo ? '#2a5ea8' : '#4b5563' }}>
                          {newAction.photo ? newAction.photo.name : 'Cliquer pour ajouter un justificatif'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                          {newAction.photo ? `${(newAction.photo.size / 1024).toFixed(1)} KB` : 'JPG, PNG - 5 Mo max.'}
                        </div>
                      </div>
                    </div>
                    <input type="file" accept="image/*" ref={fileRef} onChange={e => setNewAction(p => ({ ...p, photo: e.target.files?.[0] || null }))} style={{ display: 'none' }} />
                  </label>
                  {newAction.photo && (
                    <button type="button" onClick={() => { setNewAction(p => ({ ...p, photo: null })); if (fileRef.current) fileRef.current.value = '' }} style={{ ...compactButton(false), marginTop: '6px', color: '#c93128', borderColor: '#f0c7c5' }}>
                      Supprimer le justificatif
                    </button>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button style={compactButton(true)} onClick={addAction}>Enregistrer</button>
                  <button style={compactButton(false)} onClick={() => { setShowAddAction(false); setError('') }}>Annuler</button>
                </div>
              </div>
            )}

            {loading ? (
              <div style={{ ...cardStyle, padding: '36px', textAlign: 'center', color: '#6b7280' }}>Chargement en cours...</div>
            ) : (
              <SortableTable
                emptyMessage="Aucune operation sur la periode selectionnee."
                columns={[
                  { key: 'id', label: '#', render: (_v: any, row: any) => <span style={{ color: '#9ca3af' }}>{row.id}</span> },
                  {
                    key: 'movement_label',
                    label: 'Nature du mouvement',
                    render: (_v: any, row: any) => (
                      <span style={{ background: row.type === 'entree' ? '#e9f7f0' : '#fdeceb', color: row.type === 'entree' ? '#1f8a57' : '#c93128', padding: '3px 9px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 700 }}>
                        {row.movement_label}
                      </span>
                    )
                  },
                  { key: 'titre', label: 'Titre', render: (_v: any, row: any) => <span style={{ fontWeight: '600', color: '#1f2937' }}>{row.titre}</span> },
                  { key: 'service_nom', label: 'Service', render: (_v: any, row: any) => <span style={{ color: '#4b5563' }}>{row.service_nom}</span> },
                  { key: 'type_charge_label', label: 'Type de charge', render: (_v: any, row: any) => <span style={{ color: '#4b5563' }}>{row.type_charge_label}</span> },
                  { key: 'categorie', label: 'Categorie', render: (_v: any, row: any) => <span style={{ color: '#4b5563' }}>{row.categorie || '-'}</span> },
                  { key: 'sous_categorie', label: 'Sous-categorie', render: (_v: any, row: any) => <span style={{ color: '#4b5563' }}>{row.sous_categorie}</span> },
                  { key: 'montant_fmt', label: 'Montant', render: (_v: any, row: any) => <span style={{ fontWeight: '700', color: row.type === 'entree' ? '#1f8a57' : '#c93128' }}>{row.montant_fmt}</span> },
                  { key: 'date', label: 'Date', render: (_v: any, row: any) => <span style={{ color: '#4b5563' }}>{row.date}</span> },
                  { key: 'personne', label: 'Personne', render: (_v: any, row: any) => <span style={{ color: '#4b5563' }}>{row.personne}</span> },
                  {
                    key: 'photo_url',
                    label: 'Justificatif',
                    sortable: false,
                    render: (_v: any, row: any) => row.photo_url ? (
                      <div onClick={() => setSelectedPhoto(row.photo_url)} style={{ cursor: 'pointer', display: 'inline-block' }}>
                        <img src={row.photo_url} alt="Justificatif" style={{ width: '40px', height: '40px', objectFit: 'cover', borderRadius: '8px', border: '1px solid #d9e0e7' }} />
                        <div style={{ fontSize: '10px', color: '#2a5ea8', marginTop: '3px', textAlign: 'center', fontWeight: 600 }}>Voir</div>
                      </div>
                    ) : (
                      <span style={{ fontSize: '10.5px', color: '#9ca3af', background: '#f8fafc', padding: '4px 8px', borderRadius: '8px', border: '1px solid #e5eaf0' }}>Aucun</span>
                    )
                  },
                  {
                    key: 'statut_label',
                    label: 'Statut',
                    render: (_v: any, row: any) => (
                      <select
                        value={row.statut}
                        onChange={e => updateStatut(row.id, e.target.value)}
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
                      <button onClick={() => openEditModal(row)} style={{ ...compactButton(false), padding: '7px 12px', color: '#2a5ea8', borderColor: '#cddcf5' }}>
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
                        onClick={() => {
                          const caisseId = typeof activeTab === 'number' ? activeTab : undefined
                          deleteAction(row.id, caisseId)
                        }}
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

export default Caisse
