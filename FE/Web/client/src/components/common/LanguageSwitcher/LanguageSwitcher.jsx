import { useTranslation } from 'react-i18next';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();
  const isVietnamese = i18n.language?.startsWith('vi');

  const toggle = () => {
    const next = isVietnamese ? 'en' : 'vi';
    i18n.changeLanguage(next);
    localStorage.setItem('lang', next);
  };

  return (
    <button
      type="button"
      className="language-switcher-btn"
      onClick={toggle}
      aria-label={isVietnamese ? t('languageSwitcher.ariaSwitchToEnglish') : t('languageSwitcher.ariaSwitchToVietnamese')}
      title={isVietnamese ? t('languageSwitcher.switchToEnglish') : t('languageSwitcher.switchToVietnamese')}
    >
      {isVietnamese ? t('languageSwitcher.switchToEnglish') : t('languageSwitcher.switchToVietnamese')}
    </button>
  );
};

export default LanguageSwitcher;
