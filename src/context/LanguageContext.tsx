import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { Language } from '../types';
import { TRANSLATIONS, Translations } from '../i18n/translations';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: Translations;
  isRTL: boolean;
  dir: 'ltr' | 'rtl';
}

const STORAGE_LANG_KEY = 'lyka_editorial_language';

const LanguageContext = createContext<LanguageContextType | null>(null);

const getPersistedLanguage = (): Language => {
  try {
    const stored = localStorage.getItem(STORAGE_LANG_KEY);
    if (stored === 'en' || stored === 'ar' || stored === 'ta' || stored === 'tanglish') {
      return stored;
    }
  } catch {
    // ignore
  }
  return 'en';
};

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => getPersistedLanguage());

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_LANG_KEY, lang);
    } catch {
      // ignore
    }
  }, []);

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'ar' : language === 'ar' ? 'ta' : language === 'ta' ? 'tanglish' : 'en');
  }, [language, setLanguage]);

  const isRTL = language === 'ar';
  const dir: 'ltr' | 'rtl' = isRTL ? 'rtl' : 'ltr';

  useEffect(() => {
    document.documentElement.setAttribute('dir', dir);
    document.documentElement.setAttribute('lang', language);
    if (language === 'ar') {
      document.title = 'لايكا العقارية — دار النشر العقارية الفاخرة والمقتنيات السيادية في دبي';
    } else if (language === 'ta') {
      document.title = 'லைகா ரியாலிட்டி — துபாய் பிரீமியம் சொகுசு இல்லங்கள்';
    } else if (language === 'tanglish') {
      document.title = 'LYKA Realty — Dubai Prime Properties & Tanglish Concierge';
    } else {
      document.title = 'LYKA Realty — Haute Real Estate Editorial & Prime Dubai Residences';
    }
  }, [language, dir]);

  const t = useMemo(() => (TRANSLATIONS as Record<string, Translations>)[language] ?? TRANSLATIONS.en, [language]);

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      toggleLanguage,
      t,
      isRTL,
      dir
    }),
    [language, setLanguage, toggleLanguage, t, isRTL, dir]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export function useLanguage(): LanguageContextType {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
