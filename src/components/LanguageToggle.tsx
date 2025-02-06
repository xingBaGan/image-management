import React from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { Globe } from 'lucide-react';

const LanguageToggle: React.FC = () => {
  const { language, setLanguage } = useLanguage();

  const toggleLanguage = () => {
    setLanguage(language === 'en' ? 'zh' : 'en');
  };

  return (
    <button
      onClick={toggleLanguage}
      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg flex items-center space-x-1"
      title={language === 'en' ? '切换到中文' : 'Switch to English'}
    >
      <Globe size={20} />
      <span className="text-sm">{language.toUpperCase()}</span>
    </button>
  );
};

export default LanguageToggle; 