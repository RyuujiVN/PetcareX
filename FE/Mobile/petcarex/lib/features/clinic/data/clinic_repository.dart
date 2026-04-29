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

    if (response.statusCode == 200) {
      final data = jsonDecode(response.body);
      if (data is Map<String, dynamic>) {
        return ClinicHomepageSetting.fromJson(data);
      }
      // BE đôi khi trả empty body cho clinic chưa cấu hình → trả về setting rỗng.
      return ClinicHomepageSetting.fromJson(<String, dynamic>{});
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
