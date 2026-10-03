import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import IssueListTab from '../components/IssueListTab';
import IssueDetailView from '../components/IssueDetailView';
import CreateIssueModal from '../components/CreateIssueModal';
import AssignIssueModal from '../components/AssignIssueModal';
import StatusUpdateModal from '../components/StatusUpdateModal';
import issueManagementApi from '../api/issueManagementApi';

export default function IssueTrackerPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const [selectedIssue, setSelectedIssue] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [assignModalIssue, setAssignModalIssue] = useState(null);
  const [statusModalIssue, setStatusModalIssue] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const targetId = params.get('id') || params.get('requestId');
    if (targetId) {
      issueManagementApi.getIssueById(targetId)
        .then(res => {
          if (res.data?.data) {
            setSelectedIssue(res.data.data);
          }
        })
        .catch(err => {
          console.warn('Could not auto-load issue by id:', err);
        });
    }
  }, [location.search]);

  const handleRefreshAll = () => setRefreshKey(k => k + 1);

  const handleSelectIssue = (issue) => setSelectedIssue(issue);

  const handleBackToList = () => {
    setSelectedIssue(null);
    navigate(location.pathname, { replace: true });
    handleRefreshAll();
  };

  // If an issue detail is selected, show the detail view
  if (selectedIssue) {
    return (
      <div>
        <IssueDetailView
          issue={selectedIssue}
          onBack={handleBackToList}
          onOpenAssignModal={(iss) => setAssignModalIssue(iss)}
          onOpenStatusModal={(iss) => setStatusModalIssue(iss)}
        />
        <AssignIssueModal
          isOpen={!!assignModalIssue}
          onClose={() => setAssignModalIssue(null)}
          issue={assignModalIssue}
          onIssueAssigned={() => { handleRefreshAll(); setSelectedIssue(null); }}
        />
        <StatusUpdateModal
          isOpen={!!statusModalIssue}
          onClose={() => setStatusModalIssue(null)}
          issue={statusModalIssue}
          onStatusUpdated={() => { handleRefreshAll(); setSelectedIssue(null); }}
        />
      </div>
    );
  }

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
{/* Header */}
        <p style={{ margin: '4px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
          Submit, monitor, assign, update status, and manage issue requests across the facility
        </p>
      </div>

      <IssueListTab
        onSelectIssue={handleSelectIssue}
        onOpenCreateModal={() => setShowCreateModal(true)}
        onOpenAssignModal={(iss) => setAssignModalIssue(iss)}
        onOpenStatusModal={(iss) => setStatusModalIssue(iss)}
        refreshKey={refreshKey}
      />

      <CreateIssueModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onIssueCreated={handleRefreshAll}
      />
      <AssignIssueModal
        isOpen={!!assignModalIssue}
        onClose={() => setAssignModalIssue(null)}
        issue={assignModalIssue}
        onIssueAssigned={handleRefreshAll}
      />
      <StatusUpdateModal
        isOpen={!!statusModalIssue}
        onClose={() => setStatusModalIssue(null)}
        issue={statusModalIssue}
        onStatusUpdated={handleRefreshAll}
      />
    </div>
  );
}
