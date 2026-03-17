import instance from './instance';

export const getMyPetsApi = () => {
  return instance.get('/pet').then((response) => response.data);
};

export const getPetByIdApi = (petId) => {
  return instance.get(`/pet/${petId}`).then((response) => response.data);
};

export const createPetApi = (data) => {
  return instance.post('/pet', data).then((response) => response.data);
};

export const updatePetApi = (petId, data) => {
  return instance.put(`/pet/${petId}`, data).then((response) => response.data);
};

export const deletePetApi = (petId) => {
  return instance.delete(`/pet/${petId}`).then((response) => response.data);
};

export const getPetSpeciesApi = () => {
  return instance.get('/pet/species').then((response) => response.data);
};

export const getBreedsBySpeciesApi = (speciesId) => {
  return instance.get(`/pet/species/${speciesId}/breed`).then((response) => response.data);
};

export const uploadPetAvatarApi = (file) => {
  const formData = new FormData();
  formData.append('file', file);

  return instance.post('/pet/upload', formData).then((response) => response.data);
};
