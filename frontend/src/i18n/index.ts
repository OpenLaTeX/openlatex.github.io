import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '../lib/storage';
import { translations } from './translations';

void i18n.use(initReactI18next).init({
  resources: {
    fr: { translation: translations.fr },
    en: { translation: translations.en }
  },
  lng: storage.language(),
  fallbackLng: 'fr',
  interpolation: { escapeValue: false }
});

i18n.on('languageChanged', (language) => {
  const value = language === 'en' ? 'en' : 'fr';
  storage.setLanguage(value);
  document.documentElement.lang = value;
});

document.documentElement.lang = i18n.language === 'en' ? 'en' : 'fr';

export default i18n;
