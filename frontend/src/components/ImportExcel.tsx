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
  const [successCount, setSuccessCount] = useState(0)
  const [error, setError] = useState('')

  const today = new Date().toISOString().split('T')[0]

  const parseDate = (val: any): string => {
    if (!val) return today
    if (typeof val === 'number') {
      try {
        const date = XLSX.SSF.parse_date_code(val)
        const d = String(date.d).padStart(2, '0')
        const m = String(date.m).padStart(2, '0')
        return `${date.y}-${m}-${d}`
      } catch { return today }
    }
    if (typeof val === 'string') {
      if (val.includes('/')) {
        const parts = val.split('/')
        if (parts.length === 3) {
          const [d, m, y] = parts
          return `${y.padStart(4,'20')}-${m.padStart(2,'0')}-${d.padStart(2,'0')}`
        }
      }
      if (val.match(/^\d{4}-\d{2}-\d{2}$/)) return val
      return today
    }
    return today
  }

  const parseValue = (val: any, colKey: string): any => {
    if (colKey.includes('date') || colKey === 'date') {
      return parseDate(val)
    }
    if (colKey === 'montant') {
      if (!val && val !== 0) return 0
      const num = parseFloat(String(val).replace(',', '.').replace(/[^0-9.-]/g, ''))
      return isNaN(num) ? 0 : num
    }
    if (val === undefined || val === null) return ''
    return String(val).trim()
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setLoading(true); setError(''); setSuccess(false)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: '' })

      if (rawRows.length === 0) {
        setError('Fichier vide !'); setLoading(false); return
      }

      const parsed = rawRows.map((row: any) => {
        const rowKeys = Object.keys(row).map(k => k.toLowerCase().trim())
        const rowValues = Object.values(row)
        const obj: any = {}

        columns.forEach((col, colIndex) => {
          // Chercher par nom de colonne
          const matchIdx = rowKeys.findIndex(k =>
            k === col.key.toLowerCase() ||
            k === col.label.toLowerCase() ||
            k.includes(col.key.toLowerCase()) ||
            k.includes(col.label.toLowerCase()) ||
            col.key.toLowerCase().includes(k) ||
            col.label.toLowerCase().includes(k)
          )

          if (matchIdx !== -1) {
            const rawKey = Object.keys(row)[matchIdx]
            obj[col.key] = parseValue(row[rawKey], col.key)
          } else if (rowValues[colIndex] !== undefined && rowValues[colIndex] !== '') {
            // Utiliser par position si pas trouvé par nom
            obj[col.key] = parseValue(rowValues[colIndex], col.key)
          } else {
            obj[col.key] = col.key.includes('date') ? today : col.key === 'montant' ? 0 : ''
          }
        })

        return obj
      })

      setSuccessCount(parsed.length)
      await onImport(parsed)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError('Erreur import. Vérifiez le fichier.')
      setTimeout(() => setError(''), 5000)
      console.error(err)
    } finally {
      setLoading(false)
      if (fileRef.current) fileRef.current.value = ''
    }
  }

  return (
    <>
      <input
        type="file"
        accept=".xlsx,.xls,.csv"
        ref={fileRef}
        onChange={handleFile}
        style={{ display: 'none' }}
      />

      {/* TOAST SUCCESS */}
      {success && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: '#1a7a40', color: '#fff',
          padding: '14px 20px', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          fontSize: '13px', fontWeight: '600',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '20px' }}>✅</span>
          <div>
            <div>Import réussi !</div>
            <div style={{ fontSize: '11px', opacity: 0.85 }}>
              {successCount} ligne{successCount > 1 ? 's' : ''} importée{successCount > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {/* TOAST ERROR */}
      {error && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px', zIndex: 9999,
          background: '#c0392b', color: '#fff',
          padding: '14px 20px', borderRadius: '10px',
          boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
          fontSize: '13px', fontWeight: '600',
          display: 'flex', alignItems: 'center', gap: '10px',
        }}>
          <span style={{ fontSize: '20px' }}>❌</span>
          <div>{error}</div>
        </div>
      )}

      {/* BOUTON */}
      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        style={{
          padding: '6px 12px',
          background: loading ? '#e8eaed' : '#fff',
          color: loading ? '#888' : '#1a3a6b',
          border: '1px solid #1a3a6b',
          borderRadius: '6px', fontSize: '12px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: '600',
          display: 'flex', alignItems: 'center', gap: '4px',
        }}
      >
        {loading ? '⏳ Import...' : '📥 Import data'}
      </button>
    </>
  )
}

export default ImportExcel