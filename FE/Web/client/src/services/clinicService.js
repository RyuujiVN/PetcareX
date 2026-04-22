// Lấy danh sách phòng khám
const normalizeTimeValue = (value) => {
  const raw = String(value || '').trim()
  if (!raw) return ''
  return raw.length >= 5 ? raw.slice(0, 5) : raw
}

const normalizeClinicRecord = (clinic) => {
  if (!clinic || typeof clinic !== 'object') {
    return clinic
  }

  const openingTime = normalizeTimeValue(clinic.openingTime || clinic.opening_time || '')
  const closingTime = normalizeTimeValue(clinic.closingTime || clinic.closing_time || '')

  return {
    ...clinic,
    openingTime,
    closingTime,
  }
}

const normalizeClinicListResponse = (payload) => {
  if (!payload || !Array.isArray(payload.items)) {
    return payload
  }

  return {
    ...payload,
    items: payload.items.map((clinic) => normalizeClinicRecord(clinic)),
  }
}

export const getClinicListApi = (
  instance,
  page = 1,
  limit = 50,
  search = '',
) => {
  return instance
    .get('/clinic', {
      params: {
        page,
        limit,
        ...(search ? { search } : {}),
      },
    })
    .then((response) => normalizeClinicListResponse(response.data))
}
// Lấy thông tin chi tiết của phòng khám
export const getClinicByIdApi = (instance, clinicId) => {
  if (!clinicId) return Promise.resolve(null)
  return instance
    .get(`/clinic/${clinicId}`)
    .then((response) => normalizeClinicRecord(response.data))
}
// Lấy danh sách phòng khám theo bác sĩ
export const createClinicApi = (instance, data) => {
  return instance.post('/clinic', data).then((response) => response.data)
}
// Cập nhật thông tin phòng khám
export const updateClinicApi = (instance, clinicId, data) => {
  const payload = {
    ...(data || {}),
  }

  const normalizedOpeningTime = normalizeTimeValue(
    payload.opening_time || payload.openingTime || '',
  )
  const normalizedClosingTime = normalizeTimeValue(
    payload.closing_time || payload.closingTime || '',
  )

  if (normalizedOpeningTime) {
    payload.openingTime = normalizedOpeningTime
    payload.opening_time = normalizedOpeningTime
  }

  if (normalizedClosingTime) {
    payload.closingTime = normalizedClosingTime
    payload.closing_time = normalizedClosingTime
  }

  return instance
    .put(`/clinic/${clinicId}`, payload)
    .then((response) => response.data)
}
// Xóa phòng khám
export const deleteClinicApi = (instance, clinicId) => {
  return instance
    .delete(`/clinic/${clinicId}`)
    .then((response) => response.data)
}
// Tải lên ảnh đại diện cho phòng khám
export const uploadClinicAvatarApi = (instance, file) => {
  const formData = new FormData()
  formData.append('file', file)

  return instance
    .post('/clinic/upload', formData)
    .then((response) => response.data)
}
