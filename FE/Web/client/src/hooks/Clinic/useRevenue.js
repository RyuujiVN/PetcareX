import { useCallback, useEffect, useState } from 'react'
import { getAdminInstance } from '../../services/apiClient'
import {
  getChartParams,
  getRevenueChart,
  getRevenueSummary,
  getTopVeterinarians,
  transformChartData,
} from '../../services/revenueService'

const PERIOD_KEYS = {
  TODAY: 'today',
  WEEK: '7days',
  MONTH: 'month',
  YEAR: 'year',
}

export default function useRevenue() {
  const [summary, setSummary] = useState({ totalRevenue: 0, totalPaidInvoices: 0, totalUnpaidInvoices: 0 })
  const [chartData, setChartData] = useState([])
  const [topVeterinarians, setTopVeterinarians] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState(PERIOD_KEYS.MONTH)

  const fetchSummaryAndVets = useCallback(async () => {
    const instance = getAdminInstance()
    const [summaryRes, topVetsRes] = await Promise.all([
      getRevenueSummary(instance),
      getTopVeterinarians(instance),
    ])
    setSummary(summaryRes)
    setTopVeterinarians(topVetsRes)
  }, [])

  const fetchChart = useCallback(async (periodKey) => {
    const instance = getAdminInstance()
    const params = getChartParams(periodKey)
    const raw = await getRevenueChart(instance, params.dateStart, params.dateEnd, params.groupBy)
    const transformed = transformChartData(raw, params.groupBy, params.dateStart, params.dateEnd)
    setChartData(transformed)
  }, [])

  const fetchRevenue = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      await Promise.all([fetchSummaryAndVets(), fetchChart(period)])
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu doanh thu')
    } finally {
      setLoading(false)
    }
  }, [fetchSummaryAndVets, fetchChart, period])

  // Khi period thay đổi → chỉ fetch lại chart
  useEffect(() => {
    if (!loading) {
      fetchChart(period).catch(() => {})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period])

  return {
    loading,
    error,
    period,
    setPeriod,
    fetchRevenue,
    summary,
    dailyRevenue: chartData,
    topVeterinarians,
    PERIOD_KEYS,
  }
}
