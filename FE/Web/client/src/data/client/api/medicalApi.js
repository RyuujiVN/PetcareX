import {
  CLIENT_AUTH_STORAGE,
  clearAuthStorage,
  clearLegacyAuthStorage,
} from '../../../constants/authStorage';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

const buildUrl = (path, params = {}) => {
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  const url = new URL(`${API_BASE_URL}${normalizedPath}`);

  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      url.searchParams.append(key, String(value));
    }
  });

  return url.toString();
};

const parseResponseData = async (response) => {
  const text = await response.text();
  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
};

const normalizeErrorMessage = (payload, fallback) => {
  if (!payload) return fallback;

  if (typeof payload === 'string') return payload;

  if (Array.isArray(payload?.message) && payload.message.length > 0) {
    return payload.message[0];
  }

  return payload?.message || payload?.error || fallback;
};

const request = async (path, options = {}) => {
  const {
    method = 'GET',
    params,
    body,
    headers = {},
    withAuth = true,
  } = options;

  const token = localStorage.getItem(CLIENT_AUTH_STORAGE.tokenKey);
  const finalHeaders = {
    ...headers,
  };

  if (withAuth && token) {
    finalHeaders.Authorization = `Bearer ${token}`;
  }

  if (body !== undefined) {
    finalHeaders['Content-Type'] = finalHeaders['Content-Type'] || 'application/json';
  }

  const response = await fetch(buildUrl(path, params), {
    method,
    headers: finalHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  const payload = await parseResponseData(response);

  if (!response.ok) {
    if (response.status === 401 && withAuth) {
      clearAuthStorage(CLIENT_AUTH_STORAGE);
      clearLegacyAuthStorage();
      if (window.location.pathname !== '/login') {
        window.location.href = '/login';
      }
    }

    const errorMessage = normalizeErrorMessage(payload, 'Có lỗi xảy ra khi gọi API');
    throw new Error(errorMessage);
  }

  return payload;
};

export const getMedicalById = (id) => request(`/medical/${id}`);

export const getMedicalByClinic = (page = 1, limit = 10) =>
  request('/medical/clinic', {
    params: { page, limit },
  });

export const getMedicalByPetId = (petId, page = 1, limit = 10) =>
  request(`/medical/pet/${petId}`, {
    params: { page, limit },
  });

export const createMedical = (data) =>
  request('/medical', {
    method: 'POST',
    body: data,
  });

export const updateMedical = (id, data) =>
  request(`/medical/${id}`, {
    method: 'PUT',
    body: data,
  });

export const getMedicalOrdersByMedicalId = (id) => request(`/medical/${id}/medical-order`);

export const createMedicalOrder = (data) =>
  request('/medical/medical-order', {
    method: 'POST',
    body: data,
  });

export const updateMedicalOrder = (id, data) =>
  request(`/medical/medical-order/${id}`, {
    method: 'PUT',
    body: data,
  });

export const deleteMedicalOrder = (id) =>
  request(`/medical/medical-order/${id}`, {
    method: 'DELETE',
  });

export const getMedicinesByMedicalId = (id) => request(`/medical/${id}/medicine`);

export const addMedicine = (data) =>
  request('/medical/medicine', {
    method: 'POST',
    body: data,
  });

export const updateMedicine = (id, data) =>
  request(`/medical/medicine/${id}`, {
    method: 'PUT',
    body: data,
  });

export const deleteMedicine = (id) =>
  request(`/medical/medicine/${id}`, {
    method: 'DELETE',
  });

export const getAllMedicalOrders = () => request('/medical-order');

export const getAllMedicines = () =>
  request('/medicine', {
    withAuth: false,
  });

export default {
  getMedicalById,
  getMedicalByClinic,
  getMedicalByPetId,
  createMedical,
  updateMedical,
  getMedicalOrdersByMedicalId,
  createMedicalOrder,
  updateMedicalOrder,
  deleteMedicalOrder,
  getMedicinesByMedicalId,
  addMedicine,
  updateMedicine,
  deleteMedicine,
  getAllMedicalOrders,
  getAllMedicines,
};
