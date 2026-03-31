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

export const getLatestMedicalByPetId = async (petId) => {
	if (!petId) return null

	const payload = await getMedicalByPetId(petId, 1, 200)
	const records = Array.isArray(payload?.items)
		? payload.items
		: Array.isArray(payload?.data)
			? payload.data
			: Array.isArray(payload)
				? payload
				: []

	if (records.length === 0) return null

	const sortedByCreatedAtDesc = [...records].sort((a, b) => {
		const aTime = new Date(a?.createdAt || 0).getTime()
		const bTime = new Date(b?.createdAt || 0).getTime()
		return bTime - aTime
	})

	return sortedByCreatedAtDesc[0] || null
}

export default {
	getMedicalById,
	getMedicalByPetId,
	getMedicalOrdersByMedicalId,
	getMedicinesByMedicalId,
	getLatestMedicalByPetId,
}
