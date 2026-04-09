// Lấy danh sách bác sĩ thú y với phân trang, tìm kiếm và lọc theo phòng khám
export const getVeterinariansApi = async (
  instance,
  page = 1,
  size = 10,
  options = {},
) => {
  const { clinicId, search = '', specialty = '' } = options

  if (!clinicId) {
    throw new Error('Thieu clinicId de tai danh sach bac si')
  }

  const response = await instance.get('/veterinarian', {
    params: {
      page,
      limit: size,
      clinicId,
      ...(search ? { search } : {}),
      ...(specialty ? { specialty } : {}),
    },
  })

  return response?.data || {}
}
// Lấy danh sách bác sĩ thú y theo phòng khám
export const getVeterinarianByClinicApi = (
  instance,
  clinicId,
  page = 1,
  limit = 50,
  search = '',
  specialty = '',
) => {
  return instance
    .get('/veterinarian', {
      params: {
        page,
        limit,
        clinicId,
        ...(search ? { search } : {}),
        ...(specialty ? { specialty } : {}),
      },
    })
    .then((response) => response.data)
}
// Lấy thông tin chi tiết của bác sĩ thú y
export const createVeterinarianApi = async (instance, data) => {
  const response = await instance.post('/veterinarian', data)
  return response?.data || {}
}
// Cập nhật thông tin bác sĩ thú y
export const updateVeterinarianApi = async (instance, id, data) => {
  const response = await instance.put(`/veterinarian/${id}`, data)
  return response?.data || {}
}
// Xóa bác sĩ thú y
export const deleteVeterinarianApi = async (instance, id) => {
  const response = await instance.delete(`/veterinarian/${id}`)
  return response?.data || {}
}
