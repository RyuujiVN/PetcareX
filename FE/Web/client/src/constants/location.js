// Vị trí mặc định (Đà Nẵng) — dùng khi không lấy được vị trí thật từ browser Geolocation.
export const DEFAULT_LOCATION = {
  lat: 16.061063335944954,
  lon: 108.21931990,
  label: 'Đà Nẵng',
}

// Timeout khi hỏi permission / chờ geolocation trả về (ms).
export const GEOLOCATION_TIMEOUT_MS = 10000

// Cache vị trí trong 5 phút để không hỏi lại permission mỗi lần mount.
export const GEOLOCATION_MAX_AGE_MS = 5 * 60 * 1000
