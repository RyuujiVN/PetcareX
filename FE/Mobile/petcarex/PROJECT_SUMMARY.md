# PetCareX Mobile Project Summary

## 📌 Tổng quan dự án
PetCareX là ứng dụng di động quản lý chăm sóc thú cưng được phát triển bằng Flutter, tích hợp với hệ thống Backend NestJS. Dự án vừa trải qua một đợt tối ưu hóa mã nguồn (Refactoring) và đồng bộ hóa giao diện (UI/UX) toàn diện.

## 🛠 Tech Stack
- **Frontend:** Flutter (Dart)
- **State Management:** `provider` (MultiProvider)
- **Đa ngôn ngữ:** `flutter_localizations` (Hỗ trợ Tiếng Việt & Tiếng Anh).
- **Networking:** Custom `ApiClient` (http) với cơ chế tự động đính kèm JWT Token.
- **Lưu trữ:** `shared_preferences` (Cài đặt) & `flutter_secure_storage` (Thông tin đăng nhập).

## 📂 Workspace chuẩn khi thao tác
- **Mobile root path chuẩn:** `F:\capstone 2\code\PetcareX\FE\Mobile\petcarex`.
- **Quy ước chạy lệnh:** Tất cả lệnh Flutter/i18n/analyze cho mobile phải chạy từ đúng root path trên để tránh sai ngữ cảnh workspace.
- **Quy ước i18n:** Nguồn chân lý là `lib/l10n/app_vi.arb` và `lib/l10n/app_en.arb`; file trong `lib/l10n/generated/` chỉ là kết quả sinh tự động.

## 🔐 Cấu hình Firebase qua .env (Refactor 2026-03-23)
- **Trạng thái:** Đã chuyển Firebase config từ hardcode trong `lib/firebase_options.dart` sang đọc từ `.env` qua `flutter_dotenv`.
- **File liên quan:**
    - `.env`: chứa giá trị thật cho local dev (đã thêm đầy đủ key theo Android/iOS/Web).
    - `.env.example`: template rỗng để chia sẻ cấu trúc biến cho team.
    - `.gitignore`: đã thêm rule ignore `.env`, `.env.*` và chỉ whitelist `.env.example`.
    - `lib/main.dart`: nạp env sớm bằng `await dotenv.load(fileName: '.env');` trước `Firebase.initializeApp(...)`.
    - `lib/firebase_options.dart`: đổi từ `static const FirebaseOptions` sang getter đọc env + fail-fast khi thiếu biến.
    - `pubspec.yaml`: thêm dependency `flutter_dotenv` và khai báo asset `.env`.
- **Danh sách env bắt buộc:**
    - `FIREBASE_PROJECT_ID`, `FIREBASE_MESSAGING_SENDER_ID`, `FIREBASE_STORAGE_BUCKET`, `FIREBASE_AUTH_DOMAIN`
    - `FIREBASE_ANDROID_API_KEY`, `FIREBASE_ANDROID_APP_ID`
    - `FIREBASE_IOS_API_KEY`, `FIREBASE_IOS_APP_ID`, `FIREBASE_IOS_CLIENT_ID`, `FIREBASE_IOS_BUNDLE_ID`
    - `FIREBASE_WEB_API_KEY`, `FIREBASE_WEB_APP_ID`, `FIREBASE_WEB_MEASUREMENT_ID`
- **Phản biện bảo mật quan trọng:**
    - Với Flutter mobile/web, đưa key vào `.env` giúp **không hardcode trực tiếp trong source tracked bởi git**, nhưng **không phải cơ chế bảo mật tuyệt đối** vì key vẫn được đóng gói vào app build.
    - Cách tối ưu thực tế: kết hợp `.env` + giới hạn key phía Firebase Console (App restrictions, SHA/package/bundle/domain, API allowlist) + đưa secret thực sự nhạy cảm về backend.

## 🎨 Color System

### Mục tiêu hệ màu
- Giữ cảm giác **sáng, sạch, dễ nhìn** trên toàn app.
- Ưu tiên semantic color để tách lớp rõ ràng: nền, bề mặt, chữ chính/phụ, trạng thái, accent.
- Tránh tình trạng “muddy/flat UI” do map nhiều ngữ nghĩa về cùng một màu.

