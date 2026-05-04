import dayjs from 'dayjs'
import { getClinicListApi } from './clinicService'

const PAGE_LIMIT = 50
const BATCH_SIZE = 5

const processBatch = async (items, handler) => {
  const results = []
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.allSettled(batch.map(handler))
    results.push(...batchResults)
  }
  return results
}

export const fetchAllClinics = async (instance) => {
  const allClinics = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const response = await getClinicListApi(instance, page, PAGE_LIMIT)
    const items = Array.isArray(response?.items) ? response.items : []
    allClinics.push(...items)
    totalPages = response?.meta?.totalPages || 1
    page += 1
  }

  return allClinics.filter((c) => !c.deleted)
}

const fetchClinicMedicalRecords = async (instance, clinicId) => {
  try {
    const allRecords = []
    let page = 1
    let totalPages = 1
    while (page <= totalPages) {
      const response = await instance
        .get('/medical/clinic', { params: { page, limit: PAGE_LIMIT, clinicId } })
        .then((r) => r.data)
      const items = Array.isArray(response?.items) ? response.items : []
      allRecords.push(...items)
      totalPages = response?.meta?.totalPages || 1
      page += 1
    }
    return allRecords
  } catch {
    return []
  }
}

export const fetchSystemActivity = async (instance) => {
  const clinics = await fetchAllClinics(instance)
  const results = await processBatch(clinics, async (clinic) => {
    const records = await fetchClinicMedicalRecords(instance, clinic.id)
    return { clinic, records }
  })

  const clinicVisitMap = {}
  results.forEach((res) => {
    if (res.status !== 'fulfilled' || !res.value) return
    const { clinic, records } = res.value
    clinicVisitMap[clinic.id] = {
      clinic,
      records: records.map((r) => ({
        id: r.id,
        createdAt: r.createdAt,
      })),
    }
  })

  return { clinics, clinicVisitMap }
}

export const ACTIVITY_PERIOD_KEYS = {
  THIS_MONTH: 'thisMonth',
  LAST_MONTH: 'lastMonth',
  THIS_QUARTER: 'thisQuarter',
}

export const getActivityRange = (periodKey) => {
  const now = dayjs()
  switch (periodKey) {
    case ACTIVITY_PERIOD_KEYS.LAST_MONTH: {
      const lastMonth = now.subtract(1, 'month')
      return [lastMonth.startOf('month'), lastMonth.endOf('month')]
    }
    case ACTIVITY_PERIOD_KEYS.THIS_QUARTER: {
      const month = now.month()
      const quarterStartMonth = month - (month % 3)
      const start = now.month(quarterStartMonth).startOf('month')
      const end = start.add(2, 'month').endOf('month')
      return [start, end]
    }
    case ACTIVITY_PERIOD_KEYS.THIS_MONTH:
    default:
      return [now.startOf('month'), now.endOf('month')]
  }
}

const countWithin = (records, start, end) => {
  if (!Array.isArray(records) || records.length === 0) return 0
  return records.reduce((acc, r) => {
    if (!r?.createdAt) return acc
    const d = dayjs(r.createdAt)
    if (!d.isValid()) return acc
    return d.valueOf() >= start.valueOf() && d.valueOf() <= end.valueOf() ? acc + 1 : acc
  }, 0)
}

export const calculateActivitySummary = (clinicVisitMap, clinics, periodKey) => {
  const [start, end] = getActivityRange(periodKey)
  const totalClinics = clinics?.length || 0
  let totalVisits = 0
  let activeClinics = 0

  Object.values(clinicVisitMap || {}).forEach((entry) => {
    const count = countWithin(entry.records, start, end)
    totalVisits += count
    if (count > 0) activeClinics += 1
  })

  return {
    totalClinics,
    totalVisits,
    activeClinics,
    inactiveClinics: Math.max(totalClinics - activeClinics, 0),
  }
}

export const calculateClinicActivityRanking = (clinicVisitMap, clinics, periodKey) => {
  const [start, end] = getActivityRange(periodKey)
  const prevPeriodKey =
    periodKey === ACTIVITY_PERIOD_KEYS.THIS_MONTH
      ? ACTIVITY_PERIOD_KEYS.LAST_MONTH
      : periodKey === ACTIVITY_PERIOD_KEYS.LAST_MONTH
        ? null
        : null

  let prevStart
  let prevEnd
  if (prevPeriodKey) {
    ;[prevStart, prevEnd] = getActivityRange(prevPeriodKey)
  } else {
    const [s, e] = [start, end]
    const diff = e.valueOf() - s.valueOf()
    prevEnd = s.subtract(1, 'millisecond')
    prevStart = dayjs(prevEnd.valueOf() - diff)
  }

  return clinics
    .map((clinic) => {
      const entry = clinicVisitMap?.[clinic.id]
      const records = entry?.records || []
      const currentVisits = countWithin(records, start, end)
      const previousVisits = countWithin(records, prevStart, prevEnd)
      let growthPct = null
      if (previousVisits > 0) {
        growthPct = ((currentVisits - previousVisits) / previousVisits) * 100
      } else if (currentVisits > 0) {
        growthPct = 100
      }
      return {
        id: clinic.id,
        name: clinic.name,
        address: clinic.address,
        avatarUrl: clinic.avatarUrl,
        currentVisits,
        previousVisits,
        growthPct,
        active: currentVisits > 0,
      }
    })
    .sort((a, b) => b.currentVisits - a.currentVisits)
}
