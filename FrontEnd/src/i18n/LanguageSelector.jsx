import React, { useState, useRef, useEffect } from 'react';
import { Globe, Check, ChevronDown } from 'lucide-react';
import { useTranslation } from './LanguageContext';

export default function LanguageSelector({ variant = 'navbar', className = '' }) {
  const { locale, availableLocales, changeLanguage, t, isRTL } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

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

  const current = availableLocales.find(l => l.code === locale) || availableLocales[0];

  const handleSelect = (code) => {
    changeLanguage(code);
    setIsOpen(false);
  };

  // Login page or standalone variant
  if (variant === 'auth' || variant === 'standalone') {
    return (
      <div ref={containerRef} style={{ position: 'relative', display: 'inline-block' }} className={className}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-haspopup="true"
          aria-expanded={isOpen}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 14px',
            borderRadius: '10px',
            background: 'var(--color-surface, #171B21)',
            border: '1px solid var(--color-border, #303841)',
            color: 'var(--color-text, #F5F7FA)',
            fontSize: '0.85rem',
            fontWeight: 600,
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.25)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-primary, #2F81F7)';
            e.currentTarget.style.transform = 'translateY(-1px)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = 'var(--color-border, #303841)';
            e.currentTarget.style.transform = 'translateY(0)';
          }}
        >
          <Globe size={16} color="var(--color-primary, #2F81F7)" />
          <span>{current.flag}</span>
          <span>{current.nativeName}</span>
          <ChevronDown size={14} style={{ opacity: 0.6, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        {isOpen && (
          <div
            style={{
              position: 'absolute',
              top: 'calc(100% + 6px)',
              right: isRTL ? 'auto' : 0,
              left: isRTL ? 0 : 'auto',
              minWidth: '220px',
              background: 'var(--color-elevated, #20262D)',
              border: '1px solid var(--color-border, #303841)',
              borderRadius: '12px',
              padding: '6px',
              boxShadow: '0 12px 32px rgba(0, 0, 0, 0.45)',
              zIndex: 1000,
              backdropFilter: 'blur(12px)',
              animation: 'fadeIn 0.15s ease-out'
            }}
          >
            <div style={{ padding: '6px 10px', fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-secondary, #B6C2CF)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {t('language.selectLanguage', 'Select Language')}
            </div>
            {availableLocales.map((loc) => {
              const isSelected = loc.code === locale;
              return (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => handleSelect(loc.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(47, 129, 247, 0.12)' : 'transparent',
                    border: 'none',
                    color: isSelected ? 'var(--color-primary, #2F81F7)' : 'var(--color-text, #F5F7FA)',
                    fontSize: '0.85rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    textAlign: isRTL ? 'right' : 'left',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.1rem' }}>{loc.flag}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                      <span style={{ lineHeight: 1.2 }}>{loc.nativeName}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary, #B6C2CF)' }}>{loc.name}</span>
                    </div>
                  </div>
                  {isSelected && <Check size={16} color="var(--color-primary, #2F81F7)" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // Standard Top Navbar Button
  return (
    <div ref={containerRef} style={{ position: 'relative' }} className={className}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        title={t('language.selectLanguage', 'Select Language')}
        aria-label={t('language.selectLanguage', 'Select Language')}
        aria-haspopup="true"
        aria-expanded={isOpen}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '6px',
          padding: '7px 12px',
          borderRadius: '20px',
          background: 'var(--bg-tertiary, #20262D)',
          border: '1px solid var(--sidebar-border, #303841)',
          color: 'var(--color-text, #F5F7FA)',
          cursor: 'pointer',
          fontSize: '0.82rem',
          fontWeight: 600,
          transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.2)'
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'var(--color-primary, #2F81F7)';
          e.currentTarget.style.transform = 'scale(1.03)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--sidebar-border, #303841)';
          e.currentTarget.style.transform = 'scale(1.0)';
        }}
      >
        <Globe size={16} color="var(--color-primary, #2F81F7)" />
        <span style={{ fontSize: '0.95rem' }}>{current.flag}</span>
        <span style={{ textTransform: 'uppercase', letterSpacing: '0.04em' }}>{current.code}</span>
        <ChevronDown size={13} style={{ opacity: 0.5, transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
      </button>

      {isOpen && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: isRTL ? 'auto' : 0,
            left: isRTL ? 0 : 'auto',
            minWidth: '230px',
            background: 'var(--color-elevated, #20262D)',
            border: '1px solid var(--color-border, #303841)',
            borderRadius: '14px',
            padding: '8px',
            boxShadow: '0 16px 40px rgba(0, 0, 0, 0.5)',
            zIndex: 1100,
            backdropFilter: 'blur(16px)'
          }}
        >
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '6px 10px 8px',
            borderBottom: '1px solid var(--color-border, #303841)',
            marginBottom: '6px'
          }}>
            <span style={{ fontSize: '0.72rem', fontWeight: 700, color: 'var(--color-text-secondary, #B6C2CF)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
              {t('language.languages', 'Languages')}
            </span>
            {isRTL && (
              <span style={{ fontSize: '0.68rem', fontWeight: 800, padding: '2px 6px', borderRadius: '4px', background: 'rgba(47, 129, 247, 0.15)', color: 'var(--color-primary, #2F81F7)' }}>
                RTL
              </span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {availableLocales.map((loc) => {
              const isSelected = loc.code === locale;
              return (
                <button
                  key={loc.code}
                  type="button"
                  onClick={() => handleSelect(loc.code)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    width: '100%',
                    padding: '8px 12px',
                    borderRadius: '8px',
                    background: isSelected ? 'rgba(47, 129, 247, 0.14)' : 'transparent',
                    border: isSelected ? '1px solid rgba(47, 129, 247, 0.25)' : '1px solid transparent',
                    color: isSelected ? 'var(--color-primary, #2F81F7)' : 'var(--color-text, #F5F7FA)',
                    fontSize: '0.84rem',
                    fontWeight: isSelected ? 700 : 500,
                    cursor: 'pointer',
                    transition: 'all 0.15s ease'
                  }}
                  onMouseEnter={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'rgba(255, 255, 255, 0.05)';
                    }
                  }}
                  onMouseLeave={(e) => {
                    if (!isSelected) {
                      e.currentTarget.style.background = 'transparent';
                    }
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <span style={{ fontSize: '1.2rem', lineHeight: 1 }}>{loc.flag}</span>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: isRTL ? 'flex-end' : 'flex-start' }}>
                      <span style={{ fontSize: '0.86rem', fontWeight: 600 }}>{loc.nativeName}</span>
                      <span style={{ fontSize: '0.72rem', color: 'var(--color-text-secondary, #B6C2CF)' }}>{loc.name}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    {loc.dir === 'rtl' && (
                      <span style={{ fontSize: '0.65rem', padding: '1px 5px', borderRadius: '4px', background: 'rgba(255, 255, 255, 0.08)', color: 'var(--color-text-secondary, #B6C2CF)' }}>
                        RTL
                      </span>
                    )}
                    {isSelected && <Check size={16} color="var(--color-primary, #2F81F7)" />}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
