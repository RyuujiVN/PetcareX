import { buildHeaders, request } from "./fetchApi";

export const APPOINTMENT_STATUS = {
  SUCCESS: "Hẹn thành công",
  IN_PROGRESS: "Đang khám",
  DONE: "Đã khám xong",
  CANCELED: "Đã huỷ",
};

export const SERVICE_OPTIONS = [
  "Khám sức khoẻ định kỳ",
  "Khám bệnh",
  "Tiêm chủng",
  "Tẩy giun",
  "Siêu âm xét nghiệm",
  "Phẫu thuật",
  "Cấp cứu",
];

export const getMyAppointmentsApi = async (page = 1, limit = 100) => {
  return request(`/appointment/my?page=${page}&limit=${limit}`, {
    method: "GET",
    headers: buildHeaders(),
  });
};

export const createAppointmentApi = async (data) => {
  return request("/appointment", {
    method: "POST",
    headers: buildHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify(data),
  });
};

export const updateAppointmentStatusApi = async (appointmentId, status) => {
  return request(`/appointment/${appointmentId}`, {
    method: "PATCH",
    headers: buildHeaders({
      "Content-Type": "application/json",
    }),
    body: JSON.stringify({ status }),
  });
};
