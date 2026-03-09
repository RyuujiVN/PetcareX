import 'package:flutter/material.dart';

import '../../data/appointment_model.dart';
import '../../data/appointment_service.dart';

class AppointmentProvider with ChangeNotifier {
  final AppointmentService _appointmentService = AppointmentService();

  List<Appointment> _appointments = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Appointment> get appointments => _appointments;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  // Lọc lịch hẹn sắp tới (Chỉ những lịch đang ở trạng thái chờ khám)
  List<Appointment> get upcomingAppointments {
    return _appointments.where((a) => a.status == 'Hẹn thành công' || a.status == 'Đang khám').toList()
      ..sort((a, b) => a.appointmentDate.compareTo(b.appointmentDate));
  }

  // Lọc lịch sử (Đã hoàn thành hoặc đã hủy)
  List<Appointment> get historicalAppointments {
    return _appointments.where((a) => a.status == 'Đã khám xong' || a.status == 'Đã huỷ').toList()
      ..sort((a, b) => b.appointmentDate.compareTo(a.appointmentDate));
  }

  Future<void> fetchAppointments() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _appointments = await _appointmentService.getMyAppointments(page: 1, limit: 100);
    } catch (e) {
      _errorMessage = 'Không thể tải danh sách lịch hẹn. Vui lòng thử lại!';
      debugPrint('Error in AppointmentProvider: $e');
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  Future<bool> cancelAppointment(String id) async {
    _isLoading = true;
    notifyListeners();
    
    try {
      final success = await _appointmentService.cancelAppointment(id);
      if (success) {
        await fetchAppointments();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint('Error cancelling appointment: $e');
      return false;
    } finally {
      if (_isLoading) {
        _isLoading = false;
        notifyListeners();
      }
    }
  }
}
