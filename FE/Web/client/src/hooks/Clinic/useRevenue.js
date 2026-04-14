import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { getAdminInstance } from '../../services/apiClient'
import {
    aggregateRevenueData,
    calculateDailyRevenue,
    calculateSummary,
    calculateTopVeterinariansByVisits,
    getRecentInvoices,
} from '../../services/revenueService'

const PERIOD_KEYS = {
  TODAY: 'today',
  WEEK: '7days',
  MONTH: 'month',
  YEAR: 'year',
}

const getPeriodRange = (periodKey) => {
  const now = dayjs()
  switch (periodKey) {
    case PERIOD_KEYS.TODAY:
      return [now.startOf('day'), now.endOf('day')]
    case PERIOD_KEYS.WEEK:
      return [now.subtract(6, 'day').startOf('day'), now.endOf('day')]
    case PERIOD_KEYS.MONTH:
      return [now.startOf('month'), now.endOf('day')]
    case PERIOD_KEYS.YEAR:
      return [now.startOf('year'), now.endOf('day')]
    default:
      return [null, null]
  }
}

const filterRecordsByPeriod = (records, periodKey) => {
  const [start, end] = getPeriodRange(periodKey)
  if (!start || !end) return records

  return records.filter((r) => {
    const dateStr = r.invoice?.createdAt || r.createdAt || ''
    if (!dateStr) return false
    const d = dayjs(dateStr)
    return d.isAfter(start.subtract(1, 'millisecond')) && d.isBefore(end.add(1, 'millisecond'))
  })
}

export default function useRevenue() {
  const [allRecords, setAllRecords] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState(PERIOD_KEYS.MONTH)
  const [invoiceFilter, setInvoiceFilter] = useState('all') // 'all' | 'PAID' | 'UNPAID'

  const fetchRevenue = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await aggregateRevenueData(getAdminInstance())
      setAllRecords(data)
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu doanh thu')
    } finally {
      setLoading(false)
    }
  }, [])

  const filteredRecords = useMemo(
    () => filterRecordsByPeriod(allRecords, period),
    [allRecords, period],
  )

  const summary = useMemo(
    () => calculateSummary(filteredRecords),
    [filteredRecords],
  )

  const dailyRevenue = useMemo(
    () => calculateDailyRevenue(filteredRecords),
    [filteredRecords],
  )

  const topVeterinariansMonthly = useMemo(
    () => calculateTopVeterinariansByVisits(allRecords, 5),
    [allRecords],
  )

  const recentInvoices = useMemo(() => {
    const invoices = getRecentInvoices(filteredRecords)
    if (invoiceFilter === 'all') return invoices
    return invoices.filter((r) => r.invoice?.status === invoiceFilter)
  }, [filteredRecords, invoiceFilter])

  return {
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
  }
}
