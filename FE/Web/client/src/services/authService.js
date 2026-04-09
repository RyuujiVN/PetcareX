// Đăng nhập
export const loginApi = (instance, email, password) => {
  return instance.post('/auth/login', { email, password })
}
// Đăng ký tài khoản
export const registerApi = (instance, data) => {
  return instance.post('/auth/register', data)
}
// Đăng nhập bằng Google
export const loginGoogleApi = (instance, data) => {
  return instance.post('/auth/login-google', data)
}
// Quên mật khẩu
export const forgotPasswordApi = (instance, email) => {
  return instance.post('/auth/forgot-password', { email })
}
// Đặt lại mật khẩu
export const resetPasswordApi = (instance, data) => {
  return instance.post('/auth/reset-password', data)
}
// Thay đổi mật khẩu
export const changePasswordApi = (instance, data) => {
  return instance.post('/auth/change-password', data)
}
