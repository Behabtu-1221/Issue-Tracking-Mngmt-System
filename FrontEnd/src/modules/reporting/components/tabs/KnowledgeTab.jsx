import React from 'react';
import { BookOpen, Eye, ThumbsUp, FileText, CheckCircle2 } from 'lucide-react';
import KPICard from '../KPICard';
import ReportDataTable from '../ReportDataTable';

export default function KnowledgeTab({ data, loading }) {
  const summary = data?.summary || {};
  const topArticles = data?.topArticles || [];

  const columns = [
    {
      key: 'Title',
      label: 'Article Title / Guide',
      sortable: true,
      render: (val, row) => (
        <div>
          <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{val}</div>
          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Category: {row.CategoryName || 'General'}</div>
        </div>
      )
    },
    {
      key: 'ArticleStatusCode',
      label: 'Status',
      sortable: true,
      render: (val) => (
        <span style={{ padding: '2px 8px', borderRadius: '10px', fontSize: '0.72rem', fontWeight: 700, background: val === 'PUBLISHED' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)', color: val === 'PUBLISHED' ? '#10b981' : '#f59e0b' }}>
          {val}
        </span>
      )
    },
    {
      key: 'ViewsCount',
      label: 'Views / Reads',
      sortable: true,
      render: (val) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#3b82f6' }}>
          <Eye size={13} /> {val || 0}
        </span>
      )
    },
    {
      key: 'LikesCount',
      label: 'Helpful Upvotes',
      sortable: true,
      render: (val) => (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px', fontWeight: 700, color: '#10b981' }}>
          <ThumbsUp size={13} /> {val || 0}
        </span>
      )
    },
    { key: 'AuthorName', label: 'Author', sortable: true },
    {
      key: 'CreatedDate',
      label: 'Published Date',
      sortable: true,
      render: (val) => val ? new Date(val).toLocaleDateString() : '—'
    }
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px' }}>
        <KPICard
          title="Knowledge Articles"
          value={loading ? '...' : summary.totalArticles || 0}
          subtext="Solution guides & SOPs"
          icon={BookOpen}
          iconBg="rgba(59, 130, 246, 0.15)"
          iconColor="#3b82f6"
          accentColor="#3b82f6"
        />

        <KPICard
          title="Published Solutions"
          value={loading ? '...' : summary.publishedArticles || 0}
          subtext={`${summary.draftArticles || 0} drafts in authoring`}
          icon={CheckCircle2}
          iconBg="rgba(16, 185, 129, 0.15)"
          iconColor="#10b981"
          accentColor="#10b981"
        />

        <KPICard
          title="Total Guide Views"
          value={loading ? '...' : summary.totalViews || 0}
          subtext="Tenant & technician reads"
          icon={Eye}
          iconBg="rgba(14, 165, 233, 0.15)"
          iconColor="#0ea5e9"
          accentColor="#0ea5e9"
        />

        <KPICard
          title="Total Helpful Likes"
          value={loading ? '...' : summary.totalLikes || 0}
          subtext="Verified solution ratings"
          icon={ThumbsUp}
          iconBg="rgba(168, 85, 247, 0.15)"
          iconColor="#a855f7"
          accentColor="#a855f7"
        />
      </div>

      <ReportDataTable
        title="Top Solution Articles & Self-Service Telemetry"
        columns={columns}
        data={topArticles}
        reportType="KB_ANALYTICS"
        loading={loading}
        showExport={false}
      />
    </div>
  );
}
