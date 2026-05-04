import { useEffect, useMemo, useState } from 'react'
import Layout from '../components/Layout'
import api from '../api/axios'
import { useAuth } from '../context/AuthContext'


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

const compactButton = (
  tone: 'dark' | 'soft' | 'blue' | 'violet' | 'danger' | 'green' = 'soft',
  disabled = false
) => {
  const palette = {
    dark: { bg: '#1d2836', color: '#fff', border: '#1d2836' },
    soft: { bg: '#fff', color: '#1d2836', border: '#d9e0e7' },
    blue: { bg: '#eef4ff', color: '#2a5ea8', border: '#cddcf5' },
    violet: { bg: '#f5f0ff', color: '#6b21a8', border: '#e6d5f7' },
    danger: { bg: '#fff', color: '#c93128', border: '#f0c7c5' },
    green: { bg: '#fff', color: '#1f8a57', border: '#ccebdc' },
  }[tone]

  return {
    padding: '8px 14px',
    borderRadius: '10px',
    border: `1px solid ${palette.border}`,
    cursor: disabled ? 'not-allowed' : 'pointer',
    fontSize: '11px',
    background: palette.bg,
    color: palette.color,
    fontWeight: 700,
    opacity: disabled ? 0.55 : 1,
  }
}

const fmtDh = (value: any) =>
  Number(value || 0).toLocaleString('fr-FR', { minimumFractionDigits: 2 })

const getTicketStatusMeta = (value?: string | null) => {
  if (!value) {
    return {
      label: 'Nouvelle commande',
      bg: '#f8fafc',
      color: '#64748b',
      border: '#d9e0e7',
    }
  }

  if (value === 'en_validation') {
    return {
      label: 'En validation',
      bg: '#fff4df',
      color: '#b76b00',
      border: '#f2d38a',
    }
  }

  if (value === 'reporte') {
    return {
      label: 'Reporte',
      bg: '#fdeceb',
      color: '#c93128',
      border: '#f4cfcf',
    }
  }

  if (value === 'en_attente_signature') {
    return {
      label: 'En attente de signature',
      bg: '#eef4ff',
      color: '#2a5ea8',
      border: '#cddcf5',
    }
  }

  if (value === 'cheque_signe') {
    return {
      label: 'Cheque signe',
      bg: '#e9f7f0',
      color: '#1f8a57',
      border: '#ccebdc',
    }
  }

  if (value === 'livre_a_equipe') {
    return {
      label: 'Livre a l equipe',
      bg: '#f5f0ff',
      color: '#6b21a8',
      border: '#e6d5f7',
    }
  }

  return {
    label: 'Traite',
    bg: '#e9f7f0',
    color: '#1f8a57',
    border: '#ccebdc',
  }
}

