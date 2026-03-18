import 'dart:convert';

import 'package:firebase_auth/firebase_auth.dart';
import 'package:flutter/material.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:google_sign_in/google_sign_in.dart';

import '../../../../core/constants/app_constants.dart';
import '../../../../core/network/api_client.dart';
import '../../../../core/network/api_helper.dart';
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
  Future<bool> login(
    String email,
    String password, {
    bool rememberMe = false,
  }) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();

    try {
      final response = await _apiClient.post(
        AppConstants.END_POINT_AUTH_LOGIN,
        {'email': email, 'password': password},
      );

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
      final response = await _apiClient
          .post(AppConstants.END_POINT_AUTH_CHANGE_PASSWORD, {
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

  String? _extractFirstMessage(dynamic rawMessage) {
    if (rawMessage == null) return null;

    if (rawMessage is List) {
      for (final item in rawMessage) {
        final message = item?.toString().trim();
        if (message != null && message.isNotEmpty) {
          return message;
        }
      }
      return null;
    }

    final message = rawMessage.toString().trim();
    if (message.isEmpty) return null;
    return message;
  }

  String _parseErrorMessage(dynamic body) {
    if (body == null) return 'errorUnknown';

    if (body is Map) {
      final error = body['error'];
      if (error is Map) {
        final nestedMessage = _extractFirstMessage(error['message']);
        if (nestedMessage != null) {
          return nestedMessage;
        }
      }

      final topMessage = _extractFirstMessage(body['message']);
      if (topMessage != null) {
        return topMessage;
      }
    }

    final fallbackMessage = _extractFirstMessage(body);
    if (fallbackMessage != null) {
      return fallbackMessage;
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

      final GoogleSignInAuthentication googleAuth =
          await googleUser.authentication;
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

      // Gửi tokenid xuống BE
      final response = await _apiClient.post(
        AppConstants.END_POINT_AUTH_LOGIN_GOOGLE,
        {'googleIdToken': idToken},
      );

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
        _errorMessage = _parseErrorMessage(body);
        _isLoading = false;
        notifyListeners();
        return false;
      }
    } catch (e) {
      if (e.toString().contains('ApiException: 7') ||
          e.toString().contains('network_error')) {
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
      final response = await _apiClient.get(
        AppConstants.END_POINT_USER_PROFILE,
      );
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
      final response = await _apiClient.get(
        AppConstants.END_POINT_USER_PROFILE,
      );
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

      final response = await _apiClient.put(
        ApiHelper.userByIdEndpoint(_user!.id),
        data,
      );

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
      final response = await _apiClient.postMultipart(
        AppConstants.END_POINT_USER_UPLOAD,
        filePath,
      );

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
      final response = await _apiClient.post(
        AppConstants.END_POINT_AUTH_FORGOT_PASSWORD,
        {'email': email},
      );
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
      final response = await _apiClient
          .post(AppConstants.END_POINT_AUTH_RESET_PASSWORD, {
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
