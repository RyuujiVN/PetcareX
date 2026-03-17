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
- **Chuỗi cứng (Hardcoded Strings):** Loại bỏ hoàn toàn các chuỗi tiếng Việt/Anh trực tiếp trong code tại các module Auth, Account, Pet, Booking và Appointment.
- **Màu sắc cứng (Hardcoded Colors):** Xóa bỏ các mã màu Hex (`Color(0xFF...)`) và các màu Material mặc định (`Colors.white`, `Colors.grey`, `Colors.blue`) rải rác trong các file giao diện.
- **Logic ngôn ngữ thủ công:** Loại bỏ các câu lệnh `if (locale == 'vi')` để xử lý định dạng tuổi hoặc tên giới tính.
- **Cảnh báo Deprecated:** Loại bỏ việc sử dụng `withOpacity` (thay bằng `withValues`).
- **Biến trạng thái dư thừa:** Xóa bỏ các biến `bool _obscureText` tại toàn bộ các trang nhập mật khẩu.

### 🐛 Các vấn đề Logic đã khắc phục
- **Đứt gãy luồng điều hướng Async (Navigation Flow):** Đã khắc phục lỗi các action bên ngoài Provider (như Đăng nhập bằng Google) gọi API thành công nhưng không điều hướng. Chuẩn hóa: Bất kỳ Future<bool> nào gọi từ Provider cũng phải được `await` và xử lý kết quả bằng `Navigator` ở tầng UI (Kèm `if(!mounted) return;`).

### ➕ Các thành phần thêm mới & Hợp nhất (Added / Unified)
- **Hệ thống màu Ngữ nghĩa (Semantic Colors):** 
    - Mở rộng `AppColors` với bộ màu: `onPrimary`, `appBarBackground`, `cardBackground`, `formFill`, `formBorder`, `formLabel`.
    - Thêm bộ màu trạng thái nhẹ: `primaryLight`, `successLight`, `errorLight`.
    - Thêm bộ màu xám chuẩn (Grayscale): `textGrey`, `borderGrey`, `iconGrey`.
- **Hệ thống Đa ngôn ngữ nâng cao:**
    - Tích hợp **Plural** (Số ít/Số nhiều) cho tiếng Anh (ví dụ: `1 year old` vs `2 years old`).
    - Sử dụng **Placeholders** cho các thông báo lỗi động (ví dụ: `pleaseEnter(label)`).
    - Đồng bộ hóa toàn bộ trạng thái lịch hẹn (`Confirmed`, `Completed`, `Cancelled`) qua i18n.
- **`PasswordTextField` Widget:** Hợp nhất logic nhập mật khẩu vào một Widget dùng chung duy nhất cho toàn bộ ứng dụng.
- **Xử lý Async an toàn:** Áp dụng kiểm tra `mounted` và `context.mounted` cho tất cả các tác vụ điều hướng và hiển thị thông báo sau khi `await`.

## 📁 Trạng thái các tính năng

### 1. Hệ thống đa ngôn ngữ (i18n)
- **Trạng thái:** Hoàn thành 100%.
- **Phạm vi:** Login, Register, Forgot Password, Reset Password, Home, Booking (5 bước), Appointment, Profile, Account.
- **Đặc biệt:** Hỗ trợ tính tuổi thú cưng tự động chuyển đổi đơn vị (Tuổi/Tháng/Ngày) theo ngôn ngữ.

### 2. Module Auth & Account
- **Giao diện:** Đã đồng bộ 100% với hệ thống `AppColors` mới. Không còn màu fix cứng.
- **Bảo mật:** Sử dụng `flutter_secure_storage` và tích hợp sẵn trong `ApiClient`.

### 3. Module Appointment & Booking
- **Logic:** Tự động dịch trạng thái từ Server sang ngôn ngữ người dùng.
- **UI:** Badge trạng thái sử dụng hệ thống màu nhẹ (Light Colors) chuyên nghiệp.

## 📝 Hướng dẫn chạy dự án
1. **Đồng bộ ngôn ngữ:** Chạy `flutter gen-l10n` khi có thay đổi trong file `.arb`.
2. **Kết nối Server:** `adb reverse tcp:3000 tcp:3000`.
3. **Khởi chạy:** `flutter run`.