### Nguồn màu tập trung (single source of truth)
- `lib/core/theme/app_colors.dart`: định nghĩa toàn bộ semantic colors + alpha helper.
- `lib/core/theme/app_theme.dart`: map semantic colors vào `ThemeData`/`ColorScheme`.
- `lib/core/theme/app_text_styles.dart`: chuẩn text tone (title/body) dùng lại toàn app.

### Quy tắc bắt buộc khi code UI
1. **Không hardcode màu trong component** (`Colors.*`, `Color(0x...)`) cho các màn nghiệp vụ.
2. Chỉ dùng màu từ `AppColors` (hoặc màu suy ra qua helper như `primaryAlpha(...)`, `textAlpha(...)`).
3. Nếu thiếu màu mới:
    - Thêm vào `app_colors.dart` theo tên semantic.
    - Nếu ảnh hưởng global UI, map lại trong `app_theme.dart`.
    - Sau đó mới dùng trong component.
4. Không tạo biến màu cục bộ lặp lại ở từng screen khi đã có semantic color tương ứng.

### Bộ semantic colors hiện hành (Bright refresh 2026-03)
- Core: `primary`, `onPrimary`, `background`, `surface`, `cardBackground`, `appBarBackground`.
- Text/neutral: `textDark`, `textGrey`, `iconGrey`, `border`, `divider`, `borderGrey`.
- Form/action: `formFill`, `formFillDisabled`, `formBorder`, `buttonSecondary`, `buttonSecondaryText`.
- State: `primaryLight`, `success/successLight`, `error/errorLight/errorBorder`, `warning`.
- Domain accents: `male`, `female`, `infoAccent`, `petAccent`, `securityAccent`, `navInactive`.

### Ghi chú hiệu chỉnh màu gần nhất
- Sau commit `158988248a24ff9111574fd813a4b8337cb063fa`, một số màu semantic từng bị gom về cùng tông chữ/nền, làm UI tối và kém phân lớp.
- Đã hiệu chỉnh lại theo hướng bright-clean, đồng thời chuẩn hóa các màn có hardcoded màu nổi bật (`notification`, `chat`, `main`) về `AppColors`.

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
    - `lib/core/configs/app_config.dart`: chứa `appName`, `baseUrl`, `apiPrefix`.
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

### ➕ Chuẩn hóa API Upload ảnh qua Cloudinary (Refactor 2026-03)
- **Backend upload endpoint dùng chung:**
    - `POST /api/cloudinary/upload/one-file` cho upload 1 ảnh.
    - `POST /api/cloudinary/upload/multi-file` cho upload nhiều ảnh (field `files`).
- **Nguyên tắc mobile:**
    - Không gọi endpoint upload theo module (`/user/upload`, `/pet/upload`, `/clinic/upload`) ở tầng feature nữa.
    - Dùng endpoint Cloudinary dùng chung, mapping tập trung tại `lib/core/constants/app_constants.dart`.
- **Trạng thái áp dụng hiện tại:**
    - `AuthProvider.uploadAvatar(...)` (avatar user) đã đi qua endpoint Cloudinary one-file thông qua constants.
    - `PetRepository.uploadAvatar(...)` (avatar pet) đã đi qua endpoint Cloudinary one-file thông qua constants.
    - `CommunityRepository` đã bổ sung helper `uploadPostImages(...)` dùng endpoint Cloudinary multi-file, sẵn sàng cho luồng forum có ảnh.
- **Lợi ích:**
    - Tập trung hóa contract upload ảnh, giảm duplicate API giữa các module.
    - Dễ thay đổi backend storage strategy mà không phải sửa hàng loạt feature.

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
- **Login UX (scroll behavior):** Nút đổi ngôn ngữ ở `LoginPage` đã được đưa vào luồng nội dung cuộn (`SingleChildScrollView`) thay vì `Positioned` cố định. Khi người dùng cuộn màn hình, nút sẽ cuộn theo đúng ngữ cảnh giao diện.
- **Register UX Validation:** Bổ sung validate trực tiếp tại UI cho hai trường mật khẩu:
        - Thiếu mật khẩu: hiển thị `enterPassword`.
        - Thiếu xác nhận mật khẩu: hiển thị `enterConfirmPassword`.
        - Sai khớp mật khẩu/xác nhận mật khẩu: hiển thị `passwordsNotMatch`.
    Các thông báo đã đồng bộ đầy đủ VI/EN trong `app_vi.arb` và `app_en.arb`.
