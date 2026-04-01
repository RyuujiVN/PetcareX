import { SERVICE_LABELS } from '../../../constants/enumLabels';
import instance from './instance';

export const APPOINTMENT_STATUS = {
  BOOKED: 'BOOKED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

const LEGACY_APPOINTMENT_STATUS_MAP = {
  SUCCESS: APPOINTMENT_STATUS.BOOKED,
  DONE: APPOINTMENT_STATUS.COMPLETED,
};

export const normalizeAppointmentStatus = (status) => {
  const normalized = String(status || '').trim().toUpperCase();
  if (!normalized) return '';

  if (/^CANCEL+ED$/.test(normalized)) {
    return APPOINTMENT_STATUS.CANCELLED;
  }

  return LEGACY_APPOINTMENT_STATUS_MAP[normalized] || normalized;
};

const normalizeAppointmentRecord = (item) => {
  if (!item || typeof item !== 'object') return item;

  const normalizedStatus = normalizeAppointmentStatus(item.status);
  return {
    ...item,
    status: normalizedStatus || item.status,
  };
};

export const SERVICE_OPTIONS = SERVICE_LABELS;

export const getMyAppointmentsApi = (page = 1, limit = 100) => {
  return instance.get('/appointment/my', {
    params: {
      page,
      limit,
    },
  }).then((response) => {
    const payload = response.data || {};
    const items = Array.isArray(payload.items)
      ? payload.items.map(normalizeAppointmentRecord)
      : [];

    return {
      ...payload,
      items,
    };
  });
};

export const createAppointmentApi = (data) => {
  return instance.post('/appointment', data).then((response) => normalizeAppointmentRecord(response.data));
};

export const updateAppointmentStatusApi = (appointmentId, status) => {
  const normalizedStatus = normalizeAppointmentStatus(status) || status;
  return instance
    .patch(`/appointment/${appointmentId}`, { status: normalizedStatus })
    .then((response) => normalizeAppointmentRecord(response.data));
};