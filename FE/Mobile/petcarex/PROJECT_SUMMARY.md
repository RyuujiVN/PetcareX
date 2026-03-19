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
- **Logic Đa Ngôn Ngữ & API:** Đồng bộ Enum (`ServiceEnum`...) giữa hệ thống giao diện và API. Frontend gọi chuỗi tiếng Việt như `Khám bệnh` cho API Payload thông qua `enum.value`, nhưng tự động sử dụng `enum.getTranslatedName(BuildContext)` để dịch trực tiếp qua `app_vi.arb` & `app_en.arb` trước khi hiển thị.
- **Tiêu chuẩn Enum:** Tất cả các Enums được lưu trữ duy nhất trong `lib/core/enums/` và loại bỏ thư mục `common/` thừa của Typescript.
- **Chuẩn hóa Booking UI theo i18n:** Đã loại bỏ chuỗi cứng còn sót trong các bước `Service`, `Doctor`, `Time`, `Summary`, `Success`.
- **Booking Step Header UX (2026-03):** Loại bỏ pattern trùng lặp title/subtitle (ví dụ `Dịch vụ`/`Dịch vụ`) ở các bước đặt lịch. Subtitle từng bước được đổi thành câu hướng dẫn có ngữ nghĩa rõ ràng (`bookingClinicSub`, `bookingServiceSub`, `bookingDoctorSub`, `bookingTimeSub`) để người dùng hiểu cần làm gì ở mỗi bước.
- **Booking Symptoms Input UX (2026-03):** Ở bước `Dịch vụ`, ô nhập `Triệu chứng` (bắt buộc) được đưa lên đầu màn và kèm helper text để người dùng nhận biết ngay từ đầu, không cần cuộn xuống cuối danh sách dịch vụ mới thấy. Đồng thời tối ưu controller nhập liệu để tránh reset con trỏ khi Provider rebuild.
- **Chuẩn hóa Enum Chuyên môn bác sĩ:** `VeterinarySpecialtyEnum` được bổ sung `getTranslatedName(context)` + `fromValue(...)` để vừa lọc theo giá trị API (tiếng Việt) vừa hiển thị theo locale.
- **Chuẩn hóa Enum trạng thái lịch hẹn:** `AppointmentStatusEnum` được bổ sung `getTranslatedName(context)` + `fromValue(...)`; luồng `AppointmentProvider` và `AppointmentPage` bắt buộc map status qua enum, không hardcode chuỗi tại UI/Provider.
- **Quy ước hiển thị trạng thái tiếng Anh:** Trạng thái `BOOKED/Hẹn thành công` phải hiển thị là **Booked** (không dùng **Confirmed**).
- **Tối ưu hóa `fromValue(...)` cho Appointment:** Chỉ map theo 2 nguồn chuẩn của enum (`enum.name` từ API key: `BOOKED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED` và `enum.value` tiếng Việt từ backend). Đã loại bỏ alias legacy dư thừa như `SUCCESS`, `PENDING`, `CONFIRMED` để giữ code gọn và dễ bảo trì.
- **Chuẩn hóa tiêu đề AppBar trang lịch hẹn:** Không dùng lại `navAppointments` (label uppercase cho bottom nav) để tránh hiển thị toàn chữ in hoa trong AppBar. Đã tách key riêng `appointmentsTitle` để hiển thị dạng title-case tự nhiên (VI: `Lịch hẹn`, EN: `Appointments`).
- **Nâng cấp Empty State cho Appointment:**
    - Tab **Sắp tới**: hiển thị tiêu đề + mô tả rõ nghĩa + CTA `Đặt lịch ngay` để dẫn người dùng qua luồng tạo lịch mới.
    - Tab **Lịch sử**: hiển thị thông điệp định hướng rằng dữ liệu hoàn thành/đã hủy sẽ xuất hiện tại đây (tránh trạng thái chỉ còn mỗi chữ tên tab).
    - Vẫn giữ `RefreshIndicator` để người dùng kéo xuống tải lại dữ liệu.
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

### 5. Dev Connectivity (Android USB)
- **Nguyên nhân cốt lõi:** Mobile đang dùng `AppConstants.baseUrl` mặc định `http://localhost:3000`; với thiết bị Android thật, `localhost` là máy điện thoại nên cần tunnel `adb reverse` về máy dev.
- **Tính chất kết nối:** `adb reverse` không bền vững qua lần rút/cắm cáp hoặc reconnect ADB, nên có thể mất mapping sau mỗi phiên.
- **Chuẩn vận hành mới (git-friendly):** `android/app/build.gradle.kts` có task `autoAdbReverseDebug` và được hook vào `preDebugBuild`, nên khi chạy `flutter run` (Android debug) sẽ tự set `adb reverse tcp:3000 tcp:3000` cho các thiết bị đang kết nối.
- **Kết quả mong muốn:** Team pull code về và chạy `flutter run` là có reverse tự động, không cần gõ lại lệnh `adb reverse` thủ công mỗi lần.
- **Chẩn đoán nhanh:** Dùng `adb reverse --list`; nếu không thấy `tcp:3000` thì nguy cơ cao app lỗi kết nối server trên Android thật.

## 📝 Hướng dẫn chạy dự án
1. **Đồng bộ ngôn ngữ:** Chạy `flutter gen-l10n` khi có thay đổi trong file `.arb`.
2. **Android USB (mặc định):** Chạy `flutter run` (debug) để kích hoạt auto reverse qua Gradle.
3. **Nếu cần set reverse thủ công:** `adb reverse tcp:3000 tcp:3000` rồi `flutter run`.
4. **Quy ước ghi file bằng PowerShell (tránh lỗi tiếng Việt):** Khi dùng `Set-Content` hoặc `Out-File`, luôn bắt buộc chỉ định `-Encoding UTF8`.
