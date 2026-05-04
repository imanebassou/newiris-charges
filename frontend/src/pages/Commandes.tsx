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

const CHOIX = [
  { value: 'en_attente', label: 'En attente' },
  { value: 'ok', label: 'Validee' },
  { value: 'nok', label: 'Refusee' },
]

const TYPES_PAIEMENT = ['Cheque', 'Virement', 'Especes', 'Carte bancaire', 'Traite', 'Autres']

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

const choixStyle = (val: string) => {
  if (val === 'ok') return { bg: '#e8f8ef', color: '#1a7a40' }
  if (val === 'nok') return { bg: '#fdeaea', color: '#c0392b' }
  return { bg: '#fff3e0', color: '#e65100' }
}

const emptyForm = {
  titre: '',
  fournisseur: '',
  montant: '',
  echeance: '',
  mode_livraison: '',
  type_paiement: '',
}

const Commandes = () => {
  document.title = 'Gestion de commandes - Newiris'

  const now = new Date()
  const [selectedMonth, setSelectedMonth] = useState(now.getMonth() + 1)
  const [selectedYear, setSelectedYear] = useState(now.getFullYear())

  const [commandes, setCommandes] = useState<any[]>([])
  const [fournisseurs, setFournisseurs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [showForm, setShowForm] = useState(false)
  const [activeView, setActiveView] = useState<'dashboard' | 'table'>('dashboard')

  const [typesPaiement, setTypesPaiement] = useState<string[]>(TYPES_PAIEMENT)
  const [showAddType, setShowAddType] = useState(false)
  const [newType, setNewType] = useState('')

  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [draftEcheances, setDraftEcheances] = useState<Record<number, string>>({})
  const [draftDurees, setDraftDurees] = useState<Record<number, string>>({})

  const [form, setForm] = useState(emptyForm)
  const [docFile, setDocFile] = useState<File | null>(null)

  const [selectedRow, setSelectedRow] = useState<any | null>(null)
  const [editMode, setEditMode] = useState(false)

  const fetchData = async () => {
    try {
      const [cmdRes, fournRes] = await Promise.all([
        api.get('/commandes/'),
        api.get('/fournisseurs/'),
      ])
      setCommandes(cmdRes.data)
      setFournisseurs(fournRes.data)
      setDraftEcheances(
        Object.fromEntries(cmdRes.data.map((c: any) => [c.id, c.echeance || '']))
      )
      setDraftDurees(
        Object.fromEntries(cmdRes.data.map((c: any) => [c.id, c.mode_livraison || '']))
      )
    } catch (err) {
      console.error(err)
      setError('Une erreur est survenue lors du chargement.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const isInSelectedPeriod = (row: any) => {
    const rawDate = row.created_at || row.date_creation || row.date || ''
    if (!rawDate) return true
    const d = new Date(rawDate)
    if (isNaN(d.getTime())) return true
    return d.getMonth() + 1 === selectedMonth && d.getFullYear() === selectedYear
  }

  const filteredCommandes = useMemo(
    () => commandes.filter((row: any) => isInSelectedPeriod(row)),
    [commandes, selectedMonth, selectedYear]
  )

  const openCreate = () => {
    setEditMode(false)
    setSelectedRow(null)
    setForm(emptyForm)
    setDocFile(null)
    setShowAddType(false)
    setShowForm(true)
  }

  const openEdit = (row: any) => {
    setEditMode(true)
    setSelectedRow(row)
    setForm({
      titre: row.titre || '',
      fournisseur: row.fournisseur ? String(row.fournisseur) : '',
      montant: row.montant ? String(row.montant) : '',
      echeance: row.echeance || '',
      mode_livraison: row.mode_livraison || '',
      type_paiement: row.type_paiement || '',
    })
    setDocFile(null)
    setShowAddType(false)
    setShowForm(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (
      !form.titre.trim() ||
      !form.fournisseur ||
      !form.montant ||
      !form.echeance.trim() ||
      !form.mode_livraison.trim() ||
      !form.type_paiement ||
      (!editMode && !docFile)
    ) {
      setError('Tous les champs obligatoires doivent etre renseignes.')
      return
    }

    try {
      const fd = new FormData()
      fd.append('titre', form.titre)
      fd.append('fournisseur', form.fournisseur)
      fd.append('montant', form.montant)
      fd.append('echeance', form.echeance)
      fd.append('mode_livraison', form.mode_livraison)
      fd.append('type_paiement', form.type_paiement)

      if (!editMode) {
        fd.append('validation_direction', 'en_attente')
        fd.append('validation_finance', 'en_attente')
      } else if (selectedRow) {
        fd.append('validation_direction', selectedRow.validation_direction)
        fd.append('validation_finance', selectedRow.validation_finance)
      }

      if (docFile) fd.append('demande_achat', docFile)

      if (editMode && selectedRow) {
        await api.patch(`/commandes/${selectedRow.id}/`, fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      } else {
        await api.post('/commandes/', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        })
      }

      setSuccess(editMode ? 'Commande modifiee avec succes.' : 'Commande creee avec succes.')
      setTimeout(() => setSuccess(''), 3000)

      setShowForm(false)
      setEditMode(false)
      setSelectedRow(null)
      setForm(emptyForm)
      setDocFile(null)
      fetchData()
    } catch (err) {
      console.error(err)
      setError(editMode ? 'Erreur lors de la modification de la commande.' : 'Erreur lors de la creation de la commande.')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/commandes/${id}/`)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const updateField = async (id: number, data: any) => {
    try {
      await api.patch(`/commandes/${id}/`, data)
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const uploadDoc = async (id: number, file: File) => {
    try {
      const fd = new FormData()
      fd.append('demande_achat', file)
      await api.patch(`/commandes/${id}/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      fetchData()
    } catch (err) {
      console.error(err)
    }
  }

  const handleImport = async (rows: any[]) => {
    for (const row of rows) {
      try {
        await api.post('/commandes/', {
          titre: row.titre || 'Sans titre',
          fournisseur: row.fournisseur || null,
          montant: row.montant ? parseFloat(String(row.montant).replace(',', '.')) : null,
          echeance: row.echeance || '',
          mode_livraison: row.mode_livraison || '',
          type_paiement: row.type_paiement || '',
          validation_direction: 'en_attente',
          validation_finance: 'en_attente',
        })
      } catch (err) {
        console.error(err)
      }
    }
    setLoading(true)
    await fetchData()
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

  const tableData = filteredCommandes.map(c => ({
    ...c,
    fournisseur_nom: c.fournisseur_nom || '-',
    montant_fmt: c.montant ? `${Number(c.montant).toLocaleString('fr-FR')} DH` : '-',
    doc_url: c.doc_url || null,
    personne: c.personne || '-',
  }))

  const totalCommandes = filteredCommandes.length
  const totalMontant = useMemo(
    () => filteredCommandes.reduce((sum: number, c: any) => sum + Number(c.montant || 0), 0),
    [filteredCommandes]
  )
  const totalDirectionOk = filteredCommandes.filter((c: any) => c.validation_direction === 'ok').length
  const totalFinanceOk = filteredCommandes.filter((c: any) => c.validation_finance === 'ok').length
  const totalAttente = filteredCommandes.filter(
    (c: any) => c.validation_direction === 'en_attente' || c.validation_finance === 'en_attente'
  ).length

  const byPaiement = Object.entries(
    filteredCommandes.reduce((acc: any, row: any) => {
      const key = row.type_paiement || 'Sans type'
      acc[key] = (acc[key] || 0) + Number(row.montant || 0)
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  const byValidation = [
    { name: 'Direction validee', value: totalDirectionOk },
    { name: 'Finance validee', value: totalFinanceOk },
    { name: 'En attente', value: totalAttente },
  ]

  const byFournisseur = Object.entries(
    filteredCommandes.reduce((acc: any, row: any) => {
      const key = row.fournisseur_nom || 'Sans fournisseur'
      acc[key] = (acc[key] || 0) + Number(row.montant || 0)
      return acc
    }, {})
  )
    .map(([name, montant]) => ({ name, montant }))
    .sort((a: any, b: any) => b.montant - a.montant)
    .slice(0, 6)

  const ChoixSelect = ({ id, field, value }: { id: number; field: string; value: string }) => {
    const s = choixStyle(value)
    return (
      <select
        value={value}
        onChange={e => updateField(id, { [field]: e.target.value })}
        style={{
          padding: '5px 8px',
          borderRadius: '9px',
          fontSize: '10.5px',
          border: '1px solid #d9e0e7',
          cursor: 'pointer',
          background: s.bg,
          color: s.color,
          fontWeight: '600',
        }}
      >
        {CHOIX.map(c => (
          <option key={c.value} value={c.value}>
            {c.label}
          </option>
        ))}
      </select>
    )
  }

  return (
    <Layout>
      <div style={{ padding: '16px 18px 20px', fontSize: '14px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ ...cardStyle, padding: '18px 20px 16px', background: 'linear-gradient(135deg, #ffffff 0%, #fbfcfd 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1d2836', marginBottom: '6px' }}>
                  Gestion des commandes
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '720px' }}>
                  Pilotage des demandes d achat, des validations et du suivi documentaire.
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

                <ImportExcel
                  onImport={handleImport}
                  columns={[
                    { key: 'titre', label: 'Intitule' },
                    { key: 'fournisseur', label: 'Fournisseur' },
                    { key: 'montant', label: 'Montant' },
                    { key: 'echeance', label: 'Echeance' },
                    { key: 'mode_livraison', label: 'Delai de livraison' },
                    { key: 'type_paiement', label: 'Mode de paiement' },
                  ]}
                />

                <button
                  onClick={openCreate}
                  style={{ ...compactButton(true), background: '#c93128', borderColor: '#c93128' }}
                >
                  + Nouvelle demande
                </button>
              </div>
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
          <button onClick={() => setActiveView('dashboard')} style={compactButton(activeView === 'dashboard')}>
            Tableau de bord
          </button>
          <button onClick={() => setActiveView('table')} style={compactButton(activeView === 'table')}>
            Registre des demandes
          </button>
        </div>

        {showForm && (
          <div style={{ ...cardStyle, padding: '18px', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1d2836', marginBottom: '14px' }}>
              {editMode ? 'Modification de la demande' : 'Nouvelle demande d achat'}
            </h3>

            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Intitule *</label>
                  <input style={inputStyle} value={form.titre} onChange={e => setForm({ ...form, titre: e.target.value })} required placeholder="Ex : Acquisition de materiel" />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fournisseur *</label>
                  <select style={inputStyle} value={form.fournisseur} onChange={e => setForm({ ...form, fournisseur: e.target.value })} required>
                    <option value="">- Selectionner -</option>
                    {fournisseurs.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.nom}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Montant previsionnel (DH) *</label>
                  <input style={inputStyle} type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} required placeholder="0.00" />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Echeance *</label>
                  <input
                    style={inputStyle}
                    type="text"
                    value={form.echeance}
                    onChange={e => setForm({ ...form, echeance: e.target.value })}
                    required
                    placeholder="Ex : Fin du mois, urgence prioritaire..."
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Delai de livraison *</label>
                  <input
                    style={inputStyle}
                    type="text"
                    value={form.mode_livraison}
                    onChange={e => setForm({ ...form, mode_livraison: e.target.value })}
                    required
                    placeholder="Ex : 3 jours ouvres, 1 semaine..."
                  />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Mode de paiement *</label>
                  <select
                    style={inputStyle}
                    value={form.type_paiement}
                    onChange={e => {
                      if (e.target.value === '__add__') {
                        setShowAddType(true)
                      } else {
                        setForm({ ...form, type_paiement: e.target.value })
                        setShowAddType(false)
                      }
                    }}
                    required
                  >
                    <option value="">- Selectionner -</option>
                    {typesPaiement.map(t => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                    <option value="__add__">+ Ajouter</option>
                  </select>

                  {showAddType && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input
                        style={{ ...inputStyle, flex: 1 }}
                        value={newType}
                        onChange={e => setNewType(e.target.value)}
                        placeholder="Nouveau mode de paiement..."
                        onKeyDown={e => {
                          if (e.key === 'Enter') {
                            e.preventDefault()
                            if (newType.trim()) {
                              setTypesPaiement([...typesPaiement, newType.trim()])
                              setForm({ ...form, type_paiement: newType.trim() })
                              setNewType('')
                              setShowAddType(false)
                            }
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (newType.trim()) {
                            setTypesPaiement([...typesPaiement, newType.trim()])
                            setForm({ ...form, type_paiement: newType.trim() })
                            setNewType('')
                            setShowAddType(false)
                          }
                        }}
                        style={compactButton(true)}
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => { setShowAddType(false); setNewType('') }}
                        style={compactButton(false)}
                      >
                        X
                      </button>
                    </div>
                  )}
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                    Piece jointe - Demande d achat {!editMode ? '*' : ''}
                  </label>
                  <label style={{ display: 'block', border: '1px dashed #cfd7df', borderRadius: '10px', padding: '11px', cursor: 'pointer', background: '#f8fafc' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '34px', height: '44px', background: '#eef2f7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '11px', fontWeight: '700' }}>
                        DOC
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: docFile ? '#2a5ea8' : '#4b5563' }}>
                          {docFile ? docFile.name : 'Cliquer pour televerser un document'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                          {docFile ? `${(docFile.size / 1024).toFixed(1)} KB` : 'PDF, JPG, PNG, DOC'}
                        </div>
                      </div>
                    </div>
                    <input type="file" accept=".pdf,.jpg,.png,.doc,.docx" onChange={e => setDocFile(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  </label>

                  {docFile && (
                    <button
                      type="button"
                      onClick={() => setDocFile(null)}
                      style={{ ...compactButton(false), marginTop: '6px', color: '#c93128', borderColor: '#f0c7c5' }}
                    >
                      Supprimer le document
                    </button>
                  )}
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
                    setShowAddType(false)
                    setDocFile(null)
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
            Chargement...
          </div>
        ) : (
          <>
            {activeView === 'dashboard' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #1d2836' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Demandes enregistrees</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#1d2836', lineHeight: 1.18 }}>{totalCommandes}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>Periode selectionnee</div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #2a5ea8' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Volume budgetaire</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#2a5ea8', lineHeight: 1.18 }}>{fmtDh(totalMontant)} DH</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>Montant cumule</div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #1f8a57' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Validations direction</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#1f8a57', lineHeight: 1.18 }}>{totalDirectionOk}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>Demandes approuvees</div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #c93128' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Validations finance</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#c93128', lineHeight: 1.18 }}>{totalFinanceOk}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>Demandes approuvees</div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #d08b19' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Instances en attente</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#d08b19', lineHeight: 1.18 }}>{totalAttente}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>Traitement en cours</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.8fr 1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px' }}>Fournisseurs prioritaires</div>
                    <ResponsiveContainer width="100%" height={230}>
                      <BarChart data={byFournisseur} barCategoryGap={18}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} DH`} />
                        <Bar dataKey="montant" fill="#1d2836" radius={[5, 5, 0, 0]} maxBarSize={34} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>Modes de paiement</div>
                    {byPaiement.length > 0 ? (
                      <ResponsiveContainer width="100%" height={230}>
                        <PieChart>
                          <Pie data={byPaiement} dataKey="value" nameKey="name" outerRadius={78} innerRadius={34} paddingAngle={2}>
                            {byPaiement.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip formatter={(v: any) => `${Number(v).toLocaleString('fr-FR')} DH`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '92px', fontSize: '12px' }}>Aucune donnee</div>
                    )}
                  </div>

                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>Cycle de validation</div>
                    {byValidation.some(item => item.value > 0) ? (
                      <ResponsiveContainer width="100%" height={230}>
                        <PieChart>
                          <Pie data={byValidation} dataKey="value" nameKey="name" outerRadius={78} innerRadius={34} paddingAngle={2}>
                            <Cell fill="#1f8a57" />
                            <Cell fill="#2a5ea8" />
                            <Cell fill="#d08b19" />
                          </Pie>
                          <Tooltip formatter={(v: any) => `${v} demande(s)`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '92px', fontSize: '12px' }}>Aucune donnee</div>
                    )}
                  </div>
                </div>
              </>
            )}

            {activeView === 'table' && (
              <SortableTable
                emptyMessage="Aucune demande sur la periode selectionnee."
                columns={[
                  { key: 'id', label: '#', render: (_v: any, row: any) => <span style={{ color: '#aaa' }}>{row.id}</span> },
                  { key: 'titre', label: 'Intitule', render: (_v: any, row: any) => <span style={{ fontWeight: '600', color: '#1f2937' }}>{row.titre}</span> },
                  { key: 'fournisseur_nom', label: 'Fournisseur', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.fournisseur_nom}</span> },
                  { key: 'montant_fmt', label: 'Montant', render: (_v: any, row: any) => <span style={{ fontWeight: '700', color: '#2a5ea8' }}>{row.montant_fmt}</span> },
                  {
                    key: 'echeance_fmt',
                    label: 'Echeance',
                    sortable: false,
                    render: (_v: any, row: any) => (
                      <input
                        type="text"
                        value={draftEcheances[row.id] ?? row.echeance ?? ''}
                        onChange={e => setDraftEcheances(prev => ({ ...prev, [row.id]: e.target.value }))}
                        onBlur={() => updateField(row.id, { echeance: draftEcheances[row.id] ?? row.echeance ?? '' })}
                        placeholder="Echeance"
                        style={{ ...inputStyle, width: '150px', padding: '4px 8px' }}
                      />
                    ),
                  },
                  {
                    key: 'mode_livraison',
                    label: 'Delai de livraison',
                    sortable: false,
                    render: (_v: any, row: any) => (
                      <input
                        value={draftDurees[row.id] ?? row.mode_livraison ?? ''}
                        onChange={e => setDraftDurees(prev => ({ ...prev, [row.id]: e.target.value }))}
                        onBlur={() => updateField(row.id, { mode_livraison: draftDurees[row.id] ?? row.mode_livraison ?? '' })}
                        placeholder="Ex : 3 jours"
                        style={{ ...inputStyle, width: '150px', padding: '4px 8px' }}
                      />
                    ),
                  },
                  {
                    key: 'type_paiement',
                    label: 'Mode de paiement',
                    sortable: false,
                    render: (_v: any, row: any) => (
                      <select
                        value={row.type_paiement || ''}
                        onChange={e => updateField(row.id, { type_paiement: e.target.value })}
                        style={{ padding: '5px 8px', borderRadius: '9px', fontSize: '10.5px', border: '1px solid #d9e0e7', cursor: 'pointer', minWidth: '120px' }}
                      >
                        <option value="">- Selectionner -</option>
                        {typesPaiement.map(t => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    ),
                  },
                  { key: 'personne', label: 'Demandeur', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.personne}</span> },
                  {
                    key: 'demande_achat',
                    label: 'Piece jointe',
                    sortable: false,
                    render: (_v: any, row: any) => (
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        {row.doc_url ? (
                          <>
                            <a
                              href={row.doc_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ padding: '5px 8px', background: '#e8f4fb', color: '#0099cc', border: '1px solid #b3d9f0', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', textDecoration: 'none', fontWeight: 600 }}
                            >
                              Consulter
                            </a>
                            <label style={{ padding: '5px 8px', background: '#fff3e0', color: '#e65100', border: '1px solid #ffd08a', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                              Remplacer
                              <input
                                type="file"
                                accept=".pdf,.jpg,.png,.doc,.docx"
                                style={{ display: 'none' }}
                                onChange={async e => {
                                  const file = e.target.files?.[0]
                                  if (file) await uploadDoc(row.id, file)
                                }}
                              />
                            </label>
                          </>
                        ) : (
                          <label style={{ padding: '5px 8px', background: '#f8f9fa', color: '#555', border: '1px solid #e0e0e0', borderRadius: '8px', fontSize: '11px', cursor: 'pointer', fontWeight: 600 }}>
                            Televerser
                            <input
                              type="file"
                              accept=".pdf,.jpg,.png,.doc,.docx"
                              style={{ display: 'none' }}
                              onChange={async e => {
                                const file = e.target.files?.[0]
                                if (file) await uploadDoc(row.id, file)
                              }}
                            />
                          </label>
                        )}
                      </div>
                    ),
                  },
                  { key: 'validation_direction', label: 'Validation direction', render: (_v: any, row: any) => <ChoixSelect id={row.id} field="validation_direction" value={row.validation_direction} /> },
                  { key: 'validation_finance', label: 'Validation finance', render: (_v: any, row: any) => <ChoixSelect id={row.id} field="validation_finance" value={row.validation_finance} /> },
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
                    ),
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
                    ),
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

export default Commandes
