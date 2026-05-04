import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import SortableTable from '../components/SortableTable'

const TYPE_ACTION_CHOICES = ['vidange', 'vignette', 'assurance', 'lavage', 'depannage']
const STATUT_VALIDATION_CHOICES = ['en_attente', 'valide', 'refuse']

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

const etatLabel: { [k: string]: string } = {
  normal: 'Normal',
  proche: 'Proche',
  depasee: 'Depassee',
  active: 'Active',
  inactive: 'Inactive',
  en_panne: 'En panne',
  en_attente: 'En attente',
  valide: 'Valide',
  refuse: 'Refuse',
}

const statusTone = (etat: string) => {
  if (etat === 'normal' || etat === 'active' || etat === 'valide') {
    return { bg: '#ebf8f2', color: '#1f8a57', border: '#cfe9db' }
  }
  if (etat === 'proche' || etat === 'inactive' || etat === 'en_attente') {
    return { bg: '#fff4df', color: '#b76b00', border: '#f5deb0' }
  }
  return { bg: '#fdf1ef', color: '#c93128', border: '#f1d3cf' }
}

const Vehicules = () => {
  document.title = 'Gestion de vehicule - NEWIRIS'

  const [activeTab, setActiveTab] = useState<'dashboard' | 'dossier' | 'actions'>('dashboard')
  const [activeActionsTab, setActiveActionsTab] = useState<'general' | 'demande'>('general')
  const [vehicules, setVehicules] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [users, setUsers] = useState<any[]>([])
  const [actions, setActions] = useState<any[]>([])
  const [demandes, setDemandes] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showVehiculeForm, setShowVehiculeForm] = useState(false)
  const [showActionForm, setShowActionForm] = useState(false)
  const [showDemandeForm, setShowDemandeForm] = useState(false)
  const [editingDossier, setEditingDossier] = useState<number | null>(null)
  const [dossierForm, setDossierForm] = useState<any>({})
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const [form, setForm] = useState({
    nom: '',
    matricule: '',
    service: '',
    personne: '',
    couleur: '',
    photo: null as File | null,
  })

  const [actionForm, setActionForm] = useState({
    vehicule: '',
    date: new Date().toISOString().split('T')[0],
    type: 'vidange',
    montant: '',
  })

  const [demandeForm, setDemandeForm] = useState({
    vehicule: '',
    attribue_a: '',
    demande_par: '',
    date_souhaitee: new Date().toISOString().split('T')[0],
  })

  const fetchAll = async () => {
    setLoading(true)
    try {
      const [vRes, sRes, uRes, aRes, dRes] = await Promise.all([
        api.get('/vehicules/vehicules/'),
        api.get('/services/'),
        api.get('/auth/users/'),
        api.get('/vehicules/actions/'),
        api.get('/vehicules/demandes/'),
      ])
      setVehicules(vRes.data)
      setServices(sRes.data)
      setUsers(uRes.data)
      setActions(aRes.data)
      setDemandes(dRes.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void fetchAll()
  }, [])

  const flashSuccess = () => {
    setSuccess(true)
    setTimeout(() => setSuccess(false), 2500)
  }

  const getDaysDiff = (dateValue?: string | null) => {
    if (!dateValue) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const target = new Date(dateValue)
    target.setHours(0, 0, 0, 0)
    return Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  }

  const getDateStatus = (dateValue?: string | null) => {
    const diff = getDaysDiff(dateValue)
    if (diff === null) return 'proche'
    if (diff < 0) return 'depasee'
    if (diff <= 30) return 'proche'
    return 'normal'
  }

  const getVidangeStatus = (kmActuel?: number | null, kmNext?: number | null) => {
    if (kmActuel == null || kmNext == null) return 'proche'
    if (kmActuel >= kmNext) return 'depasee'
    if (kmNext - kmActuel <= 1000) return 'proche'
    return 'normal'
  }

  const deriveEtatVoiture = (vehicule: any) => {
    if (vehicule.etat_voiture === 'en_panne') return 'en_panne'
    const states = [
      getDateStatus(vehicule.dossier?.date_echeance_assurance),
      getDateStatus(vehicule.dossier?.date_echeance_vignette),
      getDateStatus(vehicule.dossier?.date_echeance_visite),
      getVidangeStatus(vehicule.dossier?.km_actuel, vehicule.dossier?.km_next_vidange),
    ]
    if (states.includes('depasee')) return 'inactive'
    if (states.includes('proche')) return 'inactive'
    return 'active'
  }

  const vehiculeCards = useMemo(
    () =>
      vehicules.map((v) => ({
        ...v,
        service_nom: v.service_nom || '-',
        computed_etat_vidange: getVidangeStatus(v.dossier?.km_actuel, v.dossier?.km_next_vidange),
        computed_etat_assurance: getDateStatus(v.dossier?.date_echeance_assurance),
        computed_etat_vignette: getDateStatus(v.dossier?.date_echeance_vignette),
        computed_etat_voiture: deriveEtatVoiture(v),
      })),
    [vehicules]
  )

  const dashboardStats = useMemo(() => {
    const total = vehiculeCards.length
    const actifs = vehiculeCards.filter((v) => v.computed_etat_voiture === 'active').length
    const alertes = vehiculeCards.filter(
      (v) =>
        v.computed_etat_vidange === 'proche' ||
        v.computed_etat_assurance === 'proche' ||
        v.computed_etat_vignette === 'proche'
    ).length
    const depasses = vehiculeCards.filter(
      (v) =>
        v.computed_etat_vidange === 'depasee' ||
        v.computed_etat_assurance === 'depasee' ||
        v.computed_etat_vignette === 'depasee'
    ).length
    return { total, actifs, alertes, depasses }
  }, [vehiculeCards])

  const handleAddVehicule = async () => {
    if (!form.nom || !form.matricule) {
      setError('Nom et matricule obligatoires.')
      return
    }

    setError('')
    try {
      const payload = new FormData()
      payload.append('nom', form.nom)
      payload.append('matricule', form.matricule)
      payload.append('service', form.service || '')
      payload.append('personne', form.personne || '')
      payload.append('couleur', form.couleur || '')
      if (form.photo) payload.append('photo', form.photo)

      await api.post('/vehicules/vehicules/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      flashSuccess()
      setForm({
        nom: '',
        matricule: '',
        service: '',
        personne: '',
        couleur: '',
        photo: null,
      })
      setShowVehiculeForm(false)
      void fetchAll()
    } catch {
      setError('Erreur lors de la creation du vehicule.')
    }
  }

  const handleDeleteVehicule = async (id: number) => {
    await api.delete(`/vehicules/vehicules/${id}/`)
    void fetchAll()
  }

  const handleAddAction = async () => {
    if (!actionForm.vehicule || !actionForm.date) {
      setError('Vehicule et date obligatoires.')
      return
    }

    setError('')
    try {
      await api.post('/vehicules/actions/', {
        vehicule: actionForm.vehicule,
        date: actionForm.date,
        type: actionForm.type,
        montant: actionForm.montant || null,
      })

      flashSuccess()
      setActionForm({
        vehicule: '',
        date: new Date().toISOString().split('T')[0],
        type: 'vidange',
        montant: '',
      })
      setShowActionForm(false)
      void fetchAll()
    } catch {
      setError("Erreur lors de l'enregistrement de l'action.")
    }
  }

  const handleDeleteAction = async (id: number) => {
    await api.delete(`/vehicules/actions/${id}/`)
    void fetchAll()
  }

  const handleAddDemande = async () => {
    if (!demandeForm.vehicule || !demandeForm.date_souhaitee) {
      setError('Vehicule et date obligatoires.')
      return
    }

    setError('')
    try {
      await api.post('/vehicules/demandes/', {
        vehicule: demandeForm.vehicule,
        attribue_a: demandeForm.attribue_a || null,
        demande_par: demandeForm.demande_par || null,
        date_souhaitee: demandeForm.date_souhaitee,
      })

      flashSuccess()
      setDemandeForm({
        vehicule: '',
        attribue_a: '',
        demande_par: '',
        date_souhaitee: new Date().toISOString().split('T')[0],
      })
      setShowDemandeForm(false)
      void fetchAll()
    } catch {
      setError("Erreur lors de l'enregistrement de la demande.")
    }
  }

  const handleDeleteDemande = async (id: number) => {
    await api.delete(`/vehicules/demandes/${id}/`)
    void fetchAll()
  }

  const handleEditDossier = (v: any) => {
    setEditingDossier(v.id)
    setDossierForm({
      date_echeance_assurance: v.dossier?.date_echeance_assurance || '',
      date_echeance_visite: v.dossier?.date_echeance_visite || '',
      date_echeance_vignette: v.dossier?.date_echeance_vignette || '',
      km_actuel: v.dossier?.km_actuel || '',
      km_next_vidange: v.dossier?.km_next_vidange || '',
      nombre_vidange: v.dossier?.nombre_vidange || 0,
    })
  }

  const handleSaveDossier = async (v: any) => {
    try {
      if (v.dossier?.id) {
        await api.patch(`/vehicules/dossiers/${v.dossier.id}/`, dossierForm)
      } else {
        await api.post('/vehicules/dossiers/', { vehicule: v.id, ...dossierForm })
      }
      setEditingDossier(null)
      flashSuccess()
      void fetchAll()
    } catch {
      setError('Erreur lors de la sauvegarde du dossier.')
    }
  }

  const vehiculesDossierData = vehicules.map((v) => ({
    ...v,
    date_ass_fmt: v.dossier?.date_echeance_assurance
      ? new Date(v.dossier.date_echeance_assurance).toLocaleDateString('fr-FR')
      : '-',
    date_vis_fmt: v.dossier?.date_echeance_visite
      ? new Date(v.dossier.date_echeance_visite).toLocaleDateString('fr-FR')
      : '-',
    date_vig_fmt: v.dossier?.date_echeance_vignette
      ? new Date(v.dossier.date_echeance_vignette).toLocaleDateString('fr-FR')
      : '-',
    km_actuel_fmt: v.dossier?.km_actuel ?? '-',
    km_next_fmt: v.dossier?.km_next_vidange ?? '-',
    nb_vidange_fmt: v.dossier?.nombre_vidange ?? '-',
  }))

  const actionsData = actions.map((a) => ({
    ...a,
    date_fmt: new Date(a.date).toLocaleDateString('fr-FR'),
    type_label: a.type.charAt(0).toUpperCase() + a.type.slice(1),
    montant_fmt: a.montant ? `${Number(a.montant).toLocaleString('fr-FR')} DH` : '-',
  }))

  const demandesData = demandes.map((d) => ({
    ...d,
    attribue_a_nom: d.attribue_a_nom || '-',
    demande_par_nom: d.demande_par_nom || '-',
    date_souhaitee_fmt: new Date(d.date_souhaitee).toLocaleDateString('fr-FR'),
    date_retour_fmt: d.date_retour ? new Date(d.date_retour).toLocaleDateString('fr-FR') : '-',
  }))

  return (
    <Layout>
      <div style={{ padding: '16px 18px 20px' }}>
        <div style={{ ...cardStyle, padding: '18px 20px', marginBottom: '14px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ fontSize: '22px', fontWeight: 800, color: '#1d2836', marginBottom: '6px' }}>
                Gestion de vehicule
              </div>
              <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '760px' }}>
                Lecture rapide du parc, echeances critiques et suivi detaille des dossiers vehicule.
              </div>
            </div>

            <button
              onClick={() => {
                if (activeTab === 'dashboard') setShowVehiculeForm(!showVehiculeForm)
                else if (activeTab === 'actions' && activeActionsTab === 'general') setShowActionForm(!showActionForm)
                else if (activeTab === 'actions' && activeActionsTab === 'demande') setShowDemandeForm(!showDemandeForm)
              }}
              style={{
                padding: '9px 16px',
                background: '#1d2836',
                color: '#fff',
                border: 'none',
                borderRadius: '10px',
                fontSize: '12px',
                cursor: 'pointer',
                fontWeight: 700,
              }}
            >
              + Ajouter
            </button>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', flexWrap: 'wrap' }}>
          <button onClick={() => setActiveTab('dashboard')} style={compactButton(activeTab === 'dashboard')}>Dashboard</button>
          <button onClick={() => setActiveTab('dossier')} style={compactButton(activeTab === 'dossier')}>Dossier vehicule</button>
          <button onClick={() => setActiveTab('actions')} style={compactButton(activeTab === 'actions')}>Actions</button>
        </div>

        {success && (
          <div style={{ ...cardStyle, padding: '12px 16px', marginBottom: '12px', borderColor: '#cfe9db', background: '#ebf8f2', color: '#1f8a57', fontSize: '13px', fontWeight: 700 }}>
            Operation reussie.
          </div>
        )}

        {error && (
          <div style={{ ...cardStyle, padding: '12px 16px', marginBottom: '12px', borderColor: '#f1d3cf', background: '#fdf1ef', color: '#c93128', fontSize: '13px', fontWeight: 700 }}>
            {error}
          </div>
        )}

        {activeTab === 'dashboard' && (
          <>
            {showVehiculeForm && (
              <div style={{ ...cardStyle, padding: '18px', marginBottom: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: 700, color: '#1d2836', marginBottom: '14px' }}>Nouveau vehicule</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Nom *</label>
                    <input style={inputStyle} value={form.nom} onChange={e => setForm(p => ({ ...p, nom: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Matricule *</label>
                    <input style={inputStyle} value={form.matricule} onChange={e => setForm(p => ({ ...p, matricule: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Service</label>
                    <select style={inputStyle} value={form.service} onChange={e => setForm(p => ({ ...p, service: e.target.value }))}>
                      <option value="">- Aucun -</option>
                      {services.map((s: any) => <option key={s.id} value={s.id}>{s.nom}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Personne</label>
                    <select style={inputStyle} value={form.personne} onChange={e => setForm(p => ({ ...p, personne: e.target.value }))}>
                      <option value="">- Aucun -</option>
                      {users.map((u: any) => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Couleur</label>
                    <input style={inputStyle} value={form.couleur} onChange={e => setForm(p => ({ ...p, couleur: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Photo</label>
                    <input type="file" accept="image/*" style={inputStyle} onChange={e => setForm(p => ({ ...p, photo: e.target.files?.[0] || null }))} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button style={compactButton(true)} onClick={handleAddVehicule}>Enregistrer</button>
                  <button style={compactButton(false)} onClick={() => setShowVehiculeForm(false)}>Annuler</button>
                </div>
              </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '14px' }}>
              <div style={{ ...cardStyle, padding: '16px', borderTop: '3px solid #1d2836' }}>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Vehicules</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#1d2836' }}>{dashboardStats.total}</div>
              </div>
              <div style={{ ...cardStyle, padding: '16px', borderTop: '3px solid #1f8a57' }}>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Actifs</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#1f8a57' }}>{dashboardStats.actifs}</div>
              </div>
              <div style={{ ...cardStyle, padding: '16px', borderTop: '3px solid #d08b19' }}>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Alertes</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#b76b00' }}>{dashboardStats.alertes}</div>
              </div>
              <div style={{ ...cardStyle, padding: '16px', borderTop: '3px solid #c93128' }}>
                <div style={{ fontSize: '10px', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '8px' }}>Depasses</div>
                <div style={{ fontSize: '24px', fontWeight: 800, color: '#c93128' }}>{dashboardStats.depasses}</div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, minmax(0, 1fr))', gap: '14px' }}>
              {loading ? (
                <div style={{ ...cardStyle, padding: '36px', textAlign: 'center', color: '#6b7280', gridColumn: '1 / -1' }}>Chargement...</div>
              ) : vehiculeCards.length === 0 ? (
                <div style={{ ...cardStyle, padding: '36px', textAlign: 'center', color: '#6b7280', gridColumn: '1 / -1' }}>Aucun vehicule</div>
              ) : (
                vehiculeCards.map((vehicule) => {
                  const vidangeTone = statusTone(vehicule.computed_etat_vidange)
                  const assuranceTone = statusTone(vehicule.computed_etat_assurance)
                  const vignetteTone = statusTone(vehicule.computed_etat_vignette)
                  const voitureTone = statusTone(vehicule.computed_etat_voiture)

                  return (
                    <div
                      key={vehicule.id}
                      style={{
                        ...cardStyle,
                        overflow: 'hidden',
                        background: '#ffffff',
                      }}
                    >
                      <div
                        style={{
                          height: '190px',
                          background: '#edf2f7',
                          overflow: 'hidden',
                          borderBottom: '1px solid #e7edf4',
                        }}
                      >
                        {vehicule.photo ? (
                          <img
                            src={vehicule.photo}
                            alt={vehicule.nom}
                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                          />
                        ) : (
                          <div
                            style={{
                              width: '100%',
                              height: '100%',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: '#8ea0b5',
                              fontSize: '12px',
                              fontWeight: 700,
                            }}
                          >
                            {vehicule.nom}
                          </div>
                        )}
                      </div>

                      <div style={{ padding: '12px 12px 10px' }}>
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: '8px',
                            alignItems: 'start',
                            marginBottom: '10px',
                          }}
                        >
                          <div>
                            <div style={{ fontSize: '14px', fontWeight: 800, color: '#1d2836', lineHeight: 1.1 }}>
                              {vehicule.nom}
                            </div>
                            <div style={{ fontSize: '10px', color: '#7a8797', fontWeight: 600, marginTop: '3px' }}>
                              {vehicule.matricule}
                            </div>
                          </div>

                          <span
                            style={{
                              padding: '4px 8px',
                              borderRadius: '999px',
                              background: voitureTone.bg,
                              color: voitureTone.color,
                              border: `1px solid ${voitureTone.border}`,
                              fontSize: '9px',
                              fontWeight: 800,
                              whiteSpace: 'nowrap',
                            }}
                          >
                            {etatLabel[vehicule.computed_etat_voiture]}
                          </span>
                        </div>

                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr auto',
                            gap: '6px 10px',
                            alignItems: 'center',
                            marginBottom: '10px',
                          }}
                        >
                          <span style={{ fontSize: '10px', color: '#7a8797' }}>Service</span>
                          <span style={{ fontSize: '10px', color: '#1d2836', fontWeight: 800 }}>{vehicule.service_nom}</span>

                          <span style={{ fontSize: '10px', color: '#7a8797' }}>Vidange</span>
                          <span
                            style={{
                              padding: '3px 7px',
                              borderRadius: '999px',
                              background: vidangeTone.bg,
                              color: vidangeTone.color,
                              border: `1px solid ${vidangeTone.border}`,
                              fontSize: '9px',
                              fontWeight: 800,
                            }}
                          >
                            {etatLabel[vehicule.computed_etat_vidange]}
                          </span>

                          <span style={{ fontSize: '10px', color: '#7a8797' }}>Assurance</span>
                          <span
                            style={{
                              padding: '3px 7px',
                              borderRadius: '999px',
                              background: assuranceTone.bg,
                              color: assuranceTone.color,
                              border: `1px solid ${assuranceTone.border}`,
                              fontSize: '9px',
                              fontWeight: 800,
                            }}
                          >
                            {etatLabel[vehicule.computed_etat_assurance]}
                          </span>

                          <span style={{ fontSize: '10px', color: '#7a8797' }}>Vignette</span>
                          <span
                            style={{
                              padding: '3px 7px',
                              borderRadius: '999px',
                              background: vignetteTone.bg,
                              color: vignetteTone.color,
                              border: `1px solid ${vignetteTone.border}`,
                              fontSize: '9px',
                              fontWeight: 800,
                            }}
                          >
                            {etatLabel[vehicule.computed_etat_vignette]}
                          </span>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: '8px' }}>
                          <button
                            onClick={() => setActiveTab('dossier')}
                            style={{
                              ...compactButton(false),
                              fontSize: '10px',
                              padding: '7px 10px',
                            }}
                          >
                            Dossier
                          </button>
                          <button
                            onClick={() => handleDeleteVehicule(vehicule.id)}
                            style={{
                              ...compactButton(false),
                              color: '#c93128',
                              borderColor: '#f0c7c5',
                              fontSize: '10px',
                              padding: '7px 10px',
                            }}
                          >
                            Supprimer
                          </button>
                        </div>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </>
        )}

        {activeTab === 'dossier' && (
          <div style={{ ...cardStyle, padding: '14px' }}>
            {loading ? (
              <div style={{ padding: '36px', textAlign: 'center', color: '#6b7280' }}>Chargement...</div>
            ) : (
              <SortableTable
                emptyMessage="Aucun vehicule"
                columns={[
                  { key: 'nom', label: 'Nom', render: (_v: any, row: any) => <span style={{ fontWeight: 700, color: '#1f2937' }}>{row.nom}</span> },
                  { key: 'matricule', label: 'Matricule', render: (_v: any, row: any) => <span style={{ color: '#4b5563' }}>{row.matricule}</span> },
                  {
                    key: 'date_ass_fmt',
                    label: 'Date assurance',
                    sortable: false,
                    render: (_v: any, row: any) => editingDossier === row.id ? (
                      <input type="date" value={dossierForm.date_echeance_assurance || ''} onChange={e => setDossierForm((p: any) => ({ ...p, date_echeance_assurance: e.target.value }))} style={{ ...inputStyle, width: '140px', padding: '6px 8px' }} />
                    ) : <span>{row.date_ass_fmt}</span>
                  },
                  {
                    key: 'date_vis_fmt',
                    label: 'Date visite',
                    sortable: false,
                    render: (_v: any, row: any) => editingDossier === row.id ? (
                      <input type="date" value={dossierForm.date_echeance_visite || ''} onChange={e => setDossierForm((p: any) => ({ ...p, date_echeance_visite: e.target.value }))} style={{ ...inputStyle, width: '140px', padding: '6px 8px' }} />
                    ) : <span>{row.date_vis_fmt}</span>
                  },
                  {
                    key: 'date_vig_fmt',
                    label: 'Date vignette',
                    sortable: false,
                    render: (_v: any, row: any) => editingDossier === row.id ? (
                      <input type="date" value={dossierForm.date_echeance_vignette || ''} onChange={e => setDossierForm((p: any) => ({ ...p, date_echeance_vignette: e.target.value }))} style={{ ...inputStyle, width: '140px', padding: '6px 8px' }} />
                    ) : <span>{row.date_vig_fmt}</span>
                  },
                  {
                    key: 'km_actuel_fmt',
                    label: 'KM actuel',
                    sortable: false,
                    render: (_v: any, row: any) => editingDossier === row.id ? (
                      <input type="number" value={dossierForm.km_actuel || ''} onChange={e => setDossierForm((p: any) => ({ ...p, km_actuel: e.target.value }))} style={{ ...inputStyle, width: '100px', padding: '6px 8px' }} />
                    ) : <span>{row.km_actuel_fmt}</span>
                  },
                  {
                    key: 'km_next_fmt',
                    label: 'KM next vidange',
                    sortable: false,
                    render: (_v: any, row: any) => editingDossier === row.id ? (
                      <input type="number" value={dossierForm.km_next_vidange || ''} onChange={e => setDossierForm((p: any) => ({ ...p, km_next_vidange: e.target.value }))} style={{ ...inputStyle, width: '120px', padding: '6px 8px' }} />
                    ) : <span>{row.km_next_fmt}</span>
                  },
                  {
                    key: 'nb_vidange_fmt',
                    label: 'Nb vidange',
                    sortable: false,
                    render: (_v: any, row: any) => editingDossier === row.id ? (
                      <input type="number" value={dossierForm.nombre_vidange || ''} onChange={e => setDossierForm((p: any) => ({ ...p, nombre_vidange: e.target.value }))} style={{ ...inputStyle, width: '90px', padding: '6px 8px' }} />
                    ) : <span>{row.nb_vidange_fmt}</span>
                  },
                  {
                    key: 'actions',
                    label: 'Actions',
                    sortable: false,
                    render: (_v: any, row: any) => editingDossier === row.id ? (
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button onClick={() => handleSaveDossier(row)} style={compactButton(true)}>OK</button>
                        <button onClick={() => setEditingDossier(null)} style={compactButton(false)}>Annuler</button>
                      </div>
                    ) : (
                      <button onClick={() => handleEditDossier(row)} style={{ ...compactButton(false), color: '#2a5ea8', borderColor: '#cddcf5' }}>
                        Modifier
                      </button>
                    )
                  },
                ]}
                data={vehiculesDossierData}
              />
            )}
          </div>
        )}

        {activeTab === 'actions' && (
          <>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
              <button onClick={() => setActiveActionsTab('general')} style={compactButton(activeActionsTab === 'general')}>Actions general</button>
              <button onClick={() => setActiveActionsTab('demande')} style={compactButton(activeActionsTab === 'demande')}>Demande vehicule</button>
            </div>

            {activeActionsTab === 'general' && showActionForm && (
              <div style={{ ...cardStyle, padding: '18px', marginBottom: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1d2836', marginBottom: '14px' }}>Nouvelle action</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Vehicule *</label>
                    <select style={inputStyle} value={actionForm.vehicule} onChange={e => setActionForm(p => ({ ...p, vehicule: e.target.value }))}>
                      <option value="">- Choisir -</option>
                      {vehicules.map((v: any) => <option key={v.id} value={v.id}>{v.nom} - {v.matricule}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Type *</label>
                    <select style={inputStyle} value={actionForm.type} onChange={e => setActionForm(p => ({ ...p, type: e.target.value }))}>
                      {TYPE_ACTION_CHOICES.map(t => <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date *</label>
                    <input type="date" style={inputStyle} value={actionForm.date} onChange={e => setActionForm(p => ({ ...p, date: e.target.value }))} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Montant</label>
                    <input type="number" style={inputStyle} value={actionForm.montant} onChange={e => setActionForm(p => ({ ...p, montant: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button style={compactButton(true)} onClick={handleAddAction}>Enregistrer</button>
                  <button style={compactButton(false)} onClick={() => setShowActionForm(false)}>Annuler</button>
                </div>
              </div>
            )}

            {activeActionsTab === 'demande' && showDemandeForm && (
              <div style={{ ...cardStyle, padding: '18px', marginBottom: '14px' }}>
                <div style={{ fontSize: '14px', fontWeight: '700', color: '#1d2836', marginBottom: '14px' }}>Nouvelle demande vehicule</div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Vehicule *</label>
                    <select style={inputStyle} value={demandeForm.vehicule} onChange={e => setDemandeForm(p => ({ ...p, vehicule: e.target.value }))}>
                      <option value="">- Choisir -</option>
                      {vehicules.map((v: any) => <option key={v.id} value={v.id}>{v.nom} - {v.matricule}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Attribue a</label>
                    <select style={inputStyle} value={demandeForm.attribue_a} onChange={e => setDemandeForm(p => ({ ...p, attribue_a: e.target.value }))}>
                      <option value="">- Aucun -</option>
                      {users.map((u: any) => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Demande par</label>
                    <select style={inputStyle} value={demandeForm.demande_par} onChange={e => setDemandeForm(p => ({ ...p, demande_par: e.target.value }))}>
                      <option value="">- Aucun -</option>
                      {users.map((u: any) => <option key={u.id} value={u.id}>{u.username}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date souhaitee *</label>
                    <input type="date" style={inputStyle} value={demandeForm.date_souhaitee} onChange={e => setDemandeForm(p => ({ ...p, date_souhaitee: e.target.value }))} />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '8px', marginTop: '14px' }}>
                  <button style={compactButton(true)} onClick={handleAddDemande}>Enregistrer</button>
                  <button style={compactButton(false)} onClick={() => setShowDemandeForm(false)}>Annuler</button>
                </div>
              </div>
            )}

            <div style={{ ...cardStyle, padding: '14px' }}>
              {activeActionsTab === 'general' ? (
                <SortableTable
                  emptyMessage="Aucune action"
                  columns={[
                    { key: 'vehicule_nom', label: 'Vehicule', render: (_v: any, row: any) => <span style={{ fontWeight: '700' }}>{row.vehicule_nom}</span> },
                    { key: 'date_fmt', label: 'Date', render: (_v: any, row: any) => <span>{row.date_fmt}</span> },
                    { key: 'type_label', label: 'Type', render: (_v: any, row: any) => <span>{row.type_label}</span> },
                    { key: 'montant_fmt', label: 'Montant', render: (_v: any, row: any) => <span style={{ fontWeight: '700', color: '#1d2836' }}>{row.montant_fmt}</span> },
                    {
                      key: 'actions',
                      label: 'Supprimer',
                      sortable: false,
                      render: (_v: any, row: any) => <button onClick={() => handleDeleteAction(row.id)} style={{ ...compactButton(false), color: '#c93128', borderColor: '#f0c7c5' }}>Supprimer</button>
                    },
                  ]}
                  data={actionsData}
                />
              ) : (
                <SortableTable
                  emptyMessage="Aucune demande"
                  columns={[
                    { key: 'vehicule_nom', label: 'Vehicule', render: (_v: any, row: any) => <span style={{ fontWeight: '700' }}>{row.vehicule_nom}</span> },
                    { key: 'attribue_a_nom', label: 'Attribue a', render: (_v: any, row: any) => <span>{row.attribue_a_nom}</span> },
                    { key: 'demande_par_nom', label: 'Demande par', render: (_v: any, row: any) => <span>{row.demande_par_nom}</span> },
                    { key: 'date_souhaitee_fmt', label: 'Date souhaitee', render: (_v: any, row: any) => <span>{row.date_souhaitee_fmt}</span> },
                    {
                      key: 'statut',
                      label: 'Statut',
                      sortable: false,
                      render: (_v: any, row: any) => (
                        <select
                          value={row.statut_validation}
                          onChange={async e => {
                            await api.patch(`/vehicules/demandes/${row.id}/`, { statut_validation: e.target.value })
                            fetchAll()
                          }}
                          style={{
                            ...inputStyle,
                            width: '140px',
                            padding: '6px 8px',
                            background: statusTone(row.statut_validation).bg,
                            color: statusTone(row.statut_validation).color,
                            borderColor: statusTone(row.statut_validation).border,
                          }}
                        >
                          {STATUT_VALIDATION_CHOICES.map(s => <option key={s} value={s}>{etatLabel[s]}</option>)}
                        </select>
                      )
                    },
                    { key: 'date_retour_fmt', label: 'Date retour', render: (_v: any, row: any) => <span>{row.date_retour_fmt}</span> },
                    {
                      key: 'actions',
                      label: 'Supprimer',
                      sortable: false,
                      render: (_v: any, row: any) => <button onClick={() => handleDeleteDemande(row.id)} style={{ ...compactButton(false), color: '#c93128', borderColor: '#f0c7c5' }}>Supprimer</button>
                    },
                  ]}
                  data={demandesData}
                />
              )}
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

export default Vehicules
