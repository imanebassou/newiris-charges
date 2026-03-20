import { useEffect, useState } from 'react'
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import Layout from '../components/Layout'
import api from '../api/axios'

const COLORS = ['#1a3a6b', '#0099cc', '#e84c3d', '#f39c12', '#2ecc71']

const Dashboard = () => {
  const [chargesFixesTotal, setChargesFixesTotal] = useState(0)
  const [chargesVariablesTotal, setChargesVariablesTotal] = useState(0)
  const [categoriesData, setCategoriesData] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [fixesRes, variablesRes] = await Promise.all([
          api.get('/charges-fixes/'),
          api.get('/charges-variables/'),
        ])

        const fixes = fixesRes.data
        const variables = variablesRes.data

        const totalFixes = fixes.reduce((sum: number, c: any) => sum + parseFloat(c.montant), 0)
        const totalVariables = variables.reduce((sum: number, c: any) => sum + parseFloat(c.montant), 0)

        setChargesFixesTotal(totalFixes)
        setChargesVariablesTotal(totalVariables)

        const catMap: { [key: string]: number } = {}
        ;[...fixes, ...variables].forEach((c: any) => {
          catMap[c.categorie] = (catMap[c.categorie] || 0) + parseFloat(c.montant)
        })
        const catData = Object.entries(catMap).map(([name, value]) => ({ name, value }))
        setCategoriesData(catData)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const total = chargesFixesTotal + chargesVariablesTotal

  return (
    <Layout>
      <div style={{ padding: '20px' }}>
        <div style={{ marginBottom: '20px' }}>
          <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>
            Tableau de bord
          </h1>
          <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>
            Vue globale des charges
          </p>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', color: '#888', padding: '40px' }}>
            Chargement...
          </div>
        ) : (
          <>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '12px',
              marginBottom: '20px'
            }}>
              <div style={{
                background: '#fff', borderRadius: '8px',
                padding: '16px', border: '1px solid #e8eaed',
                borderTop: '3px solid #1a3a6b'
              }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
                  Total des charges
                </div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#1a3a6b' }}>
                  {total.toLocaleString('fr-FR')} DH
                </div>
                <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>
                  Fixes + Variables
                </div>
              </div>

              <div style={{
                background: '#fff', borderRadius: '8px',
                padding: '16px', border: '1px solid #e8eaed',
                borderTop: '3px solid #0099cc'
              }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
                  Charges fixes
                </div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#0099cc' }}>
                  {chargesFixesTotal.toLocaleString('fr-FR')} DH
                </div>
                <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>
                  {total > 0 ? ((chargesFixesTotal / total) * 100).toFixed(1) : 0}% du total
                </div>
              </div>

              <div style={{
                background: '#fff', borderRadius: '8px',
                padding: '16px', border: '1px solid #e8eaed',
                borderTop: '3px solid #e84c3d'
              }}>
                <div style={{ fontSize: '11px', color: '#888', marginBottom: '6px' }}>
                  Charges variables
                </div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: '#e84c3d' }}>
                  {chargesVariablesTotal.toLocaleString('fr-FR')} DH
                </div>
                <div style={{ fontSize: '10px', color: '#aaa', marginTop: '4px' }}>
                  {total > 0 ? ((chargesVariablesTotal / total) * 100).toFixed(1) : 0}% du total
                </div>
              </div>
            </div>

            <div style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '12px'
            }}>
              <div style={{
                background: '#fff', borderRadius: '8px',
                padding: '16px', border: '1px solid #e8eaed'
              }}>
                <h3 style={{
                  fontSize: '13px', fontWeight: '600',
                  color: '#1a3a6b', marginBottom: '16px'
                }}>
                  Répartition par catégorie
                </h3>
                {categoriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <PieChart>
                      <Pie
                        data={categoriesData}
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        dataKey="value"
                        label={({ name, percent }) =>
                          `${name} ${((percent ?? 0) * 100).toFixed(0)}%`
                        }
                      >
                        {categoriesData.map((_, index) => (
                          <Cell key={index} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        formatter={(value: any) =>
                          `${Number(value).toLocaleString('fr-FR')} DH`
                        }
                      />
                    </PieChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>
                    Aucune donnée
                  </div>
                )}
              </div>

              <div style={{
                background: '#fff', borderRadius: '8px',
                padding: '16px', border: '1px solid #e8eaed'
              }}>
                <h3 style={{
                  fontSize: '13px', fontWeight: '600',
                  color: '#1a3a6b', marginBottom: '16px'
                }}>
                  Montants par catégorie
                </h3>
                {categoriesData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={categoriesData}>
                      <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                      <YAxis tick={{ fontSize: 10 }} />
                      <Tooltip
                        formatter={(value: any) =>
                          `${Number(value).toLocaleString('fr-FR')} DH`
                        }
                      />
                      <Bar dataKey="value" fill="#1a3a6b" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div style={{ textAlign: 'center', color: '#aaa', padding: '40px' }}>
                    Aucune donnée
                  </div>
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