# petcarex

A new Flutter project.

## Getting Started

This project is a starting point for a Flutter application.

A few resources to get you started if this is your first Flutter project:

- [Learn Flutter](https://docs.flutter.dev/get-started/learn-flutter)
- [Write your first Flutter app](https://docs.flutter.dev/get-started/codelab)
- [Flutter learning resources](https://docs.flutter.dev/reference/learning-resources)

For help getting started with Flutter development, view the
[online documentation](https://docs.flutter.dev/), which offers tutorials,
samples, guidance on mobile development, and a full API reference.

## Chạy app Android (USB)
Nếu thiết bị chưa ở trạng thái `device` (ví dụ `unauthorized`), hãy mở lại USB debugging và chạy tay lệnh sau khi cần:
```powershell
adb reverse tcp:3000 tcp:3000
```
Hoặc chạy tại cmd:
C:\Users\{Model Device}\AppData\Local\Android\Sdk\platform-tools\adb.exe reverse tcp:3000 tcp:3000