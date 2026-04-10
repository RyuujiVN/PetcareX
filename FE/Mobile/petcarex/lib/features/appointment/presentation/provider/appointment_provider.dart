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
      ..sort(_compareByScheduleAscending);
  }

  List<Appointment> get historicalAppointments {
    return _appointments
        .where((a) => _historicalStatuses.contains(a.status))
        .toList()
      ..sort(_compareByScheduleDescending);
  }

  int _compareByScheduleAscending(Appointment a, Appointment b) {
    return _appointmentDateTime(a).compareTo(_appointmentDateTime(b));
  }

  int _compareByScheduleDescending(Appointment a, Appointment b) {
    return _appointmentDateTime(b).compareTo(_appointmentDateTime(a));
  }

  DateTime _appointmentDateTime(Appointment appointment) {
    final date = appointment.appointmentDate;
    final rawTime = appointment.appointmentTime.trim();
    final upperTime = rawTime.toUpperCase();

    final amPmMatch = RegExp(
      r'^(\d{1,2}):(\d{2})\s*(AM|PM)$',
    ).firstMatch(upperTime);
    if (amPmMatch != null) {
      final hour12 = int.tryParse(amPmMatch.group(1) ?? '0') ?? 0;
      final minute = int.tryParse(amPmMatch.group(2) ?? '0') ?? 0;
      final period = amPmMatch.group(3);

      var hour24 = hour12 % 12;
      if (period == 'PM') {
        hour24 += 12;
      }

      return DateTime(date.year, date.month, date.day, hour24, minute);
    }

    final parts = rawTime.split(':');
    if (parts.length >= 2) {
      final hour = int.tryParse(parts[0].trim()) ?? 0;
      final minute = int.tryParse(parts[1].trim()) ?? 0;
      final second = parts.length >= 3 ? int.tryParse(parts[2].trim()) ?? 0 : 0;

      return DateTime(date.year, date.month, date.day, hour, minute, second);
    }

    return DateTime(date.year, date.month, date.day);
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
      return false;
    } finally {
      if (_isLoading) {
        _isLoading = false;
        notifyListeners();
      }
    }
  }
}
