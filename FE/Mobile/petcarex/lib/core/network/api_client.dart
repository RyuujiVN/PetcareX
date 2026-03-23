import 'dart:convert';

import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:http/http.dart' as http;

import '../configs/app_config.dart';
import '../utils/logger.dart'; // Import mới

class ApiClient {
  static const Duration _requestTimeout = Duration(seconds: 30);
  final FlutterSecureStorage _storage = const FlutterSecureStorage();

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

  Future<http.Response> get(String endpoint) async {
    final url = Uri.parse('${AppConfig.baseUrl}$endpoint');
    final headers = await _getHeaders();
    AppLogger.logRequest('GET', url.toString(), headers);

    final response = await http
        .get(url, headers: headers)
        .timeout(_requestTimeout);
    AppLogger.logResponse(response);
    return response;
  }

  Future<http.Response> patch(
    String endpoint,
    Map<String, dynamic> body,
  ) async {
    final url = Uri.parse('${AppConfig.baseUrl}$endpoint');
    final headers = await _getHeaders();
    AppLogger.logRequest('PATCH', url.toString(), headers, body);

    final response = await http
        .patch(url, headers: headers, body: jsonEncode(body))
        .timeout(_requestTimeout);
    AppLogger.logResponse(response);
    return response;
  }

  Future<http.Response> post(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse('${AppConfig.baseUrl}$endpoint');
    final headers = await _getHeaders();
    AppLogger.logRequest('POST', url.toString(), headers, body);

    final response = await http
        .post(url, headers: headers, body: jsonEncode(body))
        .timeout(_requestTimeout);
    AppLogger.logResponse(response);
    return response;
  }

  Future<http.Response> put(String endpoint, Map<String, dynamic> body) async {
    final url = Uri.parse('${AppConfig.baseUrl}$endpoint');
    final headers = await _getHeaders();
    AppLogger.logRequest('PUT', url.toString(), headers, body);

    final response = await http
        .put(url, headers: headers, body: jsonEncode(body))
        .timeout(_requestTimeout);
    AppLogger.logResponse(response);
    return response;
  }

  Future<http.Response> delete(String endpoint) async {
    final url = Uri.parse('${AppConfig.baseUrl}$endpoint');
    final headers = await _getHeaders();
    AppLogger.logRequest('DELETE', url.toString(), headers);

    final response = await http
        .delete(url, headers: headers)
        .timeout(_requestTimeout);
    AppLogger.logResponse(response);
    return response;
  }

  Future<http.Response> postMultipart(String endpoint, String filePath) async {
    final url = Uri.parse('${AppConfig.baseUrl}$endpoint');
    final headers = await _getHeaders();
    headers.remove('Content-Type');

    AppLogger.logRequest('POST MULTIPART', url.toString(), headers);

    var request = http.MultipartRequest('POST', url);
    request.headers.addAll(headers);
    request.files.add(await http.MultipartFile.fromPath('file', filePath));

    var streamedResponse = await request.send().timeout(_requestTimeout);
    var response = await http.Response.fromStream(streamedResponse);
    AppLogger.logResponse(response);
    return response;
  }
}
