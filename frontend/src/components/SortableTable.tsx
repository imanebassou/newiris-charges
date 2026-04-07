import { useState, useRef, useEffect } from 'react'

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
  const [filters, setFilters] = useState<{ [key: string]: string[] }>({})
  const [openFilter, setOpenFilter] = useState<string | null>(null)
  const [searchFilter, setSearchFilter] = useState<{ [key: string]: string }>({})
  const filterRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setOpenFilter(null)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  const getUniqueValues = (key: string) => {
    const vals = data.map(row => String(row[key] ?? '—')).filter(Boolean)
    return Array.from(new Set(vals)).sort()
  }

  const toggleFilter = (key: string, value: string) => {
    const current = filters[key] || []
    if (current.includes(value)) {
      setFilters({ ...filters, [key]: current.filter(v => v !== value) })
    } else {
      setFilters({ ...filters, [key]: [...current, value] })
    }
  }

  const clearFilter = (key: string) => {
    const newFilters = { ...filters }
    delete newFilters[key]
    setFilters(newFilters)
  }

  const filteredData = data.filter(row => {
    return columns.every(col => {
      const activeFilters = filters[col.key]
      if (!activeFilters || activeFilters.length === 0) return true
      const cellVal = String(row[col.key] ?? '—')
      return activeFilters.includes(cellVal)
    })
  })

  const sortedData = [...filteredData].sort((a, b) => {
    if (!sortKey) return 0
    const aVal = a[sortKey]
    const bVal = b[sortKey]
    if (aVal === undefined || aVal === null) return 1
    if (bVal === undefined || bVal === null) return -1
    const aNum = parseFloat(aVal)
    const bNum = parseFloat(bVal)
    if (!isNaN(aNum) && !isNaN(bNum)) {
      return sortDir === 'asc' ? aNum - bNum : bNum - aNum
    }
    return sortDir === 'asc'
      ? String(aVal).localeCompare(String(bVal))
      : String(bVal).localeCompare(String(aVal))
  })

  return (
    <div style={{ background: '#fff', borderRadius: '8px', border: '1px solid #e8eaed', overflow: 'visible', position: 'relative' }} ref={filterRef}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
        <thead>
          <tr style={{ background: '#f8f9fa' }}>
            {columns.map(col => {
              const isFiltered = filters[col.key] && filters[col.key].length > 0
              const uniqueVals = getUniqueValues(col.key)
              const search = searchFilter[col.key] || ''
              const filteredVals = uniqueVals.filter(v => v.toLowerCase().includes(search.toLowerCase()))

              return (
                <th
                  key={col.key}
                  style={{
                    padding: '10px 14px', textAlign: 'left',
                    color: '#888', fontWeight: '500',
                    borderBottom: '1px solid #e8eaed',
                    position: 'relative', userSelect: 'none',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                    {/* SORT */}
                    <span
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                      style={{ cursor: col.sortable !== false ? 'pointer' : 'default', flex: 1 }}
                    >
                      {col.label}
                      {col.sortable !== false && (
                        <span style={{ fontSize: '10px', color: sortKey === col.key ? '#1a3a6b' : '#ccc', marginLeft: '4px' }}>
                          {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '⇅'}
                        </span>
                      )}
                    </span>

                    {/* FILTER BUTTON */}
                    {col.sortable !== false && (
                      <button
                        onClick={e => { e.stopPropagation(); setOpenFilter(openFilter === col.key ? null : col.key); setSearchFilter({ ...searchFilter, [col.key]: '' }) }}
                        style={{
                          background: isFiltered ? '#1a3a6b' : '#e8eaed',
                          border: 'none', borderRadius: '3px',
                          width: '18px', height: '18px',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          cursor: 'pointer', fontSize: '10px',
                          color: isFiltered ? '#fff' : '#555',
                          flexShrink: 0,
                        }}
                      >▼</button>
                    )}
                  </div>

                  {/* DROPDOWN */}
                  {openFilter === col.key && (
                    <div
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: 'absolute', top: '100%', left: 0,
                        background: '#fff', border: '1px solid #e0e0e0',
                        borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                        zIndex: 999, minWidth: '200px', padding: '8px',
                      }}
                    >
                      {/* SEARCH */}
                      <div style={{ position: 'relative', marginBottom: '6px' }}>
                        <input
                          value={search}
                          onChange={e => setSearchFilter({ ...searchFilter, [col.key]: e.target.value })}
                          placeholder="Rechercher..."
                          style={{
                            width: '100%', padding: '5px 28px 5px 8px',
                            border: '1px solid #e0e0e0', borderRadius: '4px',
                            fontSize: '11px', outline: 'none', boxSizing: 'border-box'
                          }}
                        />
                        <span style={{ position: 'absolute', right: '8px', top: '50%', transform: 'translateY(-50%)', color: '#aaa', fontSize: '12px' }}>🔍</span>
                      </div>

                      {/* VALUES */}
                      <div style={{ maxHeight: '180px', overflowY: 'auto' }}>
                        {filteredVals.map(val => (
                          <div
                            key={val}
                            onClick={() => toggleFilter(col.key, val)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '8px',
                              padding: '5px 6px', borderRadius: '4px', cursor: 'pointer',
                              background: (filters[col.key] || []).includes(val) ? '#e8f4fb' : 'transparent',
                              fontSize: '11px', color: '#333',
                            }}
                          >
                            <span style={{
                              width: '14px', height: '14px', borderRadius: '3px',
                              border: '1px solid #ccc', display: 'flex', alignItems: 'center', justifyContent: 'center',
                              background: (filters[col.key] || []).includes(val) ? '#1a3a6b' : '#fff',
                              color: '#fff', fontSize: '10px', flexShrink: 0,
                            }}>
                              {(filters[col.key] || []).includes(val) ? '✓' : ''}
                            </span>
                            {val}
                          </div>
                        ))}
                        {filteredVals.length === 0 && (
                          <div style={{ padding: '8px', color: '#aaa', fontSize: '11px', textAlign: 'center' }}>Aucun résultat</div>
                        )}
                      </div>

                      {/* BUTTONS */}
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px', borderTop: '1px solid #f0f0f0', paddingTop: '8px' }}>
                        <button
                          onClick={() => clearFilter(col.key)}
                          style={{
                            flex: 1, padding: '5px', border: '1px solid #e0e0e0',
                            borderRadius: '4px', background: '#fff', color: '#555',
                            fontSize: '11px', cursor: 'pointer'
                          }}
                        >Annuler</button>
                        <button
                          onClick={() => setOpenFilter(null)}
                          style={{
                            flex: 1, padding: '5px', border: 'none',
                            borderRadius: '4px', background: '#1a3a6b', color: '#fff',
                            fontSize: '11px', cursor: 'pointer', fontWeight: '600'
                          }}
                        >OK</button>
                      </div>
                    </div>
                  )}
                </th>
              )
            })}
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