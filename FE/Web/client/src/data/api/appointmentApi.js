import instance from './instance';

export const APPOINTMENT_STATUS = {
  SUCCESS: "Hẹn thành công",
  IN_PROGRESS: "Đang khám",
  DONE: "Đã khám xong",
  CANCELED: "Đã huỷ",
};

export const SERVICE_OPTIONS = {
  PERIODIC_HEALTH_CHECK: "Khám sức khoẻ định kỳ",
  MEDICAL_EXAMINATION: "Khám bệnh",
  VACCINATION: "Tiêm chủng",
  DEWORMING: "Tẩy giun",
  ULTRASOUND_AND_TEST: "Siêu âm xét nghiệm",
  SURGERY: "Phẫu thuật",
  EMERGENCY: "Cấp cứu",
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
