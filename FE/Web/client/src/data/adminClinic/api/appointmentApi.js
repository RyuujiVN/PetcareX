import instance from './instance';

export const APPOINTMENT_STATUS = {
  BOOKED: 'BOOKED',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
};

export const APPOINTMENT_STATUS_LABEL = {
  [APPOINTMENT_STATUS.BOOKED]: 'Chờ khám',
  [APPOINTMENT_STATUS.IN_PROGRESS]: 'Đang khám',
  [APPOINTMENT_STATUS.COMPLETED]: 'Đã thanh toán',
  [APPOINTMENT_STATUS.CANCELLED]: 'Đã hủy',
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

const normalizeTime = (timeValue) => (timeValue || '').slice(0, 5);

const normalizeDate = (dateValue) => {
  if (!dateValue) return '';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return '';

  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

export const getClinicAppointmentsApi = async ({ page = 1, limit = 300, date, time, status } = {}) => {
  const response = await instance.get('/appointment/clinic/my', {
    params: {
      page,
      limit,
    },
  });

  const payload = response.data || {};
  const items = Array.isArray(payload.items) ? payload.items : [];

  const filteredItems = items.filter((item) => {
    if (date && normalizeDate(item?.appointmentDate) !== date) {
      return false;
    }

    if (time && normalizeTime(item?.appointmentTime) !== normalizeTime(time)) {
      return false;
    }

    if (status && item?.status !== status) {
      return false;
    }

    return true;
  });

  return {
    ...payload,
    items: filteredItems,
    totalItems: filteredItems.length,
    itemCount: filteredItems.length,
  };
};

export const updateAppointmentStatusApi = (appointmentId, status) => {
  return instance
    .patch(`/appointment/${appointmentId}`, { status })
    .then((response) => response.data);
};
