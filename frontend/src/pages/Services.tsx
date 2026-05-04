import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import SortableTable from '../components/SortableTable'

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

const Services = () => {
  document.title = 'Services - NEWIRIS'

  const [services, setServices] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [activeTab, setActiveTab] = useState<'dashboard' | 'services'>('dashboard')
  const [showForm, setShowForm] = useState(false)

  const [form, setForm] = useState({
    nom: '',
    responsable: '',
  })
  const [photo, setPhoto] = useState<File | null>(null)

  const [editingId, setEditingId] = useState<number | null>(null)
  const [editForm, setEditForm] = useState({
    nom: '',
    responsable: '',
  })
  const [editPhoto, setEditPhoto] = useState<File | null>(null)

  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const fetchData = async () => {
    setLoading(true)
    try {
      const [servicesRes, usersRes] = await Promise.all([
        api.get('/services/'),
        api.get('/auth/users/'),
      ])
      setServices(Array.isArray(servicesRes.data) ? servicesRes.data : [])
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
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
      const formData = new FormData()
      formData.append('nom', form.nom)
      if (form.responsable) formData.append('responsable', form.responsable)
      if (photo) formData.append('photo', photo)

      await api.post('/services/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setShowForm(false)
      setForm({ nom: '', responsable: '' })
      setPhoto(null)
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Creation du service impossible.')
    }
  }

  const handleUpdate = async (id: number) => {
    try {
      const formData = new FormData()
      formData.append('nom', editForm.nom)
      if (editForm.responsable) {
        formData.append('responsable', editForm.responsable)
      } else {
        formData.append('responsable', '')
      }
      if (editPhoto) formData.append('photo', editPhoto)

      await api.patch(`/services/${id}/`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      setEditingId(null)
      setEditPhoto(null)
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Modification du service impossible.')
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/services/${id}/`)
      notifySuccess()
      fetchData()
    } catch (err) {
      console.error(err)
      setError('Suppression du service impossible.')
    }
  }

  const stats = useMemo(() => {
    return {
      total: services.length,
      withLogo: services.filter((s: any) => !!s.photo_url).length,
      withResponsable: services.filter((s: any) => !!s.responsable).length,
    }
  }, [services])

  return (
    <Layout>
      <div style={{ padding: '16px 18px 20px', fontSize: '14px' }}>
        <div style={{ marginBottom: '14px' }}>
          <div style={{ ...cardStyle, padding: '18px 20px 16px', background: 'linear-gradient(135deg, #ffffff 0%, #fbfcfd 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1d2836', marginBottom: '6px' }}>
                  Services
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '720px' }}>
                  Gestion des services, des responsables et des logos utilises dans les autres modules.
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <button onClick={() => setShowForm(!showForm)} style={{ ...compactButton(true), background: '#c93128', borderColor: '#c93128' }}>
                  + Nouveau service
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
          <button style={compactButton(activeTab === 'services')} onClick={() => setActiveTab('services')}>Services</button>
        </div>

        {showForm && (
          <div style={{ ...cardStyle, padding: '18px', marginBottom: '14px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '700', color: '#1d2836', marginBottom: '14px' }}>Nouveau service</h3>
            <form onSubmit={handleSubmit}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nom du service *</label>
                  <input style={inputStyle} value={form.nom} onChange={e => setForm({ ...form, nom: e.target.value })} required />
                </div>

                <div>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Responsable</label>
                  <select style={inputStyle} value={form.responsable} onChange={e => setForm({ ...form, responsable: e.target.value })}>
                    <option value="">Selectionner...</option>
                    {users.map((u: any) => (
                      <option key={u.id} value={u.id}>{u.username}</option>
                    ))}
                  </select>
                </div>

                <div style={{ gridColumn: '1 / -1' }}>
                  <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Logo / Photo</label>
                  <label
                    style={{
                      display: 'block',
                      border: '1px dashed #cfd7df',
                      borderRadius: '10px',
                      padding: '11px',
                      cursor: 'pointer',
                      background: '#f8fafc',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', background: '#eef2f7', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '11px', fontWeight: '700' }}>
                        LOGO
                      </div>
                      <div>
                        <div style={{ fontSize: '12px', fontWeight: '600', color: photo ? '#2a5ea8' : '#4b5563' }}>
                          {photo ? photo.name : 'Cliquer pour ajouter un logo'}
                        </div>
                        <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '2px' }}>
                          {photo ? `${(photo.size / 1024).toFixed(1)} KB` : 'PNG, JPG'}
                        </div>
                      </div>
                    </div>
                    <input type="file" accept="image/*" onChange={e => setPhoto(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                <button type="submit" style={compactButton(true)}>Creer</button>
                <button type="button" onClick={() => { setShowForm(false); setPhoto(null) }} style={compactButton(false)}>Annuler</button>
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
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px' }}>
                <div style={{ ...cardStyle, padding: '14px', borderTop: '3px solid #1d2836' }}>
                  <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Services total</div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#1d2836' }}>{stats.total}</div>
                </div>

                <div style={{ ...cardStyle, padding: '14px', borderTop: '3px solid #2a5ea8' }}>
                  <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Services avec logo</div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#2a5ea8' }}>{stats.withLogo}</div>
                </div>

                <div style={{ ...cardStyle, padding: '14px', borderTop: '3px solid #1f8a57' }}>
                  <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Services avec responsable</div>
                  <div style={{ fontSize: '17px', fontWeight: '800', color: '#1f8a57' }}>{stats.withResponsable}</div>
                </div>
              </div>
            )}

            {activeTab === 'services' && (
              <SortableTable
                emptyMessage="Aucun service."
                columns={[
                  {
                    key: 'photo_url',
                    label: 'Logo',
                    sortable: false,
                    render: (_v: any, row: any) => editingId === row.id ? (
                      <div style={{ minWidth: '170px' }}>
                        <label
                          style={{
                            display: 'block',
                            border: '1px dashed #cfd7df',
                            borderRadius: '10px',
                            padding: '8px',
                            cursor: 'pointer',
                            background: '#f8fafc',
                          }}
                        >
                          <div style={{ fontSize: '11px', color: '#4b5563', fontWeight: 600 }}>
                            {editPhoto ? editPhoto.name : 'Choisir un logo'}
                          </div>
                          <input type="file" accept="image/*" onChange={e => setEditPhoto(e.target.files?.[0] || null)} style={{ display: 'none' }} />
                        </label>
                      </div>
                    ) : row.photo_url ? (
                      <img src={row.photo_url} alt={row.nom} style={{ width: '42px', height: '42px', borderRadius: '10px', objectFit: 'cover', border: '1px solid #d9e0e7' }} />
                    ) : (
                      <div style={{ width: '42px', height: '42px', borderRadius: '10px', background: '#eef2f7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#94a3b8', fontSize: '10px', fontWeight: 700 }}>
                        LOGO
                      </div>
                    ),
                  },
                  {
                    key: 'nom',
                    label: 'Nom',
                    sortable: false,
                    render: (_v: any, row: any) => editingId === row.id ? (
                      <input style={{ ...inputStyle, width: '220px', padding: '6px 8px' }} value={editForm.nom} onChange={e => setEditForm({ ...editForm, nom: e.target.value })} />
                    ) : (
                      <span style={{ fontWeight: 600, color: '#1f2937' }}>{row.nom}</span>
                    ),
                  },
                  {
                    key: 'responsable_nom',
                    label: 'Responsable',
                    sortable: false,
                    render: (_v: any, row: any) => editingId === row.id ? (
                      <select style={{ ...inputStyle, width: '180px', padding: '6px 8px' }} value={editForm.responsable} onChange={e => setEditForm({ ...editForm, responsable: e.target.value })}>
                        <option value="">Selectionner...</option>
                        {users.map((u: any) => (
                          <option key={u.id} value={u.id}>{u.username}</option>
                        ))}
                      </select>
                    ) : (
                      <span style={{ color: '#4b5563' }}>{row.responsable_nom || '-'}</span>
                    ),
                  },
                  {
                    key: 'created_at',
                    label: 'Cree le',
                    render: (_v: any, row: any) => <span style={{ color: '#4b5563' }}>{new Date(row.created_at).toLocaleDateString('fr-FR')}</span>,
                  },
                  {
                    key: 'modifier',
                    label: 'Modifier',
                    sortable: false,
                    render: (_v: any, row: any) => editingId === row.id ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleUpdate(row.id)} style={{ ...stateButton, background: '#1d2836', color: '#fff', borderColor: '#1d2836' }}>
                          OK
                        </button>
                        <button onClick={() => { setEditingId(null); setEditPhoto(null) }} style={stateButton}>
                          X
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingId(row.id)
                          setEditForm({
                            nom: row.nom || '',
                            responsable: row.responsable ? String(row.responsable) : '',
                          })
                          setEditPhoto(null)
                        }}
                        style={{ ...stateButton, color: '#2a5ea8', borderColor: '#cddcf5' }}
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
                      <button onClick={() => handleDelete(row.id)} style={{ ...stateButton, color: '#c93128', borderColor: '#f0c7c5' }}>
                        Supprimer
                      </button>
                    ),
                  },
                ]}
                data={services}
              />
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default Services
