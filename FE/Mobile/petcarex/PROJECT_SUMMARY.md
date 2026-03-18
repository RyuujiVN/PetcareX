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
- **Thông báo lỗi Cứng (Hardcoded Error Messages):** Khắc phục triệt để việc Exception bắn ra các chuỗi Tiếng Việt cứng (như _"Lỗi kết nối"_, _"Đã có lỗi xảy ra"_) trực tiếp từ `AuthProvider` và `RegisterPage`. Đã định nghĩa file `ErrorHandler` để map mã lỗi (Error Keys: `errorConnection`, `errorNetwork`, `errorGoogleAuth`) với `AppLocalizations`, đảm bảo Backend Error và Internal Exception đều chuẩn đa ngôn ngữ 100%.

### ➕ Các thành phần thêm mới & Hợp nhất (Added / Unified)
- **Hệ thống màu Ngữ nghĩa (Semantic Colors):** 
    - Mở rộng `AppColors` với bộ màu: `onPrimary`, `appBarBackground`, `cardBackground`, `formFill`, `formBorder`, `formLabel`.
    - Thêm bộ màu trạng thái nhẹ: `primaryLight`, `successLight`, `errorLight`.
    - Thêm bộ màu xám chuẩn (Grayscale): `textGrey`, `borderGrey`, `iconGrey`.
- **Hệ thống Đa ngôn ngữ nâng cao:**
    - Tích hợp **Plural** (Số ít/Số nhiều) cho tiếng Anh (ví dụ: `1 year old` vs `2 years old`).
    - Sử dụng **Placeholders** cho các thông báo lỗi động (ví dụ: `pleaseEnter(label)`).
    - Đồng bộ hóa toàn bộ trạng thái lịch hẹn (`Booked`, `In progress`, `Completed`, `Cancelled`) qua i18n.
- **`PasswordTextField` Widget:** Hợp nhất logic nhập mật khẩu vào một Widget dùng chung duy nhất cho toàn bộ ứng dụng.
- **Xử lý Async an toàn:** Áp dụng kiểm tra `mounted` và `context.mounted` cho tất cả các tác vụ điều hướng và hiển thị thông báo sau khi `await`.

### ➕ Chuẩn hóa API Endpoint Registry (Refactor 2026-03)
- **Tách lớp cấu hình & endpoint rõ ràng:**
    - `lib/core/constants/app_config.dart`: chứa `appName`, `baseUrl`, `apiPrefix`.
    - `lib/core/constants/app_constants.dart`: chỉ chứa endpoint cố định theo domain (không chứa logic build URL/query).
    - `lib/core/network/api_helper.dart`: chứa helper build endpoint động + query params.
- **Chuẩn naming endpoint:** Bổ sung bộ hằng số gốc theo domain API (`END_POINT_USER`, `END_POINT_PET`, `END_POINT_CLINIC`, `END_POINT_VETERINARIAN`, `END_POINT_APPOINTMENT`, `END_POINT_MEDICAL`, `END_POINT_POST`, `END_POINT_COMMENT`, `END_POINT_TOPIC`, `END_POINT_INVOICE`, ...).
- **Chuẩn endpoint con:** Khai báo rõ ràng endpoint cố định như `profile`, `upload`, `species`, `get-all`, `replies`, `like`, `remove-like`, ... ngay trong cùng file constants.
- **Chuẩn endpoint động:** Dùng helper method trong `ApiHelper` cho route có tham số động (`{id}`, `{petId}`, `{speciesId}`, `{medicalRecordId}`, ...), ví dụ `userByIdEndpoint(...)`, `appointmentByIdEndpoint(...)`, `petByIdEndpoint(...)`.
- **Chuẩn query params:** Dùng `ApiHelper.buildEndpoint(...)` + method theo ngữ cảnh (`clinicsEndpoint(...)`, `veterinariansEndpoint(...)`, `appointmentMyEndpoint(...)`, `postsEndpoint(...)`, `postCommentsListEndpoint(...)`) để tránh nối chuỗi query thủ công.
- **Mục tiêu maintainability:** Khi backend đổi route, chỉ cần sửa tại `app_constants.dart` (endpoint cố định) và/hoặc `api_helper.dart` (route động/query), không phải chỉnh hàng loạt repository/service.
- **Các module đã migrate sang chuẩn mới:**
    - `features/appointment/data/appointment_service.dart`
    - `features/booking/data/booking_repository.dart`
    - `features/community/data/community_repository.dart`
    - `features/pet/data/pet_repository.dart`
    - `features/auth/presentation/providers/auth_provider.dart` (route `user/{id}`)

## 📁 Trạng thái các tính năng

### 1. Hệ thống đa ngôn ngữ (i18n)
- **Trạng thái:** Hoàn thành 100%.
- **Tính năng mới:** Tích hợp nút Dropdown chuyển đổi ngôn ngữ (Tiếng Việt/English) trực tiếp ngay trên cùng góc phải của màn hình **Đăng nhập** (`LoginPage`). Giúp người dùng mới dễ dàng tiếp cận app mà không cần đăng nhập vào trong.
- **Phạm vi:** Login, Register, Forgot Password, Reset Password, Home, Booking (5 bước), Appointment, Profile, Account.
- **Đặc biệt:** Hỗ trợ tính tuổi thú cưng tự động chuyển đổi đơn vị (Tuổi/Tháng/Ngày) theo ngôn ngữ. Quản lý trạng thái đa ngôn ngữ thông suốt qua `LanguageProvider`.

