import dayjs from 'dayjs'
import { getInvoiceByMedicalRecordIdApi, INVOICE_STATUS } from './invoiceService'
import { getMedicalByClinicApi, getMedicalByIdApi } from './medicalService'

const BATCH_SIZE = 10
const PAGE_LIMIT = 50

/**
 * Xử lý mảng theo batch để giới hạn số request chạy song song.
 */
const processBatch = async (items, handler) => {
  const results = []
  for (let i = 0; i < items.length; i += BATCH_SIZE) {
    const batch = items.slice(i, i + BATCH_SIZE)
    const batchResults = await Promise.allSettled(batch.map(handler))
    results.push(...batchResults)
  }
  return results
}

/**
 * Fetch toàn bộ medical records của clinic (phân trang).
 */
export const fetchAllClinicMedicalRecords = async (instance) => {
  const allRecords = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const response = await getMedicalByClinicApi(instance, page, PAGE_LIMIT)
    const items = Array.isArray(response?.items) ? response.items : []
    allRecords.push(...items)
    totalPages = response?.meta?.totalPages || 1
    page += 1
  }

  return allRecords
}

/**
 * Fetch invoice cho 1 medical record, trả null nếu chưa có invoice.
 */
const fetchInvoiceSafe = async (instance, medicalRecordId) => {
  try {
    return await getInvoiceByMedicalRecordIdApi(instance, medicalRecordId)
  } catch {
    return null
  }
}

/**
 * Fetch chi tiết medical record để bổ sung veterinarian khi cần.
 */
const fetchMedicalDetailSafe = async (instance, medicalRecordId) => {
  try {
    return await getMedicalByIdApi(instance, medicalRecordId)
  } catch {
    return null
  }
}

const getVetId = (vet) => vet?.id || vet?.user?.id || null

const getVetName = (vet) => vet?.fullName || vet?.user?.fullName || ''

const getVetSpecialty = (vet) => vet?.specialty || vet?.user?.specialty || ''

const getVetAvatar = (vet) => vet?.avatarUrl || vet?.avatar || vet?.user?.avatarUrl || vet?.user?.avatar || ''

/**
 * Tổng hợp dữ liệu revenue từ medical records + invoices.
 * Tối ưu: chỉ gọi /medical/:id với record thiếu veterinarian.
 */
export const aggregateRevenueData = async (instance) => {
  const records = await fetchAllClinicMedicalRecords(instance)

  const invoiceResults = await processBatch(records, (record) =>
    fetchInvoiceSafe(instance, record.id),
  )

  const recordsNeedDetail = records.filter((record) => !getVetId(record?.veterinarian))
  const detailResults = await processBatch(recordsNeedDetail, (record) =>
    fetchMedicalDetailSafe(instance, record.id),
  )

  const detailByRecordId = new Map()
  recordsNeedDetail.forEach((record, index) => {
    const resolved = detailResults[index]
    if (resolved?.status === 'fulfilled' && resolved.value) {
      detailByRecordId.set(record.id, resolved.value)
    }
  })

  return records.map((record, index) => {
    const invoice =
      invoiceResults[index]?.status === 'fulfilled'
        ? invoiceResults[index].value
        : null
    const detail = detailByRecordId.get(record.id)
    const rawVet = detail?.veterinarian || record?.veterinarian || null

    return {
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      followUpDate: record.followUpDate,
      pet: record.pet,
      owner: record.pet?.owner || null,
      veterinarian: rawVet
        ? {
            id: getVetId(rawVet),
            fullName: getVetName(rawVet),
            specialty: getVetSpecialty(rawVet),
            avatarUrl: getVetAvatar(rawVet),
          }
        : null,
      invoice: invoice
        ? {
            id: invoice.id,
            totalAmount: invoice.totalAmount || 0,
            status: invoice.status,
            createdAt: invoice.createdAt,
            note: invoice.note,
          }
        : null,
    }
  })
}

/**
 * Tính summary cards từ danh sách enriched records.
 */
export const calculateSummary = (enrichedRecords) => {
  const recordsWithInvoice = enrichedRecords.filter((r) => r.invoice)
  const paidRecords = recordsWithInvoice.filter(
    (r) => r.invoice.status === INVOICE_STATUS.PAID,
  )
  const unpaidRecords = recordsWithInvoice.filter(
    (r) => r.invoice.status === INVOICE_STATUS.UNPAID,
  )

  const totalRevenue = paidRecords.reduce(
    (sum, r) => sum + (r.invoice.totalAmount || 0),
    0,
  )
  const totalPaidInvoices = paidRecords.length
  const totalUnpaidInvoices = unpaidRecords.length

  return {
    totalRevenue,
    totalPaidInvoices,
    totalUnpaidInvoices,
  }
}

/**
 * Tính doanh thu theo ngày cho biểu đồ.
 */
