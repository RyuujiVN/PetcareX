import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import StarRating from './StarRating'
import { maskReviewerName } from '../../../services/clinicReviewService'
import styles from './ClinicReviewSection.module.css'

const COMPACT_CONTENT_LIMIT = 180

const truncateReviewContent = (content, maxLength = COMPACT_CONTENT_LIMIT) => {
  const normalized = String(content || '').trim()
  if (normalized.length <= maxLength) {
    return normalized
  }

  const sliced = normalized.slice(0, maxLength)
  const lastSpaceIndex = sliced.lastIndexOf(' ')
  const safeCut = lastSpaceIndex > Math.floor(maxLength * 0.6) ? lastSpaceIndex : maxLength
  return `${sliced.slice(0, safeCut).trim()}...`
}

const formatDate = (value, locale) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(locale)
}

export default function ClinicReviewItem({ review, compact = false }) {
  const { t, i18n } = useTranslation()
  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN'
  const [expanded, setExpanded] = useState(false)

  const user = review?.user || {}
  const displayNameRaw = user.fullName || t('pages.home.homePageClinic.reviewSection.anonymousReviewer')
  const displayName = maskReviewerName(displayNameRaw) || displayNameRaw
  const avatarUrl = user.avatarUrl || ''
  const initials = String(displayNameRaw || 'U').trim().charAt(0).toUpperCase()
  const content = String(review?.content || '').trim()
  const shouldTruncate = compact && content.length > COMPACT_CONTENT_LIMIT
  const previewContent = shouldTruncate && !expanded ? truncateReviewContent(content) : content

  return (
    <div className={`${styles.item} ${compact ? styles.itemCompact : ''}`}>
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt={displayName}
          className={`${styles.itemAvatar} ${compact ? styles.itemAvatarCompact : ''}`}
        />
      ) : (
        <div
          className={`${styles.itemAvatarFallback} ${compact ? styles.itemAvatarFallbackCompact : ''}`}
          aria-hidden="true"
        >
          {initials}
        </div>
      )}

      <div className={`${styles.itemBody} ${compact ? styles.itemBodyCompact : ''}`}>
        <div className={styles.itemHeader}>
          <span className={styles.itemName}>{displayName}</span>
          <StarRating value={review?.rating || 0} readonly size="sm" />
          <span className={styles.itemDate}>{formatDate(review?.createdAt, locale)}</span>
        </div>

        {content ? (
          <>
            <p className={`${styles.itemContent} ${compact ? styles.itemContentCompact : ''}`}>
              {previewContent}
            </p>

            {shouldTruncate ? (
              <button
                type="button"
                className={styles.itemExpandButton}
                onClick={() => setExpanded((prev) => !prev)}
              >
                {expanded
                  ? t('pages.home.homePageClinic.reviewSection.showLess', { defaultValue: 'Thu gọn' })
                  : t('pages.home.homePageClinic.reviewSection.showMore', { defaultValue: 'Xem thêm' })}
              </button>
            ) : null}
          </>
        ) : null}
      </div>
    </div>
  )
}
