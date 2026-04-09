import { ADMIN_AUTH_STORAGE, getAdminAuthItem } from '../constants/authStorage';

const decodeJwtPayload = (token) => {
  try {
    if (!token || token.split('.').length < 2) return null;

    const payload = token.split('.')[1];
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
    const json = atob(padded);

    return JSON.parse(json);
  } catch {
    return null;
  }
};

export const extractClinicIdFromProfile = (profile) => {
  const candidate =
    profile?.clinicId ||
    profile?.clinicInfo?.id ||
    profile?.clinic?.id ||
    profile?.veterinarian?.clinic?.id ||
    profile?.adminClinic?.clinic?.id ||
    '';

  return candidate ? String(candidate) : '';
};

export const extractClinicNameFromProfile = (profile) => {
  return (
    profile?.clinicName ||
    profile?.clinicInfo?.name ||
    profile?.clinic?.name ||
    profile?.veterinarian?.clinic?.name ||
    profile?.adminClinic?.clinic?.name ||
    ''
  );
};

export const getClinicIdFromAdminStorage = () => {
  try {
    const raw = getAdminAuthItem(ADMIN_AUTH_STORAGE.userInfoKey);
    if (!raw) return '';

    const parsed = JSON.parse(raw);
    return extractClinicIdFromProfile(parsed);
  } catch {
    return '';
  }
};

export const getClinicIdFromAdminToken = () => {
  const token = getAdminAuthItem(ADMIN_AUTH_STORAGE.tokenKey);
  const payload = decodeJwtPayload(token);
  const clinicId = payload?.clinicId || '';
  return clinicId ? String(clinicId) : '';
};

export const getCurrentAdminClinicId = (profile) => {
  return (
    extractClinicIdFromProfile(profile) ||
    getClinicIdFromAdminStorage() ||
    getClinicIdFromAdminToken() ||
    ''
  );
};
