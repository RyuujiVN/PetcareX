import { Spin } from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useAdminRevenue from '../../../../hooks/admin/useAdminRevenue'
import AdminRecentInvoicesTable from './components/AdminRecentInvoicesTable'
import AdminRevenueChart from './components/AdminRevenueChart'
import AdminRevenueKPICards from './components/AdminRevenueKPICards'
import ClinicRevenueRankingTable from './components/ClinicRevenueRankingTable'
import styles from './adminRevenue.module.css'

export default function AdminRevenue() {
  const { t } = useTranslation('admin')
  const {
    loading,
    error,
    period,
    setPeriod,
    invoiceFilter,
    setInvoiceFilter,
    clinicSearch,
    setClinicSearch,
    fetchAdminRevenue,
    summary,
    dailyRevenue,
    clinicRanking,
    recentInvoices,
    hasRevenueData,
    PERIOD_KEYS,
  } = useAdminRevenue()

  useEffect(() => {
    fetchAdminRevenue()
  }, [fetchAdminRevenue])

  const periodOptions = [
    { key: PERIOD_KEYS.TODAY, label: t('revenue.period.today') },
    { key: PERIOD_KEYS.WEEK, label: t('revenue.period.week') },
    { key: PERIOD_KEYS.MONTH, label: t('revenue.period.month') },
    { key: PERIOD_KEYS.YEAR, label: t('revenue.period.year') },
  ]

  if (loading) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.loadingWrapper}>
          <Spin size="large" tip={t('revenue.loading')} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className={styles.pageWrapper}>
        <div className={styles.emptyWrapper}>
          <span className={styles.emptyText}>{error}</span>
        </div>
      </div>
    )
  }

  return (
    <div className={styles.pageWrapper}>
      {/* Header */}
      <div className={styles.pageHeader}>
        <h1 className={styles.pageTitle}>{t('revenue.pageTitle')}</h1>
        <p className={styles.pageSubtitle}>{t('revenue.pageSubtitle')}</p>
      </div>

      {/* KPI Cards */}
      <AdminRevenueKPICards summary={summary} />

      {/* Revenue Chart */}
      <AdminRevenueChart
        dailyRevenue={dailyRevenue}
        periodOptions={periodOptions}
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* Clinic Revenue Ranking */}
      <ClinicRevenueRankingTable
        clinicRanking={clinicRanking}
        clinicSearch={clinicSearch}
        onSearchChange={setClinicSearch}
      />

      {/* Recent Invoices */}
      <AdminRecentInvoicesTable
        invoices={recentInvoices}
        invoiceFilter={invoiceFilter}
        onFilterChange={setInvoiceFilter}
      />
    </div>
  )
}