- **Chuẩn hóa parse lỗi Auth từ NestJS:**
        - FE ưu tiên đọc lỗi theo thứ tự: `error.message` (nested) -> `message` (top-level) -> fallback.
        - Nếu backend trả mảng lỗi validate, FE chỉ lấy **lỗi đầu tiên** để hiển thị cho người dùng (tránh nhồi nhiều lỗi một lúc).
        - Tránh hiển thị chung chung `Bad Request Exception` khi có thông điệp chi tiết.
- **Map lỗi backend sang i18n:** `ErrorHandler` đã bổ sung mapping các thông điệp validate phổ biến (ví dụ `Email không hợp lệ`, rule độ mạnh mật khẩu) sang key localization để hiển thị đúng theo ngôn ngữ hiện tại.
- **Google Auth Contract Sync (FE-BE):**
    - Backend `LoginGoogleDTO` hiện yêu cầu payload gồm `googleIdToken`, `fullName`, `avatarUrl`.
    - FE `AuthProvider.loginWithGoogle(...)` đã đồng bộ gửi đủ 3 trường trong **một request** cho cả luồng Login và Register (2 màn này dùng chung provider method).
    - Nguồn dữ liệu profile ưu tiên: `GoogleSignInAccount` -> `FirebaseAuth.currentUser`; nếu thiếu tên hiển thị thì fallback bằng phần trước `@` của email để tránh fail validate `fullName`.
- **Reset Password UX đồng bộ Register:**
    - Trường `Nhập mật khẩu mới` và `Nhập lại mật khẩu` đã dùng inline validation theo `Form` (không chỉ báo Snackbar cho lỗi sai khớp như trước).
    - Rule hiển thị lỗi thống nhất: `enterPassword`, `enterConfirmPassword`, `passwordsNotMatch`.
- **Countdown resend OTP (UI):** Khi chưa được phép gửi lại mã (`resendAfter`), text countdown được làm mờ (`AppColors.textGrey`) để phân biệt rõ trạng thái disabled/active.
- **Chuẩn hóa lỗi OTP đa ngôn ngữ:**
    - Bổ sung key i18n `invalidOtp`, `otpExpired` cho cả VI/EN.
    - `ErrorHandler` chỉ map theo key nội bộ + thông điệp backend cụ thể (exact match), không dùng contains/pattern đoán mơ hồ.
    - Nếu message không nằm trong danh sách map tường minh, FE giữ nguyên message backend để tránh biến đổi sai ngữ nghĩa.
- **Đồng bộ OTP expiry FE-BE:**
    - Đã xác định nguyên nhân lệch thời gian: backend `OtpService.createOtp(...)` trước đó set TTL = 3 phút trong khi email ghi 5 phút.
    - Sửa backend về TTL 5 phút bằng hằng số chung trong `OtpService` và dùng chính hằng số này để render nội dung email, tránh lệch cấu hình trong tương lai.

