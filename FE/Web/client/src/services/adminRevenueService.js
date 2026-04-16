import { getClinicListApi } from './clinicService'
import { INVOICE_STATUS } from './invoiceService'

const PAGE_LIMIT = 50
const BATCH_SIZE = 5

/**
 * Fetch toàn bộ clinics (admin role có quyền GET /clinic).
 */
export const fetchAllClinics = async (instance) => {
  const allClinics = []
  let page = 1
  let totalPages = 1

  while (page <= totalPages) {
    const response = await getClinicListApi(instance, page, PAGE_LIMIT)
    const items = Array.isArray(response?.items) ? response.items : []
    allClinics.push(...items)
    totalPages = response?.meta?.totalPages || 1
    page++
  }

  return allClinics.filter((c) => !c.deleted)
}

/**
 * Fetch medical records của một clinic cụ thể (dùng cho admin).
 * Gọi GET /medical/clinic — hiện tại BE yêu cầu ADMIN_CLINIC + dùng clinicId từ JWT.
 * Khi BE bổ sung API admin-scoped, thay endpoint tại đây.
 */
const fetchClinicMedicalRecords = async (instance, clinicId) => {
  try {
    const allRecords = []
    let page = 1
    let totalPages = 1

    while (page <= totalPages) {
      const response = await instance.get('/medical/clinic', {
        params: { page, limit: PAGE_LIMIT, clinicId },
      }).then((r) => r.data)
      const items = Array.isArray(response?.items) ? response.items : []
      allRecords.push(...items)
      totalPages = response?.meta?.totalPages || 1
      page++
    }

    return allRecords
  } catch {
    return []
  }
}

/**
 * Fetch invoice của một medical record.
 */
const fetchInvoiceSafe = async (instance, medicalRecordId) => {
  try {
    const response = await instance.get(`/invoice/${medicalRecordId}`)
    return response.data
  } catch {
    return null
  }
}

/**
 * Xử lý mảng theo batch song song.
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
 * Tổng hợp dữ liệu doanh thu toàn hệ thống.
 * Quy trình: Fetch clinics → fetch medical records + invoices per clinic → aggregate.
 *
 * ⚠️ Hiện tại ADMIN role bị chặn RBAC ở medical/invoice API.
 * Khi BE bổ sung admin-scoped endpoints, service này sẽ tự hoạt động.
 */
export const aggregateSystemRevenueData = async (instance) => {
  // 1. Fetch tất cả clinics (admin có quyền)
  const clinics = await fetchAllClinics(instance)

  // 2. Fetch medical records per clinic (sẽ fail nếu admin bị chặn RBAC)
  const clinicRecordsResults = await processBatch(clinics, async (clinic) => {
    const records = await fetchClinicMedicalRecords(instance, clinic.id)
    return { clinic, records }
  })

  // 3. Thu thập tất cả medical records + gắn clinic info
  const allRecords = []
  const clinicDataMap = {}

  clinicRecordsResults.forEach((result) => {
    if (result.status !== 'fulfilled' || !result.value) return
    const { clinic, records } = result.value
    clinicDataMap[clinic.id] = {
      clinic,
      records: [],
      totalRevenue: 0,
      paidInvoices: 0,
      unpaidInvoices: 0,
      totalVisits: records.length,
    }
    records.forEach((record) => {
      allRecords.push({ ...record, _clinicId: clinic.id, _clinic: clinic })
    })
  })

  // 4. Fetch invoices cho tất cả medical records
  const invoiceResults = await processBatch(allRecords, (record) =>
    fetchInvoiceSafe(instance, record.id),
  )

  // 5. Enrich records + aggregate per clinic
  const enrichedRecords = allRecords.map((record, index) => {
    const invoice =
      invoiceResults[index]?.status === 'fulfilled'
        ? invoiceResults[index].value
        : null

    const clinicId = record._clinicId
    if (clinicDataMap[clinicId] && invoice) {
      const entry = {
        id: record.id,
        name: record.name,
        createdAt: record.createdAt,
        pet: record.pet,
        owner: record.pet?.owner || null,
        clinicId,
        clinicName: record._clinic?.name || '',
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
      clinicDataMap[clinicId].records.push(entry)

      if (invoice?.status === INVOICE_STATUS.PAID) {
        clinicDataMap[clinicId].totalRevenue += invoice.totalAmount || 0
        clinicDataMap[clinicId].paidInvoices += 1
      } else if (invoice?.status === INVOICE_STATUS.UNPAID) {
        clinicDataMap[clinicId].unpaidInvoices += 1
      }

      return entry
    }

    return {
      id: record.id,
      name: record.name,
      createdAt: record.createdAt,
      pet: record.pet,
      owner: record.pet?.owner || null,
      clinicId,
      clinicName: record._clinic?.name || '',
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

  return {
    clinics,
    enrichedRecords,
    clinicDataMap,
  }
}

/**
 * Tính KPI summary toàn hệ thống.
 */
export const calculateSystemSummary = (enrichedRecords, clinics) => {
  const recordsWithInvoice = enrichedRecords.filter((r) => r.invoice)
  const paidRecords = recordsWithInvoice.filter(
    (r) => r.invoice.status === INVOICE_STATUS.PAID,
  )
  const unpaidRecords = recordsWithInvoice.filter(
    (r) => r.invoice.status === INVOICE_STATUS.UNPAID,
  )

  return {
    totalRevenue: paidRecords.reduce(
      (sum, r) => sum + (r.invoice.totalAmount || 0),
      0,
    ),
    totalClinics: clinics?.length || 0,
    totalVisits: enrichedRecords.length,
    totalPaidInvoices: paidRecords.length,
    totalUnpaidInvoices: unpaidRecords.length,
  }
}

/**
 * Tính doanh thu theo ngày cho biểu đồ.
 */
export const calculateSystemDailyRevenue = (enrichedRecords) => {
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
 * Tính doanh thu từng clinic để xếp hạng.
 */
export const calculateClinicRanking = (clinicDataMap, clinics) => {
  return clinics
    .map((clinic) => {
      const data = clinicDataMap[clinic.id] || {}
      return {
        id: clinic.id,
        name: clinic.name,
        address: clinic.address,
        phone: clinic.phone,
        avatarUrl: clinic.avatarUrl,
        totalRevenue: data.totalRevenue || 0,
        paidInvoices: data.paidInvoices || 0,
        unpaidInvoices: data.unpaidInvoices || 0,
        totalVisits: data.totalVisits || 0,
      }
    })
    .sort((a, b) => b.totalRevenue - a.totalRevenue)
}

/**
 * Lấy danh sách invoice gần đây toàn hệ thống.
 */
export const getSystemRecentInvoices = (enrichedRecords, limit = 20) => {
  return enrichedRecords
    .filter((r) => r.invoice)
    .sort((a, b) => {
      const dateA = a.invoice.createdAt || a.createdAt || ''
      const dateB = b.invoice.createdAt || b.createdAt || ''
      return dateB.localeCompare(dateA)
    })
    .slice(0, limit)
}
