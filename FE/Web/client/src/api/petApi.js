const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

const buildHeaders = (customHeaders = {}) => {
  const token = localStorage.getItem("accessToken");

  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };
};

const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const message =
      (isJson && (payload?.message || payload?.error)) ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return payload;
};

const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  return parseResponse(response);
};

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
