import { useState } from 'react'

interface Column {
  key: string
  label: string
  sortable?: boolean
  render?: (value: any, row: any) => React.ReactNode
}

interface Props {
  columns: Column[]
  data: any[]
  emptyMessage?: string
}

const SortableTable = ({ columns, data, emptyMessage = 'Aucune donnée' }: Props) => {
  const [sortKey, setSortKey] = useState<string | null>(null)
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc')
  const [filters, setFilters] = useState<{ [key: string]: string }>({})

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const filteredData = data.filter(row => {
    return columns.every(col => {
      const filterVal = filters[col.key]
      if (!filterVal) return true
      const cellVal = String(row[col.key] ?? '').toLowerCase()
      return cellVal.includes(filterVal.toLowerCase())
    })
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (aVal === undefined || aVal === null) return 1
    if (bVal === undefined || bVal === null) return -1
    const aStr = String(aVal).toLowerCase()
    const bStr = String(bVal).toLowerCase()
    const aNum = parseFloat(aVal)
    const bNum = parseFloat(bVal)
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortDir === 'asc' ? aNum - bNum : bNum - aNum
    }
    return sortDir === 'asc'
      ? aStr.localeCompare(bStr)
      : bStr.localeCompare(aStr)
  })

  return (
    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e8eaed', overflow: 'hidden' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          {/* FILTER ROW */}
          <tr style={{ background: '#f0f4f8' }}>
            {columns.map(col => (
              <th key={`filter-${col.key}`} style={{ padding: '4px 8px', borderBottom: '1px solid #e8eaed' }}>
                <input
                  value={filters[col.key] || ''}
                  onChange={e => setFilters({ ...filters, [col.key]: e.target.value })}
                  placeholder="🔍"
                  style={{
                    width: '100%', padding: '3px 6px',
                    border: '1px solid #e0e0e0', borderRadius: '4px',
                    fontSize: '11px', outline: 'none',
                    background: filters[col.key] ? '#e8f4fb' : '#fff',
                  }}
                />
              </th>
            ))}
          </tr>
          {/* HEADER ROW */}
          <tr style={{ background: '#f8f9fa' }}>
            {columns.map(col => (
              <th
                key={col.key}
                onClick={() => col.sortable !== false && handleSort(col.key)}
                style={{
                  padding: '10px 14px', textAlign: 'left',
                  color: '#888', fontWeight: '500',
                  borderBottom: '1px solid #e8eaed',
                  cursor: col.sortable !== false ? 'pointer' : 'default',
                  userSelect: 'none',
                  whiteSpace: 'nowrap',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {col.label}
                  {col.sortable !== false && (
                    <span style={{ fontSize: '10px', color: sortKey === col.key ? '#1a3a6b' : '#ccc' }}>
                      {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                    </span>
                  )}
                </div>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {sortedData.length === 0 ? (
            <tr>
              <td colSpan={columns.length} style={{ padding: '40px', textAlign: 'center', color: '#aaa' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, i) => (
              <tr key={row.id || i} style={{ borderBottom: '1px solid #f5f5f5' }}>
                {columns.map(col => (
                  <td key={col.key} style={{ padding: '10px 14px' }}>
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  )
}

export default SortableTable