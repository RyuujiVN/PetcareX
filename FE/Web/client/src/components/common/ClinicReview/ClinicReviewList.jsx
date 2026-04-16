import { Button, Spin } from 'antd'
import { useTranslation } from 'react-i18next'
import ClinicReviewItem from './ClinicReviewItem'
import styles from './ClinicReviewSection.module.css'

export default function ClinicReviewList({
  reviews = [],
  loading = false,
  hasMore = false,
  onLoadMore,
  loadingMore = false,
}) {
  const { t } = useTranslation()

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
