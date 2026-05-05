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
  const [startIndex, setStartIndex] = useState(0)
  const [pendingAdvance, setPendingAdvance] = useState(false)
  const [slideDirection, setSlideDirection] = useState('next')

  const maxStartIndex = useMemo(() => {
    if (!carousel) return 0
    return Math.max(0, reviews.length - CAROUSEL_ITEMS_PER_PAGE)
  }, [carousel, reviews.length])

  const visibleReviews = useMemo(() => {
    if (!carousel) return reviews
    return reviews.slice(startIndex, startIndex + CAROUSEL_ITEMS_PER_PAGE)
  }, [carousel, reviews, startIndex])

  useEffect(() => {
    if (!carousel) return
    if (startIndex > maxStartIndex) {
      setStartIndex(maxStartIndex)
    }
  }, [carousel, maxStartIndex, startIndex])

  useEffect(() => {
    if (!carousel) return
    const firstId = reviews[0]?.id || null
    if (firstId && firstReviewIdRef.current !== firstId) {
      setStartIndex(0)
    }
    firstReviewIdRef.current = firstId
  }, [carousel, reviews])

  useEffect(() => {
    if (!carousel || !pendingAdvance || loadingMore) return
    setPendingAdvance(false)
    setSlideDirection('next')
    setStartIndex((current) => {
      const nextMax = Math.max(0, reviews.length - CAROUSEL_ITEMS_PER_PAGE)
      return current < nextMax ? current + 1 : current
    })
  }, [carousel, loadingMore, pendingAdvance, reviews.length])

  const handlePrev = () => {
    if (startIndex === 0) return
    setSlideDirection('prev')
    setStartIndex((current) => Math.max(0, current - 1))
  }

  const handleNext = () => {
    if (startIndex < maxStartIndex) {
      setSlideDirection('next')
      setStartIndex((current) => Math.min(maxStartIndex, current + 1))
      return
    }

    if (hasMore && !loadingMore) {
      setSlideDirection('next')
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
    const isPrevDisabled = startIndex === 0
    const isNextDisabled = loadingMore || (!hasMore && startIndex >= maxStartIndex)
    const carouselGridClassName = `${styles.carouselGrid} ${
      slideDirection === 'next' ? styles.carouselGridSlideNext : styles.carouselGridSlidePrev
    }`

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

          <div className={carouselGridClassName} key={`${startIndex}-${slideDirection}`}>
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
