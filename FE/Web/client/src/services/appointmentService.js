import {
  APPOINTMENT_STATUS_LABELS,
  SERVICE_LABELS,
} from '../constants/enumLabels'
// Định nghĩa các trạng thái cuộc hẹn mới
export const APPOINTMENT_STATUS = {
  BOOKED: 'BOOKED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
}
// Mapping trạng thái cũ sang trạng thái mới
const LEGACY_APPOINTMENT_STATUS_MAP = {
  SUCCESS: APPOINTMENT_STATUS.BOOKED,
  DONE: APPOINTMENT_STATUS.COMPLETED,
}
// Export các hằng số và hàm liên quan đến cuộc hẹn
export const APPOINTMENT_STATUS_LABEL = APPOINTMENT_STATUS_LABELS

export const APPOINTMENT_PAYMENT_SYNC_EVENT_KEY =
  'adminClinic:appointmentPaymentSync'

export const SERVICE_OPTIONS = SERVICE_LABELS
// Chuẩn hóa trạng thái cuộc hẹn
export const normalizeAppointmentStatus = (status) => {
  const normalized = String(status || '').trim().toUpperCase()
  if (!normalized) return ''

  if (/^CANCEL+ED$/.test(normalized)) {
    return APPOINTMENT_STATUS.CANCELLED
  }

  return LEGACY_APPOINTMENT_STATUS_MAP[normalized] || normalized
}
// Chuẩn hóa bản ghi cuộc hẹn
const normalizeAppointmentRecord = (item) => {
  if (!item || typeof item !== 'object') return item

  const normalizedStatus = normalizeAppointmentStatus(item.status)
  return {
    ...item,
    status: normalizedStatus || item.status,
  }
}
// Chuẩn hóa thời gian và ngày tháng
const normalizeTime = (timeValue) => (timeValue || '').slice(0, 5)
// Chuẩn hóa ngày tháng về định dạng YYYY-MM-DD
const normalizeDate = (dateValue) => {
  if (!dateValue) return ''

  const date = new Date(dateValue)
  if (Number.isNaN(date.getTime())) return ''

  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}
// API cuộc hẹn
export const getMyAppointmentsApi = (instance, page = 1, limit = 100) => {
  return instance
    .get('/appointment/my', {
      params: { page, limit },
    })
    .then((response) => {
      const payload = response.data || {}
      const items = Array.isArray(payload.items)
        ? payload.items.map(normalizeAppointmentRecord)
        : []

      return { ...payload, items }
    })
}
// API cuộc hẹn cho admin
export const getAppointmentsApi = async (
  instance,
  { page = 1, limit = 300, date, time, status } = {},
) => {
  const response = await instance.get('/appointment', {
    params: { page, limit },
  })

  const payload = response.data || {}
  const items = Array.isArray(payload.items) ? payload.items : []

  const filteredItems = items.filter((item) => {
    if (date && normalizeDate(item?.appointmentDate) !== date) {
      return false
    }

    if (
      time &&
      normalizeTime(item?.appointmentTime) !== normalizeTime(time)
    ) {
      return false
    }

    if (status && item?.status !== status) {
      return false
    }

    return true
  })

  return {
    ...payload,
    items: filteredItems,
    totalItems: filteredItems.length,
    itemCount: filteredItems.length,
  }
}
// API lấy cuộc hẹn theo ID
export const getAppointmentByIdApi = async (instance, appointmentId) => {
  if (!appointmentId) return null

  const response = await getAppointmentsApi(instance, {
    page: 1,
    limit: 500,
  })
  const items = Array.isArray(response?.items) ? response.items : []

  return (
    items.find((item) => String(item?.id) === String(appointmentId)) || null
  )
}

export const getAppointmentAiDiagnosisApi = (instance, appointmentId) => {
  if (!appointmentId) return Promise.resolve(null)

  return instance
    .get(`/appointment/${appointmentId}/ai-diagnosis`)
    .then((response) => response?.data || null)
}
// API tạo cuộc hẹn mới
export const createAppointmentApi = (instance, data) => {
  return instance
    .post('/appointment', data)
    .then((response) => normalizeAppointmentRecord(response.data))
}
// API cập nhật trạng thái cuộc hẹn
export const updateAppointmentStatusApi = (
  instance,
  appointmentId,
  statusOrPayload,
) => {
  const payload =
    typeof statusOrPayload === 'string'
      ? { status: normalizeAppointmentStatus(statusOrPayload) || statusOrPayload }
      : statusOrPayload

  return instance
    .patch(`/appointment/${appointmentId}`, payload)
    .then((response) => response.data)
}
// API xóa cuộc hẹn
export const deleteAppointmentApi = (instance, appointmentId) => {
  return instance
    .delete(`/appointment/${appointmentId}`)
    .then((response) => response.data)
}
// API lấy thời gian hiện tại từ server
export const getServerNowApi = async (instance) => {
  const localBefore = Date.now()
  const response = await instance.get('/appointment', {
    params: { page: 1, limit: 1 },
  })
  const localAfter = Date.now()

  const headerDate = response?.headers?.date
  if (headerDate) {
    const parsedHeader = Date.parse(headerDate)
    if (!Number.isNaN(parsedHeader)) {
      return parsedHeader
    }
  }

  const payloadNow =
    response?.data?.serverTime ||
    response?.data?.now ||
    response?.data?.timestamp ||
    response?.data?.currentTime
  if (payloadNow) {
    const parsedPayload = Date.parse(String(payloadNow))
    if (!Number.isNaN(parsedPayload)) {
      return parsedPayload
    }
  }

  return Math.round((localBefore + localAfter) / 2)
}
