import { useEffect, useMemo, useRef, useState } from 'react'

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
  selectableRows?: boolean
  selectedRowIds?: Array<number | string>
  onToggleRow?: (id: number | string) => void
  onToggleAllRows?: (ids: Array<number | string>, checked: boolean) => void
  batchActions?: React.ReactNode
  footerContent?: React.ReactNode
}

const SortableTable = ({
  columns,
  data,
  emptyMessage = 'Aucune donnee',
  selectableRows = false,
  selectedRowIds = [],
  onToggleRow,
  onToggleAllRows,
  batchActions,
  footerContent,
}: Props) => {
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
    const vals = data.map(row => String(row[key] ?? '-')).filter(Boolean)
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

  const filteredData = useMemo(
    () =>
      data.filter(row =>
        columns.every(col => {
          const activeFilters = filters[col.key]
          if (!activeFilters || activeFilters.length === 0) return true
          const cellVal = String(row[col.key] ?? '-')
          return activeFilters.includes(cellVal)
        })
      ),
    [data, columns, filters]
  )

  const sortedData = useMemo(() => {
    const rows = [...filteredData]
    rows.sort((a, b) => {
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
    return rows
  }, [filteredData, sortKey, sortDir])

  const visibleIds = sortedData
    .map(row => row.id)
    .filter((id: any) => id !== undefined && id !== null)

  const allVisibleSelected =
    visibleIds.length > 0 && visibleIds.every(id => selectedRowIds.includes(id))

  return (
    <div
      ref={filterRef}
      style={{
        background: '#fff',
        borderRadius: '12px',
        border: '1px solid #d9e0e7',
        boxShadow: '0 12px 30px rgba(19, 29, 43, 0.05)',
        overflowX: 'auto',
        position: 'relative',
      }}
    >
      <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: 0, fontSize: '11.5px', minWidth: '1280px' }}>
        <thead>
          <tr style={{ background: '#f8fafc' }}>
            {selectableRows && (
              <th
                style={{
                  padding: '12px 10px',
                  textAlign: 'center',
                  color: '#6b7280',
                  fontWeight: '600',
                  borderBottom: '1px solid #e7edf3',
                  whiteSpace: 'nowrap',
                  width: '46px',
                }}
              >
                <input
                  type="checkbox"
                  checked={allVisibleSelected}
                  onChange={e => onToggleAllRows?.(visibleIds, e.target.checked)}
                />
              </th>
            )}

            {columns.map(col => {
              const isFiltered = filters[col.key] && filters[col.key].length > 0
              const uniqueVals = getUniqueValues(col.key)
              const search = searchFilter[col.key] || ''
              const filteredVals = uniqueVals.filter(v => v.toLowerCase().includes(search.toLowerCase()))

              return (
                <th
                  key={col.key}
                  style={{
                    padding: '12px 14px',
                    textAlign: 'left',
                    color: '#6b7280',
                    fontWeight: '600',
                    borderBottom: '1px solid #e7edf3',
                    position: 'relative',
                    whiteSpace: 'nowrap',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span
                      onClick={() => col.sortable !== false && handleSort(col.key)}
                      style={{ cursor: col.sortable !== false ? 'pointer' : 'default', flex: 1 }}
                    >
                      {col.label}
                      {col.sortable !== false && (
                        <span
                          style={{
                            fontSize: '10px',
                            color: sortKey === col.key ? '#1d2836' : '#b6c1cd',
                            marginLeft: '4px',
                          }}
                        >
                          {sortKey === col.key ? (sortDir === 'asc' ? '▲' : '▼') : '↕'}
                        </span>
                      )}
                    </span>

                    {col.sortable !== false && (
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          setOpenFilter(openFilter === col.key ? null : col.key)
                          setSearchFilter({ ...searchFilter, [col.key]: '' })
                        }}
                        style={{
                          background: isFiltered ? '#1d2836' : '#eef2f6',
                          border: '1px solid ' + (isFiltered ? '#1d2836' : '#dde5ee'),
                          borderRadius: '6px',
                          width: '20px',
                          height: '20px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          cursor: 'pointer',
                          fontSize: '10px',
                          color: isFiltered ? '#fff' : '#516072',
                          flexShrink: 0,
                        }}
                      >
                        ▼
                      </button>
                    )}
                  </div>

                  {openFilter === col.key && (
                    <div
                      onClick={e => e.stopPropagation()}
                      style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        background: '#fff',
                        border: '1px solid #d9e0e7',
                        borderRadius: '10px',
                        boxShadow: '0 18px 40px rgba(19, 29, 43, 0.14)',
                        zIndex: 999,
                        minWidth: '220px',
                        padding: '10px',
                      }}
                    >
                      <div style={{ position: 'relative', marginBottom: '8px' }}>
                        <input
                          value={search}
                          onChange={e => setSearchFilter({ ...searchFilter, [col.key]: e.target.value })}
                          placeholder="Rechercher..."
                          style={{
                            width: '100%',
                            padding: '7px 30px 7px 10px',
                            border: '1px solid #d9e0e7',
                            borderRadius: '8px',
                            fontSize: '11px',
                            outline: 'none',
                            boxSizing: 'border-box',
                          }}
                        />
                        <span
                          style={{
                            position: 'absolute',
                            right: '9px',
                            top: '50%',
                            transform: 'translateY(-50%)',
                            color: '#9aa7b4',
                            fontSize: '11px',
                          }}
                        >
                          ⌕
                        </span>
                      </div>

                      <div style={{ maxHeight: '190px', overflowY: 'auto' }}>
                        {filteredVals.map(val => (
                          <div
                            key={val}
                            onClick={() => toggleFilter(col.key, val)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '8px',
                              padding: '7px 8px',
                              borderRadius: '8px',
                              cursor: 'pointer',
                              background: (filters[col.key] || []).includes(val) ? '#eef4ff' : 'transparent',
                              fontSize: '11px',
                              color: '#2a3646',
                            }}
                          >
                            <span
                              style={{
                                width: '14px',
                                height: '14px',
                                borderRadius: '4px',
                                border: '1px solid #c7d2dd',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                background: (filters[col.key] || []).includes(val) ? '#1d2836' : '#fff',
                                color: '#fff',
                                fontSize: '9px',
                                flexShrink: 0,
                              }}
                            >
                              {(filters[col.key] || []).includes(val) ? '✓' : ''}
                            </span>
                            {val}
                          </div>
                        ))}
                        {filteredVals.length === 0 && (
                          <div style={{ padding: '10px', color: '#9aa7b4', fontSize: '11px', textAlign: 'center' }}>
                            Aucun resultat
                          </div>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '6px', marginTop: '10px', borderTop: '1px solid #eef2f6', paddingTop: '10px' }}>
                        <button
                          onClick={() => clearFilter(col.key)}
                          style={{
                            flex: 1,
                            padding: '7px',
                            border: '1px solid #d9e0e7',
                            borderRadius: '8px',
                            background: '#fff',
                            color: '#516072',
                            fontSize: '11px',
                            cursor: 'pointer',
                          }}
                        >
                          Reinitialiser
                        </button>
                        <button
                          onClick={() => setOpenFilter(null)}
                          style={{
                            flex: 1,
                            padding: '7px',
                            border: 'none',
                            borderRadius: '8px',
                            background: '#1d2836',
                            color: '#fff',
                            fontSize: '11px',
                            cursor: 'pointer',
                            fontWeight: '600',
                          }}
                        >
                          Valider
                        </button>
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
              <td colSpan={columns.length + (selectableRows ? 1 : 0)} style={{ padding: '42px', textAlign: 'center', color: '#9aa7b4' }}>
                {emptyMessage}
              </td>
            </tr>
          ) : (
            sortedData.map((row, i) => (
              <tr key={row.id || i}>
                {selectableRows && (
                  <td
                    style={{
                      padding: '12px 10px',
                      borderBottom: i === sortedData.length - 1 ? 'none' : '1px solid #eef2f6',
                      textAlign: 'center',
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={selectedRowIds.includes(row.id)}
                      onChange={() => onToggleRow?.(row.id)}
                    />
                  </td>
                )}

                {columns.map(col => (
                  <td
                    key={col.key}
                    style={{
                      padding: '12px 14px',
                      borderBottom: i === sortedData.length - 1 ? 'none' : '1px solid #eef2f6',
                      verticalAlign: 'middle',
                      color: '#1f2937',
                    }}
                  >
                    {col.render ? col.render(row[col.key], row) : row[col.key]}
                  </td>
                ))}
              </tr>
            ))
          )}
        </tbody>
      </table>

      {(batchActions || footerContent) && (
        <div
          style={{
            borderTop: '1px solid #eef2f6',
            padding: '12px 14px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '12px',
            flexWrap: 'wrap',
            background: '#fbfcfe',
          }}
        >
          <div>{batchActions}</div>
          <div>{footerContent}</div>
        </div>
      )}
    </div>
  )
}

export default SortableTable
