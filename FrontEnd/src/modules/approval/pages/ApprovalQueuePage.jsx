import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Plus, RefreshCw } from 'lucide-react';
import { useTranslation } from '../../../i18n/LanguageContext';
import approvalApi from '../api/approvalApi';
import ApprovalListView from '../components/ApprovalListView';
import ApprovalDetailModal from '../components/ApprovalDetailModal';
import CreateWorkflowModal from '../components/CreateWorkflowModal';

export default function ApprovalQueuePage() {
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const initialStatus = searchParams.get('status') || 'ALL';

  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(initialStatus);

  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchApprovals();
  }, [search, statusFilter]);

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const statusCode = statusFilter === 'ALL' ? undefined : statusFilter;
      const res = await approvalApi.getApprovals({ search, statusCode });
      setApprovals(res.data?.data?.approvals || []);
    } catch (err) {
      console.error('Failed to fetch approvals list', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApproval = async (approvalSummary) => {
    try {
      const res = await approvalApi.getApprovalById(approvalSummary.ApprovalID);
      setSelectedApproval(res.data?.data);
    } catch (err) {
      alert('Failed to load approval details');
    }
  };

  const handleSubmitDecision = async (decisionData) => {
    await approvalApi.submitDecision(decisionData);
    const updatedRes = await approvalApi.getApprovalById(decisionData.ApprovalID);
    setSelectedApproval(updatedRes.data?.data);
    fetchApprovals();
  };

  const handleCreateWorkflowSubmit = async (workflowData) => {
    await approvalApi.createApproval(workflowData);
    setShowCreateModal(false);
    fetchApprovals();
  };

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, margin: 0 }}>
            {t('approval.title', 'Approvals & Workflows Queue')}
          </h1>
          <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('approval.subtitle', 'Multi-level governance queue, approval decision logs, and workflow histories')}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button onClick={fetchApprovals} className="btn btn-secondary" style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <RefreshCw size={16} /> {t('approval.refreshBtn', 'Refresh')}
          </button>
          <button onClick={() => setShowCreateModal(true)} className="btn btn-primary" style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}>
            <Plus size={18} /> {t('approval.workflowModal.title', 'Initiate Workflow')}
          </button>
        </div>
      </div>

      <ApprovalListView
        approvals={approvals}
        loading={loading}
        search={search}
        onSearchChange={setSearch}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
        onSelectApproval={handleSelectApproval}
      />

      {selectedApproval && (
        <ApprovalDetailModal
          isOpen={!!selectedApproval}
          onClose={() => setSelectedApproval(null)}
          approval={selectedApproval}
          onSubmitDecision={handleSubmitDecision}
        />
      )}

      {showCreateModal && (
        <CreateWorkflowModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateWorkflowSubmit}
        />
      )}
    </div>
  );
}
