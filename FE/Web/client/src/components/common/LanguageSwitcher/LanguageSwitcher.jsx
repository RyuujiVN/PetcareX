import { useTranslation } from 'react-i18next';
import { useEffect } from 'react';
import { getLanguageForScope, LANGUAGE_SCOPE, setLanguageForScope } from '../../../constants/languageStorage';
import './LanguageSwitcher.css';

const normalizeLanguage = (value) => (String(value || '').toLowerCase().startsWith('en') ? 'en' : 'vi');
const FLAG_BY_LANGUAGE = {
  vi: '/flagVN.png',
  en: '/flagel.png',
};

const LanguageSwitcher = ({ scope = LANGUAGE_SCOPE.client }) => {
  const { i18n, t } = useTranslation();
  const currentLanguage = normalizeLanguage(i18n.resolvedLanguage || i18n.language);
  const isVietnamese = currentLanguage === 'vi';
  const currentFlag = isVietnamese ? FLAG_BY_LANGUAGE.vi : FLAG_BY_LANGUAGE.en;
  const currentLanguageLabel = isVietnamese ? 'VI' : 'EN';

  useEffect(() => {
    const savedLanguage = getLanguageForScope(scope);
    if (savedLanguage !== currentLanguage) {
      i18n.changeLanguage(savedLanguage);
    }
  }, [scope, currentLanguage, i18n]);

  const toggle = () => {
    const next = isVietnamese ? 'en' : 'vi';
    i18n.changeLanguage(next);
    setLanguageForScope(scope, next);
  };

  return (
    <button
      type="button"
      className="language-switcher-btn"
      onClick={toggle}
      aria-label={isVietnamese ? t('languageSwitcher.ariaSwitchToEnglish') : t('languageSwitcher.ariaSwitchToVietnamese')}
      title={isVietnamese ? t('languageSwitcher.switchToEnglish') : t('languageSwitcher.switchToVietnamese')}
    >
      <img
        src={currentFlag}
        className="language-switcher-flag"
        alt={isVietnamese ? 'Vietnamese' : 'English'}
      />
      <span className="language-switcher-label">{currentLanguageLabel}</span>
    </button>
  );
};

export default LanguageSwitcher;
