import { useTranslation } from 'react-i18next'
import { formatVND } from '../../../../utils/currencyFormat'
import styles from '../revenue.module.css'

export default function TodayHighlightCard({ summary, periodOptions, period, onPeriodChange }) {
  const { t } = useTranslation('clinic')

  return (
    <div className={styles.chartCard} style={{ marginBottom: 24 }}>
      <div className={styles.chartCardHeader}>
        <h3 className={styles.chartCardTitle}>{t('revenue.todayHighlight.title')}</h3>
        {periodOptions ? (
          <div className={styles.periodTabs}>
            {periodOptions.map((opt) => (
              <button
                key={opt.key}
                className={`${styles.periodTab} ${period === opt.key ? styles.periodTabActive : ''}`}
                onClick={() => onPeriodChange(opt.key)}
              >
                {opt.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>
      <div className={styles.todayHighlight}>
        <div className={styles.todayHighlightHeader}>
          <p className={styles.todayHighlightTitle}>{t('revenue.todayHighlight.title')}</p>
          <p className={styles.todayHighlightAmount}>{formatVND(summary?.totalRevenue || 0)}</p>
          <p className={styles.todayHighlightSubtitle}>{t('revenue.todayHighlight.subtitle')}</p>
        </div>
        <div className={styles.todayHighlightStats}>
          <div className={styles.todayStatBlock}>
            <p className={styles.todayStatLabel}>{t('revenue.todayHighlight.paidLabel')}</p>
            <p className={styles.todayStatValue}>{summary?.totalPaidInvoices || 0}</p>
          </div>
          <div className={styles.todayStatBlock}>
            <p className={styles.todayStatLabel}>{t('revenue.todayHighlight.unpaidLabel')}</p>
            <p className={styles.todayStatValue}>{summary?.totalUnpaidInvoices || 0}</p>
          </div>
        </div>
        <p className={styles.todayHighlightHint}>{t('revenue.todayHighlight.hint')}</p>
      </div>
    </div>
  )
}
