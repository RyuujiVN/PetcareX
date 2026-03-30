import instance from './instance'

export const getVeterinarianPetSpeciesApi = () => {
	return instance.get('/pet/species').then((response) => response.data)
}

export const getVeterinarianPetBreedsApi = (species) => {
	return instance.get(`/pet/species/${species}/breed`).then((response) => response.data)
}
