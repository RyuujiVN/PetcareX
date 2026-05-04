import { useCallback, useMemo, useState } from 'react'
import { getAdminInstance } from '../../services/apiClient'
import {
    aggregateRevenueData,
    calculateTopVeterinariansByVisits,
    getChartParams,
    getRecentInvoices,
    getRevenueChart,
    getRevenueSummary,
    transformChartData,
} from '../../services/revenueService'

const PERIOD_KEYS = {
  TODAY: 'today',
  WEEK: 'week',
  MONTH: 'month',
  YEAR: 'year',
}

export default function useRevenue() {
  const [allRecords, setAllRecords] = useState([])
  const [summary, setSummary] = useState({
    totalRevenue: 0,
    totalPaidInvoices: 0,
    totalUnpaidInvoices: 0,
  })
  const [chartData, setChartData] = useState([])
  const [chartLoading, setChartLoading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState(PERIOD_KEYS.MONTH)
  const [invoiceFilter, setInvoiceFilter] = useState('all')

  const fetchRevenue = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const instance = getAdminInstance()
      const [summaryRes, recordsRes] = await Promise.allSettled([
        getRevenueSummary(instance),
        aggregateRevenueData(instance),
      ])

      if (summaryRes.status === 'fulfilled') {
        setSummary(summaryRes.value)
      }
      if (recordsRes.status === 'fulfilled') {
        setAllRecords(recordsRes.value)
      }
      if (summaryRes.status === 'rejected' && recordsRes.status === 'rejected') {
        setError(summaryRes.reason?.message || 'Không thể tải dữ liệu doanh thu')
      }
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu doanh thu')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchChart = useCallback(async (periodKey) => {
    try {
      setChartLoading(true)
      const params = getChartParams(periodKey)
      const data = await getRevenueChart(
        getAdminInstance(),
        params.dateStart,
        params.dateEnd,
        params.groupBy,
      )
      setChartData(transformChartData(data, params.groupBy, params.dateStart, params.dateEnd))
    } catch (err) {
      console.warn('[useRevenue] fetchChart error', err)
      setChartData([])
    } finally {
      setChartLoading(false)
    }
  }, [])

  const changePeriod = useCallback((next) => {
    setPeriod(next)
    fetchChart(next)
  }, [fetchChart])

  const topVeterinariansMonthly = useMemo(
    () => calculateTopVeterinariansByVisits(allRecords, 5),
    [allRecords],
  )

  const recentInvoices = useMemo(() => {
    const invoices = getRecentInvoices(allRecords)
    if (invoiceFilter === 'all') return invoices
    return invoices.filter((record) => record.invoice?.status === invoiceFilter)
  }, [allRecords, invoiceFilter])

  return {
    loading,
    error,
    period,
    setPeriod: changePeriod,
    invoiceFilter,
    setInvoiceFilter,
    fetchRevenue,
    fetchChart,
    summary,
    chartData,
    chartLoading,
    topVeterinariansMonthly,
    recentInvoices,
    PERIOD_KEYS,
  }
}
