import { useEffect, useMemo, useState } from 'react'

import api from '../api/axios'
import Layout from '../components/Layout'
import SortableTable from '../components/SortableTable'
import { useAuth } from '../context/AuthContext'

interface PageDefinition {
  id: number
  code: string
  label: string
  path: string
  sort_order: number
}

interface PagePermissionFormRow {
  page: number
  code: string
  label: string
  can_view: boolean
  can_create: boolean
  can_edit: boolean
  can_delete: boolean
}

interface UserFormState {
  username: string
  email: string
  password: string
  first_name: string
  last_name: string
  role: string
  fonction: string
  phone: string
  page_permissions: PagePermissionFormRow[]
}

const MOOD_COLORS = ['#c93128', '#1d2836', '#2a5ea8', '#1f8a57', '#8e44ad']

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

const sectionMap: Record<string, string> = {
  users: 'Administration',
  services: 'Administration',
  dashboard: 'Pilotage',
  banque: 'Pilotage',
  caisse: 'Pilotage',
  previsions: 'Pilotage',
  charges_fixes: 'Charges',
  charges_variables: 'Charges',
  salaires: 'Charges',
  ajoute_charges: 'Charges',
  fournisseurs: 'Operations',
  demandes_cheques: 'Operations',
  commandes: 'Operations',
  vehicules: 'Terrain',
  equipe: 'Terrain',
  chantiers: 'Terrain',
}

const sectionOrder = ['Administration', 'Pilotage', 'Charges', 'Operations', 'Terrain']

