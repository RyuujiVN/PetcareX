import {
  ADMIN_AUTH_STORAGE,
  CLIENT_AUTH_STORAGE,
  LEGACY_AUTH_STORAGE,
  getAdminAuthItem,
} from '../../../constants/authStorage';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000/api').replace(/\/+$/, '');

const readJsonSafely = async (response) => {
  const text = await response.text();

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return { message: text };
  }
};

const normalizeErrorMessage = (payload, fallbackMessage) => {
  if (!payload) {
    return fallbackMessage;
  }

  if (typeof payload === 'string') {
    return payload;
  }

  if (Array.isArray(payload.message) && payload.message.length > 0) {
    return payload.message[0];
  }

  return payload.message || payload.error || fallbackMessage;
};

const getAuthToken = () => {
  return (
    localStorage.getItem(CLIENT_AUTH_STORAGE.tokenKey) ||
    getAdminAuthItem(ADMIN_AUTH_STORAGE.tokenKey) ||
    localStorage.getItem(LEGACY_AUTH_STORAGE.tokenKey) ||
    ''
  );
};

export const extractCloudinaryUrl = (payload) => {
  if (!payload) {
    return '';
  }

  return payload.file || payload.url || payload.secure_url || payload.data?.url || payload.data?.file || '';
};

export const postMultipartFormData = async (endpoint, formData) => {
  const token = getAuthToken();
  const headers = {
    Accept: 'application/json',
  };

  if (token) {
    headers.Authorization = `Bearer ${token}`;
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method: 'POST',
    headers,
    body: formData,
  });

  const payload = await readJsonSafely(response);

  if (!response.ok) {
    throw new Error(normalizeErrorMessage(payload, `Upload failed (${response.status})`));
  }

  return payload;
};

export const uploadOneFileToCloudinary = async (file) => {
  if (!file) {
    throw new Error('Vui long chon file truoc khi tai len');
  }

  const formData = new FormData();
  formData.append('file', file);

  const payload = await postMultipartFormData('/cloudinary/upload/one-file', formData);
  const fileUrl = extractCloudinaryUrl(payload);

  if (!fileUrl) {
    throw new Error('Khong nhan duoc URL anh tu server');
  }

  return {
    ...payload,
    file: fileUrl,
    url: fileUrl,
  };
};

export const uploadMultipleFilesToCloudinary = async (files) => {
  const fileList = Array.from(files || []).filter(Boolean);

  if (fileList.length === 0) {
    throw new Error('Vui long chon it nhat 1 file');
  }

  const formData = new FormData();
  fileList.forEach((file) => {
    formData.append('files', file);
  });

  const payload = await postMultipartFormData('/cloudinary/upload/multi-file', formData);
  const rawItems = Array.isArray(payload)
    ? payload
    : Array.isArray(payload?.files)
      ? payload.files
      : [];

  const items = rawItems
    .map((item) => {
      const fileUrl = extractCloudinaryUrl(item);
      return fileUrl
        ? {
            ...item,
            file: fileUrl,
            url: fileUrl,
          }
        : null;
    })
    .filter(Boolean);

  if (items.length === 0) {
    throw new Error('Khong nhan duoc URL anh tu server');
  }

  return {
    items,
    urls: items.map((item) => item.file),
    raw: payload,
  };
};
