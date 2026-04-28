import 'dart:convert';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_helper.dart';
import 'models/booking_models.dart';

class BookingRepository {
  final ApiClient _apiClient = ApiClient();

  // Get nearby clinics sorted by distance from user's location.
  // BE endpoint /clinic/user trả về raw array (không có items/meta) — mỗi clinic kèm field `distance` (km).
  Future<List<Clinic>> getNearbyClinics({
    int page = 1,
    int limit = 20,
    required double lat,
    required double lon,
    String sortBy = 'distance',
    String? search,
  }) async {
    final endpoint = ApiHelper.nearbyClinicsEndpoint(
      page: page,
      limit: limit,
      lat: lat,
      lon: lon,
      sortBy: sortBy,
      search: search,
    );

    final response = await _apiClient.get(endpoint);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      final List rawItems = data is List
          ? data
          : (data is Map && data['items'] is List)
              ? data['items'] as List
              : const [];
      return rawItems.map((i) => Clinic.fromJson(i)).toList();
    } else {
      throw Exception('Failed to load clinics');
    }
  }

  // Get list of veterinarians by clinicId
  Future<List<Veterinarian>> getVeterinariansByClinic(
    String clinicId, {
    int page = 1,
    int limit = 10,
    String? specialty,
  }) async {
    final endpoint = ApiHelper.veterinariansEndpoint(
      page: page,
      limit: limit,
      clinicId: clinicId,
      specialty: specialty,
    );
    final response = await _apiClient.get(endpoint);

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      return (data['items'] as List)
          .map((i) => Veterinarian.fromJson(i))
          .toList();
    } else {
      throw Exception('Failed to load veterinarians');
    }
  }

  // Create an appointment
  Future<Map<String, dynamic>> createAppointment(
    CreateAppointmentDto dto,
  ) async {
    final endpoint = AppConstants.END_POINT_APPOINTMENT;
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
}
