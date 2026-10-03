import React, { useState, useMemo } from 'react';
import {
  ChevronUp, ChevronDown, Search, ArrowUpDown, ChevronLeft, ChevronRight,
  AlertCircle, CheckCircle2, Clock, SlidersHorizontal, Eye, Copy, Check, X
} from 'lucide-react';
import ExportDropdown from './ExportDropdown';

export default function ReportDataTable({
  title = 'Detailed Records',
  columns = [],
  data = [],
  totalCount = 0,
  page = 1,
  pageSize = 10,
  onPageChange = null,
  onPageSizeChange = null,
  onSortChange = null,
  sortBy = '',
  sortOrder = 'DESC',
  reportType = 'REQUEST_ANALYTICS',
  filters = {},
  loading = false,
  showExport = true,
  searchPlaceholder = 'Quick search records...'
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [density, setDensity] = useState('normal'); // 'compact' | 'normal'
  const [showColPicker, setShowColPicker] = useState(false);
  const [hiddenCols, setHiddenCols] = useState({});
  const [copiedId, setCopiedId] = useState(null);
  const [selectedRow, setSelectedRow] = useState(null);

  const toggleColumn = (key) => {
    setHiddenCols(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const visibleColumns = useMemo(() => {
    return columns.filter(c => !hiddenCols[c.key]);
  }, [columns, hiddenCols]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return data;
    const term = searchTerm.toLowerCase();
    return data.filter(row => {
      return Object.values(row).some(v => v !== null && v !== undefined && String(v).toLowerCase().includes(term));
    });
  }, [data, searchTerm]);

  const totalPages = Math.ceil((totalCount || filteredData.length) / pageSize) || 1;

  const handleHeaderClick = (col) => {
    if (!col.sortable || !onSortChange) return;
    const nextOrder = sortBy === col.key && sortOrder === 'ASC' ? 'DESC' : 'ASC';
    onSortChange(col.key, nextOrder);
  };

  const handleCopy = (text, id, e) => {
    if (e) e.stopPropagation();
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="glass-panel" style={{ borderRadius: '16px', overflow: 'hidden', boxShadow: '0 8px 24px -6px rgba(0,0,0,0.06)' }}>
      {/* Table Top Controls Bar */}
      <div style={{
        padding: '16px 20px',
        borderBottom: '1px solid var(--glass-border, rgba(148, 163, 184, 0.15))',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 800, color: 'var(--text-primary)' }}>{title}</h3>
          <span style={{
            padding: '2px 8px',
            borderRadius: '12px',
            background: 'rgba(59, 130, 246, 0.15)',
            color: '#3b82f6',
            fontSize: '0.75rem',
            fontWeight: 700
          }}>
            {totalCount || filteredData.length} Total Records
          </span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
          {/* Quick Search */}
          <div style={{ position: 'relative', width: '220px' }}>
            <Search size={14} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input
              type="text"
              placeholder={searchPlaceholder}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="form-control"
              style={{ paddingLeft: '30px', fontSize: '0.8rem', borderRadius: '8px', width: '100%' }}
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-muted)',
                  cursor: 'pointer'
                }}
              >
                <X size={12} />
              </button>
            )}
          </div>

          {/* Density Toggle */}
          <button
            type="button"
            onClick={() => setDensity(density === 'compact' ? 'normal' : 'compact')}
            className="btn btn-outline"
            title="Toggle Row Density"
            style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px' }}
          >
            {density === 'compact' ? 'Compact' : 'Normal'}
          </button>

          {/* Column Picker Button */}
          <div style={{ position: 'relative' }}>
            <button
              type="button"
              onClick={() => setShowColPicker(!showColPicker)}
              className="btn btn-outline"
              title="Select Columns"
              style={{ padding: '6px 10px', fontSize: '0.75rem', borderRadius: '8px', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              <Eye size={13} /> Columns
            </button>

            {showColPicker && (
              <div style={{
                position: 'absolute',
                top: 'calc(100% + 4px)',
                right: 0,
                minWidth: '200px',
                background: 'var(--bg-surface, #1e293b)',
                border: '1px solid var(--glass-border, rgba(148, 163, 184, 0.2))',
                borderRadius: '10px',
                boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
                padding: '8px',
                zIndex: 100
              }}>
                <div style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', padding: '4px 6px', textTransform: 'uppercase' }}>
                  Toggle Visible Columns
                </div>
                {columns.map(c => (
                  <label
                    key={c.key}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      padding: '4px 6px',
                      fontSize: '0.78rem',
                      cursor: 'pointer',
                      color: 'var(--text-primary)'
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!hiddenCols[c.key]}
                      onChange={() => toggleColumn(c.key)}
                    />
                    {c.label || c.key}
                  </label>
                ))}
              </div>
            )}
          </div>

          {/* Export Dropdown */}
          {showExport && (
            <ExportDropdown reportType={reportType} filters={filters} size="small" />
          )}
        </div>
      </div>

      {/* Table */}
      <div style={{ overflowX: 'auto', width: '100%' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
          <thead>
            <tr style={{ background: 'rgba(15, 23, 42, 0.03)', borderBottom: '1px solid var(--glass-border, rgba(148, 163, 184, 0.15))' }}>
              {visibleColumns.map((col) => {
                const isSorted = sortBy === col.key;
                return (
                  <th
                    key={col.key}
                    onClick={() => handleHeaderClick(col)}
                    style={{
                      padding: density === 'compact' ? '8px 12px' : '12px 16px',
                      fontSize: '0.78rem',
                      fontWeight: 700,
                      color: 'var(--text-muted)',
                      textTransform: 'uppercase',
                      letterSpacing: '0.5px',
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                      whiteSpace: 'nowrap'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>{col.label || col.key}</span>
                      {col.sortable && (
                        <span style={{ opacity: isSorted ? 1 : 0.4 }}>
                          {isSorted && sortOrder === 'ASC' ? <ChevronUp size={13} color="#3b82f6" /> : isSorted && sortOrder === 'DESC' ? <ChevronDown size={13} color="#3b82f6" /> : <ArrowUpDown size={12} />}
                        </span>
                      )}
                    </div>
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={visibleColumns.length} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  Loading telemetry records...
                </td>
              </tr>
            ) : filteredData.length === 0 ? (
              <tr>
                <td colSpan={visibleColumns.length} style={{ padding: '36px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
                  No matching records found
                </td>
              </tr>
            ) : (
              filteredData.map((row, rowIdx) => (
                <tr
                  key={rowIdx}
                  onClick={() => setSelectedRow(row)}
                  style={{
                    borderBottom: '1px solid rgba(148, 163, 184, 0.1)',
                    transition: 'background 0.15s ease',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.05)'; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
                >
                  {visibleColumns.map((col) => {
                    const val = row[col.key];
                    return (
                      <td
                        key={col.key}
                        style={{
                          padding: density === 'compact' ? '8px 12px' : '12px 16px',
                          fontSize: '0.82rem',
                          color: 'var(--text-primary)',
                          whiteSpace: 'nowrap'
                        }}
                      >
                        {col.render ? col.render(val, row) : (val !== null && val !== undefined ? String(val) : '—')}
                      </td>
                    );
                  })}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Footer */}
      <div style={{
        padding: '12px 20px',
        borderTop: '1px solid var(--glass-border, rgba(148, 163, 184, 0.15))',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '12px',
        fontSize: '0.8rem',
        color: 'var(--text-muted)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span>Show:</span>
          <select
            value={pageSize}
            onChange={(e) => onPageSizeChange && onPageSizeChange(Number(e.target.value))}
            className="form-control"
            style={{ padding: '2px 8px', fontSize: '0.78rem', borderRadius: '6px' }}
          >
            <option value="10">10 rows</option>
            <option value="25">25 rows</option>
            <option value="50">50 rows</option>
            <option value="100">100 rows</option>
          </select>
          <span>
            Page <strong>{page}</strong> of <strong>{totalPages}</strong>
          </span>
        </div>

        <div style={{ display: 'flex', gap: '6px' }}>
          <button
            type="button"
            onClick={() => onPageChange && onPageChange(page - 1)}
            disabled={page <= 1 || loading}
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
          >
            <ChevronLeft size={13} /> Previous
          </button>

          <button
            type="button"
            onClick={() => onPageChange && onPageChange(page + 1)}
            disabled={page >= totalPages || loading}
            className="btn btn-outline"
            style={{ padding: '4px 10px', fontSize: '0.75rem', borderRadius: '6px' }}
          >
            Next <ChevronRight size={13} />
          </button>
        </div>
      </div>

      {/* Quick Inspection Row Modal */}
      {selectedRow && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'var(--modal-backdrop, rgba(16, 20, 24, 0.78))',
          backdropFilter: 'blur(5px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }}>
          <div className="glass-panel" style={{
            width: '100%',
            maxWidth: '560px',
            borderRadius: '20px',
            padding: '24px',
            maxHeight: '85vh',
            overflowY: 'auto',
            boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
            border: '1px solid var(--glass-border, rgba(148, 163, 184, 0.2))'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(148, 163, 184, 0.15)', paddingBottom: '12px' }}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 800 }}>Record Detail View</h3>
                <p style={{ margin: '2px 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>Detailed telemetry inspect payload</p>
              </div>
              <button type="button" onClick={() => setSelectedRow(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}>
                <X size={18} />
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px' }}>
              {Object.entries(selectedRow).map(([k, v]) => {
                if (k.toLowerCase().includes('json') || k.toLowerCase().includes('version') || v === null) return null;
                return (
                  <div key={k} style={{ padding: '8px 12px', borderRadius: '8px', background: 'rgba(148, 163, 184, 0.05)', border: '1px solid rgba(148, 163, 184, 0.1)' }}>
                    <div style={{ fontSize: '0.7rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>{k}</div>
                    <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-primary)', marginTop: '2px', wordBreak: 'break-word' }}>
                      {String(v)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'flex-end' }}>
              <button type="button" onClick={() => setSelectedRow(null)} className="btn btn-primary" style={{ padding: '6px 16px', borderRadius: '8px', fontSize: '0.82rem' }}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
