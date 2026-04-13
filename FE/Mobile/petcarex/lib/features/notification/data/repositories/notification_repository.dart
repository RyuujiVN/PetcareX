import 'dart:convert';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/notification_model.dart';

class NotificationRepository {
  final ApiClient _apiClient = ApiClient();

  /// GET /api/notification?limit=20&filter=ALL|UNREAD&createdAt=...
  Future<({List<NotificationModel> data, int totalUnread})> getNotifications({
    int limit = 20,
    String filter = 'ALL',
    DateTime? createdAt,
  }) async {
    final queryParams = <String, Object?>{
      'limit': limit,
      'filter': filter,
    };

    if (createdAt != null) {
      queryParams['createdAt'] = createdAt.toUtc().toIso8601String();
    }

    final endpoint = _buildEndpoint(
      AppConstants.END_POINT_NOTIFICATION,
      queryParams,
    );

    final response = await _apiClient.get(endpoint);

    if (response.statusCode == 200 || response.statusCode == 201) {
      final body = jsonDecode(response.body);
      final List<dynamic> rawData = body['data'] ?? [];
      final int totalUnread = body['totalUnread'] ?? 0;

      final notifications =
          rawData.map((e) => NotificationModel.fromJson(e)).toList();

      return (data: notifications, totalUnread: totalUnread);
    }

    return (data: <NotificationModel>[], totalUnread: 0);
  }

  /// PATCH /api/notification/mark-one/:id
  Future<bool> markOneAsRead(String notificationId) async {
    final endpoint =
        '${AppConstants.END_POINT_NOTIFICATION}/mark-one/$notificationId';
    final response = await _apiClient.patch(endpoint, {});
    return response.statusCode == 200;
  }

  /// PATCH /api/notification/mark-all
  Future<bool> markAllAsRead() async {
    final endpoint = '${AppConstants.END_POINT_NOTIFICATION}/mark-all';
    final response = await _apiClient.patch(endpoint, {});
    return response.statusCode == 200;
  }

  String _buildEndpoint(String path, Map<String, Object?> queryParams) {
    final normalizedQuery = <String, String>{};
    for (final entry in queryParams.entries) {
      final value = entry.value;
      if (value == null) continue;
      final str = value.toString().trim();
      if (str.isEmpty) continue;
      normalizedQuery[entry.key] = str;
    }
    if (normalizedQuery.isEmpty) return path;
    return Uri(path: path, queryParameters: normalizedQuery).toString();
  }
}
