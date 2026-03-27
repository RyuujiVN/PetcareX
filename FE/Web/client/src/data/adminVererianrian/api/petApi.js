import instance from './instance'

export const getVeterinarianPetSpeciesApi = () => {
	return instance.get('/pet/species').then((response) => response.data)
}
