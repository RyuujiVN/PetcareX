class AppConstants {
  static const String appName = 'PetCareX';
  
  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'http://localhost:3000',
  );
  
  static const String apiPrefix = '/api';

  // Auth Endpoints
  static const String loginEndpoint = '$apiPrefix/auth/login';
  static const String registerEndpoint = '$apiPrefix/auth/register';
  static const String forgotPasswordEndpoint = '$apiPrefix/auth/forgot-password';
  static const String resetPasswordEndpoint = '$apiPrefix/auth/reset-password';
  static const String changePasswordEndpoint = '$apiPrefix/auth/change-password'; // Endpoint mới

  // User Endpoint
  static const String userEndpoint = '$apiPrefix/user';
  static const String userProfileEndpoint = '$apiPrefix/user/profile';
  static const String userUploadEndpoint = '$apiPrefix/user/upload';

  // Pet Endpoints
  static const String petEndpoint = '$apiPrefix/pet';
  static const String petSpeciesEndpoint = '$apiPrefix/pet/species';
  static const String petUploadEndpoint = '$apiPrefix/pet/upload';
  
  static String petBreedsEndpoint(String speciesId) => '$apiPrefix/pet/species/$speciesId/breed';
}