const Users = () => {
  document.title = 'Utilisateurs - NEWIRIS'

  const { refreshUser, user: currentUser } = useAuth()
  const [users, setUsers] = useState<any[]>([])
  const [pages, setPages] = useState<PageDefinition[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [editingUserId, setEditingUserId] = useState<number | null>(null)
  const [activeTab, setActiveTab] = useState<'dashboard' | 'users' | 'permissions'>('dashboard')
  const [permissionSearch, setPermissionSearch] = useState('')
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [form, setForm] = useState<UserFormState>({
    username: '',
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    role: 'others',
    fonction: '',
    phone: '',
    page_permissions: [],
  })

  const roleColor: { [key: string]: string } = {
    admin: '#1d2836',
    super_admin: '#8e44ad',
    achat: '#2a5ea8',
    others: '#6b7280',
    responsable_technique: '#c93128',
  }

  const roleLabel: { [key: string]: string } = {
    admin: 'Administrateur',
    super_admin: 'Super administrateur',
    achat: 'Achat',
    others: 'Autre',
    responsable_technique: 'Responsable technique',
  }

  const actionLabels: Record<'can_view' | 'can_create' | 'can_edit' | 'can_delete', string> = {
    can_view: 'Voir',
    can_create: 'Creer',
    can_edit: 'Modifier',
    can_delete: 'Supprimer',
  }

  const buildEmptyPermissions = (pageDefinitions: PageDefinition[]) =>
    pageDefinitions.map((page) => ({
      page: page.id,
      code: page.code,
      label: page.label,
      can_view: false,
      can_create: false,
      can_edit: false,
      can_delete: false,
    }))

  const resetForm = (pageDefinitions: PageDefinition[]) => {
    setEditingUserId(null)
    setForm({
      username: '',
      email: '',
      password: '',
      first_name: '',
      last_name: '',
      role: 'others',
      fonction: '',
      phone: '',
      page_permissions: buildEmptyPermissions(pageDefinitions),
    })
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      const [usersRes, pagesRes] = await Promise.all([
        api.get('/auth/users/'),
        api.get('/auth/pages/'),
      ])
      setUsers(Array.isArray(usersRes.data) ? usersRes.data : [])
      setPages(Array.isArray(pagesRes.data) ? pagesRes.data : [])
      if (!showForm && !editingUserId) {
        resetForm(pagesRes.data)
      }
    } catch (err) {
      console.error(err)
      setError('Impossible de charger les utilisateurs.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  const normalizePermissions = (pageDefinitions: PageDefinition[], existing: any[] = []) => {
    const existingByCode = new Map(existing.map((item) => [item.page_code, item]))
    return pageDefinitions.map((page) => {
      const found = existingByCode.get(page.code)
      return {
        page: page.id,
        code: page.code,
        label: page.label,
        can_view: !!found?.can_view,
        can_create: !!found?.can_create,
        can_edit: !!found?.can_edit,
        can_delete: !!found?.can_delete,
      }
    })
  }

  const openCreateForm = () => {
    resetForm(pages)
    setShowForm(true)
    setActiveTab('users')
    setSuccess('')
    setError('')
  }

  const openEditForm = (user: any) => {
    setEditingUserId(user.id)
    setForm({
      username: user.username || '',
      email: user.email || '',
      password: '',
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      role: user.role || 'others',
      fonction: user.fonction || '',
      phone: user.phone || '',
      page_permissions: normalizePermissions(pages, user.page_permissions || []),
    })
    setShowForm(true)
    setActiveTab('users')
    setSuccess('')
    setError('')
  }

  const closeForm = () => {
    setShowForm(false)
    setSuccess('')
    setError('')
    resetForm(pages)
  }

  const buildPayload = () => ({
    ...form,
    page_permissions: form.page_permissions
      .filter((item) => item.can_view || item.can_create || item.can_edit || item.can_delete)
      .map((item) => ({
        page: item.page,
        can_view: item.can_view,
        can_create: item.can_create,
        can_edit: item.can_edit,
        can_delete: item.can_delete,
      })),
    ...(editingUserId && !form.password ? { password: undefined } : {}),
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    try {
      const payload = buildPayload()
      if (editingUserId) {
        await api.put(`/auth/users/${editingUserId}/`, payload)
        setSuccess('Utilisateur mis a jour avec succes.')
      } else {
        await api.post('/auth/users/', payload)
        setSuccess('Utilisateur cree avec succes.')
      }

      if (currentUser && editingUserId === currentUser.id) {
        await refreshUser()
      }

      closeForm()
      await fetchData()
    } catch (err) {
      console.error(err)
      setError("Impossible d'enregistrer cet utilisateur.")
    }
  }

  const handleDelete = async (id: number) => {
    try {
      await api.delete(`/auth/users/${id}/`)
      setSuccess('Utilisateur supprime avec succes.')
      await fetchData()
    } catch (err) {
      console.error(err)
      setError("Impossible de supprimer cet utilisateur.")
    }
  }

  const updatePermission = (
    pageId: number,
    field: 'can_view' | 'can_create' | 'can_edit' | 'can_delete',
    checked: boolean
  ) => {
    setForm((current) => ({
      ...current,
      page_permissions: current.page_permissions.map((item) => {
        if (item.page !== pageId) return item

        if (field === 'can_view' && !checked) {
          return {
            ...item,
            can_view: false,
            can_create: false,
            can_edit: false,
            can_delete: false,
          }
        }

        if (field !== 'can_view' && checked) {
          return {
            ...item,
            can_view: true,
            [field]: checked,
          }
        }

        return {
          ...item,
          [field]: checked,
        }
      }),
    }))
  }

  const applyPermissionsPreset = (
    scope: 'all' | string,
    mode: 'full' | 'readonly' | 'clear'
  ) => {
    setForm((current) => ({
      ...current,
      page_permissions: current.page_permissions.map((item) => {
        const inScope = scope === 'all' || sectionMap[item.code] === scope
        if (!inScope) return item
        if (mode === 'full') {
          return { ...item, can_view: true, can_create: true, can_edit: true, can_delete: true }
        }
        if (mode === 'readonly') {
          return { ...item, can_view: true, can_create: false, can_edit: false, can_delete: false }
        }
        return { ...item, can_view: false, can_create: false, can_edit: false, can_delete: false }
      }),
    }))
  }

  const totalUsers = users.length
  const totalAdmins = users.filter((u) => u.role === 'admin' || u.role === 'super_admin').length
  const totalActifs = users.filter((u) => (u.page_permissions || []).some((item: any) => item.can_view)).length
  const totalRoles = new Set(users.map((u) => u.role).filter(Boolean)).size

  const topRole = useMemo(() => {
    const roleCount = users.reduce((acc: Record<string, number>, user: any) => {
      const key = roleLabel[user.role] || user.role || 'Non defini'
      acc[key] = (acc[key] || 0) + 1
      return acc
    }, {})
    return Object.keys(roleCount).sort((a, b) => roleCount[b] - roleCount[a])[0] || '-'
  }, [users])

  const tableData = useMemo(
    () =>
      users.map((u) => ({
        ...u,
        nom_complet: `${u.first_name || u.username} ${u.last_name || ''}`.trim(),
        role_label: roleLabel[u.role] || u.role,
        pages_count: (u.page_permissions || []).filter((item: any) => item.can_view).length,
      })),
    [users]
  )

  const groupedPermissions = useMemo(() => {
    const query = permissionSearch.trim().toLowerCase()
    const source = form.page_permissions.filter((permission) => {
      if (!query) return true
      return (
        permission.label.toLowerCase().includes(query) ||
        permission.code.toLowerCase().includes(query) ||
        (sectionMap[permission.code] || '').toLowerCase().includes(query)
      )
    })

    return sectionOrder
      .map((section) => ({
        section,
        items: source.filter((item) => (sectionMap[item.code] || 'Autres') === section),
      }))
      .filter((group) => group.items.length > 0)
  }, [form.page_permissions, permissionSearch])

  const dashboardCards = [
    {
      title: 'Utilisateurs',
      value: `${totalUsers}`,
      color: '#1d2836',
      note: 'Comptes enregistres',
    },
    {
      title: 'Utilisateurs actifs',
      value: `${totalActifs}`,
      color: '#1f8a57',
      note: 'Avec acces a au moins une page',
    },
    {
      title: 'Admins',
      value: `${totalAdmins}`,
      color: '#c93128',
      note: 'Admin et super admin',
    },
    {
      title: 'Roles utilises',
      value: `${totalRoles}`,
      color: '#2a5ea8',
      note: `Role principal: ${topRole}`,
    },
  ]

  return (
    <Layout>
      <div style={{ padding: '16px 18px 20px' }}>
        <div style={{ ...cardStyle, padding: '18px 20px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1d2836', marginBottom: '6px' }}>
                Utilisateurs
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280' }}>
                Gestion des comptes, des roles et des acces par page.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
              <button onClick={openCreateForm} style={{ ...compactButton(true), background: '#c93128', borderColor: '#c93128' }}>
                + Nouvel utilisateur
              </button>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('dashboard')} style={compactButton(activeTab === 'dashboard')}>Dashboard</button>
          <button onClick={() => setActiveTab('users')} style={compactButton(activeTab === 'users')}>Utilisateurs</button>
          <button onClick={() => setActiveTab('permissions')} style={compactButton(activeTab === 'permissions')}>Permissions</button>
        </div>

        {success && (
          <div style={{ ...cardStyle, padding: '12px 16px', marginBottom: '12px', borderColor: '#b8e0c6', background: '#ecfdf3', color: '#166534', fontSize: '13px', fontWeight: 700 }}>
            {success}
          </div>
        )}

        {error && (
          <div style={{ ...cardStyle, padding: '12px 16px', marginBottom: '12px', borderColor: '#f3c7c2', background: '#fff1f0', color: '#b42318', fontSize: '13px', fontWeight: 700 }}>
            {error}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
              {dashboardCards.map((card) => (
                <div key={card.title} style={{ ...cardStyle, padding: '12px 16px', borderTop: `3px solid ${card.color}`, minHeight: '94px' }}>
                  <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '4px' }}>{card.title}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: card.color, lineHeight: 1.15 }}>{card.value}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>{card.note}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 1fr', gap: '12px' }}>
              <div style={{ ...cardStyle, padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d2836', marginBottom: '12px' }}>
                  Repartition des roles
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {Object.entries(
                    users.reduce((acc: Record<string, number>, item: any) => {
                      const key = roleLabel[item.role] || item.role || 'Non defini'
                      acc[key] = (acc[key] || 0) + 1
                      return acc
                    }, {})
                  ).map(([role, count], index) => (
                    <div key={role} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '999px', background: MOOD_COLORS[index % MOOD_COLORS.length], flexShrink: 0 }} />
                      <div style={{ flex: 1, fontSize: '12px', color: '#374151', fontWeight: 600 }}>{role}</div>
                      <div style={{ fontSize: '12px', color: '#6b7280', fontWeight: 700 }}>{count}</div>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ ...cardStyle, padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 700, color: '#1d2836', marginBottom: '12px' }}>
                  Acces pages
                </div>
                <div style={{ display: 'grid', gap: '10px' }}>
                  {tableData.slice(0, 6).map((item: any) => (
                    <div key={item.id} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div
                        style={{
                          width: '34px',
                          height: '34px',
                          borderRadius: '10px',
                          background: '#f3f6fa',
                          border: '1px solid #e5eaf0',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: '#1d2836',
                          fontWeight: 800,
                          fontSize: '12px',
                          flexShrink: 0,
                        }}
                      >
                        {(item.first_name || item.username || 'U').charAt(0).toUpperCase()}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '12px', fontWeight: 700, color: '#1d2836', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {item.nom_complet}
                        </div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>{item.role_label}</div>
                      </div>
                      <div style={{ fontSize: '12px', color: '#2a5ea8', fontWeight: 800 }}>{item.pages_count} pages</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </>
        )}

        {activeTab === 'users' && (
          <>
            {showForm && (
              <div style={{ ...cardStyle, padding: '20px', marginBottom: '18px' }}>
                <div style={{ fontSize: '15px', fontWeight: 800, color: '#1d2836', marginBottom: '14px' }}>
                  {editingUserId ? "Modifier l'utilisateur" : 'Nouvel utilisateur'}
                </div>

                <form onSubmit={handleSubmit}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nom d'utilisateur *</label>
                      <input
                        style={inputStyle}
                        value={form.username}
                        onChange={(e) => setForm({ ...form, username: e.target.value })}
                        required
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Email</label>
                      <input
                        style={inputStyle}
                        type="email"
                        value={form.email}
                        onChange={(e) => setForm({ ...form, email: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Prenom</label>
                      <input
                        style={inputStyle}
                        value={form.first_name}
                        onChange={(e) => setForm({ ...form, first_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nom</label>
                      <input
                        style={inputStyle}
                        value={form.last_name}
                        onChange={(e) => setForm({ ...form, last_name: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>
                        Mot de passe {editingUserId ? '(laisser vide pour conserver)' : '*'}
                      </label>
                      <input
                        style={inputStyle}
                        type="password"
                        value={form.password}
                        onChange={(e) => setForm({ ...form, password: e.target.value })}
                        required={!editingUserId}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Role</label>
                      <select
                        style={inputStyle}
                        value={form.role}
                        onChange={(e) => setForm({ ...form, role: e.target.value })}
                      >
                        <option value="admin">Administrateur</option>
                        <option value="super_admin">Super administrateur</option>
                        <option value="achat">Achat</option>
                        <option value="others">Autre</option>
                        <option value="responsable_technique">Responsable technique</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fonction</label>
                      <input
                        style={inputStyle}
                        value={form.fonction}
                        onChange={(e) => setForm({ ...form, fonction: e.target.value })}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Telephone</label>
                      <input
                        style={inputStyle}
                        value={form.phone}
                        onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                    <button type="submit" style={compactButton(true)}>
                      {editingUserId ? 'Enregistrer' : 'Creer'}
                    </button>
                    <button type="button" onClick={closeForm} style={compactButton(false)}>
                      Annuler
                    </button>
                    <button type="button" onClick={() => setActiveTab('permissions')} style={compactButton(false)}>
                      Ouvrir les permissions
                    </button>
                  </div>
                </form>
              </div>
            )}

            {loading ? (
              <div style={{ ...cardStyle, padding: '36px', textAlign: 'center', color: '#6b7280' }}>Chargement...</div>
            ) : (
              <SortableTable
                emptyMessage="Aucun utilisateur"
                columns={[
                  {
                    key: 'id',
                    label: '#',
                    render: (_v: any, row: any) => <span style={{ color: '#94a3b8' }}>{row.id}</span>,
                  },
                  {
                    key: 'nom_complet',
                    label: 'Utilisateur',
                    render: (_v: any, row: any) => (
                      <div>
                        <div style={{ fontWeight: 700, color: '#1d2836' }}>{row.nom_complet}</div>
                        <div style={{ fontSize: '10px', color: '#6b7280' }}>@{row.username}</div>
                      </div>
                    ),
                  },
                  {
                    key: 'email',
                    label: 'Email',
                    render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.email || '-'}</span>,
                  },
                  {
                    key: 'fonction',
                    label: 'Fonction',
                    render: (_v: any, row: any) => <span style={{ color: '#555' }}>{row.fonction || '-'}</span>,
                  },
                  {
                    key: 'role_label',
                    label: 'Role',
                    render: (_v: any, row: any) => (
                      <span
                        style={{
                          padding: '4px 9px',
                          borderRadius: '999px',
                          fontSize: '10.5px',
                          background: `${roleColor[row.role] || '#888'}16`,
                          color: roleColor[row.role] || '#888',
                          fontWeight: 700,
                        }}
                      >
                        {roleLabel[row.role] || row.role}
                      </span>
                    ),
                  },
                  {
                    key: 'pages_count',
                    label: 'Acces',
                    render: (_v: any, row: any) => <span style={{ color: '#2a5ea8', fontWeight: 700 }}>{row.pages_count} pages</span>,
                  },
                  {
                    key: 'actions',
                    label: 'Actions',
                    sortable: false,
                    render: (_v: any, row: any) => (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => openEditForm(row)}
                          style={{ ...compactButton(false), padding: '7px 12px', color: '#2a5ea8', borderColor: '#cddcf5' }}
                        >
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDelete(row.id)}
                          style={{ ...compactButton(false), padding: '7px 12px', color: '#c93128', borderColor: '#f0c7c5' }}
                        >
                          Supprimer
                        </button>
                      </div>
                    ),
                  },
                ]}
                data={tableData}
              />
            )}
          </>
        )}

        {activeTab === 'permissions' && (
          <>
            {!showForm ? (
              <div style={{ ...cardStyle, padding: '18px', textAlign: 'center', color: '#6b7280' }}>
                Ouvrez d'abord un utilisateur a modifier pour ajuster ses permissions.
              </div>
            ) : (
              <div style={{ ...cardStyle, padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap', marginBottom: '14px' }}>
                  <div>
                    <div style={{ fontSize: '16px', fontWeight: 800, color: '#1d2836', marginBottom: '4px' }}>
                      Permissions de {form.first_name || form.username || 'cet utilisateur'}
                    </div>
                    <div style={{ fontSize: '12px', color: '#6b7280' }}>
                      Activez l'acces a une page, puis choisissez les actions autorisees.
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <button type="button" onClick={() => applyPermissionsPreset('all', 'full')} style={compactButton(false)}>Tout autoriser</button>
                    <button type="button" onClick={() => applyPermissionsPreset('all', 'readonly')} style={compactButton(false)}>Lecture seule</button>
                    <button type="button" onClick={() => applyPermissionsPreset('all', 'clear')} style={compactButton(false)}>Tout retirer</button>
                  </div>
                </div>

                <div style={{ marginBottom: '14px', display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  <input
                    style={{ ...inputStyle, maxWidth: '260px' }}
                    value={permissionSearch}
                    onChange={(e) => setPermissionSearch(e.target.value)}
                    placeholder="Rechercher une page ou une section"
                  />
                  <button type="button" onClick={() => setPermissionSearch('')} style={compactButton(false)}>Reset</button>
                  <button type="button" onClick={() => setActiveTab('users')} style={compactButton(false)}>Retour fiche utilisateur</button>
                </div>

                <div style={{ display: 'grid', gap: '16px' }}>
                  {groupedPermissions.map((group, groupIndex) => (
                    <div key={group.section} style={{ ...cardStyle, padding: '14px 14px 12px', borderTop: `3px solid ${MOOD_COLORS[groupIndex % MOOD_COLORS.length]}` }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', marginBottom: '12px', flexWrap: 'wrap' }}>
                        <div>
                          <div style={{ fontSize: '14px', fontWeight: 800, color: '#1d2836' }}>{group.section}</div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>{group.items.length} page(s)</div>
                        </div>
                        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                          <button type="button" onClick={() => applyPermissionsPreset(group.section, 'full')} style={compactButton(false)}>Section complete</button>
                          <button type="button" onClick={() => applyPermissionsPreset(group.section, 'readonly')} style={compactButton(false)}>Lecture seule</button>
                          <button type="button" onClick={() => applyPermissionsPreset(group.section, 'clear')} style={compactButton(false)}>Retirer</button>
                        </div>
                      </div>

                      <div style={{ display: 'grid', gap: '10px' }}>
                        {group.items.map((permission) => {
                          const accessEnabled = permission.can_view

                          return (
                            <div
                              key={permission.page}
                              style={{
                                border: '1px solid #e5eaf0',
                                borderRadius: '12px',
                                padding: '12px',
                                background: accessEnabled ? '#fbfdff' : '#f8fafc',
                              }}
                            >
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
                                <div>
                                  <div style={{ fontSize: '13px', fontWeight: 800, color: '#1d2836', marginBottom: '3px' }}>
                                    {permission.label}
                                  </div>
                                  <div style={{ fontSize: '10.5px', color: '#6b7280' }}>{permission.code}</div>
                                </div>

                                <button
                                  type="button"
                                  onClick={() => updatePermission(permission.page, 'can_view', !accessEnabled)}
                                  style={{
                                    padding: '8px 12px',
                                    borderRadius: '999px',
                                    border: accessEnabled ? '1px solid #c7d7f3' : '1px solid #d9e0e7',
                                    background: accessEnabled ? '#eef4ff' : '#fff',
                                    color: accessEnabled ? '#2a5ea8' : '#6b7280',
                                    fontSize: '11px',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                  }}
                                >
                                  {accessEnabled ? 'Acces actif' : 'Acces inactif'}
                                </button>
                              </div>

                              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '12px' }}>
                                {(['can_view', 'can_create', 'can_edit', 'can_delete'] as const).map((field) => {
                                  const enabled = permission[field]
                                  const locked = !permission.can_view && field !== 'can_view'
                                  return (
                                    <button
                                      key={field}
                                      type="button"
                                      disabled={locked}
                                      onClick={() => updatePermission(permission.page, field, !enabled)}
                                      style={{
                                        padding: '7px 12px',
                                        borderRadius: '999px',
                                        border: enabled ? '1px solid #c7d7f3' : '1px solid #d9e0e7',
                                        background: enabled ? '#eef4ff' : '#fff',
                                        color: enabled ? '#2a5ea8' : locked ? '#b8c1cc' : '#6b7280',
                                        fontSize: '11px',
                                        fontWeight: 700,
                                        cursor: locked ? 'not-allowed' : 'pointer',
                                        opacity: locked ? 0.65 : 1,
                                      }}
                                    >
                                      {actionLabels[field]}
                                    </button>
                                  )
                                })}
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                  <button type="button" onClick={() => setActiveTab('users')} style={compactButton(false)}>
                    Retour
                  </button>
                  <button type="button" onClick={closeForm} style={compactButton(false)}>
                    Fermer
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default Users