### 3. Module Appointment & Booking
- **Logic Đa Ngôn Ngữ & API:** Đồng bộ Enum (`ServiceEnum`, `AppointmentStatusEnum`, `VeterinarySpecialtyEnum`...) giữa giao diện và API. Frontend gửi **backend enum key** (ví dụ `BOOKED`, `SURGERY`, `GENERAL_EXAMINATION`) qua `enum.value`; UI chỉ hiển thị qua `enum.getTranslatedName(BuildContext)` để tự động dịch theo locale.
- **Tiêu chuẩn Enum:** Enum runtime của Flutter được đặt tập trung trong `lib/core/enums/`; mọi màn hình/business logic chỉ dùng enum Dart thay vì chuỗi cứng.
- **Chuẩn hóa Booking UI theo i18n:** Đã loại bỏ chuỗi cứng còn sót trong các bước `Service`, `Doctor`, `Time`, `Summary`, `Success`.
- **Booking Step Header UX (2026-03):** Loại bỏ pattern trùng lặp title/subtitle (ví dụ `Dịch vụ`/`Dịch vụ`) ở các bước đặt lịch. Subtitle từng bước được đổi thành câu hướng dẫn có ngữ nghĩa rõ ràng (`bookingClinicSub`, `bookingServiceSub`, `bookingDoctorSub`, `bookingTimeSub`) để người dùng hiểu cần làm gì ở mỗi bước.
- **Booking Symptoms Input UX (2026-03):** Ở bước `Dịch vụ`, ô nhập `Triệu chứng` (bắt buộc) được đưa lên đầu màn và kèm helper text để người dùng nhận biết ngay từ đầu, không cần cuộn xuống cuối danh sách dịch vụ mới thấy. Đồng thời tối ưu controller nhập liệu để tránh reset con trỏ khi Provider rebuild.
- **Chuẩn hóa Enum Chuyên môn bác sĩ:** `VeterinarySpecialtyEnum` dùng `getTranslatedName(context)` + `fromValue(...)` để parse ổn định theo enum key backend và hiển thị theo locale.
- **Chuẩn hóa Enum trạng thái lịch hẹn:** `AppointmentStatusEnum` được bổ sung `getTranslatedName(context)` + `fromValue(...)`; luồng `AppointmentProvider` và `AppointmentPage` bắt buộc map status qua enum, không hardcode chuỗi tại UI/Provider.
- **Mở rộng coverage i18n cho enum (2026-03):** Bổ sung key VI/EN + `getTranslatedName(context)` cho các nhóm: `InvoiceStatusEnum`, `RoleEnum`, `MedicineUnitEnum`, `PetSpeciesEnum`, `PetBreedEnum`; đồng bộ quy tắc parse qua `fromValue(...)` theo chuẩn hóa chữ hoa.
- **Type-safe Appointment Status (2026-03):** `Appointment.status` được nâng cấp sang kiểu `AppointmentStatusEnum` (không còn giữ `String` ở model). Các luồng lọc `upcoming/historical` và hiển thị badge trạng thái dùng so sánh enum trực tiếp, giữ nguyên logic nghiệp vụ nhưng an toàn kiểu dữ liệu hơn.
- **Loại bỏ hardcoded status payload (2026-03):** `AppointmentService.cancelAppointment(...)` và `updateAppointmentStatus(...)` gửi trạng thái bằng `AppointmentStatusEnum.value` thay vì chuỗi cứng (`Đã huỷ`, ...), giúp đồng bộ contract FE-BE và giảm rủi ro sai chính tả trạng thái.
- **Quy ước hiển thị trạng thái tiếng Anh:** Trạng thái `BOOKED/Hẹn thành công` phải hiển thị là **Booked** (không dùng **Confirmed**).
- **Tối ưu hóa `fromValue(...)` cho Appointment:** Chỉ map theo contract chuẩn enum key (`enum.name` và `enum.value` đều là key backend như `BOOKED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`); không duy trì alias legacy để tránh logic mơ hồ.
- **Chuẩn hóa tiêu đề AppBar trang lịch hẹn:** Không dùng lại `navAppointments` (label uppercase cho bottom nav) để tránh hiển thị toàn chữ in hoa trong AppBar. Đã tách key riêng `appointmentsTitle` để hiển thị dạng title-case tự nhiên (VI: `Lịch hẹn`, EN: `Appointments`).
- **Nâng cấp Empty State cho Appointment:**
    - Tab **Sắp tới**: hiển thị tiêu đề + mô tả rõ nghĩa + CTA `Đặt lịch ngay` để dẫn người dùng qua luồng tạo lịch mới.
    - Tab **Lịch sử**: hiển thị thông điệp định hướng rằng dữ liệu hoàn thành/đã hủy sẽ xuất hiện tại đây (tránh trạng thái chỉ còn mỗi chữ tên tab).
    - Vẫn giữ `RefreshIndicator` để người dùng kéo xuống tải lại dữ liệu.
- **Đồng bộ Home ↔ Appointment (2026-03):**
    - Mục **Lịch hẹn của tôi** tại Home không còn dùng dữ liệu demo/hardcode; đã đọc trực tiếp từ `AppointmentProvider` cùng nguồn với màn **Lịch hẹn**.
    - Home chỉ hiển thị **2 lịch sắp tới gần nhất** (lọc theo trạng thái upcoming và sắp xếp theo **ngày + giờ khám**), đảm bảo nhất quán khi so với tab **Sắp tới**.
    - UI card lịch hẹn ở Home được đồng bộ theo visual của Appointment: thumbnail thú cưng + badge trạng thái + các dòng thông tin icon (ngày giờ, bác sĩ, địa chỉ) + action bar tách riêng ở chân card.
    - Với lịch **Sắp tới**, cả Home và Appointment đều dùng chung pattern **2 nút**: `Xem chi tiết` + `Hủy`; nút `Hủy` chỉ cho phép khi trạng thái là `BOOKED` (trạng thái khác bị disable để đúng nghiệp vụ).
