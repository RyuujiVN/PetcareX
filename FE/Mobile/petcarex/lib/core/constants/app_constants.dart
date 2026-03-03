import 'dart:io';

class AppConstants {
  static const String appName = 'PetCareX';
  
  // Base URL cấu hình tập trung
  // static const String baseUrl = 'http://192.168.30.79:3000'; // IP Wi-Fi máy thật
  static const String baseUrl = 'http://localhost:3000'; // Dùng cho adb reverse / Emulator
  
  // Các endpoint khác nếu cần
  static const String loginEndpoint = '/auth/login';
  static const String registerEndpoint = '/auth/register';
  static const String userEndpoint = '/user';
}
