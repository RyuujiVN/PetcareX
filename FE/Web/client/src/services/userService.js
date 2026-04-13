import {
  extractCloudinaryUrl,
  postMultipartFormData,
  uploadMultipleFilesToCloudinary,
  uploadOneFileToCloudinary,
} from './cloudinaryService'

const USER_PHONE_UNIQUE_CONSTRAINT = 'UQ_8e1f623798118e629b46a9e6299'
const USER_EMAIL_UNIQUE_CONSTRAINT = 'UQ_e12875dfb3b1d92d7d7c5377e22'

// Chuẩn hóa dữ liệu đầu vào về chuỗi đã trim để giảm lỗi do khoảng trắng.
const toTrimmedString = (value) => String(value ?? '').trim()

// Chuẩn hóa payload cập nhật user trước khi gửi API.
// Chỉ gửi các field có trong data và loại bỏ phone rỗng để tránh va chạm unique không cần thiết.
const normalizeUserUpdatePayload = (data = {}) => {
  const payload = {}

  if (Object.prototype.hasOwnProperty.call(data, 'fullName')) {
    payload.fullName = toTrimmedString(data.fullName)
  }

  if (Object.prototype.hasOwnProperty.call(data, 'email')) {
    payload.email = toTrimmedString(data.email).toLowerCase()
  }

  if (Object.prototype.hasOwnProperty.call(data, 'phone')) {
    const normalizedPhone = toTrimmedString(data.phone)
    if (normalizedPhone) {
      payload.phone = normalizedPhone
    }
  }

  if (Object.prototype.hasOwnProperty.call(data, 'address')) {
    payload.address = toTrimmedString(data.address)
  }

  if (Object.prototype.hasOwnProperty.call(data, 'avatarUrl')) {
    payload.avatarUrl = toTrimmedString(data.avatarUrl)
  }

  return payload
}

// Phân tích lỗi từ backend để đổi thành thông báo dễ hiểu cho người dùng.
// Trường hợp hay gặp: lỗi unique phone/email nhưng backend trả về 500 chung chung.
const resolveUserUpdateErrorMessage = (error) => {
  const responseData = error?.response?.data || {}
  const status = error?.response?.status
  const messageParts = [
    responseData?.message,
    responseData?.error,
    responseData?.detail,
    responseData?.stack,
    error?.message,
  ]

  const fullText = messageParts
    .flat()
    .filter(Boolean)
    .map((item) => String(item).toLowerCase())
    .join(' ')

  if (
    fullText.includes(USER_PHONE_UNIQUE_CONSTRAINT.toLowerCase()) ||
    (fullText.includes('unique constraint') && fullText.includes('phone'))
  ) {
    return 'Số điện thoại đã được sử dụng'
  }

  if (
    fullText.includes(USER_EMAIL_UNIQUE_CONSTRAINT.toLowerCase()) ||
    (fullText.includes('unique constraint') && fullText.includes('email'))
  ) {
    return 'Email đã được sử dụng'
  }

  if (status === 500 && fullText.includes('duplicate key value')) {
    return 'Thông tin tài khoản đã được sử dụng'
  }

  return null
}
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
// Có normalize payload và ánh xạ lỗi DB để UI hiển thị message nghiệp vụ.
export const updateUserProfileApi = (instance, userId, data) => {
  const payload = normalizeUserUpdatePayload(data)

  return instance.put(`/user/${userId}`, payload).catch((error) => {
    const normalizedMessage = resolveUserUpdateErrorMessage(error)

    if (normalizedMessage) {
      error.message = normalizedMessage
    }

    return Promise.reject(error)
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