- **Chuẩn hóa CTA "Khám phá" trong module Appointment (2026-03):**
    - Đổi text footer card lịch sử từ `Khám phá/Explore` thành `Xem chi tiết/View details` để đúng ngữ nghĩa hành động.
    - Bổ sung key i18n mới: `viewDetail`, `retry`, `yes`, `no` và áp dụng ở trang Appointment/Home.
- **Chuẩn hóa dialog hủy lịch (2026-03):**
    - Form xác nhận hủy ở cả Home và Appointment dùng lựa chọn `Có/Không` (`Yes/No`) để rõ ràng quyết định người dùng, thay cho nhãn xác nhận gây nhiễu ngữ cảnh.
- **Đồng bộ contract Appointment API mới (2026-03-19):**
    - Backend `GET /api/appointment/my` trả `pet.breed` theo dạng enum string (ví dụ `DOG_GOLDEN_RETRIEVER`), không còn object `breed.name` như contract cũ.
    - Đã sửa `AppointmentPet.fromJson(...)` để parse tương thích cả 2 dạng dữ liệu (mới: string, cũ: object) nhằm tránh crash parse làm tab lịch hẹn rơi vào trạng thái lỗi.
    - UI chi tiết lịch hẹn map `pet.breed` qua `PetBreedEnum.fromValue(...).getTranslatedName(context)` để hiển thị đúng theo locale, không lộ enum key thô ra người dùng.
    - Chuẩn hóa hiển thị lỗi tải lịch: key nội bộ `failed` được resolve qua `AppLocalizations`, tránh hiện chữ `failed` trực tiếp trên giao diện.
    - Chuẩn hóa hiển thị giờ hẹn theo `HH:mm` và loại bỏ `substring(0, 5)` cứng ở step success của Booking để tránh `RangeError` khi backend đổi format giờ.
- **Chuẩn hóa lỗi nghiệp vụ Booking:** `BookingProvider` trả về error key (`bookingErrorCompleteAllSteps`) thay vì chuỗi tiếng Việt cứng; UI map key sang `AppLocalizations` trước khi hiển thị.
- **Logic:** Tự động dịch trạng thái từ Server sang ngôn ngữ người dùng.
- **UI:** Badge trạng thái sử dụng hệ thống màu nhẹ (Light Colors) chuyên nghiệp.

### 4. Module Pet (Add/Edit UI & Validation)
- **Mục tiêu UX:** Tối ưu lại màn hình **Thêm thú cưng** và **Sửa thú cưng** để tránh lệch bố cục khi báo lỗi và tăng rõ ràng thông báo cho người dùng.
- **Chuẩn hóa kiến trúc form:**
    - Dùng chung widget tại `lib/features/pet/presentation/widgets/pet_form_fields.dart` cho cả Add/Edit để đồng bộ style + logic.
    - AddPet chuyển sang cùng mô hình với EditPet: nội dung cuộn + **action bar cố định ở đáy** để nút lưu không bị trôi theo scroll.
    - Form được bọc `ConstrainedBox(maxWidth)` + `SizedBox(width: double.infinity)` để giữ hành vi layout ổn định trên nhiều kích thước màn hình.
- **Khắc phục lỗi lệch form khi validate:**
    - Chuẩn hóa `InputDecoration` và chừa khoảng helper cố định để khi có lỗi không làm nhảy lệch hàng input.
    - Ở màn hình hẹp, hàng 2 cột (Loài/Giống, Cân nặng/Màu lông) tự chuyển sang dạng dọc để tránh chèn ép giao diện.
    - Trường **Giống** được làm mờ + khóa tương tác khi người dùng chưa chọn **Loài**; chỉ mở khi đã có loài để tránh thao tác sai luồng.
