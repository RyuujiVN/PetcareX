export const CLINIC_INFO_STORAGE_PREFIX = 'clinicInfo_';
export const CLINIC_INFO_UPDATED_EVENT = 'clinicInfo:updated';

const normalizeClinicId = (clinicId) => {
  if (clinicId === null || clinicId === undefined) return '';
  return String(clinicId).trim();
};

const DEFAULT_CLINIC_INFO = {
  avatarUrl: '',
  name: '',
  email: '',
  address: '',
  phone: '',
  description: '',
  openingDays: '',
  openingTime: '08:00',
  closingTime: '20:00',
  updatedAt: 0,
};

const fallbackFromClinic = (clinic) => {
  if (!clinic || typeof clinic !== 'object') {
    return {};
  }

  return {
    avatarUrl: clinic.avatarUrl || clinic.image || '',
    name: clinic.name || clinic.clinicName || '',
    email: clinic.email || '',
    address: clinic.address || '',
    phone: clinic.phone || clinic.phoneNumber || '',
    description: clinic.description || '',
    openingTime: clinic.openingTime || clinic.localInfo?.openingTime || '',
    closingTime: clinic.closingTime || clinic.localInfo?.closingTime || '',
    openingDays: clinic.openingDays || clinic.localInfo?.openingDays || '',
    updatedAt: Number(clinic.updatedAt) || 0,
  };
};

export const formatClinicOpenHours = ({ openingTime = '', closingTime = '' } = {}) => {
  const timeRange = [openingTime, closingTime].filter(Boolean).join(' - ');
  if (!timeRange) {
    return '';
  }

  return timeRange;
};

export const buildClinicInfoContent = (source = {}, fallbackClinic = null) => {
  const merged = {
    ...DEFAULT_CLINIC_INFO,
    ...fallbackFromClinic(fallbackClinic),
    ...(source || {}),
  };

  return {
    ...merged,
    timeDisplay: formatClinicOpenHours(merged),
  };
};

export const getClinicInfoStorageKey = (clinicId) => {
  const normalized = normalizeClinicId(clinicId);
  return `${CLINIC_INFO_STORAGE_PREFIX}${normalized || 'default'}`;
};

export const getClinicInfoContent = (clinicId, fallbackClinic = null) => {
  if (typeof window === 'undefined') {
    return buildClinicInfoContent({}, fallbackClinic);
  }

  const key = getClinicInfoStorageKey(clinicId);

  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) {
      return buildClinicInfoContent({}, fallbackClinic);
    }

    const parsed = JSON.parse(raw);
    return buildClinicInfoContent(parsed, fallbackClinic);
  } catch {
    return buildClinicInfoContent({}, fallbackClinic);
  }
};

export const saveClinicInfoContent = (clinicId, content, fallbackClinic = null) => {
  if (typeof window === 'undefined') return;

  const key = getClinicInfoStorageKey(clinicId);
  const payload = buildClinicInfoContent(
    {
      ...(content || {}),
      updatedAt: Date.now(),
    },
    fallbackClinic,
  );
  window.localStorage.setItem(key, JSON.stringify(payload));

  window.dispatchEvent(
    new CustomEvent(CLINIC_INFO_UPDATED_EVENT, {
      detail: {
        clinicId: normalizeClinicId(clinicId),
        key,
        content: payload,
      },
    }),
  );
};
