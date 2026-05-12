import 'dart:convert';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_helper.dart';
import 'models/clinic_homepage_setting.dart';
import 'models/clinic_review_models.dart';

class ClinicRepository {
  final ApiClient _apiClient = ApiClient();

  Future<ClinicHomepageSetting> getHomepageSetting(String clinicId) async {
    final endpoint = ApiHelper.clinicHomepageSettingByIdEndpoint(clinicId);
    final response = await _apiClient.get(endpoint);

    if (response.statusCode == 404) {
      return ClinicHomepageSetting.defaults();
    }

    if (response.statusCode == 200) {
      final rawBody = response.body.trim();
      if (rawBody.isEmpty) {
        return ClinicHomepageSetting.defaults();
      }

      try {
        final data = jsonDecode(rawBody);
        if (data is Map) {
          return ClinicHomepageSetting.fromJson(
            data.map((key, value) => MapEntry(key.toString(), value)),
          );
        }

        if (data is String) {
          final normalized = data.trim();
          if (normalized.isEmpty) {
            return ClinicHomepageSetting.defaults();
          }

          final parsed = jsonDecode(normalized);
          if (parsed is Map) {
            return ClinicHomepageSetting.fromJson(
              parsed.map((key, value) => MapEntry(key.toString(), value)),
            );
          }
        }

        return ClinicHomepageSetting.defaults();
      } catch (_) {
        return ClinicHomepageSetting.defaults();
      }
    }

    throw Exception('Failed to load clinic homepage setting');
  }

  Future<List<ClinicReviewItem>> getClinicReviews({
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
      final data = jsonDecode(response.body);
      final List rawItems = (data is Map && data['items'] is List)
          ? data['items'] as List
          : (data is List ? data : const []);
      return rawItems
          .whereType<Map<String, dynamic>>()
          .map((e) => ClinicReviewItem.fromJson(e))
          .toList();
    }
    throw Exception('Failed to load clinic reviews');
  }
}
