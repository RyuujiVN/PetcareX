import { Spin } from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useAdminActivity from '../../../../hooks/admin/useAdminActivity'
import ActivityKPICards from './components/ActivityKPICards'
import ClinicActivityRankingTable from './components/ClinicActivityRankingTable'
import styles from './activity.module.css'

export default function AdminActivity() {
  const { t } = useTranslation('admin')
  const {
    loading,
    error,
    period,
    setPeriod,
    clinicSearch,
    setClinicSearch,
    fetchActivity,
    summary,
    clinicRanking,
    PERIOD_KEYS,
  } = useAdminActivity()

  useEffect(() => {
    fetchActivity()
  }, [fetchActivity])

  const periodOptions = [
    { key: PERIOD_KEYS.THIS_MONTH, label: t('activity.period.thisMonth') },
    { key: PERIOD_KEYS.LAST_MONTH, label: t('activity.period.lastMonth') },
    { key: PERIOD_KEYS.THIS_QUARTER, label: t('activity.period.thisQuarter') },
  ]

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.loadingWrapper}>
          <Spin size="large" tip={t('activity.loading')} />
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageWrapper}>
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('activity.pageTitle')}</h1>
        <p className={styles.pageSubtitle}>{t('activity.pageSubtitle')}</p>
      </div>

      {error ? (
        <div className={styles.emptyWrapper}>
          <span className={styles.emptyText}>{error}</span>
        </div>
      ) : null}

      <ActivityKPICards summary={summary} />

      <ClinicActivityRankingTable
        clinicRanking={clinicRanking}
        clinicSearch={clinicSearch}
        onSearchChange={setClinicSearch}
        periodOptions={periodOptions}
        period={period}
        onPeriodChange={setPeriod}
      />
    </div>
  )
}
