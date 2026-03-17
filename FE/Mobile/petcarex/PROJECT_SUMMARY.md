# PetCareX Mobile Project Summary

## 📌 Tổng quan dự án
PetCareX là ứng dụng di động quản lý chăm sóc thú cưng được phát triển bằng Flutter, tích hợp với hệ thống Backend NestJS. Dự án vừa trải qua một đợt tối ưu hóa mã nguồn (Refactoring) và đồng bộ hóa giao diện (UI/UX) toàn diện.

## 🛠 Tech Stack
- **Frontend:** Flutter (Dart)
- **State Management:** `provider` (MultiProvider)
- **Đa ngôn ngữ:** `flutter_localizations` (Hỗ trợ Tiếng Việt & Tiếng Anh).
- **Networking:** Custom `ApiClient` (http) với cơ chế tự động đính kèm JWT Token.
- **Lưu trữ:** `shared_preferences` (Cài đặt) & `flutter_secure_storage` (Thông tin đăng nhập).

## ✅ Nhật ký thay đổi (Refactoring & Clean Code)

Dưới đây là chi tiết các thành phần đã được xóa bỏ và thêm mới để đảm bảo dự án sạch và dễ quản lý:

### 🗑 Các thành phần đã XÓA (Removed)
- **Chuỗi cứng (Hardcoded Strings):** Loại bỏ hơn 150 vị trí viết text tiếng Việt/Anh trực tiếp trong code. Thay thế hoàn toàn bằng hệ thống `AppLocalizations` (.arb files).
- **Màu sắc cứng (Hardcoded Colors):** Xóa bỏ các mã màu Hex (ví dụ: `Color(0xFF...)`) rải rác trong các file giao diện.
- **Biến trạng thái dư thừa:** Xóa bỏ các biến `bool _obscureText` tại trang Login, Register, Change Password.
- **Log rác:** Loại bỏ các lệnh `print()` thủ công trong `ApiClient` và các Repositories gây nhiễu Console.
- **Cấu hình lỗi thời:** Xóa bỏ `synthetic-package: true` trong `l10n.yaml` để tương thích với các bản Flutter mới (3.27+).

### ➕ Các thành phần thêm mới & Hợp nhất (Added / Unified)
- **`AppTheme` (Tối ưu hóa):** Hợp nhất toàn bộ kiểu dáng AppBar, ElevatedButton, và InputDecoration vào `ThemeData` toàn cục. Không còn cần set màu nền thủ công cho từng màn hình.
- **`AppColors` (Mở rộng):** Định nghĩa bộ mã màu chuẩn gồm `primary`, `background`, `divider`, `success`, `error`, và các mã màu `accent` đặc thù.
- **`PasswordTextField` Widget:** Widget dùng chung duy nhất cho mọi ô nhập mật khẩu. Thống nhất kiểu dấu chấm `•`, khoảng cách `letterSpacing` và logic ẩn/hiện.
- **`AppLogger` Utility:** Công cụ ghi nhật ký API chuyên nghiệp, có khung viền phân tách rõ ràng và tự động che giấu mật khẩu/token.
- **`LanguageProvider` Persistence:** Tích hợp `SharedPreferences` để ứng dụng ghi nhớ ngôn ngữ người dùng đã chọn sau khi tắt máy.
- **QR Scanner Overlay:** Khôi phục giao diện quét QR chuyên nghiệp với khung bo góc và hiệu ứng tia laser chuyển động.

## 📁 Trạng thái các tính năng

### 1. Hệ thống đa ngôn ngữ (i18n)
- **Trạng thái:** Hoàn thành 100%.
- **Phạm vi:** Login, Register, Home, Booking (5 bước), Appointment, Profile, Account.
- **Đặc biệt:** Đã dịch cả các trạng thái lịch hẹn (Status) và các thứ trong tuần (Monday - Sunday).

### 2. Quản lý thú cưng & Đặt lịch
- **Giao diện:** Đã đồng bộ màu sắc theo Theme mới.
- **Logic:** Hỗ trợ load động **Loài -> Giống** (Species -> Breed). Dữ liệu gửi lên server chuẩn UUID và định dạng ngày ISO 8601.

### 3. Bảo mật & Nhật ký
- Toàn bộ các yêu cầu API đều được qua bộ lọc của `AppLogger` để theo dõi và bảo mật thông tin nhạy cảm.

## 📝 Hướng dẫn chạy dự án
1. **Đồng bộ ngôn ngữ:** Chạy `flutter gen-l10n` khi có thay đổi trong file `.arb`.
2. **Kết nối Server:** `adb reverse tcp:3000 tcp:3000`.
3. **Khởi chạy:** `flutter run`.
