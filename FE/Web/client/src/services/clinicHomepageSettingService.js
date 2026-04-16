// Lấy setting trang chủ phòng khám
// Trả về null nếu phòng khám chưa có setting (404) — không coi là lỗi
export const getClinicHomepageSettingApi = (instance, clinicId) => {
  if (!clinicId) return Promise.resolve(null)
  return instance
    .get(`/clinic-homepage-setting/${clinicId}`)
    .then((response) => response.data)
    .catch((error) => {
      if (error?.response?.status === 404) return null
      throw error
    })
}

// Chỉnh sửa setting trang chủ phòng khám (clinicId lấy từ JWT token)
export const updateClinicHomepageSettingApi = (instance, settings) => {
  return instance
    .put('/clinic-homepage-setting', {
      settings: typeof settings === 'string' ? settings : JSON.stringify(settings),
    })
    .then((response) => response.data)
}