const DemandesCheques = () => {
  document.title = 'Demandes de cheques - NEWIRIS'

  const { user } = useAuth()
  const role = user?.role || ''
  const isAdmin = role === 'admin' || role === 'super_admin'
  const isAchat = role === 'achat'

  const [commandes, setCommandes] = useState<any[]>([])
  const [demandes, setDemandes] = useState<any[]>([])
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')
  const [detailsOpen, setDetailsOpen] = useState<Record<number, boolean>>({})
  const [modalCommandeId, setModalCommandeId] = useState<number | null>(null)
  const [activeChequeIndexByCommande, setActiveChequeIndexByCommande] = useState<Record<number, number>>({})
  const [, setShowAddType] = useState<number | null>(null)
  const [formByCommande, setFormByCommande] = useState<Record<number, any>>({})
  const [chequesByCommande, setChequesByCommande] = useState<Record<number, any[]>>({})
  const [activeSection, setActiveSection] = useState<'dashboard' | 'gestion'>('gestion')
  const [submitting, setSubmitting] = useState(false)

  const flashSuccess = (message: string) => {
    setSuccess(message)
    setError('')
    setTimeout(() => setSuccess(''), 2800)
  }

  const refreshSilently = () => {
    void fetchData()
  }

  const hydrateFormFromTicket = (commande: any, row: any | null) => ({
    commande: commande.id,
    titre: row?.titre || commande.titre || '',
    fournisseur: row?.fournisseur || commande.fournisseur || '',
    montant: row?.montant || commande.montant || '',
    type_paiement: row?.type_paiement || commande.type_paiement || '',
    date_souhaitee_signature: row?.date_souhaitee_signature || '',
    date_echeance: row?.date_echeance || commande.echeance || '',
    statut_ticket: row?.statut_ticket || 'en_validation',
    etat_signature: row?.etat_signature || 'en_cours',
    livre_a_equipe: row?.livre_a_equipe || 'en_cours',
    livre_au_transport: row?.livre_au_transport || 'en_cours',
    etat_livraison: row?.etat_livraison || 'en_cours',
    is_ticket_initial: row?.is_ticket_initial || false,
    po: null,
    po_url: row?.po_url || '',
  })

  const fetchData = async () => {
    try {
      const [demandesRes, commandesRes] = await Promise.all([
        api.get('/cheques/demandes/'),
        api.get('/commandes/'),
      ])

      const demandesData = Array.isArray(demandesRes.data) ? demandesRes.data : []
      const commandesData = Array.isArray(commandesRes.data) ? commandesRes.data : []

      const commandesValidees = commandesData.filter(
        (c: any) => c.validation_finance === 'ok' && c.validation_direction === 'ok'
      )

      const grouped: Record<number, any[]> = {}
      demandesData.forEach((row: any) => {
        if (!row.commande) return
        if (!grouped[row.commande]) grouped[row.commande] = []
        grouped[row.commande].push(row)
      })

      Object.keys(grouped).forEach((key) => {
        grouped[Number(key)] = grouped[Number(key)].sort((a: any, b: any) => {
          if (Number(b.is_ticket_initial) !== Number(a.is_ticket_initial)) {
            return Number(b.is_ticket_initial) - Number(a.is_ticket_initial)
          }
          return String(a.created_at || '').localeCompare(String(b.created_at || ''))
        })
      })

      const nextForms: Record<number, any> = {}
      const nextIndexes: Record<number, number> = {}

      commandesValidees.forEach((commande: any) => {
        const rows = grouped[commande.id] || []
        nextIndexes[commande.id] = rows.length > 0 ? 0 : -1
        nextForms[commande.id] = hydrateFormFromTicket(commande, rows[0] || null)
      })

      setDemandes(demandesData)
      setCommandes(commandesValidees)
      setChequesByCommande(grouped)
      setFormByCommande(nextForms)
      setActiveChequeIndexByCommande(nextIndexes)
    } catch (err) {
      console.error(err)
      setError('Erreur de chargement des demandes de cheques.')
    }
  }

  useEffect(() => {
    void fetchData()
  }, [])

  const setCommandeForm = (commandeId: number, field: string, value: any) => {
    setFormByCommande(prev => ({
      ...prev,
      [commandeId]: {
        ...prev[commandeId],
        [field]: value,
      },
    }))
  }

  const getCommandeRows = (commandeId: number) => chequesByCommande[commandeId] || []

  const getInitialTicket = (commandeId: number) => {
    const rows = getCommandeRows(commandeId)
    return rows.find((row: any) => row.is_ticket_initial) || null
  }

  const getCurrentRow = (commandeId: number) => {
    const rows = getCommandeRows(commandeId)
    const index = activeChequeIndexByCommande[commandeId] ?? -1
    if (index < 0) return null
    return rows[index] || null
  }

  const openTicketModal = (commande: any, index = 0) => {
    const rows = getCommandeRows(commande.id)
    const row = index >= 0 ? rows[index] || null : null
    setModalCommandeId(commande.id)
    setActiveChequeIndexByCommande(prev => ({ ...prev, [commande.id]: index }))
    setFormByCommande(prev => ({
      ...prev,
      [commande.id]: hydrateFormFromTicket(commande, row),
    }))
  }

  const openInitialRequest = (commande: any) => {
    setModalCommandeId(commande.id)
    setActiveChequeIndexByCommande(prev => ({ ...prev, [commande.id]: -1 }))
    setFormByCommande(prev => ({
      ...prev,
      [commande.id]: {
        commande: commande.id,
        titre: commande.titre || '',
        fournisseur: commande.fournisseur || '',
        montant: commande.montant || '',
        type_paiement: commande.type_paiement || '',
        date_souhaitee_signature: '',
        date_echeance: commande.echeance || '',
        statut_ticket: 'en_validation',
        etat_signature: 'en_cours',
        livre_a_equipe: 'en_cours',
        livre_au_transport: 'en_cours',
        etat_livraison: 'en_cours',
        is_ticket_initial: true,
        po: null,
        po_url: '',
      },
    }))
  }

  const closeModal = () => {
    setModalCommandeId(null)
    setShowAddType(null)
  }



  const saveInitialRequest = async (commande: any) => {
    const form = formByCommande[commande.id]

    if (!form?.date_souhaitee_signature) {
      setError('La date souhaitee de signature est obligatoire.')
      return
    }

    if (!form?.fournisseur) {
      setError('Le fournisseur est obligatoire.')
      return
    }

    try {
      setSubmitting(true)

      const payload = new FormData()
      payload.append('commande', String(commande.id))
      payload.append('titre', String(form.titre || ''))
      payload.append('fournisseur', String(form.fournisseur))
      payload.append('montant', String(form.montant || 0))
      payload.append('categorie', 'Paiement fournisseur')
      payload.append('type_paiement', String(form.type_paiement || ''))
      payload.append('date_souhaitee_signature', String(form.date_souhaitee_signature))
      payload.append('is_ticket_initial', 'true')
      payload.append('statut_ticket', 'en_validation')
      payload.append('etat_signature', 'en_cours')
      payload.append('livre_a_equipe', 'en_cours')
      payload.append('livre_au_transport', 'en_cours')
      payload.append('etat_livraison', 'en_cours')

      if (form.po instanceof File) {
        payload.append('po', form.po)
      }

      closeModal()
      flashSuccess('Demande de cheque envoyee avec succes.')

      await api.post('/cheques/demandes/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      refreshSilently()
    } catch (err: any) {
      console.error(err)
      const apiMessage =
        err?.response?.data && typeof err.response.data === 'object'
          ? Object.entries(err.response.data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join(' | ')
          : ''

      setError(apiMessage || 'Erreur lors de l enregistrement.')
      refreshSilently()
    } finally {
      setSubmitting(false)
    }
  }

  const saveTicket = async (commande: any) => {
    const form = formByCommande[commande.id]
    const currentRow = getCurrentRow(commande.id)

    if (!currentRow?.id) return

    try {
      setSubmitting(true)

      const payload = new FormData()
      payload.append('commande', String(commande.id))
      payload.append('titre', String(form.titre || ''))
      payload.append('fournisseur', String(form.fournisseur || ''))
      payload.append('montant', String(form.montant || 0))
      payload.append('categorie', 'Paiement fournisseur')
      payload.append('type_paiement', String(form.type_paiement || ''))
      payload.append('date_souhaitee_signature', String(form.date_souhaitee_signature || ''))
      payload.append('date_echeance', String(form.date_echeance || ''))
      payload.append('statut_ticket', String(form.statut_ticket || 'en_validation'))
      payload.append('etat_signature', String(form.etat_signature || 'en_cours'))
      payload.append('livre_a_equipe', String(form.livre_a_equipe || 'en_cours'))
      payload.append('livre_au_transport', String(form.livre_au_transport || 'en_cours'))
      payload.append('etat_livraison', String(form.etat_livraison || 'en_cours'))
      payload.append('is_ticket_initial', String(currentRow.is_ticket_initial))

      if (form.po instanceof File) {
        payload.append('po', form.po)
      }

      closeModal()
      flashSuccess('Ticket mis a jour avec succes.')

      await api.patch(`/cheques/demandes/${currentRow.id}/`, payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      refreshSilently()
    } catch (err: any) {
      console.error(err)
      const apiMessage =
        err?.response?.data && typeof err.response.data === 'object'
          ? Object.entries(err.response.data)
              .map(([key, value]) => `${key}: ${Array.isArray(value) ? value.join(', ') : value}`)
              .join(' | ')
          : ''

      setError(apiMessage || 'Erreur lors de l enregistrement.')
      refreshSilently()
    } finally {
      setSubmitting(false)
    }
  }

  const updateTicketStatus = async (commande: any, status: string) => {
    const currentRow = getCurrentRow(commande.id)
    if (!currentRow?.id) return

    try {
      setSubmitting(true)
      closeModal()
      flashSuccess(status === 'en_attente_signature' ? 'Demande approuvee.' : 'Demande reportee.')

      await api.patch(`/cheques/demandes/${currentRow.id}/`, { statut_ticket: status })
      refreshSilently()
    } catch (err) {
      console.error(err)
      setError('Impossible de mettre a jour le statut.')
      refreshSilently()
    } finally {
      setSubmitting(false)
    }
  }

  const deleteCurrent = async (commande: any) => {
    const currentRow = getCurrentRow(commande.id)
    if (!currentRow?.id) return

    try {
      setSubmitting(true)
      closeModal()
      flashSuccess('Ticket supprime avec succes.')

      await api.delete(`/cheques/demandes/${currentRow.id}/`)
      refreshSilently()
    } catch (err) {
      console.error(err)
      setError('Suppression impossible.')
      refreshSilently()
    } finally {
      setSubmitting(false)
    }
  }

  const stats = useMemo(() => {
    return {
      commandes: commandes.length,
      tickets: demandes.length,
      validations: demandes.filter((row: any) => row.statut_ticket === 'en_validation').length,
      signatures: demandes.filter((row: any) => row.statut_ticket === 'en_attente_signature').length,
      traites: demandes.filter((row: any) => row.statut_ticket === 'traitee').length,
    }
  }, [commandes, demandes])

  const modalCommande =
    modalCommandeId != null
      ? commandes.find((commande: any) => commande.id === modalCommandeId) || null
      : null

  const modalForm = modalCommande ? formByCommande[modalCommande.id] : null
  const modalCurrentRow = modalCommande ? getCurrentRow(modalCommande.id) : null
  const modalInitialTicket = modalCommande ? getInitialTicket(modalCommande.id) : null

  const hasApprovedFlow =
    !!modalCurrentRow &&
    ['en_attente_signature', 'cheque_signe', 'livre_a_equipe', 'traitee'].includes(modalCurrentRow.statut_ticket)

  return (
    <Layout>
      <div style={{ padding: '16px 18px 20px', fontSize: '14px' }}>
        {modalCommande && modalForm && (
          <div
            onClick={closeModal}
            style={{
              position: 'fixed',
              inset: 0,
              background: 'rgba(10, 15, 22, 0.72)',
              zIndex: 1000,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '18px',
            }}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              style={{
                width: '1120px',
                maxWidth: '96vw',
                maxHeight: '92vh',
                overflow: 'auto',
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #d9e0e7',
                boxShadow: '0 30px 80px rgba(10, 16, 28, 0.24)',
              }}
            >
              <div
                style={{
                  padding: '18px 20px',
                  background: 'linear-gradient(135deg, #182434 0%, #1f2d40 55%, #2a5ea8 100%)',
                  color: '#fff',
                }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 0.7fr 0.9fr auto', gap: '16px', alignItems: 'center' }}>
                  <div>
                    <div style={{ fontSize: '11px', opacity: 0.82, marginBottom: '4px', fontWeight: 700 }}>
                      GESTION DU TICKET
                    </div>
                    <div style={{ fontSize: '18px', fontWeight: 800 }}>{modalCommande.titre}</div>
                    <div style={{ fontSize: '11px', opacity: 0.86, marginTop: '3px' }}>
                      {modalCommande.fournisseur_nom || '-'} • {modalCommande.type_paiement || '-'}
                    </div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', opacity: 0.75, marginBottom: '3px' }}>Montant</div>
                    <div style={{ fontSize: '16px', fontWeight: 800 }}>{fmtDh(modalForm.montant)} DH</div>
                  </div>

                  <div>
                    <div style={{ fontSize: '10px', opacity: 0.75, marginBottom: '3px' }}>Etat du cheque</div>
                    <div style={{ fontSize: '12px', fontWeight: 800 }}>
                      {(modalCurrentRow || modalInitialTicket) ? getTicketStatusMeta((modalCurrentRow || modalInitialTicket)?.statut_ticket).label : 'Nouvelle commande'}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <button type="button" onClick={closeModal} style={compactButton('soft')}>
                      Fermer
                    </button>
                  </div>
                </div>
              </div>

              <div style={{ padding: '16px' }}>
                <div style={{ ...cardStyle, padding: '14px', marginBottom: '14px', background: '#fafbfc' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '12px' }}>
                    <div>
                      <div style={{ fontSize: '10px', color: '#9aa7b4', marginBottom: '4px' }}>Titre</div>
                      <div style={{ fontSize: '12px', color: '#1f2937', fontWeight: 600 }}>{modalCommande.titre || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#9aa7b4', marginBottom: '4px' }}>Fournisseur</div>
                      <div style={{ fontSize: '12px', color: '#1f2937' }}>{modalCommande.fournisseur_nom || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#9aa7b4', marginBottom: '4px' }}>Montant</div>
                      <div style={{ fontSize: '12px', color: '#1f2937' }}>{modalCommande.montant ? `${fmtDh(modalCommande.montant)} DH` : '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#9aa7b4', marginBottom: '4px' }}>Type de paiement</div>
                      <div style={{ fontSize: '12px', color: '#1f2937' }}>{modalCommande.type_paiement || '-'}</div>
                    </div>
                    <div>
                      <div style={{ fontSize: '10px', color: '#9aa7b4', marginBottom: '4px' }}>Document de commande</div>
                      {modalCommande.doc_url ? (
                        <a href={modalCommande.doc_url} target="_blank" rel="noreferrer" style={{ fontSize: '12px', color: '#2a5ea8', fontWeight: 700, textDecoration: 'none' }}>
                          Voir le document
                        </a>
                      ) : (
                        <div style={{ fontSize: '12px', color: '#9aa7b4' }}>Aucun</div>
                      )}
                    </div>
                  </div>
                </div>

                {!hasApprovedFlow ? (
                  <div style={{ ...cardStyle, padding: '18px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1d2836', marginBottom: '4px' }}>
                      {modalCurrentRow ? 'Validation de la demande de cheque' : 'Demande de cheque'}
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '14px' }}>
                      Demande initiale liee a la commande
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '16px' }}>
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
                          <div>
                            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Titre</label>
                            <input style={inputStyle} value={modalForm.titre} disabled />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Fournisseur</label>
                            <input style={inputStyle} value={modalCommande.fournisseur_nom || ''} disabled />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Type de paiement</label>
                            <input style={inputStyle} value={modalForm.type_paiement || ''} disabled />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Montant</label>
                            <input style={inputStyle} value={modalForm.montant} disabled />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date souhaitee de signature</label>
                            <input
                              type="date"
                              style={inputStyle}
                              value={modalForm.date_souhaitee_signature || ''}
                              disabled={!!modalCurrentRow && !isAdmin}
                              onChange={e => setCommandeForm(modalCommande.id, 'date_souhaitee_signature', e.target.value)}
                            />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Piece jointe PO</label>
                            {!modalCurrentRow && (
                              <input
                                type="file"
                                style={inputStyle}
                                onChange={e => setCommandeForm(modalCommande.id, 'po', e.target.files?.[0] || null)}
                              />
                            )}

                            {modalCurrentRow && !isAdmin && (
                              <div style={{ ...inputStyle, display: 'flex', alignItems: 'center', minHeight: '36px', color: '#64748b' }}>
                                {modalCurrentRow.po_url ? 'PO joint' : 'Aucune piece jointe'}
                              </div>
                            )}

                            {modalCurrentRow && isAdmin && (
                              <>
                                <input
                                  type="file"
                                  style={inputStyle}
                                  onChange={e => setCommandeForm(modalCommande.id, 'po', e.target.files?.[0] || null)}
                                />
                                {modalCurrentRow.po_url && (
                                  <a
                                    href={modalCurrentRow.po_url}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{ display: 'inline-block', marginTop: '6px', fontSize: '11px', color: '#2a5ea8', fontWeight: 700, textDecoration: 'none' }}
                                  >
                                    Voir la piece jointe actuelle
                                  </a>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1px solid #e5eaf0', borderRadius: '14px', padding: '14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d2836', marginBottom: '10px' }}>
                          Etat du ticket
                        </div>

                        <div
                          style={{
                            display: 'inline-block',
                            padding: '6px 10px',
                            borderRadius: '999px',
                            background: getTicketStatusMeta(modalCurrentRow?.statut_ticket).bg,
                            color: getTicketStatusMeta(modalCurrentRow?.statut_ticket).color,
                            border: `1px solid ${getTicketStatusMeta(modalCurrentRow?.statut_ticket).border}`,
                            fontSize: '11px',
                            fontWeight: 700,
                            marginBottom: '10px',
                          }}
                        >
                          {getTicketStatusMeta(modalCurrentRow?.statut_ticket).label}
                        </div>

                        <div style={{ fontSize: '11px', color: '#6b7280', lineHeight: 1.7 }}>
                          {!modalCurrentRow && 'La commande est prete. Le service achat peut envoyer la demande de cheque.'}
                          {modalCurrentRow?.statut_ticket === 'en_validation' && 'La demande est en attente de validation par l administration.'}
                          {modalCurrentRow?.statut_ticket === 'reporte' && 'La demande a ete reportee. Elle peut etre approuvee plus tard.'}
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                      <div>
                        {modalCurrentRow?.id && isAdmin && (
                          <button type="button" onClick={() => deleteCurrent(modalCommande)} style={compactButton('danger', submitting)}>
                            Supprimer le ticket
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {!modalCurrentRow && isAchat && (
                          <button type="button" onClick={() => saveInitialRequest(modalCommande)} style={compactButton('violet', submitting)}>
                            Demander le cheque
                          </button>
                        )}

                        {modalCurrentRow && isAdmin && (
                          <>
                            <button type="button" onClick={() => saveTicket(modalCommande)} style={compactButton('soft', submitting)}>
                              Modifier
                            </button>
                            <button type="button" onClick={() => updateTicketStatus(modalCommande, 'reporte')} style={compactButton('danger', submitting)}>
                              Desapprouver
                            </button>
                            <button type="button" onClick={() => updateTicketStatus(modalCommande, 'en_attente_signature')} style={compactButton('green', submitting)}>
                              Approuver
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ ...cardStyle, padding: '18px' }}>
                    <div style={{ fontSize: '15px', fontWeight: '700', color: '#1d2836', marginBottom: '4px' }}>
                      Gestion du cheque
                    </div>
                    <div style={{ fontSize: '11px', color: '#6b7280', marginBottom: '14px' }}>
                      Suivi du cheque apres approbation
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '16px' }}>
                      <div>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '11px' }}>
                          <div>
                            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Titre</label>
                            <input style={inputStyle} value={modalForm.titre} disabled />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Montant</label>
                            <input style={inputStyle} value={modalForm.montant} disabled />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Type de paiement</label>
                            <input style={inputStyle} value={modalForm.type_paiement || ''} disabled />
                          </div>

                          <div>
                            <label style={{ fontSize: '11px', color: '#6b7280', display: 'block', marginBottom: '4px' }}>Date d echeance</label>
                            <input
                              type="date"
                              style={inputStyle}
                              value={modalForm.date_echeance || ''}
                              disabled={!isAdmin}
                              onChange={e => setCommandeForm(modalCommande.id, 'date_echeance', e.target.value)}
                            />
                          </div>
                        </div>
                      </div>

                      <div style={{ background: '#f8fafc', border: '1px solid #e5eaf0', borderRadius: '14px', padding: '14px' }}>
                        <div style={{ fontSize: '12px', fontWeight: '700', color: '#1d2836', marginBottom: '10px' }}>
                          Suivi du cheque
                        </div>

                        <div style={{ display: 'grid', gap: '8px' }}>
                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr auto',
                              gap: '8px',
                              alignItems: 'center',
                              padding: '8px 10px',
                              background: '#fff',
                              border: '1px solid #e6edf5',
                              borderRadius: '10px',
                            }}
                          >
                            <span style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>Etat de signature</span>
                            <select
                              style={{ ...inputStyle, width: '150px', padding: '6px 8px', fontSize: '11px' }}
                              value={modalForm.etat_signature}
                              disabled={!isAdmin}
                              onChange={e => {
                                const value = e.target.value
                                setCommandeForm(modalCommande.id, 'etat_signature', value)

                                if (value === 'traitee') {
                                  setCommandeForm(modalCommande.id, 'statut_ticket', 'cheque_signe')
                                } else {
                                  setCommandeForm(modalCommande.id, 'statut_ticket', 'en_attente_signature')
                                }
                              }}
                            >
                              <option value="en_cours">En cours</option>
                              <option value="traitee">Traitee</option>
                            </select>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr auto',
                              gap: '8px',
                              alignItems: 'center',
                              padding: '8px 10px',
                              background: '#fff',
                              border: '1px solid #e6edf5',
                              borderRadius: '10px',
                            }}
                          >
                            <span style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>Etat de livraison a l equipe</span>
                            <select
                              style={{ ...inputStyle, width: '150px', padding: '6px 8px', fontSize: '11px' }}
                              value={modalForm.livre_a_equipe}
                              disabled={!isAdmin}
                              onChange={e => {
                                const value = e.target.value
                                setCommandeForm(modalCommande.id, 'livre_a_equipe', value)

                                if (value === 'traitee') {
                                  setCommandeForm(modalCommande.id, 'statut_ticket', 'livre_a_equipe')
                                }
                              }}
                            >
                              <option value="en_cours">En cours</option>
                              <option value="traitee">Traitee</option>
                            </select>
                          </div>

                          <div
                            style={{
                              display: 'grid',
                              gridTemplateColumns: '1fr auto',
                              gap: '8px',
                              alignItems: 'center',
                              padding: '8px 10px',
                              background: '#fff',
                              border: '1px solid #e6edf5',
                              borderRadius: '10px',
                            }}
                          >
                            <span style={{ fontSize: '12px', color: '#334155', fontWeight: 600 }}>Etat de livraison au transport</span>
                            <select
                              style={{ ...inputStyle, width: '150px', padding: '6px 8px', fontSize: '11px' }}
                              value={modalForm.livre_au_transport}
                              disabled={!isAdmin}
                              onChange={e => {
                                const value = e.target.value
                                setCommandeForm(modalCommande.id, 'livre_au_transport', value)

                                if (value === 'traitee') {
                                  setCommandeForm(modalCommande.id, 'etat_livraison', 'traitee')
                                  setCommandeForm(modalCommande.id, 'statut_ticket', 'traitee')
                                }
                              }}
                            >
                              <option value="en_cours">En cours</option>
                              <option value="traitee">Traitee</option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '8px', marginTop: '14px', flexWrap: 'wrap' }}>
                      <div>
                        {isAdmin && modalCurrentRow?.id && (
                          <button type="button" onClick={() => deleteCurrent(modalCommande)} style={compactButton('danger', submitting)}>
                            Supprimer le ticket
                          </button>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                        {isAdmin && (
                          <button type="button" onClick={() => saveTicket(modalCommande)} style={compactButton('dark', submitting)}>
                            Enregistrer
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div style={{ marginBottom: '14px' }}>
          <div style={{ ...cardStyle, padding: '18px 20px 16px', background: 'linear-gradient(135deg, #ffffff 0%, #fbfcfd 100%)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '14px', flexWrap: 'wrap' }}>
              <div>
                <div style={{ fontSize: '20px', fontWeight: '800', color: '#1d2836', marginBottom: '6px' }}>
                  Demandes de cheques
                </div>
                <div style={{ fontSize: '12px', color: '#6b7280', maxWidth: '760px' }}>
                  Suivi compact du circuit achat, validation et traitement des cheques lies aux commandes validees.
                </div>
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
          <button style={compactButton(activeSection === 'dashboard' ? 'dark' : 'soft')} onClick={() => setActiveSection('dashboard')}>
            Tableau de bord
          </button>
          <button style={compactButton(activeSection === 'gestion' ? 'dark' : 'soft')} onClick={() => setActiveSection('gestion')}>
            Gestion des cheques
          </button>
        </div>

        {activeSection === 'dashboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: '10px', marginBottom: '14px' }}>
            <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #1d2836' }}>
              <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Commandes valides</div>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#1d2836' }}>{stats.commandes}</div>
            </div>

            <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #2a5ea8' }}>
              <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Tickets</div>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#2a5ea8' }}>{stats.tickets}</div>
            </div>

            <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #d08b19' }}>
              <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>En validation</div>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#d08b19' }}>{stats.validations}</div>
            </div>

            <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #6b21a8' }}>
              <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>En attente de signature</div>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#6b21a8' }}>{stats.signatures}</div>
            </div>

            <div style={{ ...cardStyle, padding: '14px 14px 13px', borderTop: '3px solid #1f8a57' }}>
              <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '5px' }}>Traites</div>
              <div style={{ fontSize: '17px', fontWeight: '800', color: '#1f8a57' }}>{stats.traites}</div>
            </div>
          </div>
        )}

        {activeSection === 'gestion' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {commandes.length === 0 && (
              <div style={{ ...cardStyle, padding: '24px', color: '#888', textAlign: 'center' }}>
                Aucune commande validee disponible.
              </div>
            )}

            {commandes.map((commande: any) => {
              const rows = getCommandeRows(commande.id)
              const initialTicket = getInitialTicket(commande.id)
              const ticketMeta = getTicketStatusMeta(initialTicket?.statut_ticket || null)
              const showDetails = !!detailsOpen[commande.id]

              const dates = rows
                .filter((row: any) => !row.is_ticket_initial)
                .map((row: any) => row.date_echeance || row.date_souhaitee_signature || '-')
                .filter(Boolean)
                .join(' / ')

              const hasApprovedFlowCard =
                !!initialTicket &&
                ['en_attente_signature', 'cheque_signe', 'livre_a_equipe', 'traitee'].includes(initialTicket.statut_ticket)

              return (
                <div key={commande.id} style={{ ...cardStyle, overflow: 'hidden' }}>
                  <div
                    style={{
                      padding: '16px 18px',
                      display: 'grid',
                      gridTemplateColumns: '1.65fr 0.85fr 0.95fr 0.95fr auto',
                      gap: '14px',
                      alignItems: 'center',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: '17px', fontWeight: '800', color: '#1d2836', marginBottom: '6px' }}>
                        {commande.titre}
                      </div>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', alignItems: 'center' }}>
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>{commande.fournisseur_nom || 'Sans fournisseur'}</span>
                        <span style={{ width: '4px', height: '4px', borderRadius: '50%', background: '#c7d0db', display: 'inline-block' }} />
                        <span style={{ fontSize: '11px', color: '#6b7280' }}>{commande.type_paiement || 'Paiement non precise'}</span>
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>Montant</div>
                      <div style={{ fontSize: '20px', fontWeight: '800', color: '#2a5ea8' }}>
                        {commande.montant ? `${fmtDh(commande.montant)} DH` : '0 DH'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>Date d echeance du cheque</div>
                      <div style={{ fontSize: '12px', color: '#1f2937', fontWeight: 700 }}>
                        {dates || '-'}
                      </div>
                    </div>

                    <div>
                      <div style={{ fontSize: '10px', color: '#9ca3af', marginBottom: '4px' }}>Etat du cheque</div>
                      <div
                        style={{
                          display: 'inline-block',
                          padding: '5px 10px',
                          borderRadius: '999px',
                          background: ticketMeta.bg,
                          color: ticketMeta.color,
                          border: `1px solid ${ticketMeta.border}`,
                          fontSize: '11px',
                          fontWeight: 700,
                        }}
                      >
                        {ticketMeta.label}
                      </div>
                    </div>

                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                      <button
                        onClick={() => setDetailsOpen(prev => ({ ...prev, [commande.id]: !prev[commande.id] }))}
                        style={compactButton('soft')}
                      >
                        {showDetails ? 'Masquer les details' : 'Voir les details'}
                      </button>

                      {!initialTicket && isAchat && (
                        <button
                          type="button"
                          onClick={() => openInitialRequest(commande)}
                          style={compactButton('violet')}
                        >
                          Demander le cheque
                        </button>
                      )}

                      {initialTicket && isAdmin && !hasApprovedFlowCard && (
                        <button
                          type="button"
                          onClick={() => openTicketModal(commande, rows.findIndex((row: any) => row.id === initialTicket.id))}
                          style={compactButton('blue')}
                        >
                          Valider le cheque
                        </button>
                      )}

                      {initialTicket && isAdmin && hasApprovedFlowCard && (
                        <button
                          type="button"
                          onClick={() => openTicketModal(commande, rows.findIndex((row: any) => row.id === initialTicket.id))}
                          style={compactButton('dark')}
                        >
                          Gerer le cheque
                        </button>
                      )}

                      {initialTicket && isAchat && (
                        <button
                          type="button"
                          onClick={() => openTicketModal(commande, rows.findIndex((row: any) => row.id === initialTicket.id))}
                          style={compactButton('soft')}
                        >
                          Voir le ticket
                        </button>
                      )}
                    </div>
                  </div>

                  {showDetails && (
                    <div style={{ padding: '14px 18px', borderTop: '1px solid #e8eaed', background: '#fafbfd' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, minmax(0, 1fr))', gap: '12px' }}>
                        <div>
                          <div style={{ fontSize: '10px', color: '#9aa7b4', marginBottom: '4px' }}>Titre</div>
                          <div style={{ fontSize: '12px', color: '#1f2937', fontWeight: 600 }}>{commande.titre || '-'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#9aa7b4', marginBottom: '4px' }}>Fournisseur</div>
                          <div style={{ fontSize: '12px', color: '#1f2937' }}>{commande.fournisseur_nom || '-'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#9aa7b4', marginBottom: '4px' }}>Montant</div>
                          <div style={{ fontSize: '12px', color: '#1f2937' }}>{commande.montant ? `${fmtDh(commande.montant)} DH` : '-'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#9aa7b4', marginBottom: '4px' }}>Type de paiement</div>
                          <div style={{ fontSize: '12px', color: '#1f2937' }}>{commande.type_paiement || '-'}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#9aa7b4', marginBottom: '4px' }}>Document</div>
                          {commande.doc_url ? (
                            <a
                              href={commande.doc_url}
                              target="_blank"
                              rel="noreferrer"
                              style={{ fontSize: '12px', color: '#2a5ea8', fontWeight: 700, textDecoration: 'none' }}
                            >
                              Voir le document
                            </a>
                          ) : (
                            <div style={{ fontSize: '12px', color: '#9aa7b4' }}>Aucun</div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontSize: '10px', color: '#9aa7b4', marginBottom: '4px' }}>Nombre de tickets</div>
                          <div style={{ fontSize: '12px', color: '#1f2937', fontWeight: 700 }}>{rows.length}</div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </Layout>
  )
}

export default DemandesCheques
