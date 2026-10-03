import React, { useState } from 'react';
import { Sliders, Flag, List, Cpu, Hash, Globe, Calendar, Zap } from 'lucide-react';
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

  const ActiveComponent = TAB_COMPONENTS[activeTab];

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontFamily: "'Outfit', sans-serif", fontSize: '2.2rem', marginBottom: '8px' }}>
          Configuration <span className="glow-text">Management</span>
        </h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage platform settings, feature toggles, lookup dictionaries, business rules, and runtime configurations.
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
        {CONFIG_TABS.map((tab) => {
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
