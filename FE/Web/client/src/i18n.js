import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import viClient from './locales/client/vi.json';
import enClient from './locales/client/en.json';
import viClinic from './locales/clinic/vi.json';
import enClinic from './locales/clinic/en.json';
import viVet from './locales/vererianrian/vi.json';
import enVet from './locales/vererianrian/en.json';
import { getInitialLanguage } from './constants/languageStorage';

i18n.use(initReactI18next).init({
  resources: {
    vi: {
      client: viClient,
      clinic: viClinic,
      vererianrian: viVet,
    },
    en: {
      client: enClient,
      clinic: enClinic,
      vererianrian: enVet,
    },
  },
  defaultNS: 'client',
  fallbackNS: 'client',
  lng: getInitialLanguage(),
  fallbackLng: 'vi',
  interpolation: { escapeValue: false },
});

export default i18n;
