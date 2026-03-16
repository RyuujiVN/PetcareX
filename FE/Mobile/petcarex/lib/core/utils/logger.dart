import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:http/http.dart' as http;

class AppLogger {
  static void logRequest(String method, String url, Map<String, String> headers, [dynamic body]) {
    if (!kDebugMode) return;

    final safeHeaders = Map<String, String>.from(headers);
    if (safeHeaders.containsKey('Authorization')) {
      safeHeaders['Authorization'] = 'Bearer ***';
    }

    print('┌[API REQUEST] ──────────────────');
    print('│ Method: $method');
    print('│ URL   : $url');
    print('│ Header: $safeHeaders');
    if (body != null) {
      final safeBody = _getSafeBody(body);
      print('│ Body  : ${jsonEncode(safeBody)}');
    }
    print('└───────────────────────────────────');
  }

  static void logResponse(http.Response response) {
    if (!kDebugMode) return;

    final bodyPreview = response.body.length > 500 
        ? '${response.body.substring(0, 500)}...' 
        : response.body;

    print('┌[API RESPONSE] ──────────────────');
    print('│ Status: ${response.statusCode}');
    print('│ URL   : ${response.request?.url}');
    print('│ Body  : $bodyPreview');
    print('└───────────────────────────────────');
  }

  static void logError(String message, [dynamic error]) {
    if (!kDebugMode) return;
    print('┌[API ERROR] ─────────────────────');
    print('│ Message: $message');
    if (error != null) print('│ Error  : $error');
    print('└───────────────────────────────────');
  }

  static dynamic _getSafeBody(dynamic body) {
    if (body is! Map) return body;
    final safeBody = Map<String, dynamic>.from(body);
    const sensitiveKeys = ['password', 'newPassword', 'confirmPassword', 'oldPassword'];
    for (var key in sensitiveKeys) {
      if (safeBody.containsKey(key)) safeBody[key] = '***';
    }
    return safeBody;
  }
}
