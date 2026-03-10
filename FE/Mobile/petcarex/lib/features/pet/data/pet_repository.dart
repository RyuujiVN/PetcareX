import 'dart:convert';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_client.dart';
import '../data/models/pet_models.dart';

class PetRepository {
  final ApiClient _apiClient = ApiClient();

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
    
    // Đọc lỗi từ server nếu có
    try {
      final errorData = jsonDecode(response.body);
      if (errorData is Map && errorData['message'] != null) {
        final msg = errorData['message'];
        throw Exception(msg is List ? msg.join(', ') : msg.toString());
      }
    } catch (_) {}
    
    throw Exception('Lỗi khi tải lên avatar (Status: ${response.statusCode})');
  }

  Future<bool> createPet(CreatePetDto petDto) async {
    final response = await _apiClient.post(AppConstants.petEndpoint, petDto.toJson());
    if (response.statusCode == 200 || response.statusCode == 201) {
      return true;
    }
    
    dynamic responseBody;
    try {
      responseBody = jsonDecode(response.body);
    } catch (_) {
      throw Exception('Phản hồi từ máy chủ không hợp lệ');
    }
    String errorMessage = 'Lỗi khi tạo vật nuôi';
    
    if (responseBody is Map) {
      if (responseBody['error'] is Map && responseBody['error']['message'] != null) {
        final errorObj = responseBody['error'];
        if (errorObj['message'] is List) {
          errorMessage = (errorObj['message'] as List).join(', ');
        } else if (errorObj['message'] is String) {
          errorMessage = errorObj['message'];
        }
      } 
      else if (responseBody['message'] != null) {
        if (responseBody['message'] is List) {
          errorMessage = (responseBody['message'] as List).join(', ');
        } else if (responseBody['message'] is String) {
          errorMessage = responseBody['message'];
        }
      }
    }
    
    throw Exception(errorMessage);
  }

  Future<bool> updatePet(String id, UpdatePetDto petDto) async {
    final response = await _apiClient.put('${AppConstants.petEndpoint}/$id', petDto.toJson());
    if (response.statusCode == 200 || response.statusCode == 201 || response.statusCode == 204) {
      return true;
    }
    
    dynamic responseBody;
    try {
      responseBody = jsonDecode(response.body);
    } catch (_) {
      throw Exception('Phản hồi từ máy chủ không hợp lệ');
    }
    String errorMessage = 'Lỗi khi cập nhật vật nuôi';
    
    if (responseBody is Map) {
      if (responseBody['error'] is Map && responseBody['error']['message'] != null) {
        final errorObj = responseBody['error'];
        if (errorObj['message'] is List) {
          errorMessage = (errorObj['message'] as List).join(', ');
        } else if (errorObj['message'] is String) {
          errorMessage = errorObj['message'];
        }
      } 
      else if (responseBody['message'] != null) {
        if (responseBody['message'] is List) {
          errorMessage = (responseBody['message'] as List).join(', ');
        } else if (responseBody['message'] is String) {
          errorMessage = responseBody['message'];
        }
      }
    }
    
    throw Exception(errorMessage);
  }

  Future<bool> deletePet(String id) async {
    final response = await _apiClient.delete('${AppConstants.petEndpoint}/$id');
    if (response.statusCode == 200 || response.statusCode == 204) {
      return true;
    }
    
    dynamic responseBody;
    try {
      responseBody = jsonDecode(response.body);
    } catch (_) {
      throw Exception('Phản hồi từ máy chủ không hợp lệ');
    }
    String errorMessage = 'Lỗi khi xoá vật nuôi';
    
    if (responseBody is Map) {
      if (responseBody['message'] != null) {
        if (responseBody['message'] is List) {
          errorMessage = (responseBody['message'] as List).join(', ');
        } else if (responseBody['message'] is String) {
          errorMessage = responseBody['message'];
        }
      }
    }
    
    throw Exception(errorMessage);
  }
}
