import instance from './instance'

export const getClinicPetSpeciesApi = () => {
	return instance.get('/pet/species').then((response) => response.data)
}

export const getClinicPetByIdApi = (petId) => {
	return instance.get(`/pet/${petId}`).then((response) => response.data)
}