import 'dart:io';

Future<void> setupAdbReverse() async {
  try {
    final result = await Process.run(
      'adb',
      ['reverse', 'tcp:3000', 'tcp:3000'],
    );
    
    if (result.exitCode == 0) {
      print('✅ ADB Reverse cấu hình thành công');
    } else {
      print('❌ Lỗi ADB: ${result.stderr}');
    }
  } catch (e) {
    print('⚠️ Cảnh báo: Không tìm thấy ADB hoặc không thể chung - $e');
    print('💡 Hãy đảm bảo Android SDK được cài và PATH được cấu hình');
  }
}
