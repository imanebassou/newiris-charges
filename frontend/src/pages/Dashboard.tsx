import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../components/Layout'
import api from '../api/axios'

const COLORS = ['#1a3a6b', '#0099cc', '#e84c3d', '#f39c12', '#2ecc71']

const Dashboard = () => {
  document.title = 'Dashboard — Newiris'

  const [chargesFixes, setChargesFixes] = useState<any[]>([])
  const [chargesVariables, setChargesVariables] = useState<any[]>([])
  const [services, setServices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const [filtreService, setFiltreService] = useState('')
  const [filtreCategorie, setFiltreCategorie] = useState('')
  const [filtreMois, setFiltreMois] = useState('')

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fixesRes, variablesRes, servicesRes] = await Promise.all([
          api.get('/charges-fixes/'),
          api.get('/charges-variables/'),
          api.get('/services/'),
        ])
        setChargesFixes(fixesRes.data)
        setChargesVariables(variablesRes.data)
        setServices(servicesRes.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const filteredFixes = chargesFixes.filter(c => {
    if (filtreService && c.service !== parseInt(filtreService)) return false
    if (filtreCategorie && c.categorie !== filtreCategorie) return false
    return true
  })

  const filteredVariables = chargesVariables.filter(c => {
    if (filtreService && c.service !== parseInt(filtreService)) return false
    if (filtreCategorie && c.categorie !== filtreCategorie) return false
    if (filtreMois && !c.date.startsWith(filtreMois)) return false
    return true
  })

  const totalFixes = filteredFixes.reduce((sum, c) => sum + parseFloat(c.montant), 0)
  const totalVariables = filteredVariables.reduce((sum, c) => sum + parseFloat(c.montant), 0)
  const total = totalFixes + totalVariables

  const catMap: { [key: string]: number } = {}
  ;[...filteredFixes, ...filteredVariables].forEach((c: any) => {
    catMap[c.categorie] = (catMap[c.categorie] || 0) + parseFloat(c.montant)
  })
  const categoriesData = Object.entries(catMap).map(([name, value]) => ({ name, value }))

  const categories = [...new Set([...chargesFixes, ...chargesVariables].map(c => c.categorie))]

  const mois = [
    { value: '2026-01', label: 'Janvier 2026' },
    { value: '2026-02', label: 'Février 2026' },
    { value: '2026-03', label: 'Mars 2026' },
    { value: '2026-04', label: 'Avril 2026' },
    { value: '2026-05', label: 'Mai 2026' },
    { value: '2026-06', label: 'Juin 2026' },
    { value: '2026-07', label: 'Juillet 2026' },
    { value: '2026-08', label: 'Août 2026' },
    { value: '2026-09', label: 'Septembre 2026' },
    { value: '2026-10', label: 'Octobre 2026' },
    { value: '2026-11', label: 'Novembre 2026' },
    { value: '2026-12', label: 'Décembre 2026' },
  ]

  const selectStyle = {
    padding: '6px 12px', border: '1px solid #e0e0e0',
    borderRadius: '6px', fontSize: '12px',
    background: '#fff', cursor: 'pointer', outline: 'none',
  }

  return (
    <Layout>
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Tableau de bord</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Vue globale des charges</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <select style={selectStyle} value={filtreMois} onChange={e => setFiltreMois(e.target.value)}>
              <option value="">Tous les mois</option>
              {mois.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
            <select style={selectStyle} value={filtreService} onChange={e => setFiltreService(e.target.value)}>
              <option value="">Tous les services</option>
              {services.map(s => <option key={s.id} value={s.id}>{s.nom}</option>)}
            </select>
            <select style={selectStyle} value={filtreCategorie} onChange={e => setFiltreCategorie(e.target.value)}>
              <option value="">Toutes les catégories</option>
              {categories.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
            {(filtreService || filtreCategorie || filtreMois) && (
              <button
                onClick={() => { setFiltreService(''); setFiltreCategorie(''); setFiltreMois('') }}
                style={{
                  padding: '6px 12px', background: '#fdeaea',
                  color: '#c0392b', border: '1px solid #f5c6c6',
                  borderRadius: '6px', fontSize: '12px', cursor: 'pointer'
                }}
              >
                Réinitialiser
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>Chargement...</div>
        ) : (
          <>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '20px' }}>
              <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed', borderTop: '3px solid #1a3a6b' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>Total des charges</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a3a6b' }}>
                  {total.toLocaleString('fr-FR')} DH
                </div>
                <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>Fixes + Variables</div>
              </div>
              <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed', borderTop: '3px solid #0099cc' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>Charges fixes</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#0099cc' }}>
                  {totalFixes.toLocaleString('fr-FR')} DH
                </div>
                <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>
                  {total > 0 ? ((totalFixes / total) * 100).toFixed(1) : 0}% du total
                </div>
              </div>
              <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed', borderTop: '3px solid #e84c3d' }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>Charges variables</div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#e84c3d' }}>
                  {totalVariables.toLocaleString('fr-FR')} DH
                </div>
                <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>
                  {total > 0 ? ((totalVariables / total) * 100).toFixed(1) : 0}% du total
                </div>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
              <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>
                  Répartition par catégorie
                </h3>
                {categoriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={categoriesData}
                        cx="50%" cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                      >
                        {categoriesData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: any) => `${Number(value).toLocaleString('fr-FR')} DH`} />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>Aucune donnée</div>
                )}
              </div>

              <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed' }}>
                <h3 style={{ fontSize: '13px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>
                  Montants par catégorie
                </h3>
                {categoriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoriesData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip formatter={(value: any) => `${Number(value).toLocaleString('fr-FR')} DH`} />
                      <Bar dataKey="value" fill="#1a3a6b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>Aucune donnée</div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </Layout>
  )
}

export default Dashboard