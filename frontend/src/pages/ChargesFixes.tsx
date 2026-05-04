import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import SortableTable from '../components/SortableTable'
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

const stateButton = {
  padding: '7px 12px',
  borderRadius: '9px',
  fontSize: '11px',
  border: '1px solid #d9e0e7',
  cursor: 'pointer',
  background: '#fff',
}

const fmtDh = (value: any) =>
  Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

const TYPE_OPTIONS = [
  { value: 'traitee_par_banque', label: 'Traitee par banque' },
  { value: 'traitee_par_caisse', label: 'Traitee par caisse' },
]

const formatDate = (value: string) => {
  if (!value) return '-'
  const d = new Date(value)
  if (isNaN(d.getTime())) return value
  return d.toLocaleDateString('fr-FR')
}

const ChargesFixes = () => {
  document.title = 'Charges fixes - NEWIRIS'

  const [categories, setCategories] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'categories'>('dashboard')

  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const [categoryForm, setCategoryForm] = useState({
    nom: '',
    type_traitement: 'traitee_par_banque',
    jour_du_mois: 3,
    montant: '',
    date_debut: '',
    date_fin: '',
  })

  const [editingCategoryId, setEditingCategoryId] = useState<number | null>(null)
  const [editingCategoryForm, setEditingCategoryForm] = useState({
    nom: '',
    type_traitement: 'traitee_par_banque',
    jour_du_mois: '3',
    montant: '',
    date_debut: '',
    date_fin: '',
  })

  const fetchData = async () => {
    setLoading(true)
    try {
      const categoriesRes = await api.get('/charges-fixes/categories/')
      setCategories(Array.isArray(categoriesRes.data) ? categoriesRes.data : [])
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

  const handleCreateCategory = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/charges-fixes/categories/', {
        nom: categoryForm.nom,
        type_traitement: categoryForm.type_traitement,
        jour_du_mois: Number(categoryForm.jour_du_mois),
        montant: parseFloat(String(categoryForm.montant || '0')) || 0,
        date_debut: categoryForm.date_debut || null,
        date_fin: categoryForm.date_fin || null,
      })

      setCategoryForm({
        nom: '',
        type_traitement: 'traitee_par_banque',
        jour_du_mois: 3,
        montant: '',
        date_debut: '',
        date_fin: '',
      })
      setShowCategoryForm(false)
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Creation de la categorie impossible.')
    }
  }

  const handleUpdateCategory = async (id: number) => {
    try {
      await api.patch(`/charges-fixes/categories/${id}/`, {
        nom: editingCategoryForm.nom,
        type_traitement: editingCategoryForm.type_traitement,
        jour_du_mois: Number(editingCategoryForm.jour_du_mois),
        montant: parseFloat(String(editingCategoryForm.montant || '0')) || 0,
        date_debut: editingCategoryForm.date_debut || null,
        date_fin: editingCategoryForm.date_fin || null,
      })
      setEditingCategoryId(null)
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Modification de la categorie impossible.')
    }
  }

  const handleDeleteCategory = async (id: number) => {
    try {
      await api.delete(`/charges-fixes/categories/${id}/`)
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Suppression de la categorie impossible.')
    }
  }

  const stats = useMemo(() => {
    const totalMontant = categories.reduce((sum: number, c: any) => sum + Number(c.montant || 0), 0)
    const banqueCount = categories.filter((c: any) => c.type_traitement === 'traitee_par_banque').length
    const caisseCount = categories.filter((c: any) => c.type_traitement === 'traitee_par_caisse').length

    return {
      totalCategories: categories.length,
      totalMontant,
      banqueCount,
      caisseCount,
    }
  }, [categories])

  const chartByType = [
    {
      name: 'Traitees par banque',
      value: categories
        .filter((c: any) => c.type_traitement === 'traitee_par_banque')
        .reduce((sum: number, c: any) => sum + Number(c.montant || 0), 0)
    },
    {
      name: 'Traitees par caisse',
      value: categories
        .filter((c: any) => c.type_traitement === 'traitee_par_caisse')
        .reduce((sum: number, c: any) => sum + Number(c.montant || 0), 0)
    },
  ]

  const chartByCategory = categories.map((c: any) => ({
    name: c.nom,
    montant: Number(c.montant || 0),
  }))

  const categoryTableData = categories.map((c: any) => ({
    ...c,
    montant_fmt: `${fmtDh(c.montant)} DH`,
    periode_fmt: `${formatDate(c.date_debut)} au ${formatDate(c.date_fin)}`,
  }))

  return (
    <Layout>
      <div style={{ padding: '16px 18px 20px', fontSize: '14px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ ...cardStyle, padding: '18px 20px 16px', background: 'linear-gradient(135deg, #ffffff 0%, #fbfcfd 100%)' }}>
            <div>
              <div style={{ fontSize: '20px', fontWeight: '800', color: '#1d2836', marginBottom: '6px' }}>
                Charges fixes
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '760px' }}>
                Parametrage des categories principales pour la projection mensuelle des charges fixes.
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
          <button style={compactButton(activeTab === 'dashboard')} onClick={() => setActiveTab('dashboard')}>
            Tableau de bord
          </button>
          <button style={compactButton(activeTab === 'categories')} onClick={() => setActiveTab('categories')}>
            Categories
          </button>
        </div>

        {loading ? (
          <div style={{ ...cardStyle, padding: '36px', textAlign: 'center', color: '#6b7280' }}>
            Chargement en cours...
          </div>
        ) : (
          <>
            {activeTab === 'dashboard' && (
              <>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ ...cardStyle, padding: '14px', borderTop: '3px solid #1d2836' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Categories</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#1d2836' }}>{stats.totalCategories}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>Parametres actifs</div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px', borderTop: '3px solid #1f8a57' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Montant cumule</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#1f8a57' }}>{fmtDh(stats.totalMontant)} DH</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>Projection mensuelle</div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px', borderTop: '3px solid #2a5ea8' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Traitees par banque</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#2a5ea8' }}>{stats.banqueCount}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>Categories</div>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px', borderTop: '3px solid #c93128' }}>
                    <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Traitees par caisse</div>
                    <div style={{ fontSize: '17px', fontWeight: '800', color: '#c93128' }}>{stats.caisseCount}</div>
                    <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '5px' }}>Categories</div>
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr 1fr', gap: '10px' }}>
                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836' }}>Montants par categorie</div>
                      <div style={{ fontSize: '10px', color: '#6b7280' }}>Vue globale</div>
                    </div>

                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={chartByCategory}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                        <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                        <YAxis tick={{ fontSize: 10 }} />
                        <Tooltip formatter={(v: any) => `${fmtDh(v)} DH`} />
                        <Bar dataKey="montant" fill="#1d2836" radius={[5, 5, 0, 0]} maxBarSize={34} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>

                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>
                      Repartition par traitement
                    </div>
                    {chartByType.some(item => item.value > 0) ? (
                      <ResponsiveContainer width="100%" height={210}>
                        <PieChart>
                          <Pie data={chartByType} dataKey="value" nameKey="name" outerRadius={76} innerRadius={36} paddingAngle={2}>
                            <Cell fill="#2a5ea8" />
                            <Cell fill="#c93128" />
                          </Pie>
                          <Tooltip formatter={(v: any) => `${fmtDh(v)} DH`} />
                        </PieChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '92px', fontSize: '12px' }}>
                        Aucune donnee
                      </div>
                    )}
                  </div>

                  <div style={{ ...cardStyle, padding: '14px' }}>
                    <div style={{ fontSize: '13px', fontWeight: '700', color: '#1d2836', marginBottom: '10px' }}>
                      Echeancier mensuel
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {categories.slice(0, 6).map((cat: any) => (
                        <div key={cat.id} style={{ display: 'flex', justifyContent: 'space-between', gap: '10px', fontSize: '12px', borderBottom: '1px solid #eef2f6', paddingBottom: '6px' }}>
                          <span style={{ color: '#4b5563' }}>{cat.nom}</span>
                          <strong style={{ color: '#1d2836' }}>Jour {cat.jour_du_mois}</strong>
                        </div>
                      ))}
                      {categories.length === 0 && (
                        <div style={{ color: '#9ca3af', fontSize: '12px' }}>Aucune categorie</div>
                      )}
                    </div>
                  </div>
                </div>
              </>
            )}

            {activeTab === 'categories' && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '14px' }}>
                  <button
                    onClick={() => setShowCategoryForm(!showCategoryForm)}
                    style={{ ...compactButton(true), background: '#c93128', borderColor: '#c93128' }}
                  >
                    + Ajouter categorie
                  </button>
                </div>

                {showCategoryForm && (
                  <div style={{ ...cardStyle, padding: '18px', marginBottom: '14px' }}>
                    <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1d2836', marginBottom: '14px' }}>
                      Nouvelle categorie
                    </h3>
                    <form onSubmit={handleCreateCategory}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nom *</label>
                          <input style={inputStyle} value={categoryForm.nom} onChange={e => setCategoryForm({ ...categoryForm, nom: e.target.value })} required />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Type *</label>
                          <select style={inputStyle} value={categoryForm.type_traitement} onChange={e => setCategoryForm({ ...categoryForm, type_traitement: e.target.value })}>
                            {TYPE_OPTIONS.map(option => (
                              <option key={option.value} value={option.value}>{option.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Jour du mois *</label>
                          <input
                            style={inputStyle}
                            type="number"
                            min="1"
                            max="31"
                            value={categoryForm.jour_du_mois}
                            onChange={e => setCategoryForm({ ...categoryForm, jour_du_mois: Number(e.target.value) })}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Montant *</label>
                          <input
                            style={inputStyle}
                            type="number"
                            value={categoryForm.montant}
                            onChange={e => setCategoryForm({ ...categoryForm, montant: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date de debut *</label>
                          <input
                            style={inputStyle}
                            type="date"
                            value={categoryForm.date_debut}
                            onChange={e => setCategoryForm({ ...categoryForm, date_debut: e.target.value })}
                            required
                          />
                        </div>

                        <div>
                          <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date de fin *</label>
                          <input
                            style={inputStyle}
                            type="date"
                            value={categoryForm.date_fin}
                            onChange={e => setCategoryForm({ ...categoryForm, date_fin: e.target.value })}
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

                <SortableTable
                  emptyMessage="Aucune categorie."
                  columns={[
                    {
                      key: 'nom',
                      label: 'Categorie',
                      sortable: false,
                      render: (_v: any, row: any) => editingCategoryId === row.id ? (
                        <input style={{ ...inputStyle, width: '180px', padding: '6px 8px' }} value={editingCategoryForm.nom} onChange={e => setEditingCategoryForm({ ...editingCategoryForm, nom: e.target.value })} />
                      ) : (
                        <span style={{ fontWeight: 600, color: '#1f2937' }}>{row.nom}</span>
                      ),
                    },
                    {
                      key: 'type_traitement_label',
                      label: 'Type',
                      sortable: false,
                      render: (_v: any, row: any) => editingCategoryId === row.id ? (
                        <select style={{ ...inputStyle, width: '180px', padding: '6px 8px' }} value={editingCategoryForm.type_traitement} onChange={e => setEditingCategoryForm({ ...editingCategoryForm, type_traitement: e.target.value })}>
                          {TYPE_OPTIONS.map(option => (
                            <option key={option.value} value={option.value}>{option.label}</option>
                          ))}
                        </select>
                      ) : (
                        <span style={{ color: '#4b5563' }}>{row.type_traitement_label}</span>
                      ),
                    },
                    {
                      key: 'jour_du_mois',
                      label: 'Jour du mois',
                      sortable: false,
                      render: (_v: any, row: any) => editingCategoryId === row.id ? (
                        <input style={{ ...inputStyle, width: '90px', padding: '6px 8px' }} type="number" min="1" max="31" value={editingCategoryForm.jour_du_mois} onChange={e => setEditingCategoryForm({ ...editingCategoryForm, jour_du_mois: e.target.value })} />
                      ) : (
                        <span style={{ fontWeight: 700, color: '#2a5ea8' }}>Jour {row.jour_du_mois}</span>
                      ),
                    },
                    {
                      key: 'montant_fmt',
                      label: 'Montant',
                      sortable: false,
                      render: (_v: any, row: any) => editingCategoryId === row.id ? (
                        <input style={{ ...inputStyle, width: '120px', padding: '6px 8px' }} type="number" value={editingCategoryForm.montant} onChange={e => setEditingCategoryForm({ ...editingCategoryForm, montant: e.target.value })} />
                      ) : (
                        <span style={{ fontWeight: 700, color: '#1f8a57' }}>{row.montant_fmt}</span>
                      ),
                    },
                    {
                      key: 'periode_fmt',
                      label: 'Periode',
                      sortable: false,
                      render: (_v: any, row: any) => editingCategoryId === row.id ? (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                          <input
                            type="date"
                            value={editingCategoryForm.date_debut}
                            onChange={e => setEditingCategoryForm({ ...editingCategoryForm, date_debut: e.target.value })}
                            style={{ ...inputStyle, width: '150px', padding: '6px 8px' }}
                          />
                          <input
                            type="date"
                            value={editingCategoryForm.date_fin}
                            onChange={e => setEditingCategoryForm({ ...editingCategoryForm, date_fin: e.target.value })}
                            style={{ ...inputStyle, width: '150px', padding: '6px 8px' }}
                          />
                        </div>
                      ) : (
                        <span style={{ color: '#4b5563' }}>{row.periode_fmt}</span>
                      ),
                    },
                    {
                      key: 'actions',
                      label: 'Actions',
                      sortable: false,
                      render: (_v: any, row: any) => editingCategoryId === row.id ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => handleUpdateCategory(row.id)} style={{ ...stateButton, background: '#1d2836', color: '#fff', borderColor: '#1d2836' }}>OK</button>
                          <button onClick={() => setEditingCategoryId(null)} style={stateButton}>X</button>
                        </div>
                      ) : (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button
                            onClick={() => {
                              setEditingCategoryId(row.id)
                              setEditingCategoryForm({
                                nom: row.nom,
                                type_traitement: row.type_traitement,
                                jour_du_mois: String(row.jour_du_mois),
                                montant: String(row.montant),
                                date_debut: row.date_debut || '',
                                date_fin: row.date_fin || '',
                              })
                            }}
                            style={{ ...stateButton, color: '#2a5ea8', borderColor: '#cddcf5' }}
                          >
                            Modifier
                          </button>
                          <button onClick={() => handleDeleteCategory(row.id)} style={{ ...stateButton, color: '#c93128', borderColor: '#f0c7c5' }}>
                            Supprimer
                          </button>
                        </div>
                      ),
                    },
                  ]}
                  data={categoryTableData}
                />
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default ChargesFixes
