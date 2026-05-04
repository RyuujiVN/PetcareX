import 'package:flutter/foundation.dart';
import 'package:geolocator/geolocator.dart';

import '../constants/location_constants.dart';

enum LocationFailureReason {
  none,
  serviceDisabled, // user chưa bật Location Services trên thiết bị
  permissionDenied, // user từ chối lần này (vẫn có thể hỏi lại)
  permissionPermanentlyDenied, // user đã từ chối vĩnh viễn / chọn "Don't ask again"
  unknown, // timeout / lỗi không xác định
}

class UserLocation {
  final double lat;
  final double lon;
  final bool isDefault;
  final LocationFailureReason reason;

  const UserLocation({
    required this.lat,
    required this.lon,
    required this.isDefault,
    this.reason = LocationFailureReason.none,
  });
}

// Lấy vị trí user một lần và cache trong session.
// - Nếu service tắt / permission denied / timeout → fallback Đà Nẵng + isDefault = true.
// - Cache module-scope qua field static để mọi nơi gọi không hỏi lại permission mỗi lần.
class LocationService {
  static UserLocation? _cached;
  static Future<UserLocation>? _inflight;

  static UserLocation _fallbackWith(LocationFailureReason reason) =>
      UserLocation(
        lat: LocationConstants.defaultLat,
        lon: LocationConstants.defaultLon,
        isDefault: true,
        reason: reason,
      );

  // Mở Location Settings của hệ điều hành để user bật Location Services.
  Future<bool> openLocationSettings() => Geolocator.openLocationSettings();

  // Mở App Settings — dùng khi permission bị deny vĩnh viễn.
  Future<bool> openAppSettings() => Geolocator.openAppSettings();

  Future<UserLocation> getUserLocation() {
    if (_cached != null) return Future.value(_cached);
    if (_inflight != null) return _inflight!;

    final future = _resolve().then((value) {
      _cached = value;
      _inflight = null;
      return value;
    });
    _inflight = future;
    return future;
  }

  // Force fetch lại — dùng khi user bấm "Cho phép vị trí" thủ công.
  Future<UserLocation> refresh() {
    _cached = null;
    _inflight = null;
    return getUserLocation();
  }

  Future<UserLocation> _resolve() async {
    try {
      var permission = await Geolocator.checkPermission();
      _log('checkPermission → $permission');

      // Lần đầu cài app: state là denied → bắt buộc gọi requestPermission để
      // hiện hệ thống dialog cho user. Nếu state là deniedForever (user đã từ chối
      // 2 lần), Geolocator sẽ trả về luôn không show dialog — caller có thể bấm
      // SnackBar fallback và mở Settings tay.
      if (permission == LocationPermission.denied) {
        permission = await Geolocator.requestPermission();
        _log('requestPermission → $permission');
      }

      if (permission == LocationPermission.deniedForever) {
        return _fallbackWith(LocationFailureReason.permissionPermanentlyDenied);
      }
      if (permission == LocationPermission.denied) {
        return _fallbackWith(LocationFailureReason.permissionDenied);
      }

      // Check service sau permission: user có thể vừa enable Location ngay khi thấy dialog.
      final serviceEnabled = await Geolocator.isLocationServiceEnabled();
      _log('isLocationServiceEnabled → $serviceEnabled');
      if (!serviceEnabled) {
        return _fallbackWith(LocationFailureReason.serviceDisabled);
      }

      final position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.high,
        ),
      ).timeout(LocationConstants.geolocationTimeout);
      _log('position → ${position.latitude}, ${position.longitude}');

      return UserLocation(
        lat: position.latitude,
        lon: position.longitude,
        isDefault: false,
      );
    } catch (e) {
      _log('error → $e');
      return _fallbackWith(LocationFailureReason.unknown);
    }
  }

  void _log(String message) {
    if (kDebugMode) debugPrint('[LocationService] $message');
  }
}
