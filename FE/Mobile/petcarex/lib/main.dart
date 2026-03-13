import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'l10n/generated/app_localizations.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'core/providers/language_provider.dart'; // Import mới
import 'features/appointment/presentation/provider/appointment_provider.dart';
import 'features/auth/presentation/login_page.dart';
import 'features/auth/presentation/providers/auth_provider.dart';
import 'features/booking/presentation/provider/booking_provider.dart';
import 'features/pet/presentation/provider/pet_provider.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => LanguageProvider()), // Sử dụng class từ file riêng
        ChangeNotifierProvider(create: (_) => AuthProvider()),
        ChangeNotifierProvider(create: (_) => PetProvider()),
        ChangeNotifierProvider(create: (_) => BookingProvider()),
        ChangeNotifierProvider(create: (_) => AppointmentProvider()),
      ],
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    // watch sẽ rebuild MyApp khi locale thay đổi
    final languageProvider = context.watch<LanguageProvider>();

    return MaterialApp(
      title: 'PetCareX',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      locale: languageProvider.locale,
      localizationsDelegates: const [
        AppLocalizations.delegate,
        GlobalMaterialLocalizations.delegate,
        GlobalWidgetsLocalizations.delegate,
        GlobalCupertinoLocalizations.delegate,
      ],
      supportedLocales: const [
        Locale('vi'),
        Locale('en'),
      ],
      home: const LoginPage(),
    );
  }
}
