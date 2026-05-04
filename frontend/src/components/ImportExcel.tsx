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

  const normalizeText = (val: any): string =>
    String(val ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, ' ')
      .trim()

  const parseDate = (val: any): string => {
    if (!val) return ''
    if (val instanceof Date && !isNaN(val.getTime())) {
      return val.toISOString().split('T')[0]
    }
    if (typeof val === 'number') {
      try {
        const date = XLSX.SSF.parse_date_code(val)
        const d = String(date.d).padStart(2, '0')
        const m = String(date.m).padStart(2, '0')
        return `${date.y}-${m}-${d}`
      } catch {
        return ''
      }
    }
    if (typeof val === 'string') {
      const clean = val.trim()
      if (!clean) return ''
      if (/^\d{4}-\d{2}-\d{2}$/.test(clean)) return clean
      if (/^\d+(\.\d+)?$/.test(clean)) {
        try {
          const excelDate = XLSX.SSF.parse_date_code(Number(clean))
          const d = String(excelDate.d).padStart(2, '0')
          const m = String(excelDate.m).padStart(2, '0')
          return `${excelDate.y}-${m}-${d}`
        } catch {
          return ''
        }
      }
      const slashMatch = clean.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
      if (slashMatch) {
        const [, d, m, y] = slashMatch
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
      }
      const dashMatch = clean.match(/^(\d{1,2})-(\d{1,2})-(\d{4})$/)
      if (dashMatch) {
        const [, d, m, y] = dashMatch
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
      }
      const yearFirstSlash = clean.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
      if (yearFirstSlash) {
        const [, y, m, d] = yearFirstSlash
        return `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`
      }
      return ''
    }
    return ''
  }

  const parseValue = (val: any, colKey: string): any => {
    if (colKey.includes('date') || colKey === 'date') {
      return parseDate(val)
    }
    if (colKey === 'montant' || colKey === 'salaire_base') {
      if (!val && val !== 0) return 0
      const num = parseFloat(String(val).replace(',', '.').replace(/[^0-9.-]/g, ''))
      return isNaN(num) ? 0 : num
    }
    if (val === undefined || val === null) return ''
    return String(val).trim()
  }

  const buildAliases = (key: string, label: string): string[] => {
    const source = [key, label]
    const aliases = new Set<string>()

    source.forEach((item) => {
      const normalized = normalizeText(item)
      if (!normalized) return
      aliases.add(normalized)
      aliases.add(normalized.replace(/\s+/g, ''))
    })

    const extraAliases: Record<string, string[]> = {
      nom: ['nom'],
      prenom: ['prenom', 'pre nom'],
      salaire_base: ['salaire base', 'salaire de base', 'base'],
      date_debut: ['date debut', 'debut', 'date debut contrat'],
      date_fin: ['date fin', 'fin', 'date fin contrat'],
      salarie: ['salarie', 'employe', 'nom complet', 'nom prenom'],
      type: ['type', 'mouvement'],
      categorie: ['categorie', 'rubrique'],
      montant: ['montant', 'montant dh', 'somme'],
      date: ['date', 'date action'],
      statut: ['statut', 'etat'],
      titre: ['titre', 'libelle', 'objet'],
      description: ['description', 'commentaire', 'details'],
    }

    ;(extraAliases[key] || []).forEach((alias) => {
      const normalized = normalizeText(alias)
      if (!normalized) return
      aliases.add(normalized)
      aliases.add(normalized.replace(/\s+/g, ''))
    })

    return Array.from(aliases)
  }

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setLoading(true)
    setError('')
    setSuccess(false)

    try {
      const data = await file.arrayBuffer()
      const workbook = XLSX.read(data)
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const rawRows: any[] = XLSX.utils.sheet_to_json(sheet, { raw: true, defval: '' })

      if (rawRows.length === 0) {
        setError('Fichier vide.')
        setLoading(false)
        return
      }

      const parsed = rawRows.map((row: any) => {
        const rawKeys = Object.keys(row)
        const rowKeys = rawKeys.map((k) => normalizeText(k))
        const rowValues = Object.values(row)
        const obj: any = {}

        columns.forEach((col, colIndex) => {
          const aliases = buildAliases(col.key, col.label)
          const matchIdx = rowKeys.findIndex((k) =>
            aliases.some((alias) =>
              k === alias ||
              k.replace(/\s+/g, '') === alias.replace(/\s+/g, '') ||
              k.includes(alias) ||
              alias.includes(k)
            )
          )

          if (matchIdx !== -1) {
            const rawKey = rawKeys[matchIdx]
            obj[col.key] = parseValue(row[rawKey], col.key)
          } else if (rowValues[colIndex] !== undefined && rowValues[colIndex] !== '') {
            obj[col.key] = parseValue(rowValues[colIndex], col.key)
          } else {
            obj[col.key] = col.key.includes('date') || col.key === 'date' ? '' : col.key === 'montant' || col.key === 'salaire_base' ? 0 : ''
          }
        })

        return obj
      })

      setSuccessCount(parsed.length)
      await onImport(parsed)
      setSuccess(true)
      setTimeout(() => setSuccess(false), 5000)
    } catch (err) {
      setError('Erreur import. Verifiez le fichier.')
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

      {success && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: '#1a7a40',
            color: '#fff',
            padding: '14px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '20px' }}>OK</span>
          <div>
            <div>Import reussi.</div>
            <div style={{ fontSize: '11px', opacity: 0.85 }}>
              {successCount} ligne{successCount > 1 ? 's' : ''} importee{successCount > 1 ? 's' : ''}
            </div>
          </div>
        </div>
      )}

      {error && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            zIndex: 9999,
            background: '#c0392b',
            color: '#fff',
            padding: '14px 20px',
            borderRadius: '10px',
            boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
            fontSize: '13px',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <span style={{ fontSize: '20px' }}>X</span>
          <div>{error}</div>
        </div>
      )}

      <button
        onClick={() => fileRef.current?.click()}
        disabled={loading}
        style={{
          padding: '6px 12px',
          background: loading ? '#e8eaed' : '#fff',
          color: loading ? '#888' : '#1a3a6b',
          border: '1px solid #1a3a6b',
          borderRadius: '6px',
          fontSize: '12px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontWeight: '600',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
        }}
      >
        {loading ? 'Import...' : 'Import data'}
      </button>
    </>
  )
}

export default ImportExcel
