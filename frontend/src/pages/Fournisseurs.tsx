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

const fmtCount = (value: number) => value.toLocaleString('fr-FR')

const Fournisseurs = () => {
  document.title = 'Fournisseurs - NEWIRIS'

  const [fournisseurs, setFournisseurs] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'table'>('dashboard')

  const [showForm, setShowForm] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editingDate, setEditingDate] = useState('')

  const [form, setForm] = useState({
    nom: '',
    type_contrat: '',
    date_fin_rf: ''
  })

  const [typesContrat, setTypesContrat] = useState<string[]>([
    'CDI',
    'CDD',
    'Freelance',
    'Prestation',
    'Maintenance',
    'Autres'
  ])

  const [showAddType, setShowAddType] = useState(false)
  const [newType, setNewType] = useState('')
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await api.get('/fournisseurs/')
      setFournisseurs(Array.isArray(res.data) ? res.data : [])
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

  const notifySuccess = () => {
    setSuccess(true)
    setError('')
    setTimeout(() => setSuccess(false), 2500)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/fournisseurs/', {
        nom: form.nom,
        type_contrat: form.type_contrat,
        date_fin_rf: form.date_fin_rf
      })
      setShowForm(false)
      setShowAddType(false)
      setForm({ nom: '', type_contrat: '', date_fin_rf: '' })
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Creation du fournisseur impossible.')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/fournisseurs/${id}/`)
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Suppression du fournisseur impossible.')
    }
  }

  const handleUpdateDate = async (id: number) => {
    try {
      await api.patch(`/fournisseurs/${id}/`, { date_fin_rf: editingDate })
      setEditingId(null)
      setEditingDate('')
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Modification de la date impossible.')
    }
  }

  const handleAddType = () => {
    if (newType.trim() && !typesContrat.includes(newType.trim())) {
      setTypesContrat([...typesContrat, newType.trim()])
      setForm({ ...form, type_contrat: newType.trim() })
      setNewType('')
      setShowAddType(false)
    }
  }

  const handleRenouveler = async (id: number) => {
    try {
      const today = new Date()
      const newDate = new Date(today)
      newDate.setDate(today.getDate() + 180)

      await api.patch(`/fournisseurs/${id}/`, {
        date_fin_rf: newDate.toISOString().split('T')[0]
      })

      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Renouvellement impossible.')
    }
  }

  const handleImport = async (rows: any[]) => {
    let successCount = 0
    let failCount = 0

    for (const row of rows) {
      try {
        await api.post('/fournisseurs/', {
          nom: row.nom || '',
          type_contrat: row.type_contrat || 'Autres',
          date_fin_rf: row.date_fin_rf || row.date || '',
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
      setError('Import des fournisseurs impossible.')
    }

    fetchData()
  }

  const getEtatStyle = (etat: string) => {
    if (etat === 'renouvelee') return { bg: '#e8f4fb', color: '#2a5ea8', label: 'Renouvelee' }
    if (etat === 'en_cours') return { bg: '#e9f7f0', color: '#1f8a57', label: 'En cours' }
    return { bg: '#fdeceb', color: '#c93128', label: 'Depassee' }
  }

  const getEcheanceColor = (echeance: number) => {
    if (echeance >= 180) return '#2a5ea8'
    if (echeance >= 1) return '#1f8a57'
    return '#c93128'
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

  const tableData = fournisseurs.map((f: any) => ({
    ...f,
    date_fin_rf_fmt: f.date_fin_rf ? new Date(f.date_fin_rf).toLocaleDateString('fr-FR') : '-',
    etat_label: getEtatStyle(f.etat_regularite).label,
  }))

  const stats = useMemo(() => {
    const total = fournisseurs.length
    const actifs = fournisseurs.filter((f: any) => f.etat_regularite === 'en_cours').length
    const renouveles = fournisseurs.filter((f: any) => f.etat_regularite === 'renouvelee').length
    const depasses = fournisseurs.filter((f: any) => f.etat_regularite === 'depasee').length

    const closest = [...fournisseurs]
      .sort((a: any, b: any) => Number(a.echeance || 0) - Number(b.echeance || 0))[0]

    return {
      total,
      actifs,
      renouveles,
      depasses,
      closestNom: closest?.nom || '-',
      closestDays: closest?.echeance ?? 0,
    }
  }, [fournisseurs])

  const contractsByType = useMemo(() => {
    const map: Record<string, number> = {}
    fournisseurs.forEach((f: any) => {
      const key = f.type_contrat || 'Autres'
      map[key] = (map[key] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [fournisseurs])

  const contractsByEtat = useMemo(() => {
    return [
      { name: 'En cours', value: fournisseurs.filter((f: any) => f.etat_regularite === 'en_cours').length, color: '#1f8a57' },
      { name: 'Renouvelees', value: fournisseurs.filter((f: any) => f.etat_regularite === 'renouvelee').length, color: '#2a5ea8' },
      { name: 'Depassees', value: fournisseurs.filter((f: any) => f.etat_regularite === 'depasee').length, color: '#c93128' },
    ]
  }, [fournisseurs])

  const echeanceChart = useMemo(() => {
    return fournisseurs
      .slice()
      .sort((a: any, b: any) => Number(a.echeance || 0) - Number(b.echeance || 0))
      .slice(0, 8)
      .map((f: any) => ({
        name: f.nom,
        echeance: Number(f.echeance || 0),
      }))
  }, [fournisseurs])

  return (
    <Layout>
      <div style={{ padding: '16px 18px 20px', fontSize: '14px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ ...cardStyle, padding: '18px 20px 16px', background: 'linear-gradient(135deg, #ffffff 0%, #fbfcfd 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1d2836', marginBottom: '6px' }}>
                  Gestion des fournisseurs
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '720px' }}>
                  Suivi des contrats, des echeances de regularite et des renouvellements fournisseurs.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
                <ImportExcel
                  onImport={handleImport}
                  columns={[
                    { key: 'nom', label: 'Nom du fournisseur' },
                    { key: 'type_contrat', label: 'Type de contrat' },
                    { key: 'date_fin_rf', label: 'Date de fin de RF' },
                  ]}
                />
                <button onClick={() => setShowForm(!showForm)} style={{ ...compactButton(true), background: '#c93128', borderColor: '#c93128' }}>
                  + Nouveau fournisseur
                </button>
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
          <button style={compactButton(activeTab === 'table')} onClick={() => setActiveTab('table')}>Fournisseurs</button>
        </div>

        {showForm && (
          <div style={{ ...cardStyle, padding: '18px', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1d2836', marginBottom: '14px' }}>Nouveau fournisseur</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '11px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nom du fournisseur *</label>
                  <input style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Type de contrat *</label>
                  <select
                    style={inputStyle}
                    value={form.type_contrat}
                    onChange={e => {
                      if (e.target.value === '__add_type__') {
                        setShowAddType(true)
                      } else {
                        setForm({ ...form, type_contrat: e.target.value })
                        setShowAddType(false)
                      }
                    }}
                    required={!showAddType}
                  >
                    <option value="">Selectionner un type...</option>
                    {typesContrat.map(t => <option key={t} value={t}>{t}</option>)}
                    <option value="__add_type__">+ Ajouter</option>
                  </select>

                  {showAddType && (
                    <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                      <input style={{ ...inputStyle, flex: 1 }} value={newType} onChange={e => setNewType(e.target.value)} placeholder="Nouveau type..." />
                      <button type="button" onClick={handleAddType} style={compactButton(true)}>OK</button>
                      <button type="button" onClick={() => { setShowAddType(false); setNewType('') }} style={compactButton(false)}>X</button>
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date de fin de RF *</label>
                  <input style={inputStyle} type="date" value={form.date_fin_rf} onChange={e => setForm({ ...form, date_fin_rf: e.target.value })} required />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button type="submit" style={compactButton(true)}>Creer</button>
                <button type="button" onClick={() => { setShowForm(false); setShowAddType(false) }} style={compactButton(false)}>Annuler</button>
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
            {activeTab === 'dashboard' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #1d2836' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Fournisseurs total</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#1d2836', lineHeight: 1.18 }}>{fmtCount(stats.total)}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>Base fournisseurs</div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #1f8a57' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Contrats en cours</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#1f8a57', lineHeight: 1.18 }}>{fmtCount(stats.actifs)}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>Echeance positive</div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #2a5ea8' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Contrats renouveles</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#2a5ea8', lineHeight: 1.18 }}>{fmtCount(stats.renouveles)}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>180 jours et plus</div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #c93128' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Contrats depasses</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#c93128', lineHeight: 1.18 }}>{fmtCount(stats.depasses)}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>Action requise</div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #d08b19' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Echeance la plus proche</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#d08b19', lineHeight: 1.18, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{stats.closestNom}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>{stats.closestDays} jour(s)</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836' }}>Echeances les plus proches</div>
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>Top 8</div>
                    </div>

                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={echeanceChart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: any) => `${v} jour(s)`} />
                        <Bar dataKey="echeance" radius={[5, 5, 0, 0]} maxBarSize={34}>
                          {echeanceChart.map((item, i) => (
                            <Cell key={i} fill={item.echeance >= 180 ? '#2a5ea8' : item.echeance >= 1 ? '#1f8a57' : '#c93128'} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>Repartition par etat</div>
                    {contractsByEtat.some(item => item.value > 0) ? (
                      <>
                        <ResponsiveContainer width="100%" height={210}>
                          <PieChart>
                            <Pie data={contractsByEtat} dataKey="value" nameKey="name" outerRadius={76} innerRadius={36} paddingAngle={2}>
                              {contractsByEtat.map((item, i) => <Cell key={i} fill={item.color} />)}
                            </Pie>
                            <Tooltip formatter={(v: any) => `${v} fournisseur(s)`} />
                          </PieChart>
                        </ResponsiveContainer>

                        <div style={{ borderTop: '1px solid #eef2f6', paddingTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                            <span>Total suivi</span>
                            <strong style={{ color: '#1d2836' }}>{stats.total}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280' }}>
                            <span>Contrats sensibles</span>
                            <strong style={{ color: '#1d2836' }}>{stats.depasses}</strong>
                          </div>
                        </div>
                      </>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '92px', fontSize: '12px' }}>Aucune donnee</div>
                    )}
                  </div>

                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>Repartition par contrat</div>
                    {contractsByType.length > 0 ? (
                      <>
                        <ResponsiveContainer width="100%" height={210}>
                          <PieChart>
                            <Pie data={contractsByType} dataKey="value" nameKey="name" outerRadius={76} innerRadius={36} paddingAngle={2}>
                              {contractsByType.map((_: any, i: number) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                            </Pie>
                            <Tooltip formatter={(v: any) => `${v} fournisseur(s)`} />
                          </PieChart>
                        </ResponsiveContainer>

                        <div style={{ borderTop: '1px solid #eef2f6', paddingTop: '10px' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280', marginBottom: '4px' }}>
                            <span>Types actifs</span>
                            <strong style={{ color: '#1d2836' }}>{contractsByType.length}</strong>
                          </div>
                          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', color: '#6b7280' }}>
                            <span>Base fournisseurs</span>
                            <strong style={{ color: '#1d2836' }}>{stats.total}</strong>
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

            {activeTab === 'table' && (
              <SortableTable
                emptyMessage="Aucun fournisseur."
                columns={[
                  { key: 'nom', label: 'Nom du fournisseur', render: (_v: any, row: any) => <span style={{ fontWeight: 600, color: '#1f2937' }}>{row.nom}</span> },
                  { key: 'type_contrat', label: 'Type de contrat', render: (_v: any, row: any) => <span style={{ color: '#4b5563' }}>{row.type_contrat}</span> },
                  {
                    key: 'date_fin_rf_fmt',
                    label: 'Date de fin de RF',
                    sortable: false,
                    render: (_v: any, row: any) => editingId === row.id ? (
                      <div style={{ display: 'flex', gap: '6px', alignItems: 'center' }}>
                        <input type="date" value={editingDate} onChange={e => setEditingDate(e.target.value)} style={{ ...inputStyle, width: '145px', padding: '6px 8px' }} />
                        <button onClick={() => handleUpdateDate(row.id)} style={{ ...stateButton, background: '#1d2836', color: '#fff', borderColor: '#1d2836' }}>OK</button>
                        <button onClick={() => { setEditingId(null); setEditingDate('') }} style={stateButton}>X</button>
                      </div>
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <span style={{ color: '#4b5563' }}>{row.date_fin_rf_fmt}</span>
                        <button
                          onClick={() => {
                            setEditingId(row.id)
                            setEditingDate(row.date_fin_rf)
                          }}
                          style={{ ...stateButton, padding: '4px 8px', fontSize: '10px' }}
                        >
                          Modifier
                        </button>
                      </div>
                    )
                  },
                  {
                    key: 'echeance',
                    label: 'Echeance (jours)',
                    render: (_v: any, row: any) => (
                      <span style={{ fontWeight: 700, color: getEcheanceColor(Number(row.echeance || 0)) }}>
                        {row.echeance} j
                      </span>
                    )
                  },
                  {
                    key: 'etat_label',
                    label: 'Etat de regularite',
                    render: (_v: any, row: any) => {
                      const s = getEtatStyle(row.etat_regularite)
                      return (
                        <span style={{ padding: '4px 10px', borderRadius: '999px', fontSize: '10.5px', fontWeight: 700, display: 'inline-block', background: s.bg, color: s.color }}>
                          {s.label}
                        </span>
                      )
                    }
                  },
                  {
                    key: 'actions',
                    label: 'Actions',
                    sortable: false,
                    render: (_v: any, row: any) => (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleRenouveler(row.id)} style={{ ...stateButton, color: '#2a5ea8', borderColor: '#cddcf5' }}>
                          Renouveler
                        </button>
                        <button onClick={() => handleDelete(row.id)} style={{ ...stateButton, color: '#c93128', borderColor: '#f0c7c5' }}>
                          Supprimer
                        </button>
                      </div>
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

export default Fournisseurs
