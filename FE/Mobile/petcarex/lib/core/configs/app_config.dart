class AppConfig {
  static const String appName = 'PetCareX';

  static const String baseUrl = String.fromEnvironment(
    'BASE_URL',
    defaultValue: 'http://localhost:3000',
  );

  static const String apiPrefix = '/api';
}