export const calculateDailyRevenue = (enrichedRecords) => {
  const paidRecords = enrichedRecords.filter(
    (r) => r.invoice?.status === INVOICE_STATUS.PAID,
  )

  const dailyMap = {}
  paidRecords.forEach((r) => {
    const dateKey = (r.invoice.createdAt || r.createdAt || '').substring(0, 10)
    if (!dateKey) return

    if (!dailyMap[dateKey]) {
      dailyMap[dateKey] = { date: dateKey, revenue: 0, count: 0 }
    }
    dailyMap[dateKey].revenue += r.invoice.totalAmount || 0
    dailyMap[dateKey].count += 1
  })

  return Object.values(dailyMap).sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Tính top bác sĩ theo số lượt khám trong tháng hiện tại.
 */
export const calculateTopVeterinariansByVisits = (enrichedRecords, limit = 5) => {
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth()

  const monthRecords = enrichedRecords.filter((r) => {
    if (!r.veterinarian?.id) return false
    const dateStr = r.invoice?.createdAt || r.createdAt
    if (!dateStr) return false
    const d = new Date(dateStr)
    if (Number.isNaN(d.getTime())) return false
    return d.getFullYear() === year && d.getMonth() === month
  })

  const vetMap = {}
  monthRecords.forEach((r) => {
    const vetId = r.veterinarian.id
    if (!vetMap[vetId]) {
      vetMap[vetId] = {
        id: vetId,
        fullName: r.veterinarian.fullName || '',
        specialty: r.veterinarian.specialty || '',
        avatarUrl: r.veterinarian.avatarUrl || '',
        recordCount: 0,
      }
    }
    vetMap[vetId].recordCount += 1
  })

  return Object.values(vetMap)
    .filter((v) => v.recordCount > 0)
    .sort((a, b) => b.recordCount - a.recordCount)
    .slice(0, limit)
}

/**
 * Lấy danh sách hoá đơn gần đây, sắp xếp mới nhất trước.
 */
export const getRecentInvoices = (enrichedRecords, limit = 20) => {
  return enrichedRecords
    .filter((r) => r.invoice)
    .sort((a, b) => {
      const dateA = a.invoice.createdAt || a.createdAt || ''
      const dateB = b.invoice.createdAt || b.createdAt || ''
      return dateB.localeCompare(dateA)
    })
    .slice(0, limit)
}

/**
 * GET /api/revenue/summary — Tóm tắt hoá đơn hôm nay của phòng khám.
 * Response: { total: number, totalPaid: number, totalUnpaid: number }
 */
export const getRevenueSummary = async (instance) => {
  const { data } = await instance.get('/revenue/summary')
  return {
    totalRevenue: Number(data.total) || 0,
    totalPaidInvoices: Number(data.totalPaid) || 0,
    totalUnpaidInvoices: Number(data.totalUnpaid) || 0,
  }
}

/**
 * GET /api/revenue/chart — Doanh thu theo khoảng thời gian.
 * Response (groupBy=DAY):   [{ total, date }]   — date = day-of-month number
 * Response (groupBy=MONTH): [{ total, month }]  — month = 1–12
 */
export const getRevenueChart = async (instance, dateStart, dateEnd, groupBy) => {
  const { data } = await instance.get('/revenue/chart', {
    params: { dateStart, dateEnd, groupBy },
  })
  return Array.isArray(data) ? data : []
}

/**
 * GET /api/revenue/top-veterinarian — Top 5 bác sĩ hôm nay.
 * Response: [{ fullName, avatarUrl, id, totalAppointment, specialty }]
 */
export const getTopVeterinarians = async (instance) => {
  const { data } = await instance.get('/revenue/top-veterinarian')
  return Array.isArray(data) ? data : []
}

/**
 * Chuyển đổi response chart API sang dạng [{ date, revenue }] cho Recharts.
 */
export const transformChartData = (apiData, groupBy, dateStart, dateEnd) => {
  if (!apiData?.length) return []

  if (groupBy === 'MONTH') {
    const year = dayjs(dateStart).year()
    return apiData
      .map((item) => ({
        date: dayjs().year(year).month(Number(item.month) - 1).startOf('month').format('YYYY-MM-01'),
        revenue: Number(item.total) || 0,
      }))
      .sort((a, b) => a.date.localeCompare(b.date))
  }

  // groupBy === 'DAY'
  const start = dayjs(dateStart)
  const end = dayjs(dateEnd)
  const sameMonth = start.month() === end.month() && start.year() === end.year()

  return apiData
    .map((item) => {
      const dayNum = Number(item.date)
      let fullDate
      if (sameMonth) {
        fullDate = start.date(dayNum)
      } else {
        fullDate = dayNum >= start.date()
          ? start.date(dayNum)
          : end.startOf('month').date(dayNum)
      }
      return {
        date: fullDate.format('YYYY-MM-DD'),
        revenue: Number(item.total) || 0,
      }
    })
    .sort((a, b) => a.date.localeCompare(b.date))
}

/**
 * Map period key sang params cho chart API.
 * Tuần này: thứ Hai → Chủ nhật (dayjs default Sunday-start, nên tự offset).
 */
export const getChartParams = (periodKey) => {
  const now = dayjs()
  const dayOfWeek = now.day()
  const monday = now.subtract((dayOfWeek + 6) % 7, 'day').startOf('day')
  const sunday = monday.add(6, 'day').endOf('day')

  switch (periodKey) {
    case 'today':
      return {
        dateStart: now.startOf('day').toISOString(),
        dateEnd: now.endOf('day').toISOString(),
        groupBy: 'DAY',
      }
    case 'week':
      return {
        dateStart: monday.toISOString(),
        dateEnd: sunday.toISOString(),
        groupBy: 'DAY',
      }
    case 'month':
      return {
        dateStart: now.startOf('month').toISOString(),
        dateEnd: now.endOf('month').toISOString(),
        groupBy: 'DAY',
      }
    case 'year':
      return {
        dateStart: now.startOf('year').toISOString(),
        dateEnd: now.endOf('year').toISOString(),
        groupBy: 'MONTH',
      }
    default:
      return {
        dateStart: now.startOf('month').toISOString(),
        dateEnd: now.endOf('month').toISOString(),
        groupBy: 'DAY',
      }
  }
}
