import instance from './instance'

export const getClinicPetSpeciesApi = () => {
	return instance.get('/pet/species').then((response) => response.data)
}