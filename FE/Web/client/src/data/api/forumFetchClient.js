import instance from './instance'

const API_BASE_URL = instance?.defaults?.baseURL || import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

const buildUrl = (path, params = {}) => {
	const normalizedPath = path.startsWith('/') ? path : `/${path}`
	const url = new URL(`${API_BASE_URL}${normalizedPath}`)

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			url.searchParams.append(key, String(value))
		}
	})

	return url.toString()
}

const parseJsonSafely = async (response) => {
	const text = await response.text()
	if (!text) return null

	try {
		return JSON.parse(text)
	} catch {
		return text
	}
}

const normalizeErrorMessage = (payload, fallback = 'Co loi xay ra khi goi API') => {
	if (!payload) return fallback
	if (typeof payload === 'string') return payload
	if (Array.isArray(payload?.message) && payload.message.length > 0) return payload.message[0]
	return payload?.message || payload?.error || fallback
}

export const request = async (path, options = {}) => {
	const {
		method = 'GET',
		params,
		body,
		headers = {},
		withAuth = true,
	} = options

	const token = localStorage.getItem('accessToken')
	const finalHeaders = {
		...headers,
	}

	if (withAuth && token) {
		finalHeaders.Authorization = `Bearer ${token}`
	}

	if (body !== undefined) {
		finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json'
	}

	const response = await fetch(buildUrl(path, params), {
		method,
		headers: finalHeaders,
		body: body !== undefined ? JSON.stringify(body) : undefined,
	})

	const payload = await parseJsonSafely(response)

	if (!response.ok) {
		if (response.status === 401 && withAuth) {
			localStorage.removeItem('accessToken')
			localStorage.removeItem('userInfo')
			if (window.location.pathname !== '/login') {
				window.location.href = '/login'
			}
		}

		throw new Error(normalizeErrorMessage(payload))
	}

	return payload
}

export default request
