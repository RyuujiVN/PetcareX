import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Spin } from 'antd'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import ClinicReviewItem from './ClinicReviewItem'
import styles from './ClinicReviewSection.module.css'

const CAROUSEL_ITEMS_PER_PAGE = 4

export default function ClinicReviewList({
  reviews = [],
  loading = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  carousel = false,
}) {
  const { t } = useTranslation()
  const firstReviewIdRef = useRef(null)
  const [pageIndex, setPageIndex] = useState(0)
  const [pendingAdvance, setPendingAdvance] = useState(false)

  const pageCount = useMemo(() => {
    if (!carousel) return 1
    return Math.max(1, Math.ceil(reviews.length / CAROUSEL_ITEMS_PER_PAGE))
  }, [carousel, reviews.length])

  const visibleReviews = useMemo(() => {
    if (!carousel) return reviews
    const start = pageIndex * CAROUSEL_ITEMS_PER_PAGE
    return reviews.slice(start, start + CAROUSEL_ITEMS_PER_PAGE)
  }, [carousel, pageIndex, reviews])

  useEffect(() => {
    if (!carousel) return
    if (pageIndex > pageCount - 1) {
      setPageIndex(Math.max(0, pageCount - 1))
    }
  }, [carousel, pageCount, pageIndex])

  useEffect(() => {
    if (!carousel) return
    const firstId = reviews[0]?.id || null
    if (firstId && firstReviewIdRef.current !== firstId) {
      setPageIndex(0)
    }
    firstReviewIdRef.current = firstId
  }, [carousel, reviews])

  useEffect(() => {
    if (!carousel || !pendingAdvance || loadingMore) return
    setPendingAdvance(false)
    setPageIndex((current) => (current < pageCount - 1 ? current + 1 : current))
  }, [carousel, loadingMore, pageCount, pendingAdvance])

  const handlePrev = () => {
    if (pageIndex === 0) return
    setPageIndex((current) => Math.max(0, current - 1))
  }

  const handleNext = () => {
    if (pageIndex < pageCount - 1) {
      setPageIndex((current) => current + 1)
      return
    }

    if (hasMore && !loadingMore) {
      setPendingAdvance(true)
      onLoadMore?.()
    }
  }

  if (loading && reviews.length === 0) {
    return (
      <div className={styles.listEmpty}>
        <Spin />
      </div>
    )
  }

  if (!loading && reviews.length === 0) {
    return (
      <div className={styles.listEmpty}>
        {t('pages.home.homePageClinic.reviewSection.emptyList')}
      </div>
    )
  }

  if (carousel) {
    const isPrevDisabled = pageIndex === 0
    const isNextDisabled = loadingMore || (!hasMore && pageIndex >= pageCount - 1)

    return (
      <div className={styles.carouselWrapper}>
        <div className={styles.carouselStage}>
          <button
            type="button"
            className={`${styles.carouselNavButton} ${styles.carouselNavLeft}`}
            onClick={handlePrev}
            disabled={isPrevDisabled}
            aria-label={t('pages.home.homePageClinic.reviewSection.previousAria', {
              defaultValue: 'Xem bình luận trước',
            })}
          >
            <LeftOutlined />
          </button>

          <div className={styles.carouselGrid}>
            {visibleReviews.map((review) => (
              <div key={review.id} className={styles.carouselItem}>
                <ClinicReviewItem review={review} compact />
              </div>
            ))}
          </div>

          <button
            type="button"
            className={`${styles.carouselNavButton} ${styles.carouselNavRight}`}
            onClick={handleNext}
            disabled={isNextDisabled}
            aria-label={t('pages.home.homePageClinic.reviewSection.nextAria', {
              defaultValue: 'Xem bình luận tiếp theo',
            })}
          >
            <RightOutlined />
          </button>
        </div>

        {loadingMore ? (
          <div className={styles.carouselLoadingMore}>
            <Spin size="small" />
          </div>
        ) : null}
      </div>
    )
  }

  return (
    <>
      <div className={styles.list}>
        {reviews.map((review) => (
          <ClinicReviewItem key={review.id} review={review} />
        ))}
      </div>

      {hasMore ? (
        <div className={styles.loadMoreWrapper}>
          <Button onClick={onLoadMore} loading={loadingMore}>
            {t('pages.home.homePageClinic.reviewSection.loadMore')}
          </Button>
        </div>
      ) : null}
    </>
  )
}
