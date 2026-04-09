import { useEffect, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import SortableTable from '../components/SortableTable'

const ChargesFixes = () => {
  document.title = 'Charges fixes — Newiris'

  const [charges, setCharges] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedService, setSelectedService] = useState<any | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [categories, setCategories] = useState<string[]>([
    'Loyer', 'Électricité', 'Eau', 'Internet', 'Téléphone',
    'Assurance', 'Salaires', 'Transport', 'Maintenance',
    'Fournitures bureau', 'Autres',
  ])
  const [showAddCat, setShowAddCat] = useState(false)
  const [newCat, setNewCat] = useState('')
  const [showAddPerson, setShowAddPerson] = useState(false)
  const [newPerson, setNewPerson] = useState('')
  const [form, setForm] = useState({ service: '', categorie: '', montant: '', date: '' })

  const fetchData = async () => {
    try {
      const [chargesRes, servicesRes, usersRes] = await Promise.all([
        api.get('/charges-fixes/'),
        api.get('/services/'),
        api.get('/auth/users/'),
      ])
      setCharges(chargesRes.data)
      setServices(servicesRes.data)
      setUsers(usersRes.data)
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
        date: form.date || null,
      })
      setShowForm(false)
      setForm({ service: selectedService?.id?.toString() || '', categorie: '', montant: '', date: '' })
      fetchData()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: number) => {
    try { await api.delete(`/charges-fixes/${id}/`); fetchData() } catch (err) { console.error(err) }
  }

  const handleAddCategory = () => {
    if (newCat.trim() && !categories.includes(newCat.trim())) {
      setCategories([...categories, newCat.trim()])
      setForm({ ...form, categorie: newCat.trim() })
      setNewCat(''); setShowAddCat(false)
    }
  }

  const handleAddPerson = async () => {
    if (!newPerson.trim()) return
    try {
      const res = await api.post('/auth/users/', { username: newPerson.trim(), password: 'newiris1234', role: 'others' })
      setUsers([...users, res.data])
      setForm({ ...form, service: res.data.id.toString() })
      setNewPerson(''); setShowAddPerson(false)
    } catch (err) { console.error(err) }
  }

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none' }
  const totalMontant = charges.reduce((sum, c) => sum + parseFloat(c.montant), 0)
  const getChargesForService = (serviceId: number) => charges.filter(c => c.service === serviceId || c.service === String(serviceId))
  const getTotalForService = (serviceId: number) => getChargesForService(serviceId).reduce((sum, c) => sum + parseFloat(c.montant), 0)

  const chargesTableData = selectedService ? getChargesForService(selectedService.id).map((c, i) => ({
    ...c,
    index: i + 1,
    montant_fmt: `${parseFloat(c.montant).toLocaleString('fr-FR')} DH`,
    created_at_fmt: new Date(c.created_at).toLocaleDateString('fr-FR'),
    date_fmt: c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '—',
  })) : []

  if (loading) return <Layout><div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div></Layout>

  return (
    <Layout>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>
              Charges fixes {selectedService && <span style={{ fontSize: '16px', color: '#0099cc' }}>— {selectedService.nom}</span>}
            </h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Gestion des charges fixes</p>
          </div>
          {selectedService && (
            <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', background: '#0099cc', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>+ Ajouter charge fixe</button>
          )}
        </div>

        <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed', borderTop: '3px solid #0099cc', marginBottom: '20px', display: 'inline-block', minWidth: '200px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Total charges fixes</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#0099cc' }}>
            {selectedService ? getTotalForService(selectedService.id).toLocaleString('fr-FR') : totalMontant.toLocaleString('fr-FR')} DH
          </div>
        </div>

        {!selectedService && (
          services.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '60px', fontSize: '14px' }}>Aucun service disponible</div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px', maxWidth: '900px', margin: '0 auto' }}>
              {services.map(service => {
                const total = getTotalForService(service.id)
                const nbCharges = getChargesForService(service.id).length
                return (
                  <div key={service.id}
                    onClick={() => { setSelectedService(service); setForm({ ...form, service: service.id.toString() }) }}
                    style={{ background: '#fff', borderRadius: '12px', border: '2px solid #e8eaed', padding: '30px', cursor: 'pointer', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                    onMouseOver={e => { e.currentTarget.style.borderColor = '#0099cc'; e.currentTarget.style.boxShadow = '0 4px 16px rgba(0,153,204,0.15)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                    onMouseOut={e => { e.currentTarget.style.borderColor = '#e8eaed'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.05)'; e.currentTarget.style.transform = 'translateY(0)' }}
                  >
                    <div style={{ fontSize: '16px', fontWeight: '700', color: '#1a3a6b', marginBottom: '8px' }}>{service.nom}</div>
                    <div style={{ fontSize: '22px', fontWeight: '800', color: '#0099cc', marginBottom: '6px' }}>{total.toLocaleString('fr-FR')} DH</div>
                    <div style={{ fontSize: '12px', color: '#aaa' }}>{nbCharges} charge{nbCharges > 1 ? 's' : ''}</div>
                  </div>
                )
              })}
            </div>
          )
        )}

        {selectedService && (
          <div>
            <button onClick={() => { setSelectedService(null); setShowForm(false) }}
              style={{ marginBottom: '16px', padding: '6px 14px', background: '#fff', color: '#1a3a6b', border: '1px solid #1a3a6b', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>
              ← Retour aux services
            </button>

            {showForm && (
              <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
                <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouvelle charge fixe — {selectedService.nom}</h3>
                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Personne *</label>
                      <select style={inputStyle} value={form.service}
                        onChange={e => { if (e.target.value === '__add_person__') { setShowAddPerson(true) } else { setForm({ ...form, service: e.target.value }); setShowAddPerson(false) } }}
                        required={!showAddPerson}>
                        <option value="">Sélectionner une personne...</option>
                        {users.map(u => <option key={u.id} value={u.id}>{u.username}</option>)}
                        <option value="__add_person__">+ Add New</option>
                      </select>
                      {showAddPerson && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                          <input style={{ ...inputStyle, flex: 1 }} value={newPerson} onChange={e => setNewPerson(e.target.value)} placeholder="Nom de la personne..." />
                          <button type="button" onClick={handleAddPerson} style={{ padding: '8px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button>
                          <button type="button" onClick={() => { setShowAddPerson(false); setNewPerson('') }} style={{ padding: '8px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>X</button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Catégorie *</label>
                      <select style={inputStyle} value={form.categorie}
                        onChange={e => { if (e.target.value === '__add_new__') { setShowAddCat(true) } else { setForm({ ...form, categorie: e.target.value }); setShowAddCat(false) } }}
                        required={!showAddCat}>
                        <option value="">Sélectionner une catégorie...</option>
                        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                        <option value="__add_new__">+ Add New</option>
                      </select>
                      {showAddCat && (
                        <div style={{ display: 'flex', gap: '6px', marginTop: '6px' }}>
                          <input style={{ ...inputStyle, flex: 1 }} value={newCat} onChange={e => setNewCat(e.target.value)} placeholder="Nouvelle catégorie..." onKeyDown={e => e.key === 'Enter' && (e.preventDefault(), handleAddCategory())} />
                          <button type="button" onClick={handleAddCategory} style={{ padding: '8px 12px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>OK</button>
                          <button type="button" onClick={() => { setShowAddCat(false); setNewCat('') }} style={{ padding: '8px 12px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>X</button>
                        </div>
                      )}
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Montant (DH) *</label>
                      <input style={inputStyle} type="number" value={form.montant} onChange={e => setForm({ ...form, montant: e.target.value })} required placeholder="Ex: 5000" />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Période (date)</label>
                      <input style={inputStyle} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button type="submit" style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                    <button type="button" onClick={() => { setShowForm(false); setShowAddCat(false); setShowAddPerson(false) }} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
                  </div>
                </form>
              </div>
            )}

            <SortableTable
              emptyMessage="Aucune charge fixe pour ce service"
              columns={[
                { key: 'index', label: '#', render: (_v: any, row: any) => <span style={{ color: '#aaa' }}>{row.index}</span> },
                { key: 'service', label: 'Personne', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.service}</span> },
                { key: 'categorie', label: 'Catégorie', render: (_v: any, row: any) => <span style={{ fontWeight: '500', color: '#2c2c2c' }}>{row.categorie}</span> },
                { key: 'montant_fmt', label: 'Montant', render: (_v: any, row: any) => <span style={{ fontWeight: '600', color: '#0099cc' }}>{row.montant_fmt}</span> },
                { key: 'date_fmt', label: 'Période', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.date_fmt}</span> },
                { key: 'created_at_fmt', label: 'Créé le', render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.created_at_fmt}</span> },
                {
                  key: 'actions', label: 'Actions', sortable: false,
                  render: (_v: any, row: any) => (
                    <button onClick={() => handleDelete(row.id)} style={{ padding: '4px 10px', background: '#fdeaea', color: '#c0392b', border: '1px solid #f5c6c6', borderRadius: '4px', fontSize: '11px', cursor: 'pointer' }}>Supprimer</button>
                  )
                },
              ]}
              data={chargesTableData}
            />
          </div>
        )}
      </div>
    </Layout>
  )
}

export default ChargesFixes