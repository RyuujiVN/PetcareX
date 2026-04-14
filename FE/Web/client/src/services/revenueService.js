import { getInvoiceByMedicalRecordIdApi, INVOICE_STATUS } from './invoiceService'
import { getMedicalByClinicApi, getMedicalByIdApi } from './medicalService'

const BATCH_SIZE = 10
const PAGE_LIMIT = 50

/**
 * Xử lý mảng theo batch, mỗi batch chạy song song.
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
    page++
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
 * Fetch chi tiết medical record (bao gồm veterinarian info).
 */
const fetchMedicalDetailSafe = async (instance, medicalRecordId) => {
  try {
    return await getMedicalByIdApi(instance, medicalRecordId)
  } catch {
    return null
  }
}

/**
 * Tổng hợp toàn bộ dữ liệu doanh thu cho clinic.
 * Trả về object gồm: records (enriched), summaries, chart data, top vets.
 */
export const aggregateRevenueData = async (instance) => {
  // 1. Lấy toàn bộ medical records
  const records = await fetchAllClinicMedicalRecords(instance)

  // 2. Fetch invoice + detail song song theo batch
  const invoiceResults = await processBatch(records, (record) =>
    fetchInvoiceSafe(instance, record.id),
  )
  const detailResults = await processBatch(records, (record) =>
    fetchMedicalDetailSafe(instance, record.id),
  )

  // 3. Ghép dữ liệu
  const enrichedRecords = records.map((record, index) => {
    const invoice =
      invoiceResults[index]?.status === 'fulfilled'
        ? invoiceResults[index].value
        : null
    const detail =
      detailResults[index]?.status === 'fulfilled'
        ? detailResults[index].value
        : null

    return {
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      followUpDate: record.followUpDate,
      pet: record.pet,
      owner: record.pet?.owner || null,
      veterinarian: detail?.veterinarian || null,
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

  return enrichedRecords
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
  const unpaidAmount = unpaidRecords.reduce(
    (sum, r) => sum + (r.invoice.totalAmount || 0),
    0,
  )
  const averagePerRecord =
    totalPaidInvoices > 0 ? Math.round(totalRevenue / totalPaidInvoices) : 0

  return {
    totalRevenue,
    totalPaidInvoices,
    totalUnpaidInvoices,
    unpaidAmount,
    averagePerRecord,
  }
}

/**
 * Tính doanh thu theo ngày cho biểu đồ.
 * Trả về array { date, revenue, count } đã sắp xếp theo ngày.
 */
export const calculateDailyRevenue = (enrichedRecords) => {
  const paidRecords = enrichedRecords.filter(
    (r) => r.invoice?.status === INVOICE_STATUS.PAID,
  )

  const dailyMap = {}
  paidRecords.forEach((r) => {
    const dateKey = (r.invoice.createdAt || r.createdAt || '')
      .substring(0, 10)
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
 * Tính top bác sĩ theo doanh thu.
 */
export const calculateTopVeterinarians = (enrichedRecords) => {
  const paidRecords = enrichedRecords.filter(
    (r) => r.invoice?.status === INVOICE_STATUS.PAID && r.veterinarian,
  )

  const vetMap = {}
  paidRecords.forEach((r) => {
    const vetId = r.veterinarian.id
    if (!vetId) return

    if (!vetMap[vetId]) {
      vetMap[vetId] = {
        id: vetId,
        fullName: r.veterinarian.fullName || '',
        specialty: r.veterinarian.specialty || '',
        totalRevenue: 0,
        recordCount: 0,
      }
    }
    vetMap[vetId].totalRevenue += r.invoice.totalAmount || 0
    vetMap[vetId].recordCount += 1
  })

  return Object.values(vetMap).sort((a, b) => b.totalRevenue - a.totalRevenue)
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
