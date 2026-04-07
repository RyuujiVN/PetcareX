import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import viClient from './locales/client/vi.json';
import enClient from './locales/client/en.json';
import viClinic from './locales/clinic/vi.json';
import enClinic from './locales/clinic/en.json';
import { getInitialLanguage } from './constants/languageStorage';

i18n.use(initReactI18next).init({
  resources: {
    vi: {
      client: viClient,
      clinic: viClinic,
    },
    en: {
      client: enClient,
      clinic: enClinic,
    },
  },
  defaultNS: 'client',
  fallbackNS: 'client',
  lng: getInitialLanguage(),
  fallbackLng: 'vi',
  interpolation: { escapeValue: false },
});

export default i18n;
