import React from 'react';
import { useLocale } from '../contexts/LanguageContext';

const LanguageSwitch: React.FC = () => {
  const { language, setLanguage } = useLocale();

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="px-3 py-1 text-sm font-medium rounded-md hover:bg-gray-100 dark:hover:bg-gray-700"
    >
      {language === 'zh' ? '英文' : 'zh'}
    </button>
  );
};

export default LanguageSwitch; 