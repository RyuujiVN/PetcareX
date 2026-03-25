import 'dart:convert';

import '../../../core/network/api_client.dart';
import '../../../core/network/api_helper.dart';
import 'models/pet_medical_record_models.dart';

class PetMedicalRecordRepository {
  final ApiClient _apiClient = ApiClient();

  String _parseErrorMessage(String responseBody, String fallback) {
    try {
      final data = jsonDecode(responseBody);
      if (data is Map<String, dynamic>) {
        if (data['error'] is Map && data['error']['message'] != null) {
          final msg = data['error']['message'];
          return msg is List ? msg.join(', ') : msg.toString();
        }
        if (data['message'] != null) {
          final msg = data['message'];
          return msg is List ? msg.join(', ') : msg.toString();
        }
      }
    } catch (_) {}

    return fallback;
  }

  Future<List<PetMedicalRecordSummary>> getMedicalRecordsByPetId(
    String petId, {
    int page = 1,
    int limit = 20,
  }) async {
    final endpoint = ApiHelper.buildEndpoint(
      ApiHelper.medicalByPetIdEndpoint(petId),
      queryParameters: <String, Object?>{'page': page, 'limit': limit},
    );

    final response = await _apiClient.get(endpoint);
    if (response.statusCode != 200) {
      throw Exception(
        _parseErrorMessage(response.body, 'Lỗi khi tải danh sách hồ sơ y tế'),
      );
    }

    final decoded = jsonDecode(response.body);
    final rawItems = _extractArray(decoded);

    return rawItems
        .whereType<Map<String, dynamic>>()
        .map(PetMedicalRecordSummary.fromJson)
        .where((item) => item.id.isNotEmpty)
        .toList();
  }

  Future<PetMedicalRecordDetail> getMedicalRecordDetail(String recordId) async {
    final detailRes = await _apiClient.get(ApiHelper.medicalByIdEndpoint(recordId));
    if (detailRes.statusCode != 200) {
      throw Exception(
        _parseErrorMessage(detailRes.body, 'Lỗi khi tải chi tiết phiếu khám'),
      );
    }

    final orderRes = await _apiClient.get(
      ApiHelper.medicalOrdersByMedicalIdEndpoint(recordId),
    );
    final medicineRes = await _apiClient.get(
      ApiHelper.medicalMedicinesByMedicalIdEndpoint(recordId),
    );

    final detailData = jsonDecode(detailRes.body);
    if (detailData is! Map<String, dynamic>) {
      throw Exception('Phản hồi chi tiết hồ sơ y tế không hợp lệ');
    }

    final orders = orderRes.statusCode == 200
        ? _extractArray(jsonDecode(orderRes.body))
              .whereType<Map<String, dynamic>>()
              .map(MedicalOrderItem.fromJson)
              .toList()
        : <MedicalOrderItem>[];

    final medicines = medicineRes.statusCode == 200
        ? _extractArray(jsonDecode(medicineRes.body))
              .whereType<Map<String, dynamic>>()
              .map(MedicalMedicineItem.fromJson)
              .toList()
        : <MedicalMedicineItem>[];

    return PetMedicalRecordDetail.fromJson(
      detailData,
      medicalOrders: orders,
      medicines: medicines,
    );
  }

  List<dynamic> _extractArray(dynamic decoded) {
    if (decoded is List) {
      return decoded;
    }
    if (decoded is Map<String, dynamic>) {
      final items = decoded['items'];
      if (items is List) {
        return items;
      }
      final data = decoded['data'];
      if (data is List) {
        return data;
      }
    }
    return const [];
  }
}