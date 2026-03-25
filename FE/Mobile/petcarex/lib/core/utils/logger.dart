import 'dart:convert';

import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class AppLogger {
  static void logRequest(
    String method,
    String url,
    Map<String, String> headers, [
    dynamic body,
  ]) {
    if (!kDebugMode) return;

    final safeHeaders = Map<String, String>.from(headers);
    if (safeHeaders.containsKey('Authorization')) {
      safeHeaders['Authorization'] = 'Bearer ***';
    }

    _log('API REQUEST');
    _log('Method: $method');
    _log('URL   : $url');
    _log('Header: $safeHeaders');
    if (body != null) {
      final safeBody = _getSafeBody(body);
      _log('│ Body  : ${jsonEncode(safeBody)}');
    }
    
  }

  static void logResponse(http.Response response) {
    if (!kDebugMode) return;

    final bodyPreview = response.body.length > 500
        ? '${response.body.substring(0, 500)}...'
        : response.body;

    _log('API RESPONSE');
    _log('Status: ${response.statusCode}');
    _log('URL: ${response.request?.url}');
    _log('Body: $bodyPreview');
  }

  static void logError(String message, [dynamic error]) {
    if (!kDebugMode) return;
    _log('API ERROR');
    _log('Message: $message');
    if (error != null) _log('│ Error  : $error');
  }

  static void _log(String message) {
    debugPrint(message);
  }

  static dynamic _getSafeBody(dynamic body) {
    if (body is! Map) return body;
    final safeBody = Map<String, dynamic>.from(body);
    const sensitiveKeys = [
      'password',
      'newPassword',
      'confirmPassword',
      'oldPassword',
    ];
    for (var key in sensitiveKeys) {
      if (safeBody.containsKey(key)) safeBody[key] = '***';
    }
    return safeBody;
  }
}
