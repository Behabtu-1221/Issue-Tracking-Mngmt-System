import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  MessageSquare, ArrowLeft, X, Shield, Sparkles,
  Info, ExternalLink, RefreshCw, Layers
} from 'lucide-react';
import { useAuth } from '../../../modules/authentication/contexts/AuthContext';
import { useTranslation } from '../../../i18n/LanguageContext';
import ConversationListPanel from '../components/ConversationListPanel';
import ConversationPanel from '../components/ConversationPanel';

/**
 * CommDiscussionsPage — Request-Centered Stakeholder Conversations Hub
 * Fully responsive master-detail view with role-tailored header, mobile drawer toggle,
 * and direct request deep-linking.
 */
export default function CommDiscussionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const requestIdFromUrl = searchParams.get('requestId');

  const { user } = useAuth();
  const currentUserId = user?.id || user?.userId || user?.UserID || 1;
  const userRole = (user?.userTypeCode || user?.role || '').toUpperCase();

  const [selectedConv, setSelectedConv] = useState(null);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth <= 900);

  // Auto-detect window resize for responsive layout
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth <= 900);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // If requestId provided in URL query, set initial conversation
  useEffect(() => {
    if (requestIdFromUrl && !selectedConv) {
      setSelectedConv({
        ReferenceIssueRequestID: Number(requestIdFromUrl),
        RequestTitle: `Request #${requestIdFromUrl}`
      });
    }
  }, [requestIdFromUrl, selectedConv]);

  const handleSelectConversation = useCallback((conv) => {
    setSelectedConv(conv);
  }, []);

  const getRolePortalLabel = () => {
    if (userRole.includes('ADMIN')) return t('communication.roleBadges.admin', 'Admin Operations Hub');
    if (userRole.includes('TECH')) return t('communication.roleBadges.tech', 'Technician Fulfillment Desk');
    if (userRole.includes('MANAGER')) return t('communication.roleBadges.manager', 'Department Oversight');
    return t('communication.roleBadges.requester', 'Requester Support Portal');
  };

  return (
    <div style={{ padding: '24px', maxWidth: '1600px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* ── Page Header ── */}
      <div style={{
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
        flexWrap: 'wrap', gap: '16px'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <h1 style={{
              margin: 0, fontSize: '1.75rem', fontWeight: 800,
              letterSpacing: '-0.5px', color: 'var(--text-primary)',
              display: 'flex', alignItems: 'center', gap: '10px'
            }}>
              <MessageSquare size={28} color="var(--accent-primary)" />
              {t('communication.tabs.comments', 'Request Discussions')}
            </h1>
            <span style={{
              padding: '4px 10px', borderRadius: '20px',
              background: 'rgba(99,102,241,0.12)', border: '1px solid rgba(99,102,241,0.25)',
              color: 'var(--accent-primary)', fontSize: '0.75rem', fontWeight: 700
            }}>
              {getRolePortalLabel()}
            </span>
          </div>
          <p style={{ margin: '6px 0 0', color: 'var(--text-muted)', fontSize: '0.88rem' }}>
            {t('communication.subtitle', 'Collaborate directly with requesters, facility managers, and assigned field technicians in real-time.')}
          </p>
        </div>

        {/* Back to Request or Communication Dashboard */}
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={() => navigate('/communication/dashboard')}
            style={{
              padding: '9px 15px', borderRadius: '10px',
              background: 'var(--bg-tertiary)', border: '1px solid var(--glass-border)',
              color: 'var(--text-secondary)', cursor: 'pointer', display: 'flex',
              alignItems: 'center', gap: '6px', fontSize: '0.82rem', fontWeight: 600
            }}
          >
            ← {t('communication.title', 'Communication Hub')}
          </button>
        </div>
      </div>

      {/* ── Mobile Back Button (when conversation is active) ── */}
      {isMobileView && selectedConv && (
        <button
          onClick={() => setSelectedConv(null)}
          style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            padding: '10px 16px', borderRadius: '10px',
            background: 'var(--accent-gradient)', color: '#ffffff',
            border: 'none', fontWeight: 700, fontSize: '0.85rem',
            cursor: 'pointer', alignSelf: 'flex-start',
            boxShadow: '0 4px 14px rgba(99, 102, 241, 0.25)'
          }}
        >
          <ArrowLeft size={16} /> {t('communication.tabs.conversations', 'All Discussions List')}
        </button>
      )}

      {/* ── Responsive Master-Detail Layout ── */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: isMobileView
          ? '1fr'
          : '380px 1fr',
        gap: '20px',
        minHeight: '660px'
      }}>
        {/* Left Pane: Conversation List (hidden on mobile if chat is open) */}
        {(!isMobileView || !selectedConv) && (
          <div style={{ minWidth: 0, height: '660px' }}>
            <ConversationListPanel
              currentUserId={currentUserId}
              selectedConversationId={selectedConv?.ConversationID || selectedConv?.ReferenceIssueRequestID}
              onSelectConversation={handleSelectConversation}
            />
          </div>
        )}

        {/* Right Pane: Active Chat Thread (hidden on mobile if no conversation chosen) */}
        {(!isMobileView || selectedConv) && (
          <div style={{ minWidth: 0, height: '660px' }}>
            {selectedConv ? (
              <ConversationPanel
                conversationId={selectedConv.ConversationID}
                issueRequestId={selectedConv.ReferenceIssueRequestID}
                currentUserId={currentUserId}
                onRequestOpen={(id) => navigate(`/issues?requestId=${id}`)}
              />
            ) : (
              <div style={{
                height: '100%',
                background: 'var(--bg-secondary)',
                border: '1px solid var(--glass-border)',
                borderRadius: '20px',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '40px', textAlign: 'center',
                boxShadow: 'var(--shadow-lg)'
              }}>
                <div style={{
                  padding: '24px', borderRadius: '50%',
                  background: 'linear-gradient(135deg, rgba(99,102,241,0.12) 0%, rgba(124,58,237,0.08) 100%)',
                  color: 'var(--accent-primary)', marginBottom: '18px'
                }}>
                  <MessageSquare size={48} />
                </div>
                <div style={{ fontWeight: 800, fontSize: '1.2rem', color: 'var(--text-primary)' }}>
                  Select a Discussion Thread
                </div>
                <div style={{
                  fontSize: '0.88rem', color: 'var(--text-muted)',
                  marginTop: '8px', maxWidth: '380px', lineHeight: 1.5
                }}>
                  Choose any active request conversation on the left to review message history, inspect participant details, and post immediate updates.
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
