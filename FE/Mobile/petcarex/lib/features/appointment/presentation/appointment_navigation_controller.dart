import 'package:flutter/foundation.dart';

class AppointmentOpenRequest {
  final String appointmentId;
  final bool expandAiDiagnosis;

  const AppointmentOpenRequest({
    required this.appointmentId,
    required this.expandAiDiagnosis,
  });
}

class AppointmentNavigationController extends ChangeNotifier {
  AppointmentOpenRequest? _pendingRequest;

  void openAppointmentDetails(
    String appointmentId, {
    bool expandAiDiagnosis = false,
  }) {
    final normalizedId = appointmentId.trim();
    if (normalizedId.isEmpty) return;

    _pendingRequest = AppointmentOpenRequest(
      appointmentId: normalizedId,
      expandAiDiagnosis: expandAiDiagnosis,
    );
    notifyListeners();
  }

  AppointmentOpenRequest? consumePendingRequest() {
    final request = _pendingRequest;
    _pendingRequest = null;
    return request;
  }
}
