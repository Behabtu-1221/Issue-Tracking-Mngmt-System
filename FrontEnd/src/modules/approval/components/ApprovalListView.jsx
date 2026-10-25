import React from 'react';
import { Search, Filter, CheckCircle2, XCircle, RotateCcw, Clock, Eye, Layers, ArrowRight, UserCheck } from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';

export default function ApprovalListView({
  approvals,
  loading,
  search,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
  onSelectApproval
}) {
  const { t } = useTranslation();

  const getStatusBadge = (status) => {
    switch (status) {
      case 'APPROVED':
        return (
          <span className="status-badge status-resolved" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <CheckCircle2 size={13} /> {t('approval.status.approved', 'Approved')}
          </span>
        );
      case 'REJECTED':
        return (
          <span className="status-badge" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px', color: 'var(--color-error)', borderColor: 'rgba(229, 72, 77, 0.4)', background: 'rgba(229, 72, 77, 0.12)' }}>
            <XCircle size={13} /> {t('approval.status.rejected', 'Rejected')}
          </span>
        );
      case 'RETURNED':
        return (
          <span className="status-badge status-pending" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <RotateCcw size={13} /> {t('approval.status.returned', 'Returned')}
          </span>
        );
      default:
        return (
          <span className="status-badge status-in-progress" style={{ display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
            <Clock size={13} /> {t('approval.status.pending', 'Pending Action')}
          </span>
        );
    }
  };

  return (
    <div className="enterprise-card p-3 sm:p-6">
      {/* Search & Filter Header Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 mb-5">
        <div className="relative flex-1 min-w-0">
          <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            placeholder={t('approval.filters.searchPlaceholder', 'Search workflows by title, requester, or request number...')}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            style={{
              width: '100%',
              paddingLeft: '42px',
              paddingRight: '14px',
              paddingTop: '11px',
              paddingBottom: '11px',
              borderRadius: '12px',
              border: '1px solid var(--color-border)',
              background: 'var(--color-surface)',
              color: 'var(--color-text-main)',
              fontSize: '0.88rem',
              outline: 'none',
              transition: 'border-color 0.2s, box-shadow 0.2s'
            }}
          />
        </div>

        {/* Filter Pills with horizontal scroll on mobile */}
        <div
          className="flex items-center gap-1.5 overflow-x-auto p-1 rounded-xl max-w-full"
          style={{
            background: 'var(--color-elevated)',
            border: '1px solid var(--color-border)',
            scrollbarWidth: 'none'
          }}
        >
          {[
            { key: 'ALL', label: t('approval.filters.all', 'All') },
            { key: 'PENDING', label: t('approval.filters.pending', 'Pending') },
            { key: 'APPROVED', label: t('approval.filters.approved', 'Approved') },
            { key: 'REJECTED', label: t('approval.filters.rejected', 'Rejected') },
            { key: 'RETURNED', label: t('approval.filters.returned', 'Returned') }
          ].map(({ key: st, label }) => (
            <button
              key={st}
              onClick={() => onStatusFilterChange(st)}
              className="touch-target-sm shrink-0"
              style={{
                padding: '6px 12px',
                borderRadius: '8px',
                border: 'none',
                background: statusFilter === st ? 'var(--color-primary)' : 'transparent',
                color: statusFilter === st ? 'white' : 'var(--text-muted)',
                fontWeight: '700',
                fontSize: '0.78rem',
                cursor: 'pointer',
                transition: 'all 0.2s',
                whiteSpace: 'nowrap'
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Workflow Queue */}
      {loading ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <div className="spinner" style={{ marginBottom: '12px' }} />
          <div>{t('common.loading', 'Fetching governance workflow queue...')}</div>
        </div>
      ) : (!approvals || approvals.length === 0) ? (
        <div style={{ padding: '60px', textAlign: 'center', color: 'var(--text-muted)' }}>
          <Layers size={42} style={{ opacity: 0.4, marginBottom: '12px', color: 'var(--accent-primary)' }} />
          <div style={{ fontWeight: '700', fontSize: '1rem', color: 'var(--text-primary)', marginBottom: '4px' }}>
            {t('approval.empty.noApprovalsTitle', 'No Approval Workflows Found')}
          </div>
          <div style={{ fontSize: '0.82rem' }}>
            {t('approval.empty.noApprovalsDesc', 'No approval requests match the current search or status filter.')}
          </div>
        </div>
      ) : (
        <>
          {/* Mobile Card Presentation (Visible on < md) */}
          <div className="block md:hidden space-y-3">
            {approvals.map((a) => {
              const totalStages = a.TotalStages || 1;
              const currentStage = a.CurrentStageNumber || 1;
              const isFinalApproved = a.ApprovalStatusCode === 'APPROVED';

              return (
                <div
                  key={a.ApprovalID}
                  onClick={() => onSelectApproval(a)}
                  className="p-4 rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] active:scale-[0.99] transition-transform"
                >
                  <div className="flex items-center justify-between gap-2 mb-2">
                    <span
                      style={{
                        fontWeight: '800',
                        fontSize: '0.75rem',
                        color: 'var(--accent-primary)',
                        background: 'rgba(99, 102, 241, 0.1)',
                        padding: '2px 8px',
                        borderRadius: '6px'
                      }}
                    >
                      {a.RequestNumber || `REQ-#${a.RequestID}`}
                    </span>
                    {getStatusBadge(a.ApprovalStatusCode)}
                  </div>

                  <h4 className="font-bold text-[var(--text-primary)] text-sm mb-1.5 line-clamp-2">
                    {a.Title}
                  </h4>

                  <div className="text-xs text-[var(--text-muted)] flex items-center justify-between mb-3">
                    <span>Requester: <strong className="text-[var(--text-primary)]">{a.RequesterName || 'System User'}</strong></span>
                    <span>{new Date(a.CreatedDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</span>
                  </div>

                  {/* Stage Stepper Mini */}
                  <div className="p-2 rounded-lg bg-[var(--color-elevated)] flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold text-[var(--text-muted)]">
                      {isFinalApproved ? 'Completed All Stages' : `Stage ${currentStage} of ${totalStages}`}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {Array.from({ length: totalStages }).map((_, stIdx) => {
                        const stageNum = stIdx + 1;
                        const isPassed = isFinalApproved || stageNum < currentStage;
                        const isCurrent = stageNum === currentStage && !isFinalApproved;
                        return (
                          <div
                            key={stIdx}
                            style={{
                              width: '18px',
                              height: '18px',
                              borderRadius: '50%',
                              background: isPassed ? '#10b981' : isCurrent ? '#f59e0b' : 'var(--glass-border)',
                              color: 'white',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontSize: '10px',
                              fontWeight: 800
                            }}
                          >
                            {stageNum}
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectApproval(a);
                    }}
                    className="btn btn-primary touch-target w-full flex items-center justify-center gap-2 text-xs"
                  >
                    <Eye size={15} /> {t('approval.table.takeAction', 'Review Decision')} <ArrowRight size={13} />
                  </button>
                </div>
              );
            })}
          </div>

          {/* Desktop Table Presentation (Visible on >= md) */}
          <div className="hidden md:block table-scroll-container">
            <table style={{ width: '100%', minWidth: '780px', borderCollapse: 'separate', borderSpacing: '0 8px', textAlign: 'left', fontSize: '0.85rem' }}>
              <thead>
                <tr style={{ color: 'var(--text-muted)', fontSize: '0.78rem', letterSpacing: '0.5px' }}>
                  <th style={{ padding: '12px 18px', fontWeight: '700' }}>{t('approval.table.titleSubject', 'WORKFLOW & REQUEST')}</th>
                  <th style={{ padding: '12px 18px', fontWeight: '700' }}>{t('approval.table.requester', 'REQUESTER')}</th>
                  <th style={{ padding: '12px 18px', fontWeight: '700' }}>{t('approval.table.stage', 'STAGE PIPELINE')}</th>
                  <th style={{ padding: '12px 18px', fontWeight: '700' }}>{t('approval.table.status', 'STATUS')}</th>
                  <th style={{ padding: '12px 18px', fontWeight: '700' }}>{t('approval.table.submittedDate', 'SUBMITTED DATE')}</th>
                  <th style={{ padding: '12px 18px', fontWeight: '700', textAlign: 'right' }}>{t('approval.table.actions', 'ACTION')}</th>
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
                        background: 'var(--color-surface)',
                        border: '1px solid var(--color-border)',
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
                          {isFinalApproved
                            ? t('approval.stage.completedAll', 'Completed All Stages')
                            : `${t('approval.stage.activeStage', 'Active Stage')} ${currentStage} ${t('approval.stage.of', 'of')} ${totalStages}`}
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
                          className="btn btn-primary btn-sm touch-target-sm"
                          style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
                        >
                          <Eye size={15} /> {t('approval.table.takeAction', 'Review')} <ArrowRight size={13} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
