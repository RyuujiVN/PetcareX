import { LeftOutlined, RightOutlined } from '@ant-design/icons'
import { Button, Spin } from 'antd'
import { useRef } from 'react'
import { useTranslation } from 'react-i18next'
import ClinicReviewItem from './ClinicReviewItem'
import styles from './ClinicReviewSection.module.css'

export default function ClinicReviewList({
  reviews = [],
  loading = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
  carousel = false,
}) {
  const { t } = useTranslation()
  const viewportRef = useRef(null)
  const dragStateRef = useRef({ isDown: false, startX: 0, scrollLeft: 0 })

  const scrollViewport = (direction) => {
    const viewport = viewportRef.current
    if (!viewport) return
    const distance = Math.max(viewport.clientWidth * 0.85, 280)
    viewport.scrollBy({
      left: direction === 'next' ? distance : -distance,
      behavior: 'smooth',
    })
  }

  const handleViewportScroll = () => {
    if (!carousel || !hasMore || loadingMore) {
      return
    }

    const viewport = viewportRef.current
    if (!viewport) return

    const nearEnd = viewport.scrollLeft + viewport.clientWidth >= viewport.scrollWidth - 48
    if (nearEnd) {
      onLoadMore?.()
    }
  }

  const stopDragging = () => {
    if (!carousel) return

    const viewport = viewportRef.current
    if (viewport) {
      viewport.classList.remove(styles.carouselDragging)
    }

    dragStateRef.current.isDown = false
  }

  const handleMouseDown = (event) => {
    if (!carousel) return

    const viewport = viewportRef.current
    if (!viewport) return

    dragStateRef.current = {
      isDown: true,
      startX: event.pageX,
      scrollLeft: viewport.scrollLeft,
    }

    viewport.classList.add(styles.carouselDragging)
  }

  const handleMouseMove = (event) => {
    if (!carousel) return

    const viewport = viewportRef.current
    const dragState = dragStateRef.current
    if (!viewport || !dragState.isDown) return

    event.preventDefault()
    const deltaX = event.pageX - dragState.startX
    viewport.scrollLeft = dragState.scrollLeft - deltaX
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
    return (
      <div className={styles.carouselWrapper}>
        <div className={styles.carouselControls}>
          <button
            type="button"
            className={styles.carouselControlButton}
            onClick={() => scrollViewport('prev')}
            aria-label={t('pages.home.homePageClinic.reviewSection.previousAria', {
              defaultValue: 'Xem bình luận trước',
            })}
          >
            <LeftOutlined />
          </button>

          <span className={styles.carouselHint}>
            {t('pages.home.homePageClinic.reviewSection.scrollHint', {
              defaultValue: 'Kéo sang trái/phải để xem thêm bình luận',
            })}
          </span>

          <button
            type="button"
            className={styles.carouselControlButton}
            onClick={() => scrollViewport('next')}
            aria-label={t('pages.home.homePageClinic.reviewSection.nextAria', {
              defaultValue: 'Xem bình luận tiếp theo',
            })}
          >
            <RightOutlined />
          </button>
        </div>

        <div
          ref={viewportRef}
          className={styles.carouselViewport}
          onScroll={handleViewportScroll}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={stopDragging}
          onMouseLeave={stopDragging}
        >
          <div className={styles.carouselTrack}>
            {reviews.map((review) => (
              <div key={review.id} className={styles.carouselItem}>
                <ClinicReviewItem review={review} compact />
              </div>
            ))}
          </div>
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
