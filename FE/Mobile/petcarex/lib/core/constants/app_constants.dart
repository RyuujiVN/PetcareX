class AppConstants {
  static const String appName = 'PetCareX';
  
  // Base URL cấu hình tập trung sử dụng --dart-define
  // Cho phép thay đổi URL mà không cần sửa code
  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'http://localhost:3000',
  );
  
  // Endpoints
  static const String loginEndpoint = '/auth/login';
  static const String registerEndpoint = '/auth/register';
  static const String forgotPasswordEndpoint = '/auth/forgot-password';
  static const String resetPasswordEndpoint = '/auth/reset-password';
  static const String userEndpoint = '/user';
}
