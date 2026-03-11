import 'dart:convert';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_client.dart';
import '../data/models/pet_models.dart';

class PetRepository {
  final ApiClient _apiClient = ApiClient();

  /// Helper: extract error message from server response body
  String _parseErrorMessage(String responseBody, String fallback) {
    try {
      final data = jsonDecode(responseBody);
      if (data is Map) {
        // Check nested error.message first
        if (data['error'] is Map && data['error']['message'] != null) {
          final msg = data['error']['message'];
          return msg is List ? msg.join(', ') : msg.toString();
        }
        // Check top-level message
        if (data['message'] != null) {
          final msg = data['message'];
          return msg is List ? msg.join(', ') : msg.toString();
        }
      }
    } catch (_) {}
    return fallback;
  }

  Future<List<Pet>> getMyPets() async {
    final response = await _apiClient.get(AppConstants.petEndpoint);
    if (response.statusCode == 200) {
      try {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => Pet.fromJson(json)).toList();
      } catch (_) {
        throw Exception('Phản hồi từ máy chủ không hợp lệ');
      }
    }
    throw Exception('Lỗi khi tải danh sách vật nuôi của bạn');
  }

  Future<List<PetSpecies>> getSpecies() async {
    final response = await _apiClient.get(AppConstants.petSpeciesEndpoint);
    if (response.statusCode == 200) {
      try {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => PetSpecies.fromJson(json)).toList();
      } catch (_) {
        throw Exception('Phản hồi từ máy chủ không hợp lệ');
      }
    }
    throw Exception('Lỗi khi tải danh sách loài vật nuôi');
  }

  Future<List<PetBreed>> getBreeds(String speciesId) async {
    final response = await _apiClient.get(AppConstants.petBreedsEndpoint(speciesId));
    if (response.statusCode == 200) {
      try {
        final List<dynamic> data = jsonDecode(response.body);
        return data.map((json) => PetBreed.fromJson(json)).toList();
      } catch (_) {
        throw Exception('Phản hồi từ máy chủ không hợp lệ');
      }
    }
    throw Exception('Lỗi khi tải danh sách giống vật nuôi');
  }

  Future<String> uploadAvatar(String filePath) async {
    final response = await _apiClient.postMultipart(AppConstants.petUploadEndpoint, filePath);
    if (response.statusCode == 200 || response.statusCode == 201) {
      try {
        final data = jsonDecode(response.body);
        final fileUrl = data is Map ? data['file'] : null;
        if (fileUrl is String && fileUrl.isNotEmpty) {
          return fileUrl;
        }
      } catch (_) {}
      throw Exception('Phản hồi từ máy chủ không hợp lệ');
    }
    throw Exception(
      _parseErrorMessage(response.body, 'Lỗi khi tải lên avatar (Status: ${response.statusCode})'),
    );
  }

  Future<bool> createPet(PetFormDto petDto) async {
    final response = await _apiClient.post(AppConstants.petEndpoint, petDto.toJson());
    if (response.statusCode == 200 || response.statusCode == 201) {
      return true;
    }
    throw Exception(_parseErrorMessage(response.body, 'Lỗi khi tạo vật nuôi'));
  }

  Future<bool> updatePet(String id, PetFormDto petDto) async {
    final response = await _apiClient.put('${AppConstants.petEndpoint}/$id', petDto.toJson());
    if (response.statusCode == 200 || response.statusCode == 201 || response.statusCode == 204) {
      return true;
    }
    throw Exception(_parseErrorMessage(response.body, 'Lỗi khi cập nhật vật nuôi'));
  }

  Future<bool> deletePet(String id) async {
    final response = await _apiClient.delete('${AppConstants.petEndpoint}/$id');
    if (response.statusCode == 200 || response.statusCode == 204) {
      return true;
    }
    throw Exception(_parseErrorMessage(response.body, 'Lỗi khi xoá vật nuôi'));
  }
}
