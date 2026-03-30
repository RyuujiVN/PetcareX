import axios from 'axios'
import {
	ADMIN_AUTH_STORAGE,
	clearAuthStorage,
	clearLegacyAuthStorage,
} from '../../../constants/authStorage'

const instance = axios.create({
	baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
})

instance.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem(ADMIN_AUTH_STORAGE.tokenKey)

		if (token) {
			config.headers.Authorization = `Bearer ${token}`
		}

		return config
	},
	(error) => Promise.reject(error),
)

instance.interceptors.response.use(
	(response) => response,
	(error) => {
		const responseData = error.response?.data
		const normalizedMessage = Array.isArray(responseData?.message)
			? responseData.message[0]
			: responseData?.message

		if (normalizedMessage || responseData?.error) {
			error.message = normalizedMessage || responseData.error
		}

		if (error.response?.status === 401) {
			if (window.location.pathname !== '/login') {
				clearAuthStorage(ADMIN_AUTH_STORAGE)
				clearLegacyAuthStorage()
				window.location.href = '/login'
			}
		}

		return Promise.reject(error)
	},
)

export default instance
