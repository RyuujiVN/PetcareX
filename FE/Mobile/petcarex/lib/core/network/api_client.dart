import 'dart:convert';

import 'package:flutter/foundation.dart'; // Để dùng kDebugMode
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

class ApiClient {
  // Base URL trỏ đến server của bạn
  static const String baseUrl = 'http://localhost:3000';
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

  // Hàm in nhật ký Request để kiểm tra
  void _logRequest(String method, String url, Map<String, String> headers, [dynamic body]) {
    if (kDebugMode) {
      print('🚀 [API REQUEST] $method $url');
      print('📡 Headers: $headers');
      if (body != null) print('📦 Body: ${jsonEncode(body)}');
    }
  }

  // Hàm in nhật ký Response để kiểm tra
  void _logResponse(http.Response response) {
    if (kDebugMode) {
      print('✅ [API RESPONSE] ${response.statusCode} ${response.request?.url}');
      print('📄 Body: ${response.body}');
      print('---------------------------');
    }
  }

  Future<http.Response> get(String endpoint) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    _logRequest('GET', url.toString(), headers);

    final response = await http.get(url, headers: headers);
    _logResponse(response);
    return response;
  }

  Future<http.Response> patch(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    _logRequest('PATCH', url.toString(), headers, body);

    final response = await http.patch(url, headers: headers, body: jsonEncode(body));
    _logResponse(response);
    return response;
  }

  Future<http.Response> post(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    _logRequest('POST', url.toString(), headers, body);

    final response = await http.post(url, headers: headers, body: jsonEncode(body));
    _logResponse(response);
    return response;
  }

  Future<http.Response> put(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    _logRequest('PUT', url.toString(), headers, body);

    final response = await http.put(url, headers: headers, body: jsonEncode(body));
    _logResponse(response);
    return response;
  }

  Future<http.Response> delete(String endpoint) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    _logRequest('DELETE', url.toString(), headers);

    final response = await http.delete(url, headers: headers);
    _logResponse(response);
    return response;
  }

  Future<http.Response> postMultipart(String endpoint, String filePath) async {
    final url = Uri.parse('$baseUrl$endpoint');
    final headers = await _getHeaders();
    headers.remove('Content-Type'); // MultipartRequest tự set content type

    _logRequest('POST MULTIPART', url.toString(), headers);

    var request = http.MultipartRequest('POST', url);
    request.headers.addAll(headers);
    request.files.add(await http.MultipartFile.fromPath('file', filePath));

    var streamedResponse = await request.send();
    var response = await http.Response.fromStream(streamedResponse);
    _logResponse(response);
    return response;
  }
}