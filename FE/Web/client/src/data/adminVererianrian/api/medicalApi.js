import {
	ADMIN_AUTH_STORAGE,
	clearAuthStorage,
	clearLegacyAuthStorage,
} from '../../../constants/authStorage'

const BASE_URL = import.meta.env.VITE_API_URL || '/api'

const buildHeaders = (customHeaders = {}, includeJson = true) => {
	const token = localStorage.getItem(ADMIN_AUTH_STORAGE.tokenKey)
	const headers = {
		...(includeJson ? { 'Content-Type': 'application/json' } : {}),
		...customHeaders,
	}

	if (token) {
		headers.Authorization = `Bearer ${token}`
	}

	return headers
}

const buildQueryString = (params = {}) => {
	const searchParams = new URLSearchParams()

	Object.entries(params).forEach(([key, value]) => {
		if (value !== undefined && value !== null && value !== '') {
			searchParams.append(key, value)
		}
	})

	const query = searchParams.toString()
	return query ? `?${query}` : ''
}

const normalizeErrorMessage = async (response) => {
	const fallbackMessage = `Yeu cau that bai (${response.status})`

	try {
		const data = await response.json()
		const normalizedMessage = Array.isArray(data?.message) ? data.message[0] : data?.message
		return normalizedMessage || data?.error || fallbackMessage
	} catch {
		return fallbackMessage
	}
}

const handleUnauthorized = (status) => {
	if (status !== 401 || window.location.pathname === '/login') return

	clearAuthStorage(ADMIN_AUTH_STORAGE)
	clearLegacyAuthStorage()
	window.location.href = '/login'
}

const request = async (method, endpoint, { body, params, headers } = {}) => {
	const url = `${BASE_URL}${endpoint}${buildQueryString(params)}`
	const options = {
		method,
		headers: buildHeaders(headers),
	}

	if (body !== undefined) {
		options.body = JSON.stringify(body)
	}

	const response = await fetch(url, options)

	if (!response.ok) {
		handleUnauthorized(response.status)
		const message = await normalizeErrorMessage(response)
		throw new Error(message)
	}

	if (response.status === 204) return null

	const contentType = response.headers.get('content-type') || ''
	if (!contentType.includes('application/json')) return null

	return response.json()
}

export const getClinicMedicals = ({ page = 1, limit = 10 } = {}) => {
	return request('GET', '/medical/clinic', {
		params: { page, limit },
	})
}

export const getMedicalById = (id) => request('GET', `/medical/${id}`)

export const createMedical = (data) => request('POST', '/medical', { body: data })

export const updateMedical = (id, data) => request('PUT', `/medical/${id}`, { body: data })

export const getMedicalByPetId = (petId, page = 1, limit = 10) => {
	return request('GET', `/medical/pet/${petId}`, {
		params: { page, limit },
	})
}

export const getMedicalOrdersByMedicalId = (id) => request('GET', `/medical/${id}/medical-order`)

export const createMedicalOrder = (data) => request('POST', '/medical/medical-order', { body: data })

export const updateMedicalOrder = (id, data) => {
	return request('PUT', `/medical/medical-order/${id}`, { body: data })
}

export const deleteMedicalOrder = (id) => request('DELETE', `/medical/medical-order/${id}`)

export const getAllMedicalOrders = () => request('GET', '/medical-order')

export const getMedicinesByMedicalId = (id) => request('GET', `/medical/${id}/medicine`)

export const createMedicine = (data) => request('POST', '/medical/medicine', { body: data })

export const updateMedicine = (id, data) => request('PUT', `/medical/medicine/${id}`, { body: data })

export const deleteMedicine = (id) => request('DELETE', `/medical/medicine/${id}`)

export const getAllMedicines = () => request('GET', '/medicine')

// Backward-compatible aliases for existing screens.
export const createMedicalRecordApi = createMedical
export const updateMedicalRecordApi = updateMedical
export const getMedicalOrderCatalogApi = getAllMedicalOrders
export const createMedicalOrderApi = createMedicalOrder
export const getMedicineCatalogApi = getAllMedicines
export const createMedicalMedicineApi = createMedicine

export default {
	getClinicMedicals,
	getMedicalById,
	createMedical,
	updateMedical,
	getMedicalByPetId,
	getMedicalOrdersByMedicalId,
	createMedicalOrder,
	updateMedicalOrder,
	deleteMedicalOrder,
	getAllMedicalOrders,
	getMedicinesByMedicalId,
	createMedicine,
	updateMedicine,
	deleteMedicine,
	getAllMedicines,
	createMedicalRecordApi,
	updateMedicalRecordApi,
	getMedicalOrderCatalogApi,
	createMedicalOrderApi,
	getMedicineCatalogApi,
	createMedicalMedicineApi,
}
