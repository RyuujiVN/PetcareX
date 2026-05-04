import axios from 'axios'
import {
  clearAdminAuthStorage,
  clearAuthStorage,
  clearLegacyAuthStorage,
  CLIENT_AUTH_STORAGE,
} from '../constants/authStorage'
import { getToken } from '../utils/storage/tokenStorage'
// Base URL cho API, lấy từ biến môi trường hoặc mặc định về localhost
export const API_BASE_URL =
  import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
// Hàm để áp dụng interceptor cho instance axios, xử lý lỗi và tự động đăng xuất khi gặp lỗi 401
const applyResponseInterceptor = (instance, clearFn) => {
  instance.interceptors.response.use(
    (response) => response,
    (error) => {
      console.log(error?.response?.data || error)

      const responseData = error.response?.data
      const normalizedMessage = Array.isArray(responseData?.message)
        ? responseData.message[0]
        : responseData?.message

      if (normalizedMessage || responseData?.error) {
        error.message = normalizedMessage || responseData.error
      }

      if (
        responseData?.stack &&
        responseData.stack.includes(
          'duplicate key value violates unique constraint',
        )
      ) {
        error.message = 'Email hoặc số điện thoại đã tồn tại'
      }

      if (error.response?.status === 401) {
        if (window.location.pathname !== '/login') {
          clearFn()
          clearLegacyAuthStorage()
          window.location.href = '/login'
        }
      }

      return Promise.reject(error)
    },
  )
}

let _clientInstance = null
let _adminInstance = null
// Hàm để lấy instance axios đã được cấu hình, nếu chưa có thì tạo mới và áp dụng interceptor
export const getClientInstance = () => {
  if (!_clientInstance) {
    _clientInstance = axios.create({ baseURL: API_BASE_URL })

    _clientInstance.interceptors.request.use(
      (config) => {
        const token = getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    applyResponseInterceptor(_clientInstance, () =>
      clearAuthStorage(CLIENT_AUTH_STORAGE),
    )
  }
  return _clientInstance
}
// Hàm để lấy instance axios cho admin đã được cấu hình, nếu chưa có thì tạo mới và áp dụng interceptor
export const getAdminInstance = () => {
  if (!_adminInstance) {
    _adminInstance = axios.create({ baseURL: API_BASE_URL })

    _adminInstance.interceptors.request.use(
      (config) => {
        const token = getToken()
        if (token) {
          config.headers.Authorization = `Bearer ${token}`
        }
        return config
      },
      (error) => Promise.reject(error),
    )

    applyResponseInterceptor(_adminInstance, () => clearAdminAuthStorage())
  }
  return _adminInstance
}
