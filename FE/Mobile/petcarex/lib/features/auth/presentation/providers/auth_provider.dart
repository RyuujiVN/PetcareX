import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/constants/app_constants.dart';
import '../../data/models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  final _storage = const FlutterSecureStorage();

  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;

  // Đăng nhập
  Future<bool> login(String email, String password) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(AppConstants.loginEndpoint, {
        'email': email,
        'password': password,
      });

      final body = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        _user = UserModel.fromJson(body['userInfo']);
        final token = body['accessToken'];
        
        if (token != null) {
          await _storage.write(key: 'accessToken', value: token);
        }
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = body['message'] ?? 'Đăng nhập thất bại';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Lỗi kết nối: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // Đăng xuất
  Future<void> logout() async {
    _user = null;
    await _storage.delete(key: 'accessToken');
    notifyListeners();
  }

  // Kiểm tra trạng thái đăng nhập khi mở app
  Future<void> checkAuthStatus() async {
    final token = await _storage.read(key: 'accessToken');
    if (token != null) {
      try {
        final response = await _apiClient.get(AppConstants.userEndpoint);
        if (response.statusCode == 200) {
          _user = UserModel.fromJson(jsonDecode(response.body));
        } else {
          await logout();
        }
      } catch (e) {
        // Có thể xử lý lỗi mạng ở đây
      }
    }
    notifyListeners();
  }
}
