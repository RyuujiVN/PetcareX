import instance from './instance'

const request = (method, endpoint, { body, params } = {}) => {
	return instance({
		url: endpoint,
		method,
		data: body,
		params,
	}).then((response) => response.data)
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
