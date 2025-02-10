import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { translations } from '../locales/translations';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        translation: translations.en,
      },
      zh: {
        translation: translations.zh,
      },
    },
    lng: localStorage.getItem('language') || 'zh', // 默认语言
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n; 