import { useTranslation } from 'react-i18next'
import StarRating from './StarRating'
import styles from './ClinicReviewSection.module.css'

export default function ClinicRatingSummary({ avgRating = 0, totalReviews = 0 }) {
  const { t } = useTranslation()
  const rating = Number(avgRating) || 0
  const count = Number(totalReviews) || 0
  const hasReviews = count > 0

  return (
    <div className={styles.summary}>
      <div className={styles.summaryScore}>
        <span className={styles.summaryScoreValue}>
          {hasReviews ? rating.toFixed(1) : '—'}
        </span>
        <span className={styles.summaryScoreMax}>/ 5</span>
      </div>
      <div className={styles.summaryMeta}>
        <StarRating value={rating} readonly size="md" />
        <span className={styles.summaryMetaCount}>
          {hasReviews
            ? t('pages.home.homePageClinic.reviewSection.totalReviews', { count })
            : t('pages.home.homePageClinic.reviewSection.noReviewYet')}
        </span>
      </div>
    </div>
  )
}
