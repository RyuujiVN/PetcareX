import 'dart:async';
import 'dart:convert';
import 'dart:io';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_client.dart';
import '../models/report_models.dart';

class ReportRepository {
  final ApiClient _apiClient = ApiClient();

  /// Gửi báo cáo lên BE. Ném exception với message nếu thất bại.
  Future<void> createReport(CreateReportRequest req) async {
    try {
      final response = await _apiClient.post(
        AppConstants.END_POINT_REPORT,
        req.toJson(),
      );

      // 200 hoặc 201 đều là thành công
      if (response.statusCode == 200 || response.statusCode == 201) {
        return;
      }

      // Đọc message lỗi từ BE nếu có
      String errorMessage = 'Không thể gửi tố cáo';
      try {
        final body = jsonDecode(response.body);
        if (body is Map && body['message'] != null) {
          errorMessage = body['message'].toString();
        }
      } catch (_) {}

      throw Exception(errorMessage);
    } on SocketException {
      throw Exception('Lỗi mạng: Vui lòng kiểm tra lại kết nối Internet.');
    } on TimeoutException {
      throw Exception('Yêu cầu quá thời gian. Vui lòng thử lại.');
    }
  }
}
