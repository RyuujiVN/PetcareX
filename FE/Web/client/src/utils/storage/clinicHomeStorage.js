import { buildClinicHomeContent } from '../../config/homePageClinicContent';

export const CLINIC_HOME_STORAGE_PREFIX = 'homePage_';

const normalizeClinicId = (clinicId) => {
  if (clinicId === null || clinicId === undefined) return '';
  return String(clinicId).trim();
};

export const getClinicHomeStorageKey = (clinicId) => {
  const normalized = normalizeClinicId(clinicId);
  return `${CLINIC_HOME_STORAGE_PREFIX}${normalized || 'default'}`;
};

export const getClinicHomeContent = (clinicId) => {
  if (typeof window === 'undefined') {
    return buildClinicHomeContent();
  }

  const key = getClinicHomeStorageKey(clinicId);

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return buildClinicHomeContent();
    }

    const parsed = JSON.parse(raw);
    return buildClinicHomeContent(parsed);
  } catch {
    return buildClinicHomeContent();
  }
};

export const saveClinicHomeContent = (clinicId, content) => {
  if (typeof window === 'undefined') return;

  const key = getClinicHomeStorageKey(clinicId);
  const payload = buildClinicHomeContent(content);
  window.localStorage.setItem(key, JSON.stringify(payload));
};

export const cacheClinicHomeContent = (clinicId, apiContent) => {
  if (typeof window === 'undefined' || !apiContent) return;

  const key = getClinicHomeStorageKey(clinicId);
  const payload = buildClinicHomeContent(apiContent);
  window.localStorage.setItem(key, JSON.stringify(payload));
};

export const resolveSelectedClinicId = (locationState) => {
  const stateClinicId =
    locationState?.selectedClinicId ||
    (locationState?.clinic?.id ? String(locationState.clinic.id) : '');

  if (stateClinicId) {
    return String(stateClinicId);
  }

  if (typeof window === 'undefined') {
    return '';
  }

  return window.sessionStorage.getItem('selectedClinicId') || '';
};
