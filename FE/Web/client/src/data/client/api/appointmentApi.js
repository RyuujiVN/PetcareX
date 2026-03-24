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

export const SERVICE_OPTIONS = {
  PERIODIC_HEALTH_CHECK: 'Khám sức khỏe định kỳ',
  MEDICAL_EXAMINATION: 'Khám bệnh',
  VACCINATION: 'Tiêm chủng',
  DEWORMING: 'Tẩy giun',
  ULTRASOUND_AND_TEST: 'Siêu âm xét nghiệm',
  SURGERY: 'Phẫu thuật',
  EMERGENCY: 'Cấp cứu',
};

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
