import 'package:flutter/material.dart';

import '../../../../core/enums/appointment_status_enum.dart';
import '../../data/appointment_model.dart';
import '../../data/appointment_service.dart';

class AppointmentProvider with ChangeNotifier {
  final AppointmentService _appointmentService = AppointmentService();
  static const Set<AppointmentStatusEnum> _upcomingStatuses = {
    AppointmentStatusEnum.BOOKED,
    AppointmentStatusEnum.IN_PROGRESS,
  };
  static const Set<AppointmentStatusEnum> _historicalStatuses = {
    AppointmentStatusEnum.COMPLETED,
    AppointmentStatusEnum.CANCELLED,
  };

  List<Appointment> _appointments = [];
  bool _isLoading = false;
  String? _errorMessage;

  List<Appointment> get appointments => _appointments;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;

  List<Appointment> get upcomingAppointments {
    return _appointments
        .where((a) => _upcomingStatuses.contains(a.status))
        .toList()
      ..sort((a, b) => a.appointmentDate.compareTo(b.appointmentDate)); 
  }

  List<Appointment> get historicalAppointments {
    return _appointments
        .where((a) => _historicalStatuses.contains(a.status))
        .toList()
      ..sort((a, b) => b.appointmentDate.compareTo(a.appointmentDate));
  }

  Future<void> fetchAppointments() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      _appointments = await _appointmentService.getMyAppointments(
        page: 1,
        limit: 100,
      );
    } catch (e) {
      // Để null để UI có thể dùng l10n.failed
      _errorMessage = 'failed';
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
