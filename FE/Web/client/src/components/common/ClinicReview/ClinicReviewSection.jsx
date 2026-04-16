import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { getClientInstance } from '../../../services/apiClient'
import { getClinicByIdApi } from '../../../services/clinicService'
import { getClinicReviewsApi } from '../../../services/clinicReviewService'
import { getMyPetsApi } from '../../../services/petService'
import { getMedicalByPetIdApi } from '../../../services/medicalService'
import { useAuth } from '../../../hooks/client/AuthContext'
import { getServiceLabel } from '../../../utils/enumLabel'
import ClinicRatingSummary from './ClinicRatingSummary'
import ClinicReviewForm from './ClinicReviewForm'
import ClinicReviewList from './ClinicReviewList'
import styles from './ClinicReviewSection.module.css'

const PAGE_SIZE = 5

const extractItems = (payload) => {
  if (Array.isArray(payload?.items)) return payload.items
  if (Array.isArray(payload?.data)) return payload.data
  if (Array.isArray(payload)) return payload
  return []
}

const formatExamDateForLabel = (value, locale) => {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toLocaleDateString(locale)
}

export default function ClinicReviewSection({ clinicId, showForm = true }) {
  const { t, i18n } = useTranslation()
  const { userProfile, token } = useAuth()
  const locale = i18n.language === 'en' ? 'en-US' : 'vi-VN'
  const isLoggedIn = Boolean(token)

  const [clinicSummary, setClinicSummary] = useState({ avgRating: 0, totalReviews: 0 })
  const [reviews, setReviews] = useState([])
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [loadingList, setLoadingList] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [eligibleRecords, setEligibleRecords] = useState([])
  const [loadingEligible, setLoadingEligible] = useState(false)
  const [refreshKey, setRefreshKey] = useState(0)

  // Load summary (clinic.avgRating + totalReviews) từ BE.
  const loadClinicSummary = useCallback(async () => {
    if (!clinicId) return
    try {
      const clinic = await getClinicByIdApi(getClientInstance(), clinicId)
      if (!clinic) return
      setClinicSummary({
        avgRating: Number(clinic.avgRating) || 0,
        totalReviews: Number(clinic.totalReviews) || 0,
      })
    } catch {
      // Giữ state cũ nếu fail — summary chỉ là hiển thị phụ.
    }
  }, [clinicId])

  // Load danh sách review (paginated).
  const loadReviews = useCallback(
    async (targetPage = 1, { append = false } = {}) => {
      if (!clinicId) return
      try {
        if (append) setLoadingMore(true)
        else setLoadingList(true)

        const payload = await getClinicReviewsApi(
          getClientInstance(),
          clinicId,
          targetPage,
          PAGE_SIZE,
        )
        const items = extractItems(payload)
        const meta = payload?.meta || {}
        const nextTotalPages = Number(meta.totalPages) || 1

        setTotalPages(nextTotalPages)
        setPage(targetPage)
        setReviews((prev) => (append ? [...prev, ...items] : items))
      } catch {
        if (!append) setReviews([])
      } finally {
        setLoadingList(false)
        setLoadingMore(false)
      }
    },
    [clinicId],
  )

  // Tìm các medical record của user đã hoàn thành tại clinic này và chưa review.
  const loadEligibleRecords = useCallback(async () => {
    if (!showForm || !clinicId || !isLoggedIn || !userProfile?.id) {
      setEligibleRecords([])
      return
    }
    try {
      setLoadingEligible(true)
      const pets = await getMyPetsApi(getClientInstance()).catch(() => [])
      const petList = Array.isArray(pets) ? pets : []

      if (petList.length === 0) {
        setEligibleRecords([])
        return
      }

      const recordLists = await Promise.all(
        petList.map((pet) =>
          getMedicalByPetIdApi(getClientInstance(), pet?.id, 1, 200)
            .then((resp) => ({ pet, items: extractItems(resp) }))
            .catch(() => ({ pet, items: [] })),
        ),
      )

      const eligible = []
      recordLists.forEach(({ pet, items }) => {
        items.forEach((record) => {
          const recordClinicId =
            record?.clinic?.id || record?.clinicId || record?.appointment?.clinic?.id
          const hasConclusion = Boolean(record?.conclusion)
          const alreadyReviewed = Boolean(record?.isReview)

          if (
            String(recordClinicId || '') === String(clinicId) &&
            hasConclusion &&
            !alreadyReviewed
          ) {
            const serviceName =
              getServiceLabel(record?.name, record?.name) || record?.name || ''
            const petName = pet?.name || record?.petName || ''
            const dateText = formatExamDateForLabel(record?.createdAt, locale)

            const label = [petName, serviceName, dateText].filter(Boolean).join(' • ')
            eligible.push({ id: record.id, label: label || record.id })
          }
        })
      })

      setEligibleRecords(eligible)
    } catch {
      setEligibleRecords([])
    } finally {
      setLoadingEligible(false)
    }
  }, [clinicId, isLoggedIn, locale, showForm, userProfile?.id])

  useEffect(() => {
    loadClinicSummary()
    loadReviews(1, { append: false })
    loadEligibleRecords()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [clinicId, refreshKey, userProfile?.id, isLoggedIn])

  const hasMore = useMemo(() => page < totalPages, [page, totalPages])

  const handleLoadMore = () => {
    if (loadingMore || !hasMore) return
    loadReviews(page + 1, { append: true })
  }

  const handleSubmitted = () => {
    setRefreshKey((prev) => prev + 1)
  }

  if (!clinicId) return null

  return (
    <section className={styles.section} id="clinic-review-section">
      <div className={styles.container}>
        <div>
          <h2 className={styles.sectionTitle}>
            {t('pages.home.homePageClinic.reviewSection.title')}
          </h2>
          <p className={styles.sectionSubtitle}>
            {t('pages.home.homePageClinic.reviewSection.subtitle')}
          </p>
        </div>

        <ClinicRatingSummary
          avgRating={clinicSummary.avgRating}
          totalReviews={clinicSummary.totalReviews}
        />

        {showForm ? (
          <ClinicReviewForm
            clinicId={clinicId}
            isLoggedIn={isLoggedIn}
            eligibleRecords={eligibleRecords}
            loadingEligible={loadingEligible}
            onSubmitted={handleSubmitted}
          />
        ) : null}

        <ClinicReviewList
          reviews={reviews}
          loading={loadingList}
          hasMore={hasMore}
          onLoadMore={handleLoadMore}
          loadingMore={loadingMore}
        />
      </div>
    </section>
  )
}
