import React, { useState } from 'react';
import { Sliders, Flag, List, Cpu, Hash, Globe, Calendar, Zap } from 'lucide-react';
import { useTranslation } from '../../../i18n';
import { CONFIG_TABS } from '../constants/configConstants';
import SystemSettingsTab from '../components/SystemSettingsTab';
import FeatureFlagsTab from '../components/FeatureFlagsTab';
import LookupsTab from '../components/LookupsTab';
import BusinessRulesTab from '../components/BusinessRulesTab';
import NumberSequencesTab from '../components/NumberSequencesTab';
import LocalizationTab from '../components/LocalizationTab';
import CalendarsTab from '../components/CalendarsTab';
import BootstrapTab from '../components/BootstrapTab';

const ICON_MAP = {
  Sliders: Sliders,
  Flag: Flag,
  List: List,
  Cpu: Cpu,
  Hash: Hash,
  Globe: Globe,
  Calendar: Calendar,
  Zap: Zap
};

const TAB_COMPONENTS = {
  settings: SystemSettingsTab,
  flags: FeatureFlagsTab,
  lookups: LookupsTab,
  rules: BusinessRulesTab,
  sequences: NumberSequencesTab,
  localization: LocalizationTab,
  calendars: CalendarsTab,
  bootstrap: BootstrapTab
};

export default function ConfigurationPage() {
  const [activeTab, setActiveTab] = useState('settings');
  const { t } = useTranslation();

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  const localizedTabs = CONFIG_TABS.map(tab => {
    switch (tab.id) {
      case 'settings': return { ...tab, label: t('config.tabSettings'), description: t('config.tabSettingsDesc') };
      case 'flags': return { ...tab, label: t('config.tabFlags'), description: t('config.tabFlagsDesc') };
      case 'lookups': return { ...tab, label: t('config.tabLookups'), description: t('config.tabLookupsDesc') };
      case 'rules': return { ...tab, label: t('config.tabRules'), description: t('config.tabRulesDesc') };
      case 'sequences': return { ...tab, label: t('config.tabSequences'), description: t('config.tabSequencesDesc') };
      case 'localization': return { ...tab, label: t('config.tabLocalization'), description: t('config.tabLocalizationDesc') };
      case 'calendars': return { ...tab, label: t('config.tabCalendars'), description: t('config.tabCalendarsDesc') };
      case 'bootstrap': return { ...tab, label: t('config.tabBootstrap'), description: t('config.tabBootstrapDesc') };
      default: return tab;
    }
  });

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.2rem', marginBottom: '8px' }}>
          {t('config.managementTitle')}
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          {t('config.managementSubtitle')}
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '6px',
        padding: '6px',
        background: 'var(--glass-bg)',
        border: '1px solid var(--glass-border)',
        borderRadius: 'var(--border-radius-md)',
        marginBottom: '28px',
        overflowX: 'auto'
      }}>
        {localizedTabs.map((tab) => {
          const Icon = ICON_MAP[tab.icon];
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              title={tab.description}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 16px',
                borderRadius: 'var(--border-radius-sm)',
                border: 'none',
                background: isActive ? 'var(--accent-gradient)' : 'transparent',
                color: isActive ? 'white' : 'var(--text-muted)',
                fontWeight: isActive ? '600' : '500',
                fontSize: '0.85rem',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                transition: 'all var(--transition-fast)',
                boxShadow: isActive ? 'var(--glow-accent)' : 'none'
              }}
            >
              {Icon && <Icon size={16} />}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Active Tab Content */}
      <div>
        {ActiveComponent && <ActiveComponent />}
      </div>
    </div>
  );
}
