// Vị trí mặc định (Đà Nẵng) — fallback khi không lấy được vị trí thật của user.
// Đồng bộ với Web FE (DEFAULT_LOCATION trong src/constants/location.js).
class LocationConstants {
  static const double defaultLat = 16.061010;
  static const double defaultLon = 108.218862;
  static const String defaultLabel = 'Đà Nẵng';

  // Timeout khi chờ Geolocator.getCurrentPosition resolve.
  static const Duration geolocationTimeout = Duration(seconds: 10);
}
