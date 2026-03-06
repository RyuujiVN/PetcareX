import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../constants/app_constants.dart';

class ApiClient {
  static const Duration _requestTimeout = Duration(seconds: 30);
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

  // Hàm tạo Header tự động kèm Token
  Future<Map<String, String>> _getHeaders() async {
    String? token = await _storage.read(key: 'accessToken');

    final headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };

    if (token != null) {
      headers['Authorization'] = 'Bearer $token';
    }

    return headers;
  }

  // Hàm in nhật ký Request (che token nhạy cảm)
  void _logRequest(String method, String url, Map<String, String> headers, [dynamic body]) {
    if (kDebugMode) {
      final safeHeaders = Map<String, String>.from(headers);
      if (safeHeaders.containsKey('Authorization')) {
        safeHeaders['Authorization'] = 'Bearer ***';
      }
      print('🚀 [API REQUEST] $method $url');
      print('📡 Headers: $safeHeaders');
      if (body != null && body is Map) {
        final safeBody = Map<String, dynamic>.from(body);
        if (safeBody.containsKey('password')) safeBody['password'] = '***';
        if (safeBody.containsKey('newPassword')) safeBody['newPassword'] = '***';
        if (safeBody.containsKey('confirmPassword')) safeBody['confirmPassword'] = '***';
        print('📦 Body: ${jsonEncode(safeBody)}');
      }
    }
  }

  void _logResponse(http.Response response) {
    if (kDebugMode) {
      final bodyPreview = response.body.length > 200 ? '${response.body.substring(0, 200)}...' : response.body;
      print('✅ [API RESPONSE] ${response.statusCode} ${response.request?.url}');
      print('📄 Body: $bodyPreview');
      print('---------------------------');
    }
  }

  Future<http.Response> get(String endpoint) async {
    final url = Uri.parse('${AppConstants.baseUrl}$endpoint');
    final headers = await _getHeaders();
    _logRequest('GET', url.toString(), headers);

    final response = await http.get(url, headers: headers).timeout(_requestTimeout);
    _logResponse(response);
    return response;
  }

  Future<http.Response> patch(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse('${AppConstants.baseUrl}$endpoint');
    final headers = await _getHeaders();
    _logRequest('PATCH', url.toString(), headers, body);

    final response = await http.patch(url, headers: headers, body: jsonEncode(body)).timeout(_requestTimeout);
    _logResponse(response);
    return response;
  }

  Future<http.Response> post(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse('${AppConstants.baseUrl}$endpoint');
    final headers = await _getHeaders();
    _logRequest('POST', url.toString(), headers, body);

    final response = await http.post(url, headers: headers, body: jsonEncode(body)).timeout(_requestTimeout);
    _logResponse(response);
    return response;
  }

  Future<http.Response> put(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse('${AppConstants.baseUrl}$endpoint');
    final headers = await _getHeaders();
    _logRequest('PUT', url.toString(), headers, body);

    final response = await http.put(url, headers: headers, body: jsonEncode(body)).timeout(_requestTimeout);
    _logResponse(response);
    return response;
  }

  Future<http.Response> delete(String endpoint) async {
    final url = Uri.parse('${AppConstants.baseUrl}$endpoint');
    final headers = await _getHeaders();
    _logRequest('DELETE', url.toString(), headers);

    final response = await http.delete(url, headers: headers).timeout(_requestTimeout);
    _logResponse(response);
    return response;
  }

  Future<http.Response> postMultipart(String endpoint, String filePath) async {
    final url = Uri.parse('${AppConstants.baseUrl}$endpoint');
    final headers = await _getHeaders();
    headers.remove('Content-Type'); // MultipartRequest tự set content type

    _logRequest('POST MULTIPART', url.toString(), headers);

    var request = http.MultipartRequest('POST', url);
    request.headers.addAll(headers);
    request.files.add(await http.MultipartFile.fromPath('file', filePath));

    var streamedResponse = await request.send().timeout(_requestTimeout);
    var response = await http.Response.fromStream(streamedResponse);
    _logResponse(response);
    return response;
  }
}