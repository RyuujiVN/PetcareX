import instance from './instance'

export const APPOINTMENT_STATUS = {
	BOOKED: 'BOOKED',
	IN_PROGRESS: 'IN_PROGRESS',
	COMPLETED: 'COMPLETED',
	CANCELLED: 'CANCELLED',
}

const normalizeTime = (timeValue) => (timeValue || '').slice(0, 5)

const normalizeDate = (dateValue) => {
	if (!dateValue) return ''

	const date = new Date(dateValue)
	if (Number.isNaN(date.getTime())) return ''

	const year = date.getFullYear()
	const month = String(date.getMonth() + 1).padStart(2, '0')
	const day = String(date.getDate()).padStart(2, '0')

	return `${year}-${month}-${day}`
}

export const getVeterinarianAppointmentsApi = async ({ page = 1, limit = 300, date, time, status } = {}) => {
	const response = await instance.get('/appointment', {
		params: {
			page,
			limit,
		},
	})

	const payload = response.data || {}
	const items = Array.isArray(payload.items) ? payload.items : []

	const filteredItems = items.filter((item) => {
		if (date && normalizeDate(item?.appointmentDate) !== date) {
			return false
		}

		if (time && normalizeTime(item?.appointmentTime) !== normalizeTime(time)) {
			return false
		}

		if (status && item?.status !== status) {
			return false
		}

		return true
	})

	return {
		...payload,
		items: filteredItems,
		totalItems: filteredItems.length,
		itemCount: filteredItems.length,
	}
}

export const updateVeterinarianAppointmentStatusApi = (appointmentId, payload) => {
	return instance.patch(`/appointment/${appointmentId}`, payload).then((response) => response.data)
}

export const getVeterinarianServerNowApi = async () => {
	const localBefore = Date.now()
	const response = await instance.get('/appointment', {
		params: {
			page: 1,
			limit: 1,
		},
	})
	const localAfter = Date.now()

	const headerDate = response?.headers?.date
	if (headerDate) {
		const parsedHeader = Date.parse(headerDate)
		if (!Number.isNaN(parsedHeader)) {
			return parsedHeader
		}
	}

	const payloadNow =
		response?.data?.serverTime || response?.data?.now || response?.data?.timestamp || response?.data?.currentTime
	if (payloadNow) {
		const parsedPayload = Date.parse(String(payloadNow))
		if (!Number.isNaN(parsedPayload)) {
			return parsedPayload
		}
	}

	// Fallback: use local clock midpoint as best estimate when server
	// does not expose Date header or serverTime field (CORS restriction).
	return Math.round((localBefore + localAfter) / 2)
}

export const deleteVeterinarianAppointmentApi = (appointmentId) => {
	return instance.delete(`/appointment/${appointmentId}`).then((response) => response.data)
}
