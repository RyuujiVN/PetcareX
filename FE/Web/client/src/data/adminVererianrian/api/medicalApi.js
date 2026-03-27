import instance from './instance'

export const getMedicalById = (id) => {
	return instance.get(`/medical/${id}`).then((response) => response.data)
}

export const createMedicalRecordApi = (payload) => {
	return instance.post('/medical', payload).then((response) => response.data)
}

export const updateMedicalRecordApi = (medicalId, payload) => {
	return instance.put(`/medical/${medicalId}`, payload).then((response) => response.data)
}

export const getMedicalByPetId = (petId, page = 1, limit = 10) => {
	return instance
		.get(`/medical/pet/${petId}`, {
			params: { page, limit },
		})
		.then((response) => response.data)
}

export const getMedicalOrdersByMedicalId = (id) => {
	return instance.get(`/medical/${id}/medical-order`).then((response) => response.data)
}

export const getMedicalOrderCatalogApi = () => {
	return instance.get('/medical-order').then((response) => response.data)
}

export const createMedicalOrderApi = (payload) => {
	return instance.post('/medical/medical-order', payload).then((response) => response.data)
}

export const getMedicinesByMedicalId = (id) => {
	return instance.get(`/medical/${id}/medicine`).then((response) => response.data)
}

export const getMedicineCatalogApi = () => {
	return instance.get('/medicine').then((response) => response.data)
}

export const createMedicalMedicineApi = (payload) => {
	return instance.post('/medical/medicine', payload).then((response) => response.data)
}

export default {
	getMedicalById,
	createMedicalRecordApi,
	updateMedicalRecordApi,
	getMedicalByPetId,
	getMedicalOrdersByMedicalId,
	getMedicalOrderCatalogApi,
	createMedicalOrderApi,
	getMedicinesByMedicalId,
	getMedicineCatalogApi,
	createMedicalMedicineApi,
}
