import React from 'react';
import { Search, Filter, CheckCircle2, XCircle, RotateCcw, Clock, Eye, Layers, ArrowRight, UserCheck } from 'lucide-react';

export default function ApprovalListView({
  approvals,
  loading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSelectApproval
}) {
  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span style={{
            background: 'rgba(16, 185, 129, 0.12)',
            border: '1px solid rgba(16, 185, 129, 0.4)',
            color: '#10b981',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 0 10px rgba(16, 185, 129, 0.15)'
          }}>
            <CheckCircle2 size={13} /> Approved
          </span>
        );
      case 'REJECTED':
        return (
          <span style={{
            background: 'rgba(239, 68, 68, 0.12)',
            border: '1px solid rgba(239, 68, 68, 0.4)',
            color: '#ef4444',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 0 10px rgba(239, 68, 68, 0.15)'
          }}>
            <XCircle size={13} /> Rejected
          </span>
        );
      case 'RETURNED':
        return (
          <span style={{
            background: 'rgba(245, 158, 11, 0.12)',
            border: '1px solid rgba(245, 158, 11, 0.4)',
            color: '#f59e0b',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 0 10px rgba(245, 158, 11, 0.15)'
          }}>
            <RotateCcw size={13} /> Returned
          </span>
        );
      default:
        return (
          <span style={{
            background: 'rgba(99, 102, 241, 0.12)',
            border: '1px solid rgba(99, 102, 241, 0.4)',
            color: 'var(--accent-primary)',
            padding: '4px 12px',
            borderRadius: '20px',
            fontSize: '0.75rem',
            fontWeight: '700',
            display: 'inline-flex',
            alignItems: 'center',
            gap: '5px',
            boxShadow: '0 0 10px rgba(99, 102, 241, 0.15)'
          }}>
            <Clock size={13} /> Pending Action
          </span>
        );
    }
  };

  return (
    <div style={{
      background: 'var(--glass-bg)',
      border: '1px solid var(--glass-border)',
      borderRadius: '20px',
      padding: '24px',
      backdropFilter: 'blur(16px)',
      boxShadow: 'var(--shadow-lg)'
    }}>
      {/* Search & Filter Header Bar */}
      <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', minWidth: '300px', flex: 1 }}>
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder="Search workflows by title, requester, or request number..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '42px',
              paddingRight: '14px',
              paddingTop: '11px',
              paddingBottom: '11px',
              borderRadius: '12px',
              border: '1px solid var(--glass-border)',
              background: 'var(--bg-tertiary)',
              color: 'var(--text-primary)',
              fontSize: '0.88rem',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
          />
        </div>

        {/* Filter Pills */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', background: 'var(--bg-tertiary)', padding: '4px', borderRadius: '14px', border: '1px solid var(--glass-border)' }}>
          {['ALL', 'PENDING', 'APPROVED', 'REJECTED', 'RETURNED'].map((st) => (
            <button
              key={st}
              onClick={() => onStatusFilterChange(st)}
              style={{
                padding: '7px 14px',
                borderRadius: '10px',
                border: 'none',
                background: statusFilter === st ? 'var(--accent-gradient)' : 'transparent',
                color: statusFilter === st ? 'white' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s'
              }}
            >
              {st === 'ALL' ? 'All Workflows' : st.charAt(0) + st.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow Queue Table */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ marginBottom: '12px' }} />
          <div>Fetching governance workflow queue...</div>
        </div>
      ) : (!approvals || approvals.length === 0) ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Layers size={42} style={{ opacity: 0.4, marginBottom: '12px', color: 'var(--accent-primary)' }} />
          <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>No Approval Workflows Found</div>
          <div style={{ fontSize: '0.82rem' }}>No approval requests match the current search or status filter.</div>
        </div>
      ) : (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left', fontSize: '0.85rem' }}>
            <thead>
              <tr style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.5px' }}>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>WORKFLOW & REQUEST</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>REQUESTER</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>STAGE PIPELINE</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>STATUS</th>
                <th style={{ padding: '12px 18px', fontWeight: '700' }}>SUBMITTED DATE</th>
                <th style={{ padding: '12px 18px', fontWeight: '700', textAlign: 'right' }}>ACTION</th>
              </tr>
            </thead>
            <tbody>
              {approvals.map((a) => {
                const totalStages = a.TotalStages || 1;
                const currentStage = a.CurrentStageNumber || 1;
                const isFinalApproved = a.ApprovalStatusCode === 'APPROVED';

                return (
                  <tr
                    key={a.ApprovalID}
                    onClick={() => onSelectApproval(a)}
                    style={{
                      background: 'var(--bg-tertiary)',
                      border: '1px solid var(--glass-border)',
                      borderRadius: '12px',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
                    }}
                    className="table-row-hover"
                  >
                    {/* Workflow Title */}
                    <td style={{ padding: '16px 18px', borderRadius: '12px 0 0 12px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                        <span style={{
                          fontWeight: '800',
                          fontSize: '0.75rem',
                          color: 'var(--accent-primary)',
                          background: 'rgba(99, 102, 241, 0.1)',
                          padding: '2px 8px',
                          borderRadius: '6px'
                        }}>
                          {a.RequestNumber || `REQ-#${a.RequestID}`}
                        </span>
                      </div>
                      <div style={{ fontWeight: '700', color: 'var(--text-primary)', fontSize: '0.92rem' }}>
                        {a.Title}
                      </div>
                    </td>

                    {/* Requester */}
                    <td style={{ padding: '16px 18px' }}>
                      <div style={{ fontWeight: '600', color: 'var(--text-primary)' }}>
                        {a.RequesterName || 'System User'}
                      </div>
                    </td>

                    {/* Stage Pipeline Mini Stepper */}
                    <td style={{ padding: '16px 18px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        {Array.from({ length: totalStages }).map((_, stIdx) => {
                          const stageNum = stIdx + 1;
                          const isPassed = isFinalApproved || stageNum < currentStage;
                          const isCurrent = stageNum === currentStage && !isFinalApproved;

                          return (
                            <React.Fragment key={stIdx}>
                              <div
                                title={`Stage ${stageNum}`}
                                style={{
                                  width: '24px', height: '24px',
                                  borderRadius: '50%',
                                  background: isPassed ? '#10b981' : isCurrent ? '#f59e0b' : 'var(--glass-border)',
                                  color: isPassed || isCurrent ? 'white' : 'var(--text-muted)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                                  fontSize: '0.72rem', fontWeight: '800',
                                  boxShadow: isCurrent ? '0 0 10px rgba(245, 158, 11, 0.5)' : 'none'
                                }}
                              >
                                {stageNum}
                              </div>
                              {stIdx < totalStages - 1 && (
                                <div style={{
                                  width: '16px', height: '2px',
                                  background: isPassed ? '#10b981' : 'var(--glass-border)'
                                }} />
                              )}
                            </React.Fragment>
                          );
                        })}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '4px', fontWeight: '600' }}>
                        {isFinalApproved ? 'Completed All Stages' : `Active Stage ${currentStage} of ${totalStages}`}
                      </div>
                    </td>

                    {/* Status Badge */}
                    <td style={{ padding: '16px 18px' }}>
                      {getStatusBadge(a.ApprovalStatusCode)}
                    </td>

                    {/* Submitted Date */}
                    <td style={{ padding: '16px 18px', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                      {new Date(a.CreatedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                    </td>

                    {/* Action */}
                    <td style={{ padding: '16px 18px', textAlign: 'right', borderRadius: '0 12px 12px 0' }}>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onSelectApproval(a);
                        }}
                        style={{
                          background: 'var(--accent-gradient)',
                          border: 'none',
                          color: '#ffffff',
                          padding: '8px 14px',
                          borderRadius: '10px',
                          fontWeight: '700',
                          fontSize: '0.8rem',
                          cursor: 'pointer',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '6px',
                          transition: 'all 0.2s',
                          boxShadow: '0 2px 8px rgba(79, 70, 229, 0.25)'
                        }}
                      >
                        <Eye size={15} /> Review <ArrowRight size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