- **Tối ưu ngày sinh + tuổi readonly (Add/Edit):**
    - Trường **Ngày sinh** được tách 2 cột cùng hàng với trường **Tuổi** để người dùng vừa chọn ngày vừa xem tuổi ngay lập tức.
    - Trường **Tuổi** là view-only (không cho nhập/chỉnh sửa), chỉ hiển thị giá trị tính tự động từ ngày sinh.
    - Dùng chung widget `PetBirthdateAgeFields` trong `pet_form_fields.dart` cho cả AddPet và EditPet để tránh lệch logic giữa 2 màn.
    - Chuẩn hóa helper dùng chung `formatPetAgeFromBirthdate(...)` + `calculatePetAgeTotalMonths(...)` cho **toàn bộ pet flow** (list/add/edit).
    - Công thức chuẩn tuổi theo tháng tròn: `totalMonths = (year(today) - year(dob)) * 12 + (month(today) - month(dob))`; nếu `day(today) < day(dob)` thì trừ 1 tháng (không làm tròn lên).
    - Quy tắc hiển thị mới:
        - `totalMonths < 1` -> `1 tháng tuổi`.
        - `1 <= totalMonths < 24` -> nếu chưa đủ 1 năm thì `{months} tháng`, nếu đã có năm thì `{years} năm {months} tháng`.
        - `totalMonths >= 24` -> chỉ hiển thị `{years} năm`.
    - Dữ liệu ngày sinh không hợp lệ hoặc nằm trong tương lai sẽ hiển thị trạng thái chưa có (`ageUnavailable`).
    - Vẫn giữ quy tắc responsive: màn hình hẹp thì 2 cột ngày sinh/tuổi tự xếp dọc để không vỡ bố cục.
- **Thông báo validate có ngữ nghĩa (i18n):**
    - Bỏ kiểu trả về đúng tên trường (ví dụ chỉ hiện `Giống`, `Cân nặng (kg)`).
    - Dùng message rõ nghĩa qua localization:
        - `pleaseEnter(field)`
        - `pleaseSelect(field)`
        - `invalidWeight` (cân nặng phải hợp lệ và lớn hơn 0)
        - `invalidWeightMax` (giới hạn tối đa 99.9 kg, chuẩn hóa VI/EN)
- **Đồng bộ đa ngôn ngữ trong pet flow:**
    - Bổ sung key i18n mới trong `app_vi.arb` và `app_en.arb`: `pleaseSelect`, `selectSpeciesFirst`, `invalidWeight`, `invalidWeightMax`, `uploadPhoto`, `uploadingImage`, `uploadImageSuccess`, `uploadImageFailed`.
    - View list pet tại `features/account/presentation/my_pets_page.dart` đã bỏ hàm tính tuổi cục bộ và dùng chung helper với Add/Edit để đảm bảo output thống nhất.
    - Bổ sung key i18n cho age field + display rule mới: `age`, `ageUnavailable`, `ageDisplayMinimumOneMonth`, `ageDisplayYearsMonths`, `ageDisplayYearsOnly`.
- **Ràng buộc dữ liệu Pet (đồng bộ FE-BE):**
    - **Cân nặng:** chặn ngay từ UI nếu > `99.9 kg` để tránh đẩy lỗi thô từ backend.
    - **Avatar:** người dùng có thể không upload ảnh tại thời điểm tạo/sửa; FE cho phép để trống và serialize về chuỗi rỗng khi gửi API để tương thích rule backend hiện tại (`avatar` phải là string).
    - **Màu lông:** chuyển thành bắt buộc nhập ở cả AddPet và EditPet.
- **Tối ưu loading và phản hồi:**
    - Không chặn trắng toàn màn hình khi đang tải species/breeds; dùng chỉ báo mảnh (linear progress) để giữ ngữ cảnh form.
    - Toast/SnackBar upload ảnh và lưu dữ liệu được chuẩn hóa thông điệp theo locale.
- **Đồng bộ contract Pet API mới (2026-03):**
    - Backend Pet đã chuyển sang cấu trúc enum string:
        - `GET /api/pet/species` trả về mảng `string[]` (ví dụ: `DOG`, `CAT`, ...), không còn object `{id, name}`.
        - `GET /api/pet/species/{species}/breed` trả về mảng `string[]` (ví dụ: `DOG_GOLDEN_RETRIEVER`, ...), không còn object giống có `speciesId`.
        - `GET /api/pet` trả về thú cưng với field `species` + `breed` (enum key), không còn `breedId` + object `breed`.
    - FE `PetFormDto` đã đổi payload tạo/sửa sang `{ species, breed }` để match `CreatePetDTO/UpdatePetDTO` của BE (không gửi `breedId` nữa).
    - Upload avatar pet ở mobile đã chuyển sang endpoint Cloudinary dùng chung `POST /api/cloudinary/upload/one-file` (mapping tại `app_constants.dart`).
    - Dropdown Species/Breed trong Add/Edit nhận value là enum key backend, nhưng render label qua `PetSpeciesEnum.getTranslatedName(...)` và `PetBreedEnum.getTranslatedName(...)` để UI vẫn thân thiện VI/EN.
    - Các màn hình hiển thị pet (`MyPets`, `Home`, `Booking`) đã bỏ phụ thuộc `pet.breed?.name` kiểu cũ và chuyển sang map từ `pet.breed` enum key để hiển thị tên giống theo locale.
    - Khi mở EditPet từ Home/MyPets, flow preload breed list đã đổi từ `pet.breed.speciesId` sang `pet.species`.
    - `flutter analyze` cho các file pet liên quan đã sạch issue sau khi sync contract.
