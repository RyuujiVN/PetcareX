const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:3000/api";

export const buildHeaders = (customHeaders = {}) => {
  const token = localStorage.getItem("accessToken");

  return {
    Accept: "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...customHeaders,
  };
};

export const parseResponse = async (response) => {
  const contentType = response.headers.get("content-type") || "";
  const isJson = contentType.includes("application/json");
  const payload = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const normalizedMessage = Array.isArray(payload?.message)
      ? payload.message[0]
      : payload?.message;

    const message =
      (isJson && (normalizedMessage || payload?.error)) ||
      `Request failed with status ${response.status}`;

    throw new Error(message);
  }

  return payload;
};

export const request = async (path, options = {}) => {
  const response = await fetch(`${API_BASE_URL}${path}`, options);
  return parseResponse(response);
};
