import dayjs from 'dayjs'
import { useCallback, useMemo, useState } from 'react'
import { getAdminInstance } from '../../services/apiClient'
import {
  aggregateSystemRevenueData,
  calculateClinicRanking,
  calculateSystemDailyRevenue,
  calculateSystemSummary,
  getSystemRecentInvoices,
} from '../../services/adminRevenueService'

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
    return (
      d.isAfter(start.subtract(1, 'millisecond')) &&
      d.isBefore(end.add(1, 'millisecond'))
    )
  })
}

export default function useAdminRevenue() {
  const [allRecords, setAllRecords] = useState([])
  const [clinics, setClinics] = useState([])
  const [clinicDataMap, setClinicDataMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState(PERIOD_KEYS.MONTH)
  const [invoiceFilter, setInvoiceFilter] = useState('all')
  const [clinicSearch, setClinicSearch] = useState('')

  const fetchAdminRevenue = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await aggregateSystemRevenueData(getAdminInstance())
      setClinics(data.clinics)
      setAllRecords(data.enrichedRecords)
      setClinicDataMap(data.clinicDataMap)
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu doanh thu hệ thống')
    } finally {
      setLoading(false)
    }
  }, [])

  const filteredRecords = useMemo(
    () => filterRecordsByPeriod(allRecords, period),
    [allRecords, period],
  )

  const summary = useMemo(
    () => calculateSystemSummary(filteredRecords, clinics),
    [filteredRecords, clinics],
  )

  const dailyRevenue = useMemo(
    () => calculateSystemDailyRevenue(filteredRecords),
    [filteredRecords],
  )

  const clinicRanking = useMemo(() => {
    const ranking = calculateClinicRanking(clinicDataMap, clinics)
    if (!clinicSearch.trim()) return ranking
    const keyword = clinicSearch.trim().toLowerCase()
    return ranking.filter(
      (c) =>
        c.name?.toLowerCase().includes(keyword) ||
        c.address?.toLowerCase().includes(keyword),
    )
  }, [clinicDataMap, clinics, clinicSearch])

  const recentInvoices = useMemo(() => {
    const invoices = getSystemRecentInvoices(filteredRecords)
    if (invoiceFilter === 'all') return invoices
    return invoices.filter((r) => r.invoice?.status === invoiceFilter)
  }, [filteredRecords, invoiceFilter])

  const hasRevenueData = allRecords.some((r) => r.invoice)

  return {
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
    clinics,
    hasRevenueData,
    PERIOD_KEYS,
  }
}
