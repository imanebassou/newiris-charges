import { useRef, useState } from 'react'
// @ts-ignore
import * as XLSX from 'xlsx'

interface Props {
  onImport: (data: any[]) => Promise<void>
  columns: { key: string; label: string }[]
}

const ImportExcel = ({ onImport, columns }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [error, setError] = useState('')

  const parseDate = (val: any): string => {
    if (!val) return ''
    if (typeof val === 'number') {
      const date = XLSX.SSF.parse_date_code(val)
      const d = String(date.d).padStart(2, '0')
      const m = String(date.m).padStart(2, '0')
      return `${date.y}-${m}-${d}`
    }
    if (typeof val === 'string') {
      if (val.includes('/')) {
        const [d, m, y] = val.split('/')
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
      }
      return val
    }
    return ''
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true); setError(''); setSuccess(false)
    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: true })

      const parsed = rows.map(row => {
        const obj: any = {}
        columns.forEach(col => {
          const val = row[col.label] ?? row[col.key] ?? ''
          if (col.key === 'date' || col.key.includes('date')) {
            obj[col.key] = parseDate(val)
          } else {
            obj[col.key] = val
          }
        })
        return obj
      }).filter(row => Object.values(row).some(v => v !== '' && v !== null && v !== undefined))

      await onImport(parsed)
      setSuccess(true); setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('Erreur import. Vérifiez le format.')
      console.error(err)
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <div style={{ display: 'inline-block' }}>
      <input type="file" accept=".xlsx,.xls,.csv" ref={fileRef} onChange={handleFile} style={{ display: 'none' }} />
      <button onClick={() => fileRef.current?.click()} disabled={loading} style={{
        padding: '8px 16px', background: loading ? '#aaa' : '#fff',
        color: '#1a3a6b', border: '1px solid #1a3a6b',
        borderRadius: '6px', fontSize: '12px', cursor: loading ? 'not-allowed' : 'pointer', fontWeight: '600'
      }}>
        📥 {loading ? 'Import...' : 'Import data'}
      </button>
      {success && <div style={{ fontSize: '11px', color: '#1a7a40', marginTop: '4px' }}>✓ Import réussi !</div>}
      {error && <div style={{ fontSize: '11px', color: '#c0392b', marginTop: '4px' }}>{error}</div>}
    </div>
  )
}

export default ImportExcel