import { useCallback, useMemo, useState } from 'react'
import { getAdminInstance } from '../../services/apiClient'
import { fetchSystemActivity } from '../../services/adminActivityService'

export default function useAdminActivity() {
  const [summary, setSummary] = useState({
    totalClinics: 0,
    totalVisits: 0,
    activeClinics: 0,
    inactiveClinics: 0,
  })
  const [clinicRankingSource, setClinicRankingSource] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [clinicSearch, setClinicSearch] = useState('')

  const fetchActivity = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const data = await fetchSystemActivity(getAdminInstance())
      setSummary(data.summary)
      setClinicRankingSource(data.clinicRanking)
    } catch (err) {
      setError(err.message || 'Không thể tải dữ liệu hoạt động phòng khám')
    } finally {
      setLoading(false)
    }
  }, [])

  const clinicRanking = useMemo(() => {
    const ranking = clinicRankingSource
    if (!clinicSearch.trim()) return ranking
    const keyword = clinicSearch.trim().toLowerCase()
    return ranking.filter(
      (c) =>
        c.name?.toLowerCase().includes(keyword) ||
        c.address?.toLowerCase().includes(keyword),
    )
  }, [clinicRankingSource, clinicSearch])

  return {
    loading,
    error,
    clinicSearch,
    setClinicSearch,
    fetchActivity,
    summary,
    clinicRanking,
  }
}