- **Chuẩn UX mới cho màn xem/chỉnh sửa thú cưng (2026-03-23):**
    - `EditPetPage` mặc định ở **chế độ xem** (read-only), không còn hiển thị ngay 2 nút `Hủy` + `Lưu thay đổi` khi vừa mở màn.
    - Icon action góc phải AppBar đổi từ **thùng rác (xóa)** sang **cây bút (chỉnh sửa)**.
    - Khi người dùng bấm icon cây bút, màn hình chuyển sang **chế độ chỉnh sửa**:
        - Mở tương tác cho toàn bộ form (avatar, dropdown, text field, ngày sinh...).
        - Hiển thị lại cặp nút `Hủy` + `Lưu thay đổi` ở action bar đáy màn.
    - Nút `Hủy` trong chế độ chỉnh sửa sẽ **discard thay đổi cục bộ** và quay lại chế độ xem (không pop màn hình).
    - Ở chế độ xem, action bar đáy màn hiển thị 1 CTA duy nhất: **`Xem hồ sơ y tế`** (placeholder), hiện tại dùng để mở rộng chức năng ở phase tiếp theo.
    - Đã bổ sung key i18n mới cho cả VI/EN:
        - `viewMedicalProfile`
        - `medicalProfileComingSoon`
- **Mở rộng hồ sơ y tế cho Pet (2026-03-23):**
    - Nút `Xem hồ sơ y tế` trong `EditPetPage` đã chuyển từ placeholder sang điều hướng thực tế đến màn mới `PetMedicalRecordsPage`.
    - UX mobile của hồ sơ y tế được thiết kế theo mô hình **summary-first**:
        - Danh sách phiếu khám hiển thị dạng gọn: **Tên phiếu khám + Ngày khám**.
        - Người dùng bấm mở rộng (expand/collapse) để xem chi tiết từng phiếu ngay trong danh sách (không đẩy qua quá nhiều màn).
    - Màn chi tiết mở rộng hiển thị các trường nghiệp vụ chính:
        - `Mã hồ sơ`
        - `Tên phòng khám`
        - `Tên bác sĩ`
        - `Ngày khám`
        - `Cân nặng lúc khám`
        - `Chẩn đoán`, `Triệu chứng`, `Kết luận`, `Ghi chú`
        - `Phiếu chỉ định`
        - `Thuốc`
    - Luồng API mobile đã đồng bộ theo helper endpoint hiện có:
        - `GET /api/medical/pet/{petId}?page={page}&limit={limit}`: lấy danh sách phiếu khám theo pet.
        - `GET /api/medical/{id}`: lấy chi tiết phiếu khám.
        - `GET /api/medical/{id}/medical-order`: lấy danh sách phiếu chỉ định của phiếu khám.
        - `GET /api/medical/{id}/medicine`: lấy danh sách thuốc của phiếu khám.
    - Tối ưu hiệu năng UX:
        - Danh sách chỉ tải dữ liệu summary ban đầu.
        - Dữ liệu chi tiết + thuốc + phiếu chỉ định chỉ được gọi khi người dùng mở rộng đúng item tương ứng (lazy fetch + cache theo `recordId`).
    - Bổ sung key i18n mới VI/EN cho module hồ sơ y tế: `medicalRecordEmptyTitle`, `medicalRecordCode`, `medicalRecordClinicName`, `medicalRecordVeterinarianName`, `medicalRecordExamDate`, `medicalRecordWeightAtExam`, `medicalRecordDiagnosis`, `medicalRecordSymptoms`, `medicalRecordConclusion`, `medicalRecordOrders`, `medicalRecordMedicines`, `medicalRecordNoOrders`, `medicalRecordNoMedicines`.

