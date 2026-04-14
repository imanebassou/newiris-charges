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
  const [form, setForm] = useState({ service: '', categorie: '', montant: '', date: '' })

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
        date: form.date || null,
      })
      setShowForm(false)
      setForm({ service: '', categorie: '', montant: '', date: '' })
      fetchData()
    } catch (err) { console.error(err) }
  }

  const handleDelete = async (id: number) => {
    try { await api.delete(`/charges-fixes/${id}/`); fetchData() } catch (err) { console.error(err) }
  }

  const handleImport = async (rows: any[]) => {
    for (const row of rows) {
      try {
        // Trouver le service par nom
        const service = services.find(s => s.nom.toLowerCase() === String(row.service || '').toLowerCase())
        await api.post('/charges-fixes/', {
          service: service ? service.id : parseInt(String(row.service)) || services[0]?.id,
          categorie: row.categorie || '',
          montant: parseFloat(String(row.montant).replace(',', '.')),
          date: row.date || null,
        })
      } catch (err) { console.error(err) }
    }
    fetchData()
  }

  const inputStyle = { width: '100%', padding: '8px 12px', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '13px', outline: 'none' }
  const totalMontant = charges.reduce((sum, c) => sum + parseFloat(c.montant), 0)

  const tableData = charges.map((c, i) => ({
    ...c,
    index: i + 1,
    montant_fmt: `${parseFloat(c.montant).toLocaleString('fr-FR')} DH`,
    created_at_fmt: new Date(c.created_at).toLocaleDateString('fr-FR'),
    date_fmt: c.date ? new Date(c.date).toLocaleDateString('fr-FR') : '—',
  }))

  return (
    <Layout>
      <div style={{ padding: '20px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <div>
            <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#1a3a6b' }}>Charges fixes</h1>
            <p style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>Gestion des charges fixes</p>
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
            <button onClick={() => setShowForm(!showForm)} style={{ padding: '8px 16px', background: '#0099cc', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer', fontWeight: '600' }}>+ Ajouter charge fixe</button>
          </div>
        </div>

        <div style={{ background: '#fff', borderRadius: '8px', padding: '16px', border: '1px solid #e8eaed', borderTop: '3px solid #0099cc', marginBottom: '20px', display: 'inline-block', minWidth: '200px' }}>
          <div style={{ fontSize: '11px', color: '#888', marginBottom: '4px' }}>Total charges fixes</div>
          <div style={{ fontSize: '22px', fontWeight: '700', color: '#0099cc' }}>{totalMontant.toLocaleString('fr-FR')} DH</div>
        </div>

        {showForm && (
          <div style={{ background: '#fff', borderRadius: '8px', padding: '20px', border: '1px solid #e8eaed', marginBottom: '20px' }}>
            <h3 style={{ fontSize: '14px', fontWeight: '600', color: '#1a3a6b', marginBottom: '16px' }}>Nouvelle charge fixe</h3>
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
                  <label style={{ fontSize: '11px', color: '#555', display: 'block', marginBottom: '4px' }}>Période (date)</label>
                  <input style={inputStyle} type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
                <button type="submit" style={{ padding: '8px 20px', background: '#1a3a6b', color: '#fff', border: 'none', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Créer</button>
                <button type="button" onClick={() => setShowForm(false)} style={{ padding: '8px 20px', background: '#fff', color: '#555', border: '1px solid #e0e0e0', borderRadius: '6px', fontSize: '12px', cursor: 'pointer' }}>Annuler</button>
              </div>
            </form>
          </div>
        )}

        {loading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: '#888' }}>Chargement...</div>
        ) : (
          <SortableTable
            emptyMessage="Aucune charge fixe"
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
        )}
      </div>
    </Layout>
  )
}

export default ChargesFixes