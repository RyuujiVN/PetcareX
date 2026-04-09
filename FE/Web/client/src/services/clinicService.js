// Lấy danh sách phòng khám
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
    .then((response) => response.data)
}
// Lấy thông tin chi tiết của phòng khám
export const getClinicByIdApi = (instance, clinicId) => {
  if (!clinicId) return Promise.resolve(null)
  return instance.get(`/clinic/${clinicId}`).then((response) => response.data)
}
// Lấy danh sách phòng khám theo bác sĩ
export const createClinicApi = (instance, data) => {
  return instance.post('/clinic', data).then((response) => response.data)
}
// Cập nhật thông tin phòng khám
export const updateClinicApi = (instance, clinicId, data) => {
  return instance
    .put(`/clinic/${clinicId}`, data)
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
