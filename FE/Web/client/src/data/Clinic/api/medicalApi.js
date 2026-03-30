import instance from './instance'

export const getMedicalById = (id) => {
	return instance.get(`/medical/${id}`).then((response) => response.data)
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

export const getMedicinesByMedicalId = (id) => {
	return instance.get(`/medical/${id}/medicine`).then((response) => response.data)
}

export default {
	getMedicalById,
	getMedicalByPetId,
	getMedicalOrdersByMedicalId,
	getMedicinesByMedicalId,
}
