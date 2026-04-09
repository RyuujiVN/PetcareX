import {
  extractCloudinaryUrl,
  postMultipartFormData,
  uploadMultipleFilesToCloudinary,
  uploadOneFileToCloudinary,
} from './cloudinaryService'
// Lấy danh sách người dùng với phân trang và tìm kiếm
export const getUserListApi = (instance, page = 1, limit = 10, search = '') => {
  return instance.get('/user', {
    params: {
      page,
      limit,
      ...(search ? { search } : {}),
    },
  })
}
// Lấy thông tin hồ sơ cá nhân của người dùng hiện tại
export const getUserProfileApi = (instance) => {
  return instance.get('/user/profile')
}
// Lấy thông tin người dùng theo id
export const getUserByIdApi = (instance, userId) => {
  return instance.get(`/user/${userId}`)
}
// Cập nhật thông tin hồ sơ cá nhân
export const updateUserProfileApi = (instance, userId, data) => {
  return instance.put(`/user/${userId}`, {
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    avatarUrl: data.avatarUrl,
  })
}
// Xóa người dùng
export const deleteUserApi = (instance, userId) => {
  return instance.delete(`/user/${userId}`)
}
// Tải lên ảnh đại diện cho người dùng
export const uploadAvatarApi = (formData) => {
  return postMultipartFormData('/cloudinary/upload/one-file', formData).then(
    (payload) => ({
      data: {
        ...payload,
        file: extractCloudinaryUrl(payload),
      },
    }),
  )
}
// Tải ảnh cho người dùng (chỉ định một ảnh duy nhất)
export const uploadUserImageApi = (file) => {
  return uploadOneFileToCloudinary(file).then((payload) => ({
    ...payload,
    url: payload.file,
  }))
}
// Tải lên nhiều ảnh cho người dùng
export const uploadUserImagesApi = (files) => {
  return uploadMultipleFilesToCloudinary(files).then((result) => result.urls)
}
