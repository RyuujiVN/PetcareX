import { SERVICE_LABELS } from '../../../constants/enumLabels';
import instance from './instance';

export const APPOINTMENT_STATUS = {
  BOOKED: 'BOOKED',
  SUCCESS: 'BOOKED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  DONE: 'COMPLETED',
  CANCELLED: 'CANCELLED',
  CANCELED: 'CANCELLED',
};

export const SERVICE_OPTIONS = SERVICE_LABELS;

export const getMyAppointmentsApi = (page = 1, limit = 100) => {
  return instance.get('/appointment/my', {
    params: {
      page,
      limit,
    },
  }).then((response) => response.data);
};

export const createAppointmentApi = (data) => {
  return instance.post('/appointment', data).then((response) => response.data);
};

export const updateAppointmentStatusApi = (appointmentId, status) => {
  return instance.patch(`/appointment/${appointmentId}`, { status }).then((response) => response.data);
};