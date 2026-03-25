# 🐾 PetCareX Mobile Application

PetCareX là ứng dụng di động quản lý chăm sóc thú cưng toàn diện, được phát triển bằng Flutter và tích hợp với hệ thống Backend NestJS. Ứng dụng cung cấp các tính năng từ đặt lịch khám, quản lý hồ sơ thú cưng đến cộng đồng chia sẻ kinh nghiệm nuôi dưỡng.

---

## 🚀 Tính năng chính

### 🔐 Hệ thống Tài khoản (Auth)
*   **Đăng nhập đa phương thức:** Hỗ trợ Email/Password và Google Sign-In.
*   **Ghi nhớ đăng nhập:** Cơ chế tự động đăng nhập an toàn với `flutter_secure_storage`.
*   **Quên mật khẩu:** Quy trình khôi phục mật khẩu hiện đại với mã OTP 6 ô chuyên nghiệp.
*   **Bảo mật:** Tích hợp `PasswordTextField` đồng bộ cho toàn bộ ứng dụng.

### 🐶 Quản lý Thú cưng
*   Theo dõi thông tin chi tiết: Tên, loài, giống, ngày sinh, giới tính, cân nặng.
*   Tự động tính tuổi thú cưng (Tuổi/Tháng/Ngày) theo ngôn ngữ người dùng.
*   Quản lý ảnh đại diện thú cưng.

### 📅 Đặt lịch & Hẹn (Booking)
*   **Quy trình 5 bước mượt mà:** Chọn thú cưng -> Chọn phòng khám -> Chọn dịch vụ -> Chọn bác sĩ -> Chọn thời gian.
*   **Quản lý lịch hẹn:** Theo dõi lịch hẹn sắp tới và lịch sử khám bệnh.
*   **Trạng thái thời gian thực:** Đồng bộ trạng thái (Booked, In progress, Completed, Cancelled) từ Server.

### 💬 Cộng đồng (Forum)
*   **Bản tin bài viết:** Cuộn vô tận (Infinite Scroll) để xem các chia sẻ mới nhất.
*   **Tương tác:** Like/Unlike mượt mà (Optimistic UI) và bình luận.
*   **Bình luận lồng nhau:** Hệ thống Reply chuyên nghiệp, phân cấp rõ ràng.
*   **Chủ đề đa dạng:** Phân loại bài viết theo Topic lấy động từ API.

---

## 🛠 Tech Stack

*   **Framework:** [Flutter](https://flutter.dev) (Dart)
*   **State Management:** `Provider` (MultiProvider)
*   **Networking:** Custom `ApiClient` (http) tích hợp `AppLogger`.
*   **Localizations:** `flutter_localizations` (Hỗ trợ 100% Tiếng Việt & Tiếng Anh).
*   **Storage:** `shared_preferences` & `flutter_secure_storage`.
*   **Auth:** Google Sign-In & Firebase Core.

---

## 🏁 Hướng dẫn cài đặt và chạy

### 1. Yêu cầu hệ thống
*   Flutter SDK: `^3.11.0` hoặc mới hơn.
*   Android Studio / VS Code.
*   Backend NestJS đang chạy tại `http://localhost:3000`.

### 2. Cài đặt
```bash
# Lấy các dependencies
flutter pub get

# Tạo mã nguồn đa ngôn ngữ (Bắt buộc khi có thay đổi trong file .arb)
flutter gen-l10n
```

### 3. Kết nối với Backend (Android Emulator/USB)
Nếu bạn chạy trên thiết bị thật hoặc máy ảo Android, hãy chạy lệnh sau để thiết bị có thể kết nối với server ở localhost:
```bash
adb reverse tcp:3000 tcp:3000
```

### 4. Khởi chạy
```bash
flutter run
```

---

## 📁 Cấu trúc dự án
*   `lib/core/`: Chứa theme, constants, providers dùng chung và utilities.
*   `lib/features/`: Tổ chức theo module (Auth, Pet, Booking, Community, Account...).
*   `lib/l10n/`: Chứa các file định nghĩa đa ngôn ngữ (`.arb`).

---

## 📝 Nhật ký phát triển
Chi tiết về quá trình tối ưu mã nguồn và các thay đổi quan trọng có thể xem tại:
👉 [**PROJECT_SUMMARY.md**](./PROJECT_SUMMARY.md)

---
© 2026 PetCareX Team. All rights reserved.
