import 'package:flutter/material.dart';

import '../../../../core/services/location_service.dart';
import '../../../booking/data/booking_repository.dart';
import '../../../booking/data/models/booking_models.dart';
import '../../data/clinic_repository.dart';
import '../../data/models/clinic_homepage_setting.dart';
import '../../data/models/clinic_review_models.dart';

// Provider cho luồng "Tìm phòng khám gần nhất" (tách riêng khỏi BookingProvider để
// không phá state đặt lịch đang dở của user). Strict permission: không dùng fallback
// Đà Nẵng — caller phải pop về home khi `isLocationDefault == true`.
class NearbyClinicProvider extends ChangeNotifier {
  final BookingRepository _bookingRepository = BookingRepository();
  final ClinicRepository _clinicRepository = ClinicRepository();
  final LocationService _locationService = LocationService();

  static const int _pageSize = 20;

  List<Clinic> _clinics = const [];
  bool _isLoading = false;
  bool _isLoadingMore = false;
  bool _hasMore = true;
  int _currentPage = 1;
  String? _errorMessage;

  bool _isLocationDefault = false;
  LocationFailureReason _locationReason = LocationFailureReason.none;

  // Detail-page state
  ClinicHomepageSetting? _homepageSetting;
  List<ClinicReviewItem> _reviews = const [];
  bool _isDetailLoading = false;
  String? _detailErrorMessage;

  List<Clinic> get clinics => _clinics;
  bool get isLoading => _isLoading;
  bool get isLoadingMore => _isLoadingMore;
  bool get hasMore => _hasMore;
  String? get errorMessage => _errorMessage;
  bool get isLocationDefault => _isLocationDefault;
  LocationFailureReason get locationReason => _locationReason;
  LocationService get locationService => _locationService;

  ClinicHomepageSetting? get homepageSetting => _homepageSetting;
  List<ClinicReviewItem> get reviews => _reviews;
  bool get isDetailLoading => _isDetailLoading;
  String? get detailErrorMessage => _detailErrorMessage;

  // Tải danh sách clinic gần nhất.
  // Strict mode: nếu cached là default (denied/disabled trước đó), refresh để hỏi lại.
  // Caller phải check isLocationDefault sau khi method resolve.
  Future<void> fetchClinics() async {
    _isLoading = true;
    _errorMessage = null;
    _currentPage = 1;
    _hasMore = true;
    _isLoadingMore = false;
    notifyListeners();

    try {
      var loc = await _locationService.getUserLocation();
      // Nếu lần trước đã denied → cached là default. Force refresh để re-prompt user
      // ở đúng feature này (vì đây là feature bắt buộc cần vị trí thật).
      if (loc.isDefault) {
        loc = await _locationService.refresh();
      }
      _isLocationDefault = loc.isDefault;
      _locationReason = loc.reason;

      // Không gọi BE khi không có vị trí thật — feature mất ý nghĩa nếu fallback.
      if (loc.isDefault) {
        _clinics = const [];
        _hasMore = false;
        return;
      }

      final items = await _bookingRepository.getNearbyClinics(
        page: 1,
        limit: _pageSize,
        lat: loc.lat,
        lon: loc.lon,
      );
      _clinics = items;
      _hasMore = items.length >= _pageSize;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<void> loadMore() async {
    if (_isLoadingMore || !_hasMore || _isLoading) return;
    if (_isLocationDefault) return;

    _isLoadingMore = true;
    notifyListeners();

    try {
      final loc = await _locationService.getUserLocation();
      final nextPage = _currentPage + 1;
      final items = await _bookingRepository.getNearbyClinics(
        page: nextPage,
        limit: _pageSize,
        lat: loc.lat,
        lon: loc.lon,
      );
      final seen = _clinics.map((c) => c.id).toSet();
      final fresh = items.where((c) => seen.add(c.id)).toList();
      _clinics = [..._clinics, ...fresh];
      _currentPage = nextPage;
      _hasMore = items.length >= _pageSize;
    } catch (e) {
      _errorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isLoadingMore = false;
      notifyListeners();
    }
  }

  // Force re-prompt permission + retry — gọi từ dialog "Mở Cài đặt".
  Future<void> retryLocation() async {
    await _locationService.refresh();
    await fetchClinics();
  }

  // Detail page: tải song song setting + reviews top 10.
  Future<void> fetchClinicDetail(String clinicId) async {
    _isDetailLoading = true;
    _detailErrorMessage = null;
    _homepageSetting = null;
    _reviews = const [];
    notifyListeners();

    try {
      final results = await Future.wait([
        _clinicRepository.getHomepageSetting(clinicId),
        _clinicRepository.getClinicReviews(clinicId: clinicId, limit: 10),
      ]);
      _homepageSetting = results[0] as ClinicHomepageSetting;
      _reviews = results[1] as List<ClinicReviewItem>;
    } catch (e) {
      _detailErrorMessage = e.toString().replaceAll('Exception: ', '');
    } finally {
      _isDetailLoading = false;
      notifyListeners();
    }
  }

  void clearDetail() {
    _homepageSetting = null;
    _reviews = const [];
    _isDetailLoading = false;
    _detailErrorMessage = null;
  }
}
