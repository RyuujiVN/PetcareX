import dayjs from 'dayjs'

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
 */
export const getChartParams = (periodKey) => {
  const now = dayjs()
  switch (periodKey) {
    case 'today':
      return {
        dateStart: now.startOf('day').toISOString(),
        dateEnd: now.endOf('day').toISOString(),
        groupBy: 'DAY',
      }
    case '7days':
      return {
        dateStart: now.subtract(6, 'day').startOf('day').toISOString(),
        dateEnd: now.endOf('day').toISOString(),
        groupBy: 'DAY',
      }
    case 'month':
      return {
        dateStart: now.startOf('month').toISOString(),
        dateEnd: now.endOf('day').toISOString(),
        groupBy: 'DAY',
      }
    case 'year':
      return {
        dateStart: now.startOf('year').toISOString(),
        dateEnd: now.endOf('day').toISOString(),
        groupBy: 'MONTH',
      }
    default:
      return {
        dateStart: now.startOf('month').toISOString(),
        dateEnd: now.endOf('day').toISOString(),
        groupBy: 'DAY',
      }
  }
}
