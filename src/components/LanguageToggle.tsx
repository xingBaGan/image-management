import React from 'react';
import { useLocale } from '../contexts/LanguageContext';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLocale();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1 text-sm font-medium text-gray-700 rounded-md dark:text-blue-300 dark:hover:bg-gray-700"
      title={language === 'zh' ? 'Switch to English' : '切换到中文'}
    >
      {language === 'zh' ? '中文' : 'English'}
    </button>
  );
};

export default LanguageToggle; 