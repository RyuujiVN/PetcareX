import { buildHeaders, request } from "./fetchApi";

export const getClinicListApi = async (page = 1, limit = 50, search = "") => {
  const query = new URLSearchParams({
    page: String(page),
    limit: String(limit),
    ...(search ? { search } : {}),
  });

  return request(`/clinic?${query.toString()}`, {
    method: "GET",
    headers: buildHeaders(),
  });
};

export const getClinicByIdApi = async (clinicId) => {
  return request(`/clinic/${clinicId}`, {
    method: "GET",
    headers: buildHeaders(),
  });
};

export const uploadClinicAvatarApi = async (file) => {
  const formData = new FormData();
  formData.append("file", file);

  return request("/clinic/upload", {
    method: "POST",
    headers: buildHeaders(),
    body: formData,
  });
};
