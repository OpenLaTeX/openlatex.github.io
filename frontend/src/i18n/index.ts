import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import { storage } from '../lib/storage';
import { defaultLanguage, resolveLanguage, resources } from './translations';

void i18n.use(initReactI18next).init({
  resources,
  lng: resolveLanguage(storage.language()),
  fallbackLng: defaultLanguage,
  interpolation: { escapeValue: false }
});

i18n.on('languageChanged', (language) => {
  const value = resolveLanguage(language);
  storage.setLanguage(value);
  document.documentElement.lang = value;
});

document.documentElement.lang = resolveLanguage(i18n.language);

export default i18n;
