import { useTranslation } from 'react-i18next'
import StarRating from './StarRating'
import { maskReviewerName } from '../../../services/clinicReviewService'
import styles from './ClinicReviewSection.module.css'

const formatDate = (value, locale) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(locale)
}

export default function ClinicReviewItem({ review }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN'

  const user = review?.user || {}
  const displayNameRaw = user.fullName || t('pages.home.homePageClinic.reviewSection.anonymousReviewer')
  const displayName = maskReviewerName(displayNameRaw) || displayNameRaw
  const avatarUrl = user.avatarUrl || ''
  const initials = String(displayNameRaw || 'U').trim().charAt(0).toUpperCase()

  return (
    <div className={styles.item}>
      {avatarUrl ? (
        <img src={avatarUrl} alt={displayName} className={styles.itemAvatar} />
      ) : (
        <div className={styles.itemAvatarFallback} aria-hidden="true">
          {initials}
        </div>
      )}

      <div className={styles.itemBody}>
        <div className={styles.itemHeader}>
          <span className={styles.itemName}>{displayName}</span>
          <StarRating value={review?.rating || 0} readonly size="sm" />
          <span className={styles.itemDate}>{formatDate(review?.createdAt, locale)}</span>
        </div>

        {review?.content ? (
          <p className={styles.itemContent}>{review.content}</p>
        ) : null}
      </div>
    </div>
  )
}
