class AppConstants {
  static const String appName = 'PetCareX';
  
  // Base URL cấu hình tập trung
  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'http://localhost:3000',
  );
  
  // Thử nghiệm thêm prefix '/api' nếu backend của bạn có cấu hình global prefix
  // Nếu Swagger của bạn ghi là POST /api/auth/login thì hãy giữ nguyên.
  // Nếu chỉ là POST /auth/login thì hãy xóa chữ '/api' đi.
  static const String apiPrefix = '/api'; 

  // Endpoints (Kết hợp Prefix)
  static const String loginEndpoint = '$apiPrefix/auth/login';
  static const String registerEndpoint = '$apiPrefix/auth/register';
  static const String forgotPasswordEndpoint = '$apiPrefix/auth/forgot-password';
  static const String resetPasswordEndpoint = '$apiPrefix/auth/reset-password';
  static const String userEndpoint = '$apiPrefix/user';

  // Pet Endpoints
  static const String petEndpoint = '$apiPrefix/pet';
  static const String petSpeciesEndpoint = '$apiPrefix/pet/species';
  static const String petUploadEndpoint = '$apiPrefix/pet/upload';
  
  static String petBreedsEndpoint(String speciesId) => '$apiPrefix/pet/species/$speciesId/breed';
}
