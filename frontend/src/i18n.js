import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import fi from './locales/fi.json';
import en from './locales/en.json';

const resources = {
  fi: { translation: fi },
  en: { translation: en },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'fi',
    supportedLngs: ['fi', 'en'],
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage'],
      caches: ['localStorage'],
      lookupLocalStorage: 'katsaus_lang',
    },
  });

function updateDocumentLang(lng) {
  if (document.documentElement) {
    document.documentElement.lang = lng === 'en' ? 'en' : 'fi';
  }
}

updateDocumentLang(i18n.language);
i18n.on('languageChanged', updateDocumentLang);

export default i18n;
