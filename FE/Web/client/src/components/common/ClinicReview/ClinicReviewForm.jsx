import { Button, Select, message } from 'antd'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { getClientInstance } from '../../../services/apiClient'
import { createClinicReviewApi } from '../../../services/clinicReviewService'
import StarRating from './StarRating'
import styles from './ClinicReviewSection.module.css'

// Props:
//   clinicId         — id phòng khám đang xem
//   isLoggedIn       — user đang đăng nhập không
//   eligibleRecords  — [{ id, label }] các medical record có thể review (đã hoàn thành + chưa review + thuộc clinic này)
//   loadingEligible  — đang load eligible records
//   onSubmitted      — callback sau khi submit thành công (refresh list + summary + eligibleRecords)
export default function ClinicReviewForm({
  clinicId,
  isLoggedIn,
  eligibleRecords = [],
  loadingEligible = false,
  onSubmitted,
}) {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [selectedRecordId, setSelectedRecordId] = useState('')
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const recordOptions = useMemo(
    () =>
      eligibleRecords.map((record) => ({
        value: record.id,
        label: record.label,
      })),
    [eligibleRecords],
  )

  if (!isLoggedIn) {
    return (
      <div className={styles.formInfoBox}>
        {t('pages.home.homePageClinic.reviewSection.loginHint')}
        <button
          type="button"
          className={styles.formInfoBoxLink}
          onClick={() => navigate('/login')}
        >
          {t('pages.home.homePageClinic.reviewSection.loginCTA')}
        </button>
      </div>
    )
  }

  if (!loadingEligible && eligibleRecords.length === 0) {
    return (
      <div className={styles.formInfoBox}>
        {t('pages.home.homePageClinic.reviewSection.noEligibleRecord')}
      </div>
    )
  }

  const handleSubmit = async () => {
    if (!selectedRecordId) {
      message.warning(t('pages.home.homePageClinic.reviewSection.validation.recordRequired'))
      return
    }
    if (!rating) {
      message.warning(t('pages.home.homePageClinic.reviewSection.validation.ratingRequired'))
      return
    }

    try {
      setSubmitting(true)
      await createClinicReviewApi(getClientInstance(), {
        clinicId,
        medicalRecordId: selectedRecordId,
        rating,
        content,
      })
      message.success(t('pages.home.homePageClinic.reviewSection.submitSuccess'))
      setSelectedRecordId('')
      setRating(0)
      setContent('')
      if (typeof onSubmitted === 'function') {
        onSubmitted()
      }
    } catch (error) {
      message.error(error?.message || t('pages.home.homePageClinic.reviewSection.submitFailed'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className={styles.form}>
      <h3 className={styles.formTitle}>
        {t('pages.home.homePageClinic.reviewSection.formTitle')}
      </h3>

      <div className={styles.formField}>
        <label className={styles.formLabel}>
          {t('pages.home.homePageClinic.reviewSection.recordLabel')}
        </label>
        <Select
          value={selectedRecordId || undefined}
          onChange={setSelectedRecordId}
          options={recordOptions}
          loading={loadingEligible}
          placeholder={t('pages.home.homePageClinic.reviewSection.recordPlaceholder')}
          disabled={submitting || loadingEligible}
          style={{ width: '100%' }}
        />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>
          {t('pages.home.homePageClinic.reviewSection.ratingLabel')}
        </label>
        <StarRating value={rating} onChange={setRating} size="lg" allowClear={false} />
      </div>

      <div className={styles.formField}>
        <label className={styles.formLabel}>
          {t('pages.home.homePageClinic.reviewSection.contentLabel')}
        </label>
        <textarea
          className={styles.formTextarea}
          value={content}
          onChange={(event) => setContent(event.target.value)}
          placeholder={t('pages.home.homePageClinic.reviewSection.contentPlaceholder')}
          rows={4}
          disabled={submitting}
          maxLength={1000}
        />
        <span className={styles.formHint}>
          {t('pages.home.homePageClinic.reviewSection.contentHint')}
        </span>
      </div>

      <div className={styles.formActions}>
        <Button
          type="primary"
          onClick={handleSubmit}
          loading={submitting}
          disabled={!selectedRecordId || !rating}
        >
          {t('pages.home.homePageClinic.reviewSection.submitButton')}
        </Button>
      </div>
    </div>
  )
}
