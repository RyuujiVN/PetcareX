import { buildHeaders, request } from "./fetchApi";

export const getMyPetsApi = async () => {
  return request("/pet", {
    method: "GET",
    headers: buildHeaders(),
  });
};

export const getPetByIdApi = async (petId) => {
  return request(`/pet/${petId}`, {
    method: "GET",
    headers: buildHeaders(),
  });
};

export const createPetApi = async (data) => {
  return request("/pet", {
    method: "POST",
    headers: buildHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(data),
  });
};

export const updatePetApi = async (petId, data) => {
  return request(`/pet/${petId}`, {
    method: "PUT",
    headers: buildHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(data),
  });
};

export const deletePetApi = async (petId) => {
  return request(`/pet/${petId}`, {
    method: "DELETE",
    headers: buildHeaders(),
  });
};

export const getPetSpeciesApi = async () => {
  return request("/pet/species", {
    method: "GET",
    headers: buildHeaders(),
  });
};

export const getBreedsBySpeciesApi = async (speciesId) => {
  return request(`/pet/species/${speciesId}/breed`, {
    method: "GET",
    headers: buildHeaders(),
  });
};

export const uploadPetAvatarApi = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return request("/pet/upload", {
    method: "POST",
    headers: buildHeaders(),
    body: formData,
  });
};
