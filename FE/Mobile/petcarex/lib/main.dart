import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'core/theme/app_theme.dart';
import 'package:firebase_core/firebase_core.dart';
import 'features/auth/presentation/login_page.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  // Thiết lập thanh trạng thái trong suốt để đồng bộ với màu app
  SystemChrome.setSystemUIOverlayStyle(
    const SystemUiOverlayStyle(
      statusBarColor: Colors.transparent,
      statusBarIconBrightness: Brightness.dark,
    ),
  );

  try {
    // Nếu bạn chưa cấu hình Firebase, dòng này sẽ báo lỗi. 
    // Tôi dùng try-catch để app vẫn chạy được giao diện.
    await Firebase.initializeApp();
  } catch (e) {
    debugPrint("Firebase chưa được cấu hình: $e");
  }

  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'PetCareX',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      home: const LoginPage(),
    );
  }
}
