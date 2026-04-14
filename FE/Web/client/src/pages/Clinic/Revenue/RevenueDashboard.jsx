import { Spin } from 'antd'
import { useEffect } from 'react'
import { useTranslation } from 'react-i18next'
import useRevenue from '../../../hooks/Clinic/useRevenue'
import RecentInvoicesTable from './components/RecentInvoicesTable'
import RevenueChart from './components/RevenueChart'
import RevenueSummaryCards from './components/RevenueSummaryCards'
import TopVeterinariansTable from './components/TopVeterinariansTable'
import styles from './revenue.module.css'

export default function RevenueDashboard() {
  const { t } = useTranslation('clinic')
  const {
    loading,
    error,
    period,
    setPeriod,
    invoiceFilter,
    setInvoiceFilter,
    fetchRevenue,
    summary,
    dailyRevenue,
    topVeterinariansMonthly,
    recentInvoices,
    filteredRecords,
    PERIOD_KEYS,
  } = useRevenue()

  useEffect(() => {
    fetchRevenue()
  }, [fetchRevenue])

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
      </div>

      {/* Summary Cards */}
      <RevenueSummaryCards summary={summary} />

      {/* Charts Row (period filter now inside daily chart header) */}
      <RevenueChart
        dailyRevenue={dailyRevenue}
        enrichedRecords={filteredRecords}
        periodOptions={periodOptions}
        period={period}
        onPeriodChange={setPeriod}
      />

      {/* Bottom Row: Top Vets (25%) + Recent Invoices (75%) */}
      <div className={styles.bottomRow}>
        <TopVeterinariansTable veterinarians={topVeterinariansMonthly} />
        <RecentInvoicesTable
          invoices={recentInvoices}
          invoiceFilter={invoiceFilter}
          onFilterChange={setInvoiceFilter}
        />
      </div>
    </div>
  )
}
