import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import SortableTable from '../components/SortableTable'
import ImportExcel from '../components/ImportExcel'

const categoriesFixes: string[] = [
  'Loyer', 'Électricité', 'Eau', 'Internet', 'Téléphone',
  'Assurance', 'Salaires', 'Transport', 'Maintenance',
  'Fournitures bureau', 'Autres',
]

const ChargesFixes = () => {
  document.title = 'Charges fixes — Newiris'

  const [charges, setCharges] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [selectedService, setSelectedService] = useState<any | null>(null)
  const [showCategories, setShowCategories] = useState(false)
  const [categoriesConfig, setCategoriesConfig] = useState<{ categorie: string; jour_du_mois: number }[]>([])
  const [showAddCategorie, setShowAddCategorie] = useState(false)
  const [newCategorie, setNewCategorie] = useState({ categorie: '', jour_du_mois: '' })
  const [form, setForm] = useState({ service: '', categorie: '', montant: '', date_debut: '', date_fin: '' })

  const fetchData = async () => {
    try {
      const [chargesRes, servicesRes] = await Promise.all([
        api.get('/charges-fixes/'),
        api.get('/services/'),
      ])
      setCharges(chargesRes.data)
      setServices(servicesRes.data)
    } catch (err) { console.error(err) }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchData() }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      await api.post('/charges-fixes/', {
        service: parseInt(form.service),
        categorie: form.categorie,
        montant: parseFloat(form.montant),
        date: form.date_debut || null,
      })
      setShowForm(false)
      setForm({ service: '', categorie: '', montant: '', date_debut: '', date_fin: '' })
      await fetchData()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: number) => {
    try { await api.delete(`/charges-fixes/${id}/`); await fetchData() } catch (err) { console.error(err) }
  }

  const handleImport = async (rows: any[]) => {
    for (const row of rows) {
      try {
        const service = services.find(s => s.nom.toLowerCase() === String(row.service || '').toLowerCase())
        await api.post('/charges-fixes/', {
          service: service ? service.id : parseInt(String(row.service)) || services[0]?.id,
          categorie: row.categorie || '',
          montant: parseFloat(String(row.montant || '0').replace(',', '.')),
          date: row.date || null,
        })
      } catch (err) { console.error(err) }
    }
    setLoading(true)
    await fetchData()
  }

  const handleAddCategorie = () => {
    if (!newCategorie.categorie || !newCategorie.jour_du_mois) return
    setCategoriesConfig(prev => [...prev, {
      categorie: newCategorie.categorie,
      jour_du_mois: parseInt(newCategorie.jour_du_mois)
    }])
    setNewCategorie({ categorie: '', jour_du_mois: '' })
    setShowAddCategorie(false)
  }

  const handleDeleteCategorie = (index: number) => {
    setCategoriesConfig(prev => prev.filter((_, i) => i !== index))
  }

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none' }
  const totalMontant = charges.reduce((sum, c) => sum + parseFloat(c.montant), 0)

  const chargesService = selectedService
    ? charges.filter(c => {
        const serviceNom = typeof c.service === 'string' ? c.service : services.find(s => s.id === c.service)?.nom
        return serviceNom === selectedService.nom
      })
    : []

  const totalParService = (serviceNom: string) =>
    charges.filter(c => {
      const nom = typeof c.service === 'string' ? c.service : services.find(s => s.id === c.service)?.nom
      return nom === serviceNom
    }).reduce((sum, c) => sum + parseFloat(c.montant), 0)

  const tableData = chargesService.map((c, i) => ({
    ...c,
    index: i + 1,
    montant_fmt: `${parseFloat(c.montant).toLocaleString('fr-FR')} DH`,
    created_at_fmt: new Date(c.created_at).toLocaleDateString('fr-FR'),
    date_fmt: c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '—',
  }))

  // ─── VUE CATÉGORIES ───
  if (showCategories) {
    const categoriesTableData = categoriesConfig.map((cat, i) => ({ ...cat, _index: i }))

    return (
      <Layout>
        <div style={{ padding: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <button onClick={() => setShowCategories(false)} style={{ background: '#e8eaed', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: '#555' }}>← Retour</button>
              <div>
                <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Catégories des charges fixes</h1>
                <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Configuration des catégories et jours de prévision</p>
              </div>
            </div>
            <button onClick={() => setShowAddCategorie(true)} style={{ padding: '8px 16px', background: '#0099cc', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>+ Ajouter NV</button>
          </div>

          {showAddCategorie && (
            <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
              <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouvelle catégorie</h3>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Catégorie *</label>
                  <select style={inputStyle} value={newCategorie.categorie} onChange={e => setNewCategorie(p => ({ ...p, categorie: e.target.value }))}>
                    <option value="">Sélectionner...</option>
                    {categoriesFixes.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date de prévision (jour du mois) *</label>
                  <input style={inputStyle} type="number" min="1" max="31" value={newCategorie.jour_du_mois} onChange={e => setNewCategorie(p => ({ ...p, jour_du_mois: e.target.value }))} placeholder="Ex: 5" />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button onClick={handleAddCategorie} style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                <button onClick={() => { setShowAddCategorie(false); setNewCategorie({ categorie: '', jour_du_mois: '' }) }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </div>
          )}

          <SortableTable
            emptyMessage="Aucune catégorie configurée — cliquez sur + Ajouter NV"
            columns={[
              { key: '_index', label: '#', render: (_v: any, row: any) => <span style={{ color: '#aaa' }}>{row._index + 1}</span> },
              { key: 'categorie', label: 'Catégorie', render: (_v: any, row: any) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{row.categorie}</span> },
              { key: 'jour_du_mois', label: 'Date de prévision (jour du mois)', render: (_v: any, row: any) => (
                <span style={{ background: '#e8f4fb', color: '#0099cc', padding: '3px 10px', borderRadius: '4px', fontSize: '12px', fontWeight: '600' }}>
                  Jour {row.jour_du_mois} du mois
                </span>
              )},
              { key: 'actions', label: 'Actions', sortable: false, render: (_v: any, row: any) => (
                <button onClick={() => handleDeleteCategorie(row._index)} style={{ padding: '4px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Supprimer</button>
              )},
            ]}
            data={categoriesTableData}
          />
        </div>
      </Layout>
    )
  }

  return (
    <Layout>
      <div style={{ padding: '20px' }}>

        {/* HEADER */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {selectedService && (
              <button onClick={() => { setSelectedService(null); setShowForm(false) }}
                style={{ background: '#e8eaed', border: 'none', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer', fontSize: '12px', color: '#555' }}>
                ← Retour
              </button>
            )}
            <div>
              <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>
                Charges fixes {selectedService ? `— ${selectedService.nom}` : ''}
              </h1>
              <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Gestion des charges fixes</p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <ImportExcel
              onImport={handleImport}
              columns={[
                { key: 'service', label: 'Service' },
                { key: 'categorie', label: 'Catégorie' },
                { key: 'montant', label: 'Montant' },
                { key: 'date', label: 'Période' },
              ]}
            />
            {selectedService && (
              <button onClick={() => { setShowForm(!showForm); setForm({ ...form, service: String(selectedService.id) }) }}
                style={{ padding: '8px 16px', background: '#0099cc', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
                + Ajouter charge fixe
              </button>
            )}
          </div>
        </div>

        {/* KPI TOTAL */}
        <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed', borderTop: '3px solid #0099cc', marginBottom: '20px', display: 'inline-block', minWidth: '200px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>
            {selectedService ? `Total charges fixes — ${selectedService.nom}` : 'Total charges fixes'}
          </div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#0099cc' }}>
            {selectedService ? totalParService(selectedService.nom).toLocaleString('fr-FR') : totalMontant.toLocaleString('fr-FR')} DH
          </div>
        </div>

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div>
        ) : !selectedService ? (
          /* ─── VUE SERVICES (CARDS) ─── */
          <div>
            {services.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#aaa', padding: '40px', fontSize: '13px' }}>
                Aucun service trouvé. Créez d'abord des services.
              </div>
            ) : (
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '16px' }}>

                {/* ─── CARD CATÉGORIES ─── */}
                <div
                  onClick={() => setShowCategories(true)}
                  style={{
                    background: '#fff', borderRadius: '10px',
                    border: '2px dashed #1a3a6b',
                    padding: '20px', cursor: 'pointer',
                    transition: 'all 0.2s',
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                  }}
                  onMouseOver={e => {
                    e.currentTarget.style.borderColor = '#0099cc'
                    e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,153,204,0.15)'
                    e.currentTarget.style.transform = 'translateY(-2px)'
                  }}
                  onMouseOut={e => {
                    e.currentTarget.style.borderColor = '#1a3a6b'
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                    e.currentTarget.style.transform = 'translateY(0)'
                  }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ fontSize: '32px' }}>📋</div>
                    <span style={{ fontSize: '10px', background: '#e8edf5', color: '#1a3a6b', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                      {categoriesConfig.length} config
                    </span>
                  </div>
                  <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a3a6b', marginBottom: '8px' }}>Catégories des charges fixes</div>
                  <div style={{ fontSize: '11px', color: '#888' }}>Gérer les catégories et jours de prévision</div>
                </div>

                {/* ─── CARDS SERVICES ─── */}
                {services.map(service => {
                  const total = totalParService(service.nom)
                  const count = charges.filter(c => {
                    const nom = typeof c.service === 'string' ? c.service : services.find(s => s.id === c.service)?.nom
                    return nom === service.nom
                  }).length
                  return (
                    <div key={service.id}
                      onClick={() => setSelectedService(service)}
                      style={{
                        background: '#fff', borderRadius: '10px',
                        border: '2px solid #e8eaed',
                        padding: '20px', cursor: 'pointer',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                      }}
                      onMouseOver={e => {
                        e.currentTarget.style.borderColor = '#0099cc'
                        e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,153,204,0.15)'
                        e.currentTarget.style.transform = 'translateY(-2px)'
                      }}
                      onMouseOut={e => {
                        e.currentTarget.style.borderColor = '#e8eaed'
                        e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.06)'
                        e.currentTarget.style.transform = 'translateY(0)'
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div style={{ fontSize: '32px' }}>🏢</div>
                        <span style={{ fontSize: '10px', background: '#e8f4fb', color: '#0099cc', padding: '2px 8px', borderRadius: '4px', fontWeight: '600' }}>
                          {count} charge{count > 1 ? 's' : ''}
                        </span>
                      </div>
                      <div style={{ fontSize: '15px', fontWeight: '700', color: '#1a3a6b', marginBottom: '8px' }}>{service.nom}</div>
                      <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Total charges fixes</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#0099cc' }}>
                        {total.toLocaleString('fr-FR')} DH
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        ) : (
          /* ─── VUE DÉTAIL SERVICE ─── */
          <div>
            {showForm && (
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>
                  Nouvelle charge fixe — {selectedService.nom}
                </h3>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Service *</label>
                      <select style={inputStyle} value={form.service} onChange={e => setForm({ ...form, service: e.target.value })} required>
                        <option value="">Sélectionner...</option>
                        {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Catégorie *</label>
                      <select style={inputStyle} value={form.categorie} onChange={e => setForm({ ...form, categorie: e.target.value })} required>
                        <option value="">Sélectionner une catégorie...</option>
                        {categoriesFixes.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Montant (DH) *</label>
                      <input style={inputStyle} type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} required placeholder="Ex: 5000" />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date début période</label>
                      <input style={inputStyle} type="date" value={form.date_debut} onChange={e => setForm({ ...form, date_debut: e.target.value })} />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Date fin période</label>
                      <input style={inputStyle} type="date" value={form.date_fin} onChange={e => setForm({ ...form, date_fin: e.target.value })} />
                    </div>
                    {form.date_debut && form.date_fin && (
                      <div style={{ gridColumn: '1 / -1' }}>
                        <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Période</label>
                        <div style={{ background: '#e8f4fb', border: '1px solid #b3d9f0', borderRadius: '6px', padding: '8px 12px', fontSize: '13px', color: '#0099cc', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          📅 {new Date(form.date_debut).toLocaleDateString('fr-FR')} au {new Date(form.date_fin).toLocaleDateString('fr-FR')}
                          <button type="button" onClick={() => setForm({ ...form, date_debut: '', date_fin: '' })} style={{ background: 'none', border: 'none', color: '#c0392b', cursor: 'pointer', fontSize: '12px' }}>✕</button>
                        </div>
                      </div>
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button type="submit" style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                    <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                  </div>
                </form>
              </div>
            )}

            <SortableTable
              emptyMessage="Aucune charge fixe pour ce service"
              columns={[
                { key: 'index', label: '#', render: (_v: any, row: any) => <span style={{ color: '#aaa' }}>{row.index}</span> },
                { key: 'service', label: 'Service', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.service}</span> },
                { key: 'categorie', label: 'Catégorie', render: (_v: any, row: any) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{row.categorie}</span> },
                { key: 'montant_fmt', label: 'Montant', render: (_v: any, row: any) => <span style={{ fontWeight: '600', color: '#0099cc' }}>{row.montant_fmt}</span> },
                { key: 'date_fmt', label: 'Période', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.date_fmt}</span> },
                { key: 'created_at_fmt', label: 'Créé le', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.created_at_fmt}</span> },
                { key: 'actions', label: 'Actions', sortable: false, render: (_v: any, row: any) => (
                  <button onClick={() => handleDelete(row.id)} style={{ padding: '4px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Supprimer</button>
                )},
              ]}
              data={tableData}
            />
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ChargesFixes