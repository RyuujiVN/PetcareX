import 'dart:convert';

import '../../../../core/network/api_client.dart';
import 'models/booking_models.dart';

class BookingRepository {
  final ApiClient _apiClient = ApiClient();

  // Get list of clinics with pagination
  Future<Map<String, dynamic>> getClinics({int page = 1, int limit = 10, String? search}) async {
    String endpoint = '$apiPrefix/clinic?page=$page&limit=$limit';
    if (search != null && search.isNotEmpty) {
      endpoint += '&search=$search';
    }

    final response = await _apiClient.get(endpoint);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return {
        'items': (data['items'] as List).map((i) => Clinic.fromJson(i)).toList(),
        'total': data['meta']['totalItems'],
      };
    } else {
      throw Exception('Failed to load clinics');
    }
  }

  // Get list of veterinarians by clinicId
  Future<List<Veterinarian>> getVeterinariansByClinic(String clinicId, {int page = 1, int limit = 10}) async {
    final endpoint = '$apiPrefix/veterinarian?page=$page&limit=$limit&clinicId=$clinicId';
    final response = await _apiClient.get(endpoint);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['items'] as List).map((i) => Veterinarian.fromJson(i)).toList();
    } else {
      throw Exception('Failed to load veterinarians');
    }
  }

  // Create an appointment
  Future<Map<String, dynamic>> createAppointment(CreateAppointmentDto dto) async {
    final endpoint = '$apiPrefix/appointment';
    final response = await _apiClient.post(endpoint, dto.toJson());

    if (response.statusCode == 201) {
      return jsonDecode(response.body);
    } else {
      final error = jsonDecode(response.body);
      String errorMessage = 'Failed to create appointment';
      
      // Parse NestJS Validation Error format
      if (error['error'] is Map && error['error']['message'] != null) {
        final messages = error['error']['message'];
        if (messages is List && messages.isNotEmpty) {
          errorMessage = messages.join('\n');
        } else if (messages is String) {
          errorMessage = messages;
        }
      } else if (error['message'] != null) {
        if (error['message'] is List) {
          errorMessage = error['message'].join('\n');
        } else if (error['message'] is String) {
          errorMessage = error['message'];
        }
      }
      
      throw Exception(errorMessage);
    }
  }

  // Helper static constant as in AppConstants isn't fully defined for all
  static const String apiPrefix = '/api';
}