#### Kiến trúc Localization (Chuẩn hóa)
- **Nguồn chân lý (Source of Truth):** Chỉ dùng `app_vi.arb` và `app_en.arb` để khai báo text.
- **File Dart được phép import:** Chỉ dùng các file sinh tự động trong `lib/l10n/generated/` theo `l10n.yaml` (`output-dir: lib/l10n/generated`).
- **Dọn trùng lặp:** Đã xóa các file localization Dart cũ nằm ngoài `generated` để tránh trạng thái "2 file cùng tên nhưng nội dung khác nhau" gây nhầm khi maintain.
- **Quy ước mặc định lần đầu mở app:** `LanguageProvider` khởi tạo tiếng Việt cho người dùng chưa từng tự chọn ngôn ngữ (`user_selected_language = false`).
- **Quy ước lưu lựa chọn ngôn ngữ:** Chỉ sau khi người dùng chủ động chọn ngôn ngữ (nút đổi ngôn ngữ ở Login/Account) mới bật cờ `user_selected_language = true` để khôi phục từ cache ở các lần mở app sau.

### 2. Module Auth & Account
- **Giao diện:** Đã đồng bộ 100% với hệ thống `AppColors` mới. Không còn màu fix cứng.
- **Bảo mật:** Sử dụng `flutter_secure_storage` và tích hợp sẵn trong `ApiClient`.

### 3. Module Appointment & Booking
- **Logic Đa Ngôn Ngữ & API:** Đồng bộ Enum (`ServiceEnum`...) giữa hệ thống giao diện và API. Frontend gọi chuỗi tiếng Việt như `Khám bệnh` cho API Payload thông qua `enum.value`, nhưng tự động sử dụng `enum.getTranslatedName(BuildContext)` để dịch trực tiếp qua `app_vi.arb` & `app_en.arb` trước khi hiển thị.
- **Tiêu chuẩn Enum:** Tất cả các Enums được lưu trữ duy nhất trong `lib/core/enums/` và loại bỏ thư mục `common/` thừa của Typescript.
- **Chuẩn hóa Booking UI theo i18n:** Đã loại bỏ chuỗi cứng còn sót trong các bước `Service`, `Doctor`, `Time`, `Summary`, `Success`.
- **Chuẩn hóa Enum Chuyên môn bác sĩ:** `VeterinarySpecialtyEnum` được bổ sung `getTranslatedName(context)` + `fromValue(...)` để vừa lọc theo giá trị API (tiếng Việt) vừa hiển thị theo locale.
- **Chuẩn hóa Enum trạng thái lịch hẹn:** `AppointmentStatusEnum` được bổ sung `getTranslatedName(context)` + `fromValue(...)`; luồng `AppointmentProvider` và `AppointmentPage` bắt buộc map status qua enum, không hardcode chuỗi tại UI/Provider.
- **Quy ước hiển thị trạng thái tiếng Anh:** Trạng thái `BOOKED/Hẹn thành công` phải hiển thị là **Booked** (không dùng **Confirmed**).
- **Tối ưu hóa `fromValue(...)` cho Appointment:** Chỉ map theo 2 nguồn chuẩn của enum (`enum.name` từ API key: `BOOKED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` và `enum.value` tiếng Việt từ backend). Đã loại bỏ alias legacy dư thừa như `SUCCESS`, `PENDING`, `CONFIRMED` để giữ code gọn và dễ bảo trì.
- **Chuẩn hóa lỗi nghiệp vụ Booking:** `BookingProvider` trả về error key (`bookingErrorCompleteAllSteps`) thay vì chuỗi tiếng Việt cứng; UI map key sang `AppLocalizations` trước khi hiển thị.
- **Logic:** Tự động dịch trạng thái từ Server sang ngôn ngữ người dùng.
- **UI:** Badge trạng thái sử dụng hệ thống màu nhẹ (Light Colors) chuyên nghiệp.

### 4. Dev Connectivity (Android USB)
- **Nguyên nhân cốt lõi:** Mobile đang dùng `AppConstants.baseUrl` mặc định `http://localhost:3000`; với thiết bị Android thật, `localhost` là máy điện thoại nên cần tunnel `adb reverse` về máy dev.
- **Tính chất kết nối:** `adb reverse` không bền vững qua lần rút/cắm cáp hoặc reconnect ADB, nên có thể mất mapping sau mỗi phiên.
- **Chuẩn vận hành mới (git-friendly):** `android/app/build.gradle.kts` có task `autoAdbReverseDebug` và được hook vào `preDebugBuild`, nên khi chạy `flutter run` (Android debug) sẽ tự set `adb reverse tcp:3000 tcp:3000` cho các thiết bị đang kết nối.
- **Kết quả mong muốn:** Team pull code về và chạy `flutter run` là có reverse tự động, không cần gõ lại lệnh `adb reverse` thủ công mỗi lần.
- **Chẩn đoán nhanh:** Dùng `adb reverse --list`; nếu không thấy `tcp:3000` thì nguy cơ cao app lỗi kết nối server trên Android thật.

## 📝 Hướng dẫn chạy dự án
1. **Đồng bộ ngôn ngữ:** Chạy `flutter gen-l10n` khi có thay đổi trong file `.arb`.
2. **Android USB (mặc định):** Chạy `flutter run` (debug) để kích hoạt auto reverse qua Gradle.
3. **Nếu cần set reverse thủ công:** `adb reverse tcp:3000 tcp:3000` rồi `flutter run`.
