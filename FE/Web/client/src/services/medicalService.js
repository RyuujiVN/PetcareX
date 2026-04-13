// Lấy thông tin chi tiết của hồ sơ bệnh án
export const getMedicalByIdApi = (instance, id) => {
  return instance.get(`/medical/${id}`).then((response) => response.data)
}
// Lấy danh sách hồ sơ bệnh án
export const getMedicalByClinicApi = (instance, page = 1, limit = 10) => {
  return instance
    .get('/medical/clinic', {
      params: { page, limit },
    })
    .then((response) => response.data)
}
// Lấy danh sách hồ sơ bệnh án theo id pet
export const getMedicalByPetIdApi = (instance, petId, page = 1, limit = 10) => {
  return instance
    .get(`/medical/pet/${petId}`, {
      params: { page, limit },
    })
    .then((response) => response.data)
}

// Lấy danh sách hồ sơ bệnh án theo id pet
export const getMedicalByPetIClinicdApi = (instance, petId, page = 1, limit = 10) => {
  return instance
    .get(`/medical/clinic/pet/${petId}`, {
      params: { page, limit },
    })
    .then((response) => response.data)
}
// Tạo hồ sơ bệnh án mới
export const createMedicalApi = (instance, data) => {
  return instance.post('/medical', data).then((response) => response.data)
}
// Cập nhật thông tin hồ sơ bệnh án
export const updateMedicalApi = (instance, id, data) => {
  return instance
    .put(`/medical/${id}`, data)
    .then((response) => response.data)
}
// Lấy lần cuối cùng khám bệnh của pet
export const getLatestMedicalByPetIdApi = async (instance, petId) => {
  if (!petId) return null

  // const payload = await getMedicalByPetIdApi(instance, petId, 1, 200)
  const records = Array.isArray(payload?.items)
    ? payload.items
    : Array.isArray(payload?.data)
      ? payload.data
      : Array.isArray(payload)
        ? payload
        : []

  if (records.length === 0) return null

  const sortedByCreatedAtDesc = [...records].sort((a, b) => {
    const aTime = new Date(a?.createdAt || 0).getTime()
    const bTime = new Date(b?.createdAt || 0).getTime()
    return bTime - aTime
  })

  return sortedByCreatedAtDesc[0] || null
}
// Lấy danh sách chỉ định y tế của hồ sơ bệnh án
export const getMedicalOrdersByMedicalIdApi = (instance, id) => {
  return instance
    .get(`/medical/${id}/medical-order`)
    .then((response) => response.data)
}
// Lấy danh sách thuốc của hồ sơ bệnh án
export const createMedicalOrderApi = (instance, data) => {
  return instance
    .post('/medical/medical-order', data)
    .then((response) => response.data)
}
// Cập nhật chỉ định y tế
export const updateMedicalOrderApi = (instance, id, data) => {
  return instance
    .put(`/medical/medical-order/${id}`, data)
    .then((response) => response.data)
}
// Xóa chỉ định y tế
export const deleteMedicalOrderApi = (instance, id) => {
  return instance
    .delete(`/medical/medical-order/${id}`)
    .then((response) => response.data)
}
// Lấy danh sách thuốc của hồ sơ bệnh án
export const getAllMedicalOrdersApi = (instance) => {
  return instance.get('/medical-order').then((response) => response.data)
}
// Lấy danh sách thuốc của hồ sơ bệnh án theo id
export const getMedicinesByMedicalIdApi = (instance, id) => {
  return instance
    .get(`/medical/${id}/medicine`)
    .then((response) => response.data)
}
// Thêm thuốc vào hồ sơ bệnh án
export const addMedicineApi = (instance, data) => {
  return instance
    .post('/medical/medicine', data)
    .then((response) => response.data)
}
// Cập nhật thuốc của hồ sơ bệnh án
export const updateMedicineApi = (instance, id, data) => {
  return instance
    .put(`/medical/medicine/${id}`, data)
    .then((response) => response.data)
}
// Xóa thuốc của hồ sơ bệnh án
export const deleteMedicineApi = (instance, id) => {
  return instance
    .delete(`/medical/medicine/${id}`)
    .then((response) => response.data)
}
// Lấy danh sách thuốc
export const getAllMedicinesApi = (instance) => {
  return instance.get('/medicine').then((response) => response.data)
}
// Lấy danh sách chỉ định y tế
export const createMedicalRecordApi = createMedicalApi
export const updateMedicalRecordApi = updateMedicalApi
export const getMedicalOrderCatalogApi = getAllMedicalOrdersApi
export const getMedicineCatalogApi = getAllMedicinesApi
export const createMedicalMedicineApi = addMedicineApi
