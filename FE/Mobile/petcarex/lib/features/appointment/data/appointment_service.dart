import 'dart:convert';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_helper.dart';
import 'appointment_model.dart';

class AppointmentService {
  final ApiClient _apiClient = ApiClient();

  Future<List<Appointment>> getMyAppointments({
    int page = 1,
    int limit = 10,
  }) async {
    try {
      final response = await _apiClient.get(
        ApiHelper.appointmentMyEndpoint(page: page, limit: limit),
      );

      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final rawItems = data['items'];
        if (rawItems is! List) {
          throw const FormatException('Invalid appointment list response');
        }

        return rawItems
            .whereType<Map>()
            .map(
              (json) => Appointment.fromJson(
                Map<String, dynamic>.from(json),
              ),
            )
            .toList();
      } else {
        throw Exception('Failed to load appointments: ${response.statusCode}');
      }
    } catch (e) {
      rethrow;
    }
  }

  Future<bool> cancelAppointment(String id) async {
    try {
      final response = await _apiClient.patch(
        ApiHelper.appointmentClientByIdEndpoint(id),
        {},
      );
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      return false;
    }
  }
}
