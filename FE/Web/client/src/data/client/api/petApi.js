import instance from './instance';
import { uploadOneFileToCloudinary } from '../../shared/api/cloudinaryUploadFetch';

export const getEnumLabel = (value) => {
  if (!value) return '';

  const normalized = String(value).trim();
  if (!normalized) return '';

  return normalized
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, (char) => char.toUpperCase());
};

export const getSpeciesLabel = (species) => getEnumLabel(species) || 'Chua cap nhat loai';

export const getBreedLabel = (breed, species) => {
  const rawBreed =
    typeof breed === 'object' && breed !== null
      ? breed.name || breed.id || ''
      : breed || '';

  if (!rawBreed) return 'Chua cap nhat giong';

  const rawValue = String(rawBreed).trim();
  const speciesPrefix = species ? `${String(species).trim()}_` : '';

  if (speciesPrefix && rawValue.startsWith(speciesPrefix)) {
    return getEnumLabel(rawValue.slice(speciesPrefix.length));
  }

  const matchedPrefix = rawValue.match(/^[A-Z]+_/);
  if (matchedPrefix) {
    return getEnumLabel(rawValue.slice(matchedPrefix[0].length));
  }

  return getEnumLabel(rawValue);
};

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
  return uploadOneFileToCloudinary(file).then((payload) => ({
    ...payload,
    file: payload.file,
  }));
};
