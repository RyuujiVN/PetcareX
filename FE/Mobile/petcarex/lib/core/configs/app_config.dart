import 'package:flutter_dotenv/flutter_dotenv.dart';

class AppConfig {
  static const String appName = 'PetCareX';

  static String get baseUrl {
    final fromEnv = dotenv.env['BASE_URL']?.trim();
    if (fromEnv != null && fromEnv.isNotEmpty) {
      return fromEnv;
    }
    return const String.fromEnvironment(
      'BASE_URL',
      defaultValue: 'http://localhost:3000',
    );
  }

  static const String apiPrefix = '/api';
}
