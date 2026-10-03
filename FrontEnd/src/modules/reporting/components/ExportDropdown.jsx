import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileText, Printer, ChevronDown, Check } from 'lucide-react';
import reportingApi from '../api/reportingApi';

export default function ExportDropdown({
  reportType = 'REQUEST_ANALYTICS',
  filters = {},
  buttonLabel = 'Export Report',
  size = 'medium'
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [successFormat, setSuccessFormat] = useState(null);
  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format) => {
    try {
      setExporting(true);
      if (format === 'PRINT') {
        window.print();
        setIsOpen(false);
        return;
      }

      await reportingApi.downloadReport(reportType, format, filters);
      setSuccessFormat(format);
      setTimeout(() => setSuccessFormat(null), 2500);
      setIsOpen(false);
    } catch (err) {
      console.error('Export download error:', err);
      alert('Failed to generate export file. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  return (
    <div ref={menuRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        disabled={exporting}
        className="btn btn-outline"
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '6px',
          padding: size === 'small' ? '4px 10px' : '7px 14px',
          fontSize: size === 'small' ? '0.78rem' : '0.85rem',
          borderRadius: '10px',
          fontWeight: 600
        }}
      >
        <Download size={14} />
        {exporting ? 'Generating...' : buttonLabel}
        <ChevronDown size={13} style={{ opacity: 0.7 }} />
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 6px)',
          right: 0,
          minWidth: '210px',
          background: 'var(--bg-surface, #1e293b)',
          border: '1px solid var(--glass-border, rgba(148, 163, 184, 0.2))',
          borderRadius: '12px',
          boxShadow: '0 12px 32px rgba(0,0,0,0.3)',
          padding: '6px',
          zIndex: 100,
          backdropFilter: 'blur(12px)'
        }}>
          <div style={{ padding: '6px 10px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
            Export Formats
          </div>

          <button
            type="button"
            onClick={() => handleExport('CSV')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(59, 130, 246, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileText size={15} color="#3b82f6" /> CSV Spreadsheet
            </span>
            {successFormat === 'CSV' && <Check size={14} color="#10b981" />}
          </button>

          <button
            type="button"
            onClick={() => handleExport('EXCEL')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px 10px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(16, 185, 129, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <FileSpreadsheet size={15} color="#10b981" /> Microsoft Excel (.xls)
            </span>
            {successFormat === 'EXCEL' && <Check size={14} color="#10b981" />}
          </button>

          <div style={{ height: '1px', background: 'rgba(148, 163, 184, 0.15)', margin: '4px 0' }} />

          <button
            type="button"
            onClick={() => handleExport('PRINT')}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 10px',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-primary)',
              borderRadius: '8px',
              fontSize: '0.82rem',
              cursor: 'pointer',
              textAlign: 'left'
            }}
            onMouseEnter={(e) => { e.currentTarget.style.background = 'rgba(148, 163, 184, 0.15)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; }}
          >
            <Printer size={15} color="#a855f7" /> Print-Ready / PDF Layout
          </button>
        </div>
      )}
    </div>
  );
}
