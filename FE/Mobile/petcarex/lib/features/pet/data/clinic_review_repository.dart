import 'dart:convert';

import '../../../core/constants/app_constants.dart';
import '../../../core/network/api_client.dart';
import '../../../core/network/api_helper.dart';

class ClinicReviewRepository {
  final ApiClient _apiClient = ApiClient();

  /// Creates a new clinic review.
  /// Returns the created review as a Map, or null on failure.
  Future<Map<String, dynamic>?> createClinicReview({
    required String clinicId,
    required String medicalRecordId,
    required double rating,
    String? content,
  }) async {
    final body = <String, dynamic>{
      'clinicId': clinicId,
      'medicalRecordId': medicalRecordId,
      'rating': rating,
    };
    if (content != null && content.trim().isNotEmpty) {
      body['content'] = content.trim();
    }

    final response = await _apiClient.post(
      AppConstants.END_POINT_CLINIC_REVIEW,
      body,
    );

    if (response.statusCode == 201 || response.statusCode == 200) {
      final decoded = jsonDecode(response.body);
      return decoded is Map<String, dynamic> ? decoded : null;
    }

    return null;
  }

  /// Gets reviews for a clinic (paginated).
  /// Returns a list of review maps.
  Future<List<Map<String, dynamic>>> getClinicReviews({
    required String clinicId,
    int page = 1,
    int limit = 10,
  }) async {
    final endpoint = ApiHelper.clinicReviewsEndpoint(
      clinicId: clinicId,
      page: page,
      limit: limit,
    );

    final response = await _apiClient.get(endpoint);
    if (response.statusCode == 200) {
      final decoded = jsonDecode(response.body);
      if (decoded is List) {
        return decoded.whereType<Map<String, dynamic>>().toList();
      }
      if (decoded is Map<String, dynamic>) {
        final items = decoded['items'];
        if (items is List) {
          return items.whereType<Map<String, dynamic>>().toList();
        }
      }
    }
    return [];
  }
}
