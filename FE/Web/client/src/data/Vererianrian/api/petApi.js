import instance from './instance'

export const getVeterinarianPetSpeciesApi = () => {
	return instance.get('/pet/species').then((response) => response.data)
}

export const getVeterinarianPetBreedsApi = (species) => {
	return instance.get(`/pet/species/${species}/breed`).then((response) => response.data)
}

export const getVeterinarianPetByIdApi = (petId) => {
	return instance.get(`/pet/${petId}`).then((response) => response.data)
}

// Backend should support ownerId filter on GET /pet; otherwise add GET /pet/owner/:id.
export const getVeterinarianPetsByOwnerApi = ({ ownerId, page = 1, limit = 200 } = {}) => {
	return instance
		.get('/pet', {
			params: {
				ownerId,
				page,
				limit,
			},
		})
		.then((response) => response.data)
}

// Backend should accept ownerId when creating a pet from the veterinarian portal.
export const createVeterinarianPetApi = (payload) => {
	return instance.post('/pet', payload).then((response) => response.data)
}
