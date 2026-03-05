import 'dart:convert';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_client.dart';
import '../data/models/pet_models.dart';

class PetRepository {
  final ApiClient _apiClient = ApiClient();

  Future<List<PetSpecies>> getSpecies() async {
    final response = await _apiClient.get(AppConstants.petSpeciesEndpoint);
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => PetSpecies.fromJson(json)).toList();
    }
    throw Exception('Lỗi khi tải danh sách loài vật nuôi');
  }

  Future<List<PetBreed>> getBreeds(String speciesId) async {
    final response = await _apiClient.get(AppConstants.petBreedsEndpoint(speciesId));
    if (response.statusCode == 200) {
      final List<dynamic> data = jsonDecode(response.body);
      return data.map((json) => PetBreed.fromJson(json)).toList();
    }
    throw Exception('Lỗi khi tải danh sách giống vật nuôi');
  }

  Future<String> uploadAvatar(String filePath) async {
    final response = await _apiClient.postMultipart(AppConstants.petUploadEndpoint, filePath);
    if (response.statusCode == 200 || response.statusCode == 201) {
      final data = jsonDecode(response.body);
      return data['file'];
    }
    throw Exception('Lỗi khi tải lên avatar');
  }

  Future<bool> createPet(CreatePetDto petDto) async {
    final response = await _apiClient.post(AppConstants.petEndpoint, petDto.toJson());
    if (response.statusCode == 200 || response.statusCode == 201) {
      return true;
    }
    
    final responseBody = jsonDecode(response.body);
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
}
