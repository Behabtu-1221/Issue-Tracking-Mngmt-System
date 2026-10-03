import React, { useState, useEffect } from 'react';
import approvalApi from '../api/approvalApi';
import ApprovalMetricsHeader from '../components/ApprovalMetricsHeader';
import ApprovalListView from '../components/ApprovalListView';
import ApprovalDetailModal from '../components/ApprovalDetailModal';
import ApprovalDelegationsTab from '../components/ApprovalDelegationsTab';
import ApprovalRulesGroupsTab from '../components/ApprovalRulesGroupsTab';
import CreateWorkflowModal from '../components/CreateWorkflowModal';
import { Layers, Plus, UserCheck, ShieldCheck, CheckSquare, RefreshCw } from 'lucide-react';

export default function ApprovalManagementPage() {
  const [activeTab, setActiveTab] = useState('workflows'); // 'workflows' | 'delegations' | 'rules'
  const [metrics, setMetrics] = useState(null);
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Selected approval for detail modal
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchMetrics();
  }, []);

  useEffect(() => {
    if (activeTab === 'workflows') {
      fetchApprovals();
    }
  }, [activeTab, search, statusFilter]);

  const fetchMetrics = async () => {
    try {
      const res = await approvalApi.getMetrics();
      setMetrics(res.data.data);
    } catch (err) {
      console.error('Failed to fetch approval metrics', err);
    }
  };

  const fetchApprovals = async () => {
    try {
      setLoading(true);
      const statusCode = statusFilter === 'ALL' ? undefined : statusFilter;
      const res = await approvalApi.getApprovals({ search, statusCode });
      setApprovals(res.data.data.approvals || []);
    } catch (err) {
      console.error('Failed to fetch approvals list', err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectApproval = async (approvalSummary) => {
    try {
      const res = await approvalApi.getApprovalById(approvalSummary.ApprovalID);
      setSelectedApproval(res.data.data);
    } catch (err) {
      alert('Failed to load approval details');
    }
  };

  const handleSubmitDecision = async (decisionData) => {
    await approvalApi.submitDecision(decisionData);
    // Refresh modal and main list
    const updatedRes = await approvalApi.getApprovalById(decisionData.ApprovalID);
    setSelectedApproval(updatedRes.data.data);
    fetchApprovals();
    fetchMetrics();
  };

  const handleCreateWorkflowSubmit = async (workflowData) => {
    await approvalApi.createApproval(workflowData);
    setShowCreateModal(false);
    fetchApprovals();
    fetchMetrics();
  };

  return (
    <div style={{ padding: '32px 24px', maxWidth: '1400px', margin: '0 auto' }}>

      {/* Header Banner */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '28px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
            <div style={{ width: '38px', height: '38px', borderRadius: '12px', background: 'var(--accent-gradient)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', boxShadow: 'var(--glow-accent)' }}>
              <CheckSquare size={22} />
            </div>
            <div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>
                Approval Management System
              </h1>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                Multi-level governance, decision recording, delegation & audit trails
              </div>
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '12px' }}>
          <button
            onClick={() => { fetchApprovals(); fetchMetrics(); }}
            className="btn btn-secondary"
            style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <RefreshCw size={16} /> Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="btn btn-primary"
            style={{ padding: '10px 18px', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            <Plus size={18} /> Initiate Workflow
          </button>
        </div>
      </div>

      {/* KPI Metrics */}
      <ApprovalMetricsHeader
        metrics={metrics}
        activeFilter={statusFilter}
        onFilterChange={(code) => {
          setActiveTab('workflows');
          setStatusFilter(code);
        }}
      />

      {/* Navigation Sub-tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid var(--glass-border)', paddingBottom: '12px' }}>
        <button
          onClick={() => setActiveTab('workflows')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'workflows' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: activeTab === 'workflows' ? 'white' : 'var(--text-muted)',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <Layers size={16} /> Approvals & Queue
        </button>

        <button
          onClick={() => setActiveTab('delegations')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'delegations' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: activeTab === 'delegations' ? 'white' : 'var(--text-muted)',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <UserCheck size={16} /> Delegations
        </button>

        <button
          onClick={() => setActiveTab('rules')}
          style={{
            padding: '10px 20px',
            borderRadius: '10px',
            border: 'none',
            background: activeTab === 'rules' ? 'var(--accent-primary)' : 'var(--bg-tertiary)',
            color: activeTab === 'rules' ? 'white' : 'var(--text-muted)',
            fontWeight: '700',
            cursor: 'pointer',
            fontSize: '0.9rem',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <ShieldCheck size={16} /> Governance Rules & Groups
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'workflows' && (
        <ApprovalListView
          approvals={approvals}
          loading={loading}
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusFilterChange={setStatusFilter}
          onSelectApproval={handleSelectApproval}
        />
      )}

      {activeTab === 'delegations' && (
        <ApprovalDelegationsTab />
      )}

      {activeTab === 'rules' && (
        <ApprovalRulesGroupsTab />
      )}

      {/* Modals */}
      {selectedApproval && (
        <ApprovalDetailModal
          approval={selectedApproval}
          onClose={() => setSelectedApproval(null)}
          onSubmitDecision={handleSubmitDecision}
        />
      )}

      {showCreateModal && (
        <CreateWorkflowModal
          onClose={() => setShowCreateModal(false)}
          onSubmit={handleCreateWorkflowSubmit}
        />
      )}

    </div>
  );
}