### 5. Dev Connectivity (Android USB)
- **Nguyên nhân cốt lõi:** Mobile đang dùng `AppConstants.baseUrl` mặc định `http://localhost:3000`; với thiết bị Android thật, `localhost` là máy điện thoại nên cần tunnel `adb reverse` về máy dev.
- **Tính chất kết nối:** `adb reverse` không bền vững qua lần rút/cắm cáp hoặc reconnect ADB, nên có thể mất mapping sau mỗi phiên.
- **Chuẩn vận hành mới (git-friendly):** `android/app/build.gradle.kts` có task `autoAdbReverseDebug` và được hook vào `preDebugBuild`, nên khi chạy `flutter run` (Android debug) sẽ tự set `adb reverse tcp:3000 tcp:3000` cho các thiết bị đang kết nối.
- **Kết quả mong muốn:** Team pull code về và chạy `flutter run` là có reverse tự động, không cần gõ lại lệnh `adb reverse` thủ công mỗi lần.
- **Chẩn đoán nhanh:** Dùng `adb reverse --list`; nếu không thấy `tcp:3000` thì nguy cơ cao app lỗi kết nối server trên Android thật.

### 6. Community Topic API Contract Sync (2026-03-24)
- **Vấn đề thực tế:** Màn `Đăng bài` không chọn được chủ đề vì mobile vẫn gọi endpoint cũ `/api/topic/get-all` và parse response dạng `List`, trong khi backend mới trả từ `GET /api/topic?page={page}&limit={limit}` với payload `{ items, meta }`.
- **Root cause kỹ thuật:**
    - Repository topic parse sai shape response nên danh sách topic rỗng.
    - Model topic chỉ đọc field `name` trong khi backend trả `nameVn`, `nameEng`.
- **Thay đổi đã áp dụng ở mobile:**
    - `ApiHelper` bổ sung `topicsEndpoint(page, limit, search)`.
    - `CommunityRepository.getTopics()` chuyển qua endpoint mới `/api/topic` và parse tương thích cả 2 dạng: `List` (legacy) và `{items, meta}` (current).
    - `Topic.fromJson(...)` hỗ trợ fallback tên theo thứ tự `name` -> `nameVn` -> `nameEng`.
    - `CreatePostPage` tải topic qua `fetchTopics()` (không gọi lại toàn bộ `fetchInitialData()`), đồng thời hiển thị tên chủ đề theo locale hiện tại (`vi` ưu tiên `nameVn`, `en` ưu tiên `nameEng`).
    - Dropdown được guard value hợp lệ để tránh lỗi khi topic list reload/đổi dữ liệu.
- **Chiến lược tương thích ngược:** Giữ parser linh hoạt để giảm rủi ro khi backend chuyển tiếp giữa contract cũ/mới.

### 6. Community Topic API Contract Sync (EN)
- **Observed issue:** The `Create Post` screen could not select a topic because mobile was still calling the old `/api/topic/get-all` endpoint and parsing a plain `List`, while backend now returns `GET /api/topic?page={page}&limit={limit}` with `{ items, meta }`.
- **Technical root cause:**
    - Topic repository expected the wrong response shape, resulting in an empty topic list.
    - Topic model only read `name`, while backend now sends `nameVn` and `nameEng`.
- **Applied mobile updates:**
    - Added `topicsEndpoint(page, limit, search)` in `ApiHelper`.
    - Updated `CommunityRepository.getTopics()` to call `/api/topic` and parse both formats: legacy `List` and current `{items, meta}`.
    - Updated `Topic.fromJson(...)` with fallback order: `name` -> `nameVn` -> `nameEng`.
    - Updated `CreatePostPage` to load topics via `fetchTopics()` (instead of full `fetchInitialData()`), and render localized topic names by current locale (`vi` prefers `nameVn`, `en` prefers `nameEng`).
    - Added Dropdown selected-value guard to avoid invalid-value UI state after topic refresh.
- **Backward-compatibility strategy:** Keep tolerant parsing to reduce risk during backend contract transition.

## 📝 Hướng dẫn chạy dự án
1. **Vào đúng root mobile trước khi chạy lệnh:** `Set-Location "F:\capstone 2\code\PetcareX\FE\Mobile\petcarex"`.
2. **Đồng bộ ngôn ngữ:** Chạy `flutter gen-l10n` khi có thay đổi trong file `.arb`.
3. **Android USB (mặc định):** Chạy `flutter run` (debug) để kích hoạt auto reverse qua Gradle.
4. **Nếu cần set reverse thủ công:** `adb reverse tcp:3000 tcp:3000` rồi `flutter run`.
5. **Quy ước ghi file bằng PowerShell (tránh lỗi tiếng Việt):** Khi dùng `Set-Content` hoặc `Out-File`, luôn bắt buộc chỉ định `-Encoding UTF8`.
