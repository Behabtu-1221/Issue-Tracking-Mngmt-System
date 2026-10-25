import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Check, ChevronDown, Languages, ArrowRightLeft, Globe } from 'lucide-react';
import { useTranslation } from './LanguageContext';

/**
 * High-definition SVG Flag for Ethiopia
 * High-fidelity 3-stripe with blue central disk and yellow pentagram star
 */
const EthiopiaFlagIcon = ({ width = 20, height = 14, style = {} }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 30 20"
    style={{
      borderRadius: '3px',
      overflow: 'hidden',
      display: 'inline-block',
      verticalAlign: 'middle',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.35)',
      flexShrink: 0,
      border: '1px solid rgba(255, 255, 255, 0.12)',
      ...style
    }}
    aria-label="Ethiopian Flag"
  >
    {/* Green stripe */}
    <rect width="30" height="6.67" y="0" fill="#078930" />
    {/* Yellow stripe */}
    <rect width="30" height="6.67" y="6.67" fill="#FCDD09" />
    {/* Red stripe */}
    <rect width="30" height="6.67" y="13.33" fill="#DA121A" />
    {/* Blue circle */}
    <circle cx="15" cy="10" r="4.2" fill="#0F47AF" />
    {/* Star rays */}
    <path
      d="M15,6.8 L15.9,9.3 L18.5,9.3 L16.4,10.9 L17.2,13.4 L15,11.8 L12.8,13.4 L13.6,10.9 L11.5,9.3 L14.1,9.3 Z"
      fill="#FCDD09"
    />
  </svg>
);

/**
 * High-definition SVG Flag for English (US / Global)
 * High-fidelity red/white stripes with blue canton and crisp stars
 */
const EnglishFlagIcon = ({ width = 20, height = 14, style = {} }) => (
  <svg
    width={width}
    height={height}
    viewBox="0 0 30 20"
    style={{
      borderRadius: '3px',
      overflow: 'hidden',
      display: 'inline-block',
      verticalAlign: 'middle',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.35)',
      flexShrink: 0,
      border: '1px solid rgba(255, 255, 255, 0.12)',
      ...style
    }}
    aria-label="English / US Flag"
  >
    {/* Red background */}
    <rect width="30" height="20" fill="#B22234" />
    {/* White stripes */}
    <rect width="30" height="1.54" y="1.54" fill="#FFFFFF" />
    <rect width="30" height="1.54" y="4.62" fill="#FFFFFF" />
    <rect width="30" height="1.54" y="7.69" fill="#FFFFFF" />
    <rect width="30" height="1.54" y="10.77" fill="#FFFFFF" />
    <rect width="30" height="1.54" y="13.85" fill="#FFFFFF" />
    <rect width="30" height="1.54" y="16.92" fill="#FFFFFF" />
    {/* Blue canton */}
    <rect width="13" height="10.77" fill="#3C3B6E" />
    {/* White stars pattern */}
    <circle cx="2.6" cy="2.2" r="0.6" fill="#FFFFFF" />
    <circle cx="6.5" cy="2.2" r="0.6" fill="#FFFFFF" />
    <circle cx="10.4" cy="2.2" r="0.6" fill="#FFFFFF" />
    <circle cx="4.55" cy="4.5" r="0.6" fill="#FFFFFF" />
    <circle cx="8.45" cy="4.5" r="0.6" fill="#FFFFFF" />
    <circle cx="2.6" cy="6.8" r="0.6" fill="#FFFFFF" />
    <circle cx="6.5" cy="6.8" r="0.6" fill="#FFFFFF" />
    <circle cx="10.4" cy="6.8" r="0.6" fill="#FFFFFF" />
    <circle cx="4.55" cy="9.0" r="0.6" fill="#FFFFFF" />
    <circle cx="8.45" cy="9.0" r="0.6" fill="#FFFFFF" />
  </svg>
);

const LocaleFlag = ({ code, width = 20, height = 14, style = {} }) => {
  if (code === 'am') {
    return <EthiopiaFlagIcon width={width} height={height} style={style} />;
  }
  return <EnglishFlagIcon width={width} height={height} style={style} />;
};

/**
 * Enterprise Production-Ready Language Selector & Toggle
 */
