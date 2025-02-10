import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import i18n from './i18n';

type Language = 'en' | 'zh';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => 
    (localStorage.getItem('language') as Language) || 'zh'
  );

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('language', lang);
    i18n.changeLanguage(lang);
  }, []);

  useEffect(() => {
    i18n.changeLanguage(language);
  }, []);

  return (
    <LanguageContext.Provider value={{ language, setLanguage }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// 导出一个便捷的 hook，用于获取翻译函数和当前语言
export const useLocale = () => {
  const { t } = useTranslation();
  const { language, setLanguage } = useLanguage();
  return { t, language, setLanguage };
}; 