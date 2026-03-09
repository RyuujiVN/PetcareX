import 'dart:convert';

import 'package:flutter/foundation.dart';

import '../../../core/network/api_client.dart';
import 'appointment_model.dart';

class AppointmentService {
  final ApiClient _apiClient = ApiClient();

  Future<List<Appointment>> getMyAppointments({int page = 1, int limit = 10}) async {
    try {
      final response = await _apiClient.get('/api/appointment/my?page=$page&limit=$limit');
      
      if (response.statusCode == 200) {
        final Map<String, dynamic> data = jsonDecode(response.body);
        final List<dynamic> items = data['items'];
        return items.map((json) => Appointment.fromJson(json)).toList();
      } else {
        throw Exception('Failed to load appointments: ${response.statusCode}');
      }
    } catch (e) {
      debugPrint('Error fetching appointments: $e');
      rethrow;
    }
  }

  Future<bool> cancelAppointment(String id) async {
    try {
      final response = await _apiClient.patch('/api/appointment/$id', {'status': 'Đã huỷ'});
      return response.statusCode == 200 || response.statusCode == 201;
    } catch (e) {
      debugPrint('Error cancelling appointment: $e');
      return false;
    }
  }

  Future<bool> updateAppointmentStatus(String id, String status) async {
    try {
      final response = await _apiClient.patch('/api/appointment/$id', {'status': status});
      return response.statusCode == 200;
    } catch (e) {
      debugPrint('Error updating appointment status: $e');
      return false;
    }
  }
}
