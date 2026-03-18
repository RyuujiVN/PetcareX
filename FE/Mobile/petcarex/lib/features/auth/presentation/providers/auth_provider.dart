import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
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
      _errorMessage = 'errorConnection';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  // 2. Đổi mật khẩu
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
      _errorMessage = 'errorConnection';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  String _parseErrorMessage(dynamic body) {
    if (body == null) return 'errorUnknown';
    
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
    
    return 'errorUnknown';
  }

  // 3. Đăng nhập bằng Google (Tuân thủ trạng thái rememberMe từ UI)
  Future<bool> loginWithGoogle({bool rememberMe = false}) async {
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
      final idToken = googleAuth.idToken;

      if (idToken == null) {
        _errorMessage = 'errorGoogleAuth';
        _isLoading = false;
        notifyListeners();
        return false;
      }

      final credential = GoogleAuthProvider.credential(
        accessToken: googleAuth.accessToken,
        idToken: googleAuth.idToken,
      );
      await FirebaseAuth.instance.signInWithCredential(credential);

      final response = await _apiClient.post(AppConstants.loginGoogleEndpoint, {
        'googleIdToken': idToken,
      });

      final body = jsonDecode(response.body);

      if (response.statusCode == 200 || response.statusCode == 201) {
        _user = UserModel.fromJson(body['userInfo']);
        final token = body['accessToken'];
        
        if (token != null) {
          await _storage.write(key: 'accessToken', value: token);
        }
        
        // Kiểm tra cờ rememberMe người dùng đã chọn ở UI
        if (rememberMe) {
          await _storage.write(key: 'rememberMe', value: 'true');
          await _storage.write(key: 'savedEmail', value: _user!.email);
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
      if (e.toString().contains('ApiException: 7') || e.toString().contains('network_error')) {
         _errorMessage = 'errorNetwork';
      } else if (e.toString().contains('ApiException: 10')) {
         _errorMessage = 'errorFirebase';
      } else {
         _errorMessage = 'errorGoogleAuth';
      }
      
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
    await FirebaseAuth.instance.signOut();
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
      final response = await _apiClient.get(AppConstants.userProfileEndpoint);
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

  Future<bool> fetchProfile() async {
    try {
      final response = await _apiClient.get(AppConstants.userProfileEndpoint);
      if (response.statusCode == 200) {
        final body = jsonDecode(response.body);
        _user = UserModel.fromJson(body);
        notifyListeners();
        return true;
      }
      return false;
    } catch (e) {
      debugPrint("Error fetching profile: $e");
      return false;
    }
  }

  Future<bool> updateProfile({
    required String fullName,
    required String email,
    required String phone,
    required String address,
    String? avatarUrl,
  }) async {
    if (_user == null) return false;
    
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final Map<String, dynamic> data = {
        'fullName': fullName,
        'email': email,
        'phone': phone,
        'address': address,
        'avatarUrl': avatarUrl,
      };

      final response = await _apiClient.put('${AppConstants.userEndpoint}/${_user!.id}', data);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        await fetchProfile();
        _isLoading = false;
        notifyListeners();
        return true;
      } else {
        final body = jsonDecode(response.body);
        _errorMessage = _parseErrorMessage(body);
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      _errorMessage = 'errorConnection';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  Future<String?> uploadAvatar(String filePath) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.postMultipart(AppConstants.userUploadEndpoint, filePath);
      
      if (response.statusCode == 200 || response.statusCode == 201) {
        final body = jsonDecode(response.body);
        _isLoading = false;
        notifyListeners();
        
        final fileUrl = body is Map ? body['file'] : null;
        if (fileUrl is String && fileUrl.isNotEmpty) {
          return fileUrl;
        }
        return null;
      } else {
        final body = jsonDecode(response.body);
        _errorMessage = _parseErrorMessage(body);
        _isLoading = false;
        notifyListeners();
        return null;
      }
    } catch (e) {
      _errorMessage = 'errorConnection';
      _isLoading = false;
      notifyListeners();
      return null;
    }
  }

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
      _errorMessage = jsonDecode(response.body)['message'] ?? 'errorUnknown';
      notifyListeners();
      return false;
    } catch (e) {
      _errorMessage = 'errorConnection';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

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
      _errorMessage = 'errorConnection';
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }
}
