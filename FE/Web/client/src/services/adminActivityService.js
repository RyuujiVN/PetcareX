const normalizeVisitCount = (value) => {
  const numeric = Number(value)
  return Number.isFinite(numeric) ? numeric : 0
}

const normalizeRankingItem = (item) => {
  const visits = normalizeVisitCount(
    item?.totalAppointments ?? item?.totalappointments ?? item?.total_appointments,
  )

  return {
    id: item?.clinic_id || item?.clinicId || item?.id || '',
    name: item?.clinic_name || item?.clinicName || item?.name || '',
    address: item?.clinic_address || item?.clinicAddress || item?.address || '',
    visits,
    active: true,
  }
}

export const fetchSystemActivity = async (instance) => {
  const response = await instance.get('/revenue/top-booked-clinic', {
    params: { orderByType: 'DESC' },
  })

  const rawItems = Array.isArray(response?.data) ? response.data : []
  const clinicRanking = rawItems
    .map(normalizeRankingItem)
    .filter((item) => item.id)
    .sort((a, b) => b.visits - a.visits)

  const totalClinics = clinicRanking.length
  const totalVisits = clinicRanking.reduce((sum, clinic) => sum + clinic.visits, 0)

  return {
    clinicRanking,
    summary: {
      totalClinics,
      totalVisits,
      activeClinics: totalClinics,
      inactiveClinics: 0,
    },
  }
}