export default function LanguageSelector({ variant = 'navbar', className = '' }) {
  const { locale, availableLocales, changeLanguage, t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  // Active locale definition
  const current = availableLocales.find(l => l.code === locale) || availableLocales[0];
  const otherLocale = availableLocales.find(l => l.code !== locale) || availableLocales[0];

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
      return () => window.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const handleSelect = useCallback((code) => {
    changeLanguage(code);
    setIsOpen(false);
  }, [changeLanguage]);

  return (
    <div
      ref={containerRef}
      style={{ position: 'relative', display: 'inline-block' }}
      className={`lang-selector-container ${className}`}
    >
      {/* ─── THE TOGGLE / TRIGGER BUTTON ─── */}
      <button
        type="button"
        onClick={() => setIsOpen(prev => !prev)}
        title={t('language.selectLanguage', 'Select Language')}
        aria-label={t('language.selectLanguage', 'Select Language')}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: '8px',
          height: variant === 'auth' ? '40px' : '38px',
          padding: '0 12px 0 10px',
          borderRadius: '24px',
          background: isOpen ? 'var(--color-elevated, #20262D)' : 'var(--bg-tertiary, #20262D)',
          border: isOpen
            ? '1px solid var(--color-primary, #2F81F7)'
            : '1px solid var(--sidebar-border, #303841)',
          color: 'var(--color-text, #F5F7FA)',
          cursor: 'pointer',
          fontSize: '0.84rem',
          fontWeight: 600,
          outline: 'none',
          userSelect: 'none',
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: isOpen
            ? '0 0 0 3px rgba(47, 129, 247, 0.22), 0 2px 8px rgba(0, 0, 0, 0.3)'
            : '0 2px 5px rgba(0, 0, 0, 0.25)'
        }}
        onMouseEnter={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--color-primary, #2F81F7)';
            e.currentTarget.style.transform = 'translateY(-1px)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(47, 129, 247, 0.2), 0 2px 6px rgba(0, 0, 0, 0.25)';
          }
        }}
        onMouseLeave={(e) => {
          if (!isOpen) {
            e.currentTarget.style.borderColor = 'var(--sidebar-border, #303841)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 2px 5px rgba(0, 0, 0, 0.25)';
          }
        }}
      >
        {/* Global Language Icon */}
        <Globe size={15} style={{ color: isOpen ? 'var(--color-primary, #2F81F7)' : 'var(--color-primary, #2F81F7)', flexShrink: 0 }} />

        {/* Primary Language Name */}
        <span
          style={{
            fontWeight: 700,
            fontSize: '0.85rem',
            color: 'var(--color-text, #F5F7FA)',
            letterSpacing: '0.01em',
            lineHeight: 1
          }}
        >
          {current.nativeName}
        </span>

        {/* Subdued Badge Chip */}
        <span
          style={{
            fontSize: '0.68rem',
            fontWeight: 800,
            padding: '2px 5px',
            borderRadius: '4px',
            background: 'rgba(47, 129, 247, 0.16)',
            color: 'var(--color-primary, #2F81F7)',
            letterSpacing: '0.04em',
            lineHeight: 1
          }}
        >
          {current.shortLabel || current.code.toUpperCase()}
        </span>

        {/* Animated Chevron Down */}
        <ChevronDown
          size={14}
          style={{
            color: isOpen ? 'var(--color-primary, #2F81F7)' : 'var(--color-text-secondary, #B6C2CF)',
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            transition: 'transform 0.25s cubic-bezier(0.4, 0, 0.2, 1), color 0.2s ease',
            marginLeft: '2px'
          }}
        />
      </button>

      {/* ─── THE PRODUCTION-READY ENTERPRISE DROPDOWN ─── */}
      {isOpen && (
        <div
          role="listbox"
          aria-label="Language options"
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '270px',
            background: 'var(--color-elevated, #20262D)',
            border: '1px solid var(--color-border, #303841)',
            borderRadius: '16px',
            padding: '8px',
            boxShadow: '0 18px 45px -4px rgba(0, 0, 0, 0.65), 0 0 0 1px rgba(255, 255, 255, 0.05)',
            zIndex: 1200,
            backdropFilter: 'blur(16px)',
            animation: 'langDropdownIn 0.2s cubic-bezier(0.16, 1, 0.3, 1)'
          }}
        >
          {/* Header Bar */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '6px 10px 8px',
              borderBottom: '1px solid var(--color-border, #303841)',
              marginBottom: '6px'
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Languages size={14} color="var(--color-primary, #2F81F7)" />
              <span
                style={{
                  fontSize: '0.72rem',
                  fontWeight: 800,
                  color: 'var(--color-text-secondary, #B6C2CF)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em'
                }}
              >
                {locale === 'am' ? 'ቋንቋ ይምረጡ' : 'Select Language'}
              </span>
            </div>

            <span
              style={{
                fontSize: '0.66rem',
                fontWeight: 700,
                padding: '2px 7px',
                borderRadius: '10px',
                background: 'rgba(255, 255, 255, 0.06)',
                color: 'var(--color-text-secondary, #B6C2CF)'
              }}
            >
              2 Available
            </span>
          </div>

          {/* Language Options List */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            {availableLocales.map((loc) => {
              const isSelected = loc.code === locale;
              return (
                <button
                  key={loc.code}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => handleSelect(loc.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '9px 12px',
                    borderRadius: '10px',
                    background: isSelected ? 'rgba(47, 129, 247, 0.14)' : 'transparent',
                    border: isSelected
                      ? '1px solid rgba(47, 129, 247, 0.35)'
                      : '1px solid transparent',
                    color: isSelected ? 'var(--color-primary, #2F81F7)' : 'var(--color-text, #F5F7FA)',
                    cursor: 'pointer',
                    outline: 'none',
                    textAlign: 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.06)';
                      e.currentTarget.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                      e.currentTarget.style.borderColor = 'transparent';
                    }
                  }}
                >
                  {/* Titles (flag removed at prefix) */}
                  <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
                    <div
                      style={{
                        fontSize: '0.88rem',
                        fontWeight: isSelected ? 800 : 600,
                        color: isSelected ? 'var(--color-primary, #2F81F7)' : 'var(--color-text, #F5F7FA)',
                        lineHeight: 1.2
                      }}
                    >
                      {loc.nativeName}
                    </div>
                    <div
                      style={{
                        fontSize: '0.72rem',
                        color: 'var(--color-text-secondary, #B6C2CF)',
                        marginTop: '2px',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis'
                      }}
                    >
                      {loc.region || loc.name}
                    </div>
                  </div>

                  {/* Right Status / Badge */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                    <span
                      style={{
                        fontSize: '0.68rem',
                        fontWeight: 800,
                        padding: '2px 6px',
                        borderRadius: '4px',
                        background: isSelected
                          ? 'rgba(47, 129, 247, 0.2)'
                          : 'rgba(255, 255, 255, 0.06)',
                        color: isSelected
                          ? 'var(--color-primary, #2F81F7)'
                          : 'var(--color-text-secondary, #B6C2CF)'
                      }}
                    >
                      {loc.shortLabel}
                    </span>

                    {isSelected ? (
                      <div
                        style={{
                          width: '20px',
                          height: '20px',
                          borderRadius: '50%',
                          background: 'var(--color-primary, #2F81F7)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 0 8px rgba(47, 129, 247, 0.45)'
                        }}
                      >
                        <Check size={12} color="#FFFFFF" strokeWidth={3} />
                      </div>
                    ) : (
                      <div style={{ width: '20px', height: '20px' }} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ─── QUICK TOGGLE SHORTCUT BAR ─── */}
          <div
            style={{
              marginTop: '6px',
              paddingTop: '6px',
              borderTop: '1px solid var(--color-border, #303841)'
            }}
          >
            <button
              type="button"
              onClick={() => handleSelect(otherLocale.code)}
              style={{
                width: '100%',
                padding: '7px 10px',
                borderRadius: '8px',
                background: 'rgba(255, 255, 255, 0.03)',
                border: '1px dashed var(--color-border, #303841)',
                color: 'var(--color-text-secondary, #B6C2CF)',
                fontSize: '0.76rem',
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '6px',
                cursor: 'pointer',
                transition: 'all 0.15s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(47, 129, 247, 0.08)';
                e.currentTarget.style.borderColor = 'var(--color-primary, #2F81F7)';
                e.currentTarget.style.color = 'var(--color-primary, #2F81F7)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 255, 255, 0.03)';
                e.currentTarget.style.borderColor = 'var(--color-border, #303841)';
                e.currentTarget.style.color = 'var(--color-text-secondary, #B6C2CF)';
              }}
            >
              <ArrowRightLeft size={12} />
              <span>
                {locale === 'en'
                  ? 'ወደ አማርኛ ቀይር (Switch to አማርኛ)'
                  : 'Switch to English (ወደ English)'}
              </span>
            </button>
          </div>
        </div>
      )}

      {/* Embedded Smooth Animation Keyframes */}
      <style>{`
        @keyframes langDropdownIn {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.97);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
}
