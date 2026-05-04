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
import { useAuth } from '../context/AuthContext'

const COLORS = ['#c93128', '#1d2836', '#2a5ea8', '#1f8a57', '#8e44ad', '#d08b19']

const cardStyle = {
  background: '#ffffff',
  borderRadius: '12px',
  border: '1px solid #d9e0e7',
  boxShadow: '0 12px 28px rgba(19, 29, 43, 0.05)',
}

const fmtMoney = (value: any) =>
  Number(value || 0).toLocaleString('fr-FR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })

const Dashboard = () => {
  document.title = "Page d'accueil - NEWIRIS"

  const { user, canViewPage } = useAuth()
  const [loading, setLoading] = useState(true)

  const [banqueActions, setBanqueActions] = useState<any[]>([])
  const [chargesFixes, setChargesFixes] = useState<any[]>([])
  const [chargesVariables, setChargesVariables] = useState<any[]>([])
  const [fournisseurs, setFournisseurs] = useState<any[]>([])
  const [commandes, setCommandes] = useState<any[]>([])
  const [cheques, setCheques] = useState<any[]>([])
  const [caisseSolde, setCaisseSolde] = useState<any>(null)
  const [services, setServices] = useState<any[]>([])

  const firstName =
    user?.first_name?.trim() ||
    user?.username?.trim() ||
    'Bienvenue'

  const greeting = (() => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Bonjour'
    if (hour < 18) return 'Bon apres-midi'
    return 'Bonsoir'
  })()

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true)
      try {
        const requests: Promise<any>[] = []

        if (canViewPage('banque')) requests.push(api.get('/banque/actions/'))
        else requests.push(Promise.resolve({ data: [] }))

        if (canViewPage('charges_fixes')) requests.push(api.get('/charges-fixes/'))
        else requests.push(Promise.resolve({ data: [] }))

        if (canViewPage('charges_variables')) requests.push(api.get('/charges-variables/'))
        else requests.push(Promise.resolve({ data: [] }))

        if (canViewPage('fournisseurs')) requests.push(api.get('/fournisseurs/'))
        else requests.push(Promise.resolve({ data: [] }))

        if (canViewPage('commandes')) requests.push(api.get('/commandes/'))
        else requests.push(Promise.resolve({ data: [] }))

        if (canViewPage('demandes_cheques')) requests.push(api.get('/cheques/demandes/'))
        else requests.push(Promise.resolve({ data: [] }))

        if (canViewPage('caisse')) requests.push(api.get('/caisse/solde/'))
        else requests.push(Promise.resolve({ data: null }))

        if (canViewPage('caisse')) requests.push(api.get('/caisse/actions/?principale=true'))
        else requests.push(Promise.resolve({ data: [] }))

        if (
          canViewPage('dashboard') ||
          canViewPage('services') ||
          canViewPage('charges_variables') ||
          canViewPage('charges_fixes')
        ) {
          requests.push(api.get('/services/'))
        } else {
          requests.push(Promise.resolve({ data: [] }))
        }

        const [
          banqueRes,
          fixesRes,
          variablesRes,
          fournisseursRes,
          commandesRes,
          chequesRes,
          soldeRes,
          _caissePrincipaleRes,
          servicesRes,
        ] = await Promise.all(requests)

        setBanqueActions(Array.isArray(banqueRes.data) ? banqueRes.data : [])
        setChargesFixes(Array.isArray(fixesRes.data) ? fixesRes.data : [])
        setChargesVariables(Array.isArray(variablesRes.data) ? variablesRes.data : [])
        setFournisseurs(Array.isArray(fournisseursRes.data) ? fournisseursRes.data : [])
        setCommandes(Array.isArray(commandesRes.data) ? commandesRes.data : [])
        setCheques(Array.isArray(chequesRes.data) ? chequesRes.data : [])
        setCaisseSolde(soldeRes.data || null)
        setServices(Array.isArray(servicesRes.data) ? servicesRes.data : [])
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [canViewPage])

  const pendingTasks = useMemo(() => {
    const tasks: Array<{ title: string; value: string; note: string; color: string }> = []

    if (canViewPage('charges_variables')) {
      const pendingChargesVariables = chargesVariables.filter((c: any) => c.statut === 'en_cours').length
      if (pendingChargesVariables > 0) {
        tasks.push({
          title: 'Charges variables en attente',
          value: `${pendingChargesVariables}`,
          note: 'A traiter ou valider',
          color: '#c93128',
        })
      }
    }

    if (canViewPage('banque')) {
      const pendingBanque = banqueActions.filter((a: any) => a.statut === 'en_cours').length
      if (pendingBanque > 0) {
        tasks.push({
          title: 'Operations bancaires en cours',
          value: `${pendingBanque}`,
          note: 'Suivi des entrees et sorties',
          color: '#2a5ea8',
        })
      }
    }

    if (canViewPage('commandes')) {
      const pendingCommandes = commandes.filter(
        (c: any) => c.validation_direction === 'en_attente' || c.validation_finance === 'en_attente'
      ).length
      if (pendingCommandes > 0) {
        tasks.push({
          title: 'Commandes a valider',
          value: `${pendingCommandes}`,
          note: 'Direction ou finance',
          color: '#1d2836',
        })
      }
    }

    if (canViewPage('fournisseurs')) {
      const fournisseursDepasses = fournisseurs.filter((f: any) => f.etat_regularite === 'depasee').length
      if (fournisseursDepasses > 0) {
        tasks.push({
          title: 'Regularites depassees',
          value: `${fournisseursDepasses}`,
          note: 'Fournisseurs a verifier',
          color: '#c93128',
        })
      }
    }

    if (canViewPage('demandes_cheques')) {
      const chequesEnCours = cheques.filter((c: any) => c.etat_signature === 'en_cours').length
      if (chequesEnCours > 0) {
        tasks.push({
          title: 'Cheques en cours',
          value: `${chequesEnCours}`,
          note: 'Signature ou livraison',
          color: '#d08b19',
        })
      }
    }

    return tasks
  }, [banqueActions, chargesVariables, commandes, fournisseurs, cheques, canViewPage])

  const kpiCards = useMemo(() => {
    const cards: Array<{ title: string; value: string; note: string; color: string }> = []

    if (canViewPage('caisse') && caisseSolde) {
      cards.push({
        title: 'Solde caisse principale',
        value: `${fmtMoney(caisseSolde.solde_calcule)} DH`,
        note: 'Vue globale actuelle',
        color: '#1d2836',
      })
    }

    if (canViewPage('banque')) {
      const totalEntrees = banqueActions
        .filter((a: any) => a.type === 'entree' && a.statut === 'traitee')
        .reduce((sum: number, a: any) => sum + parseFloat(a.montant || 0), 0)

      cards.push({
        title: 'Banque - Entrees traitees',
        value: `${fmtMoney(totalEntrees)} DH`,
        note: 'Montant confirme',
        color: '#1f8a57',
      })
    }

    if (canViewPage('charges_fixes')) {
      const totalFixes = chargesFixes.reduce((sum: number, c: any) => sum + parseFloat(c.montant || 0), 0)
      cards.push({
        title: 'Charges fixes',
        value: `${fmtMoney(totalFixes)} DH`,
        note: `${chargesFixes.length} ligne(s)`,
        color: '#2a5ea8',
      })
    }

    if (canViewPage('charges_variables')) {
      const totalVariables = chargesVariables
        .filter((c: any) => c.statut === 'traitee')
        .reduce((sum: number, c: any) => sum + parseFloat(c.montant || 0), 0)

      cards.push({
        title: 'Charges variables traitees',
        value: `${fmtMoney(totalVariables)} DH`,
        note: 'Montant valide',
        color: '#c93128',
      })
    }

    if (canViewPage('fournisseurs')) {
      cards.push({
        title: 'Fournisseurs',
        value: `${fournisseurs.length}`,
        note: `${fournisseurs.filter((f: any) => f.etat_regularite === 'depasee').length} depasse(s)`,
        color: '#8e44ad',
      })
    }

    if (canViewPage('commandes')) {
      const totalCommandes = commandes.reduce((sum: number, c: any) => sum + Number(c.montant || 0), 0)
      cards.push({
        title: 'Commandes',
        value: `${fmtMoney(totalCommandes)} DH`,
        note: `${commandes.length} commande(s)`,
        color: '#d08b19',
      })
    }

    if (canViewPage('demandes_cheques')) {
      cards.push({
        title: 'Demandes de cheques',
        value: `${cheques.length}`,
        note: 'Suivi centralise',
        color: '#1f8a57',
      })
    }

    return cards.slice(0, 6)
  }, [banqueActions, chargesFixes, chargesVariables, fournisseurs, commandes, cheques, caisseSolde, canViewPage])

  const serviceKpis = useMemo(() => {
    if (!services.length || !chargesVariables.length) return []

    const data = services
      .map((service: any) => {
        const total = chargesVariables
          .filter((row: any) => row.service === service.id && row.statut === 'traitee')
          .reduce((sum: number, row: any) => sum + Number(row.montant || 0), 0)

        return {
          name: service.nom,
          value: total,
        }
      })
      .filter((item) => item.value > 0)
      .sort((a, b) => b.value - a.value)
      .slice(0, 6)

    return data
  }, [services, chargesVariables])

  const homeModules = useMemo(() => {
    const modules: Array<{ name: string; note: string; color: string }> = []

    if (canViewPage('caisse')) modules.push({ name: 'Caisse', note: 'Suivi des flux', color: '#1d2836' })
    if (canViewPage('banque')) modules.push({ name: 'Banque', note: 'Operations bancaires', color: '#2a5ea8' })
    if (canViewPage('charges_fixes')) modules.push({ name: 'Charges fixes', note: 'Charges recurrentes', color: '#8e44ad' })
    if (canViewPage('charges_variables')) modules.push({ name: 'Charges variables', note: 'Depenses traitees', color: '#c93128' })
    if (canViewPage('fournisseurs')) modules.push({ name: 'Fournisseurs', note: 'Contrats et regularite', color: '#d08b19' })
    if (canViewPage('commandes')) modules.push({ name: 'Commandes', note: 'Validation et suivi', color: '#1f8a57' })

    return modules.slice(0, 6)
  }, [canViewPage])

  const activityData = useMemo(() => {
    const items: Array<{ name: string; value: number }> = []

    if (canViewPage('charges_variables')) {
      items.push({
        name: 'Charges variables',
        value: chargesVariables.filter((c: any) => c.statut === 'en_cours').length,
      })
    }

    if (canViewPage('commandes')) {
      items.push({
        name: 'Commandes',
        value: commandes.filter(
          (c: any) => c.validation_direction === 'en_attente' || c.validation_finance === 'en_attente'
        ).length,
      })
    }

    if (canViewPage('fournisseurs')) {
      items.push({
        name: 'Fournisseurs',
        value: fournisseurs.filter((f: any) => f.etat_regularite === 'depasee').length,
      })
    }

    if (canViewPage('demandes_cheques')) {
      items.push({
        name: 'Cheques',
        value: cheques.filter((c: any) => c.etat_signature === 'en_cours').length,
      })
    }

    if (canViewPage('banque')) {
      items.push({
        name: 'Banque',
        value: banqueActions.filter((a: any) => a.statut === 'en_cours').length,
      })
    }

    return items.filter((item) => item.value > 0)
  }, [chargesVariables, commandes, fournisseurs, cheques, banqueActions, canViewPage])

  return (
    <Layout>
      <div style={{ padding: '16px 18px 20px' }}>
        <div style={{ ...cardStyle, padding: '22px 22px 20px', marginBottom: '14px', overflow: 'hidden', position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background:
                'radial-gradient(circle at 12% 20%, rgba(201,49,40,0.08) 0%, rgba(201,49,40,0) 30%), radial-gradient(circle at 85% 20%, rgba(42,94,168,0.08) 0%, rgba(42,94,168,0) 28%)',
              pointerEvents: 'none',
            }}
          />
          <div style={{ position: 'relative', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '10px', padding: '6px 10px', borderRadius: '999px', background: '#f7fafc', border: '1px solid #e5eaf0', fontSize: '11px', fontWeight: 700, color: '#2a5ea8' }}>
                <span style={{ width: '8px', height: '8px', borderRadius: '999px', background: '#c93128' }} />
                PAGE D'ACCUEIL
              </div>
              <div style={{ fontSize: '28px', fontWeight: 800, color: '#1d2836', lineHeight: 1.12, marginBottom: '8px' }}>
                {greeting}, {firstName}
              </div>
              <div style={{ fontSize: '13px', color: '#6b7280', maxWidth: '720px', lineHeight: 1.65 }}>
                Voici votre vue d'ensemble NEWIRIS. Cette page s'adapte a vos acces et met en avant les indicateurs utiles,
                les priorites du moment et les points qui demandent une action.
              </div>
            </div>

            <div style={{ ...cardStyle, padding: '12px 14px', minWidth: '230px', borderTop: '3px solid #1d2836' }}>
              <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '4px' }}>Acces actifs</div>
              <div style={{ fontSize: '17px', fontWeight: 800, color: '#1d2836' }}>
                {homeModules.length} module(s)
              </div>
              <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>
                Contenu personnalise selon vos permissions
              </div>
            </div>
          </div>
        </div>

        {loading ? (
          <div style={{ ...cardStyle, padding: '36px', textAlign: 'center', color: '#6b7280' }}>
            Chargement...
          </div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, minmax(0, 1fr))', gap: '12px', marginBottom: '18px' }}>
              {kpiCards.map((card) => (
                <div key={card.title} style={{ ...cardStyle, padding: '12px 16px', borderTop: `3px solid ${card.color}`, minHeight: '94px' }}>
                  <div style={{ fontSize: '10.5px', color: '#6b7280', marginBottom: '4px' }}>{card.title}</div>
                  <div style={{ fontSize: '18px', fontWeight: 800, color: card.color, lineHeight: 1.15 }}>{card.value}</div>
                  <div style={{ fontSize: '10px', color: '#9ca3af', marginTop: '6px' }}>{card.note}</div>
                </div>
              ))}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: '12px', marginBottom: '18px' }}>
              <div style={{ ...cardStyle, padding: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1d2836', marginBottom: '10px' }}>
                  Priorites du moment
                </div>

                {pendingTasks.length > 0 ? (
                  <div style={{ display: 'grid', gap: '10px' }}>
                    {pendingTasks.map((task) => (
                      <div
                        key={task.title}
                        style={{
                          border: '1px solid #e5eaf0',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          gap: '12px',
                        }}
                      >
                        <div>
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#1d2836', marginBottom: '3px' }}>
                            {task.title}
                          </div>
                          <div style={{ fontSize: '11px', color: '#6b7280' }}>{task.note}</div>
                        </div>
                        <div style={{ fontSize: '18px', fontWeight: 800, color: task.color }}>
                          {task.value}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ textAlign: 'center', padding: '42px 10px', color: '#94a3b8', fontSize: '12px' }}>
                    Rien d'urgent pour le moment.
                  </div>
                )}
              </div>

              <div style={{ ...cardStyle, padding: '16px' }}>
                <div style={{ fontSize: '14px', fontWeight: 800, color: '#1d2836', marginBottom: '10px' }}>
                  Vos espaces
                </div>

                <div style={{ display: 'grid', gap: '10px' }}>
                  {homeModules.length > 0 ? (
                    homeModules.map((module) => (
                      <div
                        key={module.name}
                        style={{
                          border: '1px solid #e5eaf0',
                          borderRadius: '12px',
                          padding: '12px 14px',
                          background: '#fbfdff',
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '9px', marginBottom: '5px' }}>
                          <div style={{ width: '10px', height: '10px', borderRadius: '999px', background: module.color, flexShrink: 0 }} />
                          <div style={{ fontSize: '13px', fontWeight: 800, color: '#1d2836' }}>{module.name}</div>
                        </div>
                        <div style={{ fontSize: '11px', color: '#6b7280' }}>{module.note}</div>
                      </div>
                    ))
                  ) : (
                    <div style={{ textAlign: 'center', padding: '42px 10px', color: '#94a3b8', fontSize: '12px' }}>
                      Aucun module autorise.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1.15fr 0.85fr', gap: '12px', marginBottom: '18px' }}>
              <div style={{ ...cardStyle, padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1d2836', marginBottom: '10px' }}>
                  Charge d'action par module
                </div>

                {activityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={activityData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(v: any) => `${v} element(s)`} />
                      <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                        {activityData.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '108px', fontSize: '12px' }}>
                    Aucune action en attente
                  </div>
                )}
              </div>

              <div style={{ ...cardStyle, padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1d2836', marginBottom: '10px', textAlign: 'center' }}>
                  Repartition des priorites
                </div>

                {activityData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={260}>
                    <PieChart>
                      <Pie data={activityData} dataKey="value" nameKey="name" outerRadius={82} innerRadius={36} paddingAngle={2}>
                        {activityData.map((_: any, i: number) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(v: any) => `${v} element(s)`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#9ca3af', paddingTop: '108px', fontSize: '12px' }}>
                    Aucune priorite ouverte
                  </div>
                )}
              </div>
            </div>

            {serviceKpis.length > 0 && (
              <div style={{ ...cardStyle, padding: '14px' }}>
                <div style={{ fontSize: '13px', fontWeight: 800, color: '#1d2836', marginBottom: '10px' }}>
                  Charges variables traitees par service
                </div>

                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={serviceKpis}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eef2f6" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: any) => `${fmtMoney(v)} DH`} />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {serviceKpis.map((_: any, i: number) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard
