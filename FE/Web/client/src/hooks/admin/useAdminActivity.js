import { useCallback, useMemo, useState } from 'react'
import { getAdminInstance } from '../../services/apiClient'
import {
  ACTIVITY_PERIOD_KEYS,
  calculateActivitySummary,
  calculateClinicActivityRanking,
  fetchSystemActivity,
} from '../../services/adminActivityService'

export default function useAdminActivity() {
  const [clinics, setClinics] = useState([])
  const [clinicVisitMap, setClinicVisitMap] = useState({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [period, setPeriod] = useState(ACTIVITY_PERIOD_KEYS.THIS_MONTH)
  const [clinicSearch, setClinicSearch] = useState('')

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchSystemActivity(getAdminInstance())
      setClinics(data.clinics)
      setClinicVisitMap(data.clinicVisitMap)
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu hoạt động phòng khám')
    } finally {
      setLoading(false)
    }
  }, [])

  const summary = useMemo(
    () => calculateActivitySummary(clinicVisitMap, clinics, period),
    [clinicVisitMap, clinics, period],
  )

  const clinicRanking = useMemo(() => {
    const ranking = calculateClinicActivityRanking(clinicVisitMap, clinics, period)
    if (!clinicSearch.trim()) return ranking
    const keyword = clinicSearch.trim().toLowerCase()
    return ranking.filter(
      (c) =>
        c.name?.toLowerCase().includes(keyword) ||
        c.address?.toLowerCase().includes(keyword),
    )
  }, [clinicVisitMap, clinics, period, clinicSearch])

  return {
    loading,
    error,
    period,
    setPeriod,
    clinicSearch,
    setClinicSearch,
    fetchActivity,
    summary,
    clinicRanking,
    PERIOD_KEYS: ACTIVITY_PERIOD_KEYS,
  }
}
