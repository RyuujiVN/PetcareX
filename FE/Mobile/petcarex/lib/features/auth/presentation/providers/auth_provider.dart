import 'dart:convert';

import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../data/models/user_model.dart';

class AuthProvider extends ChangeNotifier {
  final ApiClient _apiClient = ApiClient();
  final _storage = const FlutterSecureStorage();
  final GoogleSignIn _googleSignIn = GoogleSignIn();

  UserModel? _user;
  bool _isLoading = false;
  String? _errorMessage;

  UserModel? get user => _user;
  bool get isLoading => _isLoading;
  String? get errorMessage => _errorMessage;
  bool get isAuthenticated => _user != null;

  // 1. Đăng nhập
  Future<bool> login(String email, String password, {bool rememberMe = false}) async {
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

        if (rememberMe) {
          await _storage.write(key: 'rememberMe', value: 'true');
          await _storage.write(key: 'savedEmail', value: email);
        } else {
          await _storage.delete(key: 'rememberMe');
        }
        
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = _parseErrorMessage(body);
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

  // 2. Đổi mật khẩu (Cập nhật theo Swagger)
  Future<bool> changePassword({
    required String oldPassword,
    required String newPassword,
    required String confirmPassword,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(AppConstants.changePasswordEndpoint, {
        'oldPassword': oldPassword,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword,
      });

      final body = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        final token = body['accessToken'];
        if (token != null) {
          await _storage.write(key: 'accessToken', value: token);
        }

        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        _errorMessage = _parseErrorMessage(body);
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

  // Helper để parse message lỗi từ NestJS
  String _parseErrorMessage(dynamic body) {
    if (body == null) return 'Đã có lỗi xảy ra';
    
    // Nếu NestJS trả về cấu trúc throw new BadRequestException({message: [...]})
    if (body['error'] != null && body['error']['message'] != null) {
      final message = body['error']['message'];
      if (message is List) {
        return message.join(', ');
      }
      return message.toString();
    }
    
    if (body['message'] != null) {
      final message = body['message'];
      if (message is List) {
        return message.join(', ');
      }
      return message.toString();
    }
    
    return 'Lỗi không xác định';
  }

  // 3. Đăng nhập bằng Google
  Future<bool> loginWithGoogle() async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final GoogleSignInAccount? googleUser = await _googleSignIn.signIn();
      if (googleUser == null) {
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final GoogleSignInAuthentication googleAuth = await googleUser.authentication;
      
      final response = await _apiClient.post('${AppConstants.loginEndpoint}/google', {
        'email': googleUser.email,
        'fullName': googleUser.displayName,
        'idToken': googleAuth.idToken,
        'accessToken': googleAuth.accessToken,
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
        _errorMessage = body['message'] ?? 'Đăng nhập Google thất bại';
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'Lỗi đăng nhập Google: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // 4. Đăng xuất
  Future<void> logout() async {
    _user = null;
    await _storage.delete(key: 'accessToken');
    await _storage.delete(key: 'rememberMe');
    await _googleSignIn.signOut();
    notifyListeners();
  }

  // 5. Lấy Email đã lưu
  Future<String?> getSavedEmail() async {
    return await _storage.read(key: 'savedEmail');
  }

  // 6. Lấy trạng thái Ghi nhớ
  Future<bool> getRememberMe() async {
    final value = await _storage.read(key: 'rememberMe');
    return value == 'true';
  }

  // 7. Kiểm tra trạng thái đăng nhập
  Future<void> checkAuthStatus() async {
    final token = await _storage.read(key: 'accessToken');
    if (token == null) {
      _isLoading = false;
      notifyListeners();
      return;
    }

    _isLoading = true;
    notifyListeners();

    try {
      final response = await _apiClient.get(AppConstants.userEndpoint);
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        _user = UserModel.fromJson(body);
      } else {
        await logout();
      }
    } catch (e) {
      debugPrint("Error checking auth status: $e");
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  // 8. Quên mật khẩu
  Future<bool> forgotPassword(String email) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(AppConstants.forgotPasswordEndpoint, {'email': email});
      _isLoading = false;
      if (response.statusCode == 200 || response.statusCode == 201) {
        notifyListeners();
        return true;
      }
      _errorMessage = jsonDecode(response.body)['message'] ?? 'Gửi yêu cầu thất bại';
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Lỗi kết nối: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // 9. Đặt lại mật khẩu (Dùng OTP)
  Future<bool> resetPassword({
    required String email, 
    required String otp, 
    required String newPassword,
    required String confirmPassword,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(AppConstants.resetPasswordEndpoint, {
        'email': email,
        'otp': otp,
        'newPassword': newPassword,
        'confirmPassword': confirmPassword, 
      });
      _isLoading = false;
      final body = jsonDecode(response.body);
      if (response.statusCode == 200 || response.statusCode == 201) {
        notifyListeners();
        return true;
      }
      _errorMessage = _parseErrorMessage(body);
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'Lỗi kết nối: $e';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
