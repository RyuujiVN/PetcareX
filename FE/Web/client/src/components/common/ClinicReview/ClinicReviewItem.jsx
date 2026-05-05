import { Modal } from 'antd'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import StarRating from './StarRating'
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
  const [isModalOpen, setIsModalOpen] = useState(false)

  const user = review?.user || {}
  const displayNameRaw = user.fullName || t('pages.home.homePageClinic.reviewSection.anonymousReviewer')
  const displayName = displayNameRaw
  const avatarUrl = user.avatarUrl || ''
  const initials = String(displayNameRaw || 'U').trim().charAt(0).toUpperCase()
  const content = String(review?.content || '').trim()
  const shouldTruncate = compact && content.length > COMPACT_CONTENT_LIMIT
  const previewContent = shouldTruncate ? truncateReviewContent(content) : content

  const handleOpenModal = () => setIsModalOpen(true)
  const handleCloseModal = () => setIsModalOpen(false)

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

            {compact ? (
              <div className={styles.itemExpandSlot}>
                {shouldTruncate ? (
                  <button
                    type="button"
                    className={styles.itemExpandButton}
                    onClick={handleOpenModal}
                  >
                    {t('pages.home.homePageClinic.reviewSection.showMore', { defaultValue: 'Xem thêm' })}
                  </button>
                ) : null}
              </div>
            ) : null}
          </>
        ) : null}
      </div>

      {shouldTruncate ? (
        <Modal
          open={isModalOpen}
          onCancel={handleCloseModal}
          footer={null}
          title={t('pages.home.homePageClinic.reviewSection.modalTitle', {
            defaultValue: 'Đánh giá từ khách hàng',
          })}
        >
          <div className={styles.reviewModalHeader}>
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className={styles.reviewModalAvatar}
              />
            ) : (
              <div className={styles.reviewModalAvatarFallback} aria-hidden="true">
                {initials}
              </div>
            )}

            <div>
              <div className={styles.reviewModalName}>{displayName}</div>
              <div className={styles.reviewModalMeta}>
                <StarRating value={review?.rating || 0} readonly size="sm" />
                <span>{formatDate(review?.createdAt, locale)}</span>
              </div>
            </div>
          </div>

          <p className={styles.reviewModalContent}>{content}</p>
        </Modal>
      ) : null}
    </div>
  )
}
