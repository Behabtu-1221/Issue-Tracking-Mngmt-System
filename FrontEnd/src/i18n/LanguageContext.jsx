import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import en from './locales/en';
import am from './locales/am';

const DICTIONARIES = { en, am };

export const AVAILABLE_LOCALES = [
  {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    shortLabel: 'EN',
    region: 'Ethiopia',
    countryCode: 'US',
    dir: 'ltr'
  },
  {
    code: 'am',
    name: 'Amharic',
    nativeName: 'አማርኛ',
    shortLabel: 'አማ',
    region: 'Ethiopia (ኢትዮጵያ)',
    countryCode: 'ET',
    dir: 'ltr'
  },
];

const STORAGE_KEY = 'itms_locale';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  // Initialize locale from storage or navigator
  const [locale, setLocale] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && DICTIONARIES[saved]) return saved;
      const navLang = navigator.language?.split('-')[0]?.toLowerCase();
      if (navLang && DICTIONARIES[navLang]) return navLang;
    } catch {
      // Ignore storage errors
    }
    return 'en';
  });

  const [backendOverrides, setBackendOverrides] = useState({});

  // Active locale definition
  const currentLocaleInfo = useMemo(() => {
    return AVAILABLE_LOCALES.find(l => l.code === locale) || AVAILABLE_LOCALES[0];
  }, [locale]);

  const direction = currentLocaleInfo.dir;
  const isRTL = direction === 'rtl';

  // Apply lang and dir to HTML document root
  useEffect(() => {
    try {
      document.documentElement.lang = locale;
      document.documentElement.dir = direction;
      document.documentElement.setAttribute('data-direction', direction);
    } catch (e) {
      console.warn('Could not set document direction:', e);
    }
  }, [locale, direction]);

  // Optional background sync with backend localization resources
  useEffect(() => {
    let isCancelled = false;

    const fetchBackendResources = async () => {
      try {
        const token = localStorage.getItem('itms_access_token') || sessionStorage.getItem('itms_access_token');
        if (!token) {
          if (!isCancelled) setBackendOverrides({});
          return;
        }

        // Fetch localizations from API
        const res = await fetch('/api/configuration/localizations?activeOnly=true', {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!res.ok) {
          if (!isCancelled) setBackendOverrides({});
          return;
        }

        const data = await res.json();
        const list = data.data || [];
        const matched = list.find(l => l.LanguageCode?.toLowerCase() === locale);
        if (matched?.LocalizationID) {
          const resResponse = await fetch(`/api/configuration/localizations/${matched.LocalizationID}/resources`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          if (resResponse.ok) {
            const resData = await resResponse.json();
            const resourceList = resData.data || [];
            const overrideMap = {};
            resourceList.forEach(r => {
              if (r.ResourceKey && r.ResourceValue && r.IsActive) {
                overrideMap[r.ResourceKey] = r.ResourceValue;
              }
            });
            if (!isCancelled) setBackendOverrides(overrideMap);
            return;
          }
        }
        if (!isCancelled) setBackendOverrides({});
      } catch {
        if (!isCancelled) setBackendOverrides({});
      }
    };

    fetchBackendResources();
    return () => { isCancelled = true; };
  }, [locale]);

  // Change language handler
  const changeLanguage = useCallback((newLocale) => {
    if (!DICTIONARIES[newLocale]) {
      console.warn(`Unsupported locale: ${newLocale}`);
      return;
    }
    setBackendOverrides({});
    setLocale(newLocale);
    try {
      localStorage.setItem(STORAGE_KEY, newLocale);
    } catch {
      // Storage unavailable
    }
  }, []);

  // Translation function t(key, params, fallback)
  const t = useCallback((key, paramsOrFallback = null, fallback = null) => {
    if (!key || typeof key !== 'string') return '';

    let params = {};
    let customFallback = null;

    if (typeof paramsOrFallback === 'string') {
      customFallback = paramsOrFallback;
    } else if (typeof paramsOrFallback === 'object' && paramsOrFallback !== null) {
      params = paramsOrFallback;
      if (typeof fallback === 'string') {
        customFallback = fallback;
      }
    }

    // 1. Check custom backend overrides
    if (backendOverrides[key]) {
      let text = backendOverrides[key];
      Object.keys(params).forEach(p => {
        text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
      });
      return text;
    }

    // 2. Resolve nested key in current locale
    const resolveKey = (dict, keyPath) => {
      if (!dict) return undefined;
      const parts = keyPath.split('.');
      let current = dict;
      for (const part of parts) {
        if (current === undefined || current === null) return undefined;
        current = current[part];
      }
      return typeof current === 'string' ? current : undefined;
    };

    let text = resolveKey(DICTIONARIES[locale], key);

    // 3. Fallback to English dictionary
    if (text === undefined && locale !== 'en') {
      text = resolveKey(DICTIONARIES.en, key);
    }

    // 4. Fallback to custom fallback string or key itself
    if (text === undefined) {
      text = customFallback !== null ? customFallback : key;
    }

    // 5. Interpolate params {name}, {count}, etc.
    if (typeof text === 'string' && Object.keys(params).length > 0) {
      Object.keys(params).forEach(p => {
        text = text.replace(new RegExp(`\\{${p}\\}`, 'g'), params[p]);
      });
    }

    return text;
  }, [locale, backendOverrides]);

  const value = useMemo(() => ({
    locale,
    direction,
    isRTL,
    availableLocales: AVAILABLE_LOCALES,
    currentLocale: currentLocaleInfo,
    changeLanguage,
    t
  }), [locale, direction, isRTL, currentLocaleInfo, changeLanguage, t]);

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useTranslation must be used within a LanguageProvider');
  }
  return context;
}

export default LanguageContext;
