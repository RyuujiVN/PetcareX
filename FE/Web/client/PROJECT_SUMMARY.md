# PetCareX Web Client Project Summary

## Tổng quan dự án
PetCareX Web Client là ứng dụng frontend cho 3 nhóm người dùng chính:
- Client Portal: Chủ nuôi thú cưng (đặt lịch, quản lý thú cưng, hồ sơ y tế, diễn đàn, chatbot AI).
- Admin Clinic Portal: Quản lý phòng khám (quản lý lịch hẹn, bác sĩ, hồ sơ khám).
- Veterinarian Portal: Bác sĩ thú y (quản lý lịch, lập phiếu khám, xem hồ sơ bệnh án).

Dự án được xây dựng theo kiến trúc route-based, tách theo từng portal trong `src/pages`, `src/layouts`, đồng thời chuẩn hóa lớp dùng chung theo `src/services`, `src/hooks`, `src/utils`, `src/constants`, `src/config`.

## Tech Stack
- Frontend core: React 19 + Vite 7.
- Routing: `react-router-dom` 7 (nested routes).
- UI: Ant Design 6, Ant Design Icons, React Icons, Lucide.
- State management: Redux Toolkit (chat rooms/messages).
- Realtime: `socket.io-client`.
- HTTP: Axios (chính) + fetch wrappers (một số module).
- Markdown rendering: `react-markdown` + `remark-gfm`.
- Social auth: Firebase Web SDK (`firebase/app`, `firebase/auth`, `firebase/analytics`).
- Styling: CSS Modules + CSS page-level + token CSS variables.

## Cập nhật mới nhất (2026-04-10)

### Cập nhật bổ sung (2026-04-13) — Fix POST /api/medical 400 & PatientInfoPanel
- Veterinarian `RecordExaminationForm`:
  - **Fix lỗi 400**: BE appointment API không trả `owner.email` và `owner.phone` trong response → FE gửi payload thiếu 2 field bắt buộc.
  - **Luồng lấy thông tin owner**: Sau khi lấy appointment → resolve `ownerId` → gọi `getUserByIdApi(ownerId)` để lấy đầy đủ `email`, `phone`, `fullName` → cập nhật vào appointment state → map vào payload POST /api/medical.
  - **Field mapping payload**: `customerName` = ownerDetail.fullName, `email` = ownerDetail.email, `phone` = ownerDetail.phone (fallback chain: ownerDetail → appointment.petRaw.owner → form values).
  - **PatientInfoPanel (read-only)**: Card thông tin bệnh nhân hiển thị ở đầu form phiếu khám khi mở từ lịch hẹn (`!isWalkIn`). 2 cột: trái = chủ nuôi (họ tên, email, SĐT), phải = thú cưng (tên, loài, giống, giới tính, tuổi, cân nặng). Toàn bộ field là text hiển thị, không có input. Badge "Thông tin từ hồ sơ đặt lịch".
  - **Edge case walk-in**: PatientInfoPanel ẩn khi `isWalkIn`, không gọi `getUserByIdApi`, luồng walk-in không bị ảnh hưởng.
  - **Edge case field thiếu**: Hiển thị "Không có thông tin" (italic, muted) thay vì crash khi field bị null/undefined.
  - **Loading state**: Hiển thị spinner khi đang fetch thông tin chủ nuôi.
  - State mới: `ownerDetail`, `ownerLoading`. Memo mới: `patientInfo`.
  - CSS: `.patientInfoCard`, `.patientInfoGrid`, `.patientInfoSection`, responsive mobile (stack 1 cột khi ≤768px).
  - i18n keys: `examForm.record.patientInfo.*` (vi + en).

### Cập nhật bổ sung (2026-04-12) — tinh chỉnh đa portal
- Veterinarian `RecordExaminationForm`:
  - Đã chuẩn hóa Chỉ số sinh tồn theo 2 field huyết áp riêng: `systolic` (tâm thu) và `diastolic` (tâm trương).
  - Có fallback tương thích dữ liệu cũ: nếu record cũ chỉ còn 1 field huyết áp thì map sang `systolic`, `diastolic` để trống.
  - Khóa chỉnh sửa tiếp tục theo OR giữa hết 15 phút kể từ `medical.createdAt` và invoice trạng thái `PAID`.
- Clinic Veterinarian list:
  - Trạng thái bác sĩ hiển thị theo dạng inline dot text (không dùng Tag): `● Đang làm việc` / `● Nghỉ việc`.
- Clinic HomePage editor:
  - Đã bổ sung nút `Xem trước` đặt cạnh cụm action lưu, mở modal preview toàn màn hình.
  - Preview render `HomePageClinic` bằng dữ liệu draft hiện tại (`forcedContent`), không phụ thuộc localStorage.
  - Đã bỏ khối preview cố định ở cuối trang editor.
- Client AI diagnosis popup:
  - Thứ tự nội dung đã chuẩn hóa: triệu chứng do chủ nuôi mô tả (nếu có) hiển thị trước, sau đó mới đến nội dung chẩn đoán AI.
  - Nếu `symptoms` rỗng/null thì ẩn hoàn toàn block triệu chứng.
- Clinic medical records list:
  - Danh sách xem phiếu khám đã hiển thị thêm ngày khám dưới tên chủ nuôi.
  - Thứ tự sắp xếp ưu tiên record có ngày khám hôm nay lên đầu, các record còn lại sắp xếp mới nhất trước.

### 1) Booking Client — bắt buộc đặt trước 3 tiếng
- Màn `BookingAppointment` đã bổ sung quy tắc lead time: người dùng phải đặt lịch trước ít nhất **3 giờ** so với thời điểm khám.
- Các khung giờ không đạt điều kiện lead time được **disable** (không ẩn), giúp người dùng vẫn thấy toàn bộ khung giờ khả dụng trong ngày.
- Validation form cũng chặn trường hợp người dùng chọn giờ không hợp lệ theo lead time.
- Khối `Lưu ý` lead time được đặt lại vị trí ở khu vực chọn giờ, nằm phía trên nhóm giờ (trên icon `Buổi sáng`) để đúng luồng thị giác khi chọn time slot.

### 1.1) Client clinic URL có ID phòng khám
- Đã bổ sung route client ` /clinic/:clinicId ` bên cạnh route cũ ` /clinic ` để hỗ trợ truy cập theo từng phòng khám cụ thể.
- Khi chọn phòng khám ở `choose-clinic`, frontend điều hướng sang URL có ID (`/clinic/{id}`) và vẫn truyền state đầy đủ.

### 2) Clinic Appointment — chỉ hiện nút xóa lịch đúng thời điểm hẹn
- Ở modal chi tiết lịch hẹn phía Clinic, action `Xóa lịch đặt` chỉ hiển thị khi:
  - trạng thái lịch là `BOOKED`, và
  - thời điểm hiện tại đã đạt hoặc vượt giờ hẹn thực tế.
- Trước giờ hẹn, nút xóa không hiển thị.

### 3) Veterinarian — khóa chỉnh sửa phiếu khám sau khi thanh toán
- `RecordExaminationForm` đã bổ sung khóa chỉnh sửa theo trạng thái hóa đơn:
  - nếu invoice của medical record là `PAID`, form chuyển read-only ngay cả khi chưa hết 15 phút.
- Form vẫn giữ cơ chế khóa 15 phút hiện có; trạng thái khóa cuối cùng là OR giữa:
  - hết thời gian chỉnh sửa, hoặc
  - đã thanh toán.
- Có lắng nghe event đồng bộ thanh toán (`APPOINTMENT_PAYMENT_SYNC_EVENT_KEY`) để khóa realtime khi Clinic vừa xác nhận thanh toán.

### 4) Notification Bell + Toast realtime (Client/Clinic/Veterinarian)
- Chuẩn hóa lại style và kích thước button chuông giữa các portal (đồng bộ form hiển thị).
- Tinh chỉnh thêm canh giữa icon chuông ở Clinic/Veterinarian để cân xứng giống client (không lệch lên trên).
- Khi có thông báo mới từ socket:
  - hiển thị toast ở góc dưới bên phải,
  - tự ẩn sau 5 giây,
  - có nút đóng `X` mặc định của Ant Design notification.
- Click item trong panel thông báo sẽ mark-as-read và điều hướng tới page phù hợp theo ngữ cảnh notification.

### 4.1) Client AI diagnosis — fetch từ backend
- Loại bỏ luồng generate chẩn đoán AI local sau khi đặt lịch từ frontend.
- Màn `AppointmentDetail` chuyển sang gọi API backend `GET /appointment/:id/ai-diagnosis` để lấy báo cáo chẩn đoán.
- Notification loại `AI_DIAGNOSIS` điều hướng về lịch hẹn kèm `appointmentId` để mở đúng ngữ cảnh dữ liệu.

### 4.2) Đánh giá phòng khám từ Hồ sơ y tế thú cưng
- Ở `MedicalRecords`, với hồ sơ đã hoàn thành, badge trạng thái được thay bằng nút `Đánh giá`.
- Click `Đánh giá` mở popup đánh giá phòng khám tương ứng với phiếu khám, gồm:
  - `rating` (chọn sao)
  - `content` (nội dung nhận xét)
- Sau khi gửi, record hiển thị `Đã đánh giá`.
- Ở `choose-clinic`, đã hiển thị rating trung bình và tổng số đánh giá theo dữ liệu client đã đánh giá.

### 5) Clinic Editor — hợp nhất 2 màn chỉnh sửa thành 1 route
- Đã dùng route hợp nhất: ` /clinic/editor/:clinicId ` (tab chỉnh sửa Trang chủ + tab chỉnh sửa thông tin phòng khám trong cùng một page).
- Legacy routes vẫn được giữ tương thích và map vào cùng page:
  - `/clinic/home-editor/:clinicId`
  - `/clinic/clinic-editor/:clinicId`
- Trên route editor mở tab mới, layout Clinic không hiển thị sidebar để tập trung chỉnh sửa.
- Đã dọn dẹp file dư thừa: bỏ phụ thuộc trực tiếp vào folder cũ `ClinicSelectionEditor` và `HomePageClinicEditor`; các tab editor đã được đặt trong `ClinicPortalEditor`.

### 6) Sidebar Clinic/Veterinarian — bổ sung ẩn/hiện
- Thêm nút toggle để ẩn/hiện sidebar, cải thiện không gian làm việc trên màn nhỏ hoặc khi cần tập trung nội dung.

## Chuẩn hóa cấu trúc thư mục (2026-04-07, cập nhật 2026-04-09)

### Cấu trúc chuẩn hiện tại (rút gọn)
- `src/services/`: API calls và business orchestration (notification REST/socket integration, AI diagnosis, Google auth bridge).
- `src/hooks/`: custom hooks theo role/domain (`client`, `Clinic`, ...).
- `src/config/`: cấu hình tích hợp (Firebase) và static content config theo module.
- `src/utils/`: utility thuần; riêng nhóm lưu trữ đặt trong `src/utils/storage/`.
- `src/constants/`: enum labels, auth storage keys, role mapping, magic values.
- `src/components/`: shared UI components.
- `src/pages/`, `src/layouts/`, `src/routes/`: route-level screens, layout và router.
- `src/data/`: **đã loại bỏ hoàn toàn** — folder đã xóa khỏi repo, không được tái tạo.

### Refactor loại bỏ trùng lặp data/ vs services/ (2026-04-09)
Lần refactor này xóa 2 file dead code trong `src/data/` vốn trùng hoàn toàn với bản chính:
- `data/client/utils/clientGoogleAuth.js` → bản chính: `services/clientGoogleAuthService.js`
- `data/client/utils/clinicHomeStorage.js` → bản chính: `utils/storage/clinicHomeStorage.js`

Không có consumer nào import từ `data/`, nên không cần cập nhật import. Folder `src/data/` đã xóa hoàn toàn.

### Danh sách services hiện tại
| File | Mô tả |
|---|---|
| `apiClient.js` | Axios instance factory (client/admin/vet) |
| `appointmentService.js` | CRUD lịch hẹn |
| `appointmentDiagnosisService.js` | AI diagnosis cho phiếu khám |
| `authService.js` | Login, register, Google OAuth API |
| `chatService.js` | Chat rooms & messages |
| `clientGoogleAuthService.js` | Google auth orchestration (Firebase → BE) |
| `clinicService.js` | CRUD phòng khám |
| `cloudinaryService.js` | Upload ảnh Cloudinary |
| `forumService.js` | Diễn đàn |
| `invoiceService.js` | Hóa đơn |
| `medicalService.js` | Hồ sơ y tế & phiếu khám |
| `notificationService.js` | Thông báo |
| `petService.js` | CRUD thú cưng |
| `userService.js` | User profile |
| `veterinarianService.js` | CRUD bác sĩ thú y |

### Quy ước thêm file mới
1. Endpoint REST/HTTP mới phải đặt trong `src/services/<domain>Service.js`.
2. Business flow tổng hợp nhiều service (không phải UI) đặt ở `src/services/`.
3. Custom hook đặt ở `src/hooks/<RoleOrDomain>/`.
4. Static config hoặc third-party bootstrap đặt ở `src/config/`.
5. Local/session storage helper đặt ở `src/utils/storage/`.
6. **Tuyệt đối không tạo file trong `src/data/`** — folder này đã bị xóa và không được tái tạo dưới bất kỳ hình thức nào.
7. Mọi lần di chuyển file phải cập nhật import và chạy build để xác nhận không vỡ luồng.

### Chuẩn hóa ngày giờ hiển thị (cập nhật 2026-04-07)

Để đồng nhất với chuẩn thông báo (notification), toàn bộ màn hình **Clinic Portal** và **Veterinarian Portal** đã chuyển sang dùng utility chung:

- `src/utils/dateTimeFormat.js`
  - `formatDateDDMMYYYY(value, fallback)` -> chuẩn `DD-MM-YYYY` (có số 0 đầu)
  - `formatTimeHHMM(value, fallback)` -> chuẩn `HH:mm` (có số 0 đầu, xử lý cả dữ liệu có giây)

#### Quy ước bắt buộc khi hiển thị ngày giờ
1. Không format trực tiếp bằng `new Date(...).toLocaleDateString('vi-VN')` trong page components của Clinic/Veterinarian.
2. Không cắt giờ thủ công bằng `.slice(0, 5)` để tránh lệch format khi backend trả về dữ liệu khác chuẩn.
3. Luôn dùng helper từ `src/utils/dateTimeFormat.js` để bảo đảm đồng nhất UI giữa các màn.
4. Notification mapper dùng chung trong `src/services/notificationService.js` chuẩn hóa mô tả lịch hẹn theo `DD-MM-YYYY` và `HH:mm` từ payload backend.

#### Các màn hình đã migrate sang formatter chung
- `src/pages/Clinic/VeterinaryClinic/AppointmentManagement/appointmentManagement.jsx`
- `src/pages/Clinic/VeterinaryClinic/InformationVererianrian/InformationVererianrian.jsx`
- `src/pages/Clinic/VeterinaryClinic/ListPetMedicalRecords/listPetMedicalRecords.jsx`
- `src/pages/Clinic/VeterinaryClinic/PetMedicalRecords/petMedicalRecords.jsx`
- `src/pages/Clinic/VeterinaryClinic/ViewMedicalRecords/viewMedicalRecords.jsx`
- `src/pages/Vererianrian/ListExaminationForm/listExaminationForm.jsx`
- `src/pages/Vererianrian/ListMedicalRecords/listMedicalRecords.jsx`
- `src/pages/Vererianrian/PetAppointmentVererianrian/petAppointmentVererianrian.jsx`
- `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx`
- `src/pages/Vererianrian/ViewPetMedicalRecords/viewPetMedicalRecords.jsx`

## Kiến trúc ứng dụng

### 1) Bootstrap & Provider Chain
Entry tại `src/main.jsx`:
- `ConfigProvider` của Ant Design (theme token global).
- `BrowserRouter`.
- Redux `Provider` (`store` gồm `room`, `message`).
- 2 auth context chạy song song:
  - `ClientAuthProvider`
  - `AdminAuthProvider`
- Init Firebase Analytics an toàn bằng `initFirebaseAnalytics()`.

### 2) Routing & Layout phân tầng
Định tuyến tập trung tại `src/routes/AppRoutes.jsx`:
- Client routes:
  - `MainLayout`: `/`, `/home`, `/clinic`, `/choose-clinic`, `/booking`, `/appointments`, `/success-booking`.
  - `HeaderLayout`: `/add-pet`, `/chatbot`, `/chat`, `/user/profile`, `/listPet`, `/medical-records`, `/forum`, ...
- Super Admin routes (role ADMIN):
  - `AdminLayout` cho `/admin/home`, `/admin/dashboard/*`.
- Admin clinic routes (role ADMIN_CLINIC):
  - `AdminClinicLayout` cho `/admin/clinic/*`.
- Veterinarian routes:
  - `AdminVererianrianLayout` cho `/admin/veterinarian/*`.
- Redirect compatibility:
  - `/admin/login` -> `/login`
  - `/admin/veterinarian/login` -> `/login`

### 3) Scroll behavior
- `src/ScrollToTop.jsx` reset vị trí cuộn mỗi lần đổi `pathname`.
- Có component dùng chung `src/components/common/ScrollToTopButton/ScrollToTopButton.jsx`:
  - Chỉ hiện khi cuộn quá ngưỡng (mặc định 300px), hỗ trợ animation fade/slide.
  - Dùng cho cả `ListPetMedicalRecords`, `Forum` và `AppointmentDetail`.
  - `Forum` gắn vào scroll container nội bộ (`leftColumn`) thay vì chỉ theo window scroll.

### 4) State và realtime
- Redux store:
  - `roomSlice`: danh sách room chat, create/rename/delete.
  - `messageSlice`: danh sách message theo room, load phân trang cũ, stream token AI.
- Socket realtime:
  - Kết nối `http://localhost:3000/chat` (hardcoded).
  - Auth qua `accessToken` (đọc từ `getToken()` — xem mục Token Storage bên dưới).

## Authentication & Role Split

### 1) Dual auth context (Client/Admin)
- `src/hooks/client/AuthContext.jsx`
- `src/hooks/adminClinic/AuthContext.jsx`

Mỗi context quản lý:
- `token`
- `userProfile`
- `login/logout`
- `refreshUserProfile`

### 2) Token Storage — Quy ước chuẩn (cập nhật 2026-04-07)

**Nguyên tắc:** Toàn bộ 4 role (CUSTOMER, ADMIN, ADMIN_CLINIC, VETERINARIAN) dùng **một key duy nhất `accessToken`** trong `localStorage`.

| Mục | Giá trị |
|---|---|
| Storage key | `accessToken` |
| Storage type | `localStorage` (shared cross-tab) |
| Header gửi BE | `Authorization: Bearer <token>` |
| Utility tập trung | `src/utils/storage/tokenStorage.js` (`getToken`, `setToken`, `removeToken`) |
| Constants | `src/constants/authStorage.js` |

**UserInfo storage** (không đổi):
- Client: `clientUserInfo` trong `localStorage`
- Admin: `adminUserInfo` trong `sessionStorage` (tab-scoped)
- Admin active role: `adminActiveRole` trong `sessionStorage`

**Legacy keys** (`clientAccessToken`, `adminAccessToken`, `userInfo`) được tự động xóa khi login/logout qua `clearLegacyAuthStorage()`.

### 3) Login chung + RBAC hậu đăng nhập
- Màn login chung: `/login`.
- `src/constants/authRole.js` xử lý:
  - normalize role
  - phân portal (`client` hoặc `admin`)
  - route đích sau login:
    - `CUSTOMER` -> `/home`
    - `ADMIN` -> `/admin/home` (super admin dashboard)
    - `ADMIN_CLINIC` -> `/admin/clinic/appointments` (quản lý phòng khám)
    - `VETERINARIAN` -> `/admin/veterinarian/appointments`

### 4) Google Login/Register
- Dùng Firebase popup (`signInWithPopup` + `GoogleAuthProvider.credentialFromResult`).
- FE gửi `googleIdToken` về backend `/auth/login-google` để lấy `accessToken` nội bộ.
- Áp dụng cho luồng login/register client tại `/login` và `/register`.

### 5) Forgot/Reset password
- Có cho cả client và admin routes.
- Có OTP expiry countdown (300s) + resend cooldown (60s).

## API Layer & Networking

### 1) Base URL
- `VITE_API_URL` (fallback: `http://localhost:3000/api`).

### 2) Kiến trúc tập trung — `src/services/`

Toàn bộ API layer đã được refactor thành service tập trung trong `src/services/` (API wrappers + business service), mỗi endpoint chỉ định nghĩa **đúng 1 lần**. Không còn duplicate giữa các role.

#### Factory & Instances — `src/services/apiClient.js`
- **2 lazy singleton** axios instance thay cho 4 instance cũ:
  - `getClientInstance()` — dùng `CLIENT_AUTH_STORAGE` (localStorage) cho client portal.
  - `getAdminInstance()` — dùng `ADMIN_AUTH_STORAGE` (sessionStorage) cho admin/clinic/vet portal.
- `applyResponseInterceptor(instance, clearFn)` — interceptor chung: normalize error message backend, 401 → clear auth + redirect `/login`.
- Export: `getClientInstance()`, `getAdminInstance()`, `API_BASE_URL`.

#### Quy ước gọi API
- Mọi service function nhận `instance` làm tham số đầu tiên (trừ cloudinary upload).
- Consumer chọn instance phù hợp role: `loginApi(getClientInstance(), payload)` hoặc `getUserListApi(getAdminInstance(), ...)`.
- Service function trả về **full axios response** — consumer tự unwrap `.data` khi cần.

#### Danh sách service file

| File | Domain | Endpoints chính |
|------|--------|----------------|
| `apiClient.js` | Foundation | `getClientInstance()`, `getAdminInstance()`, `API_BASE_URL` |
| `authService.js` | Auth | `loginApi`, `registerApi`, `loginGoogleApi`, `forgotPasswordApi`, `resetPasswordApi`, `changePasswordApi` |
| `userService.js` | User | `getUserListApi`, `getUserProfileApi`, `getUserByIdApi`, `updateUserProfileApi`, `deleteUserApi`, `uploadAvatarApi`, `uploadUserImageApi`, `uploadUserImagesApi` |
| `petService.js` | Pet | `getMyPetsApi`, `getPetByIdApi`, `createPetApi`, `updatePetApi`, `deletePetApi`, `getPetSpeciesApi`, `getBreedsBySpeciesApi`, `getPetsByOwnerApi`, `uploadPetAvatarApi` + utility re-export `getEnumLabel`, `getSpeciesLabel`, `getBreedLabel` |
| `appointmentService.js` | Appointment | `getMyAppointmentsApi` (client), `getAppointmentsApi` (clinic/vet, client-side filter), `getAppointmentByIdApi`, `createAppointmentApi`, `updateAppointmentStatusApi`, `deleteAppointmentApi`, `getServerNowApi` + constants `APPOINTMENT_STATUS`, `SERVICE_OPTIONS` |
| `clinicService.js` | Clinic | `getClinicListApi`, `getClinicByIdApi`, `createClinicApi`, `updateClinicApi`, `deleteClinicApi`, `uploadClinicAvatarApi` |
| `medicalService.js` | Medical | 15+ endpoint: CRUD medical record, medical order, medicine. Backward-compatible aliases: `createMedicalRecordApi`, `getMedicalOrderCatalogApi`, `getMedicineCatalogApi` |
| `veterinarianService.js` | Veterinarian | `getVeterinariansApi`, `getVeterinarianByClinicApi`, `createVeterinarianApi`, `updateVeterinarianApi`, `deleteVeterinarianApi` |
| `invoiceService.js` | Invoice | `getInvoiceByMedicalRecordIdApi`, `createInvoiceApi`, `updateInvoiceApi`, `upsertPaidInvoiceByMedicalApi` + `INVOICE_STATUS` |
| `forumService.js` | Forum | Post CRUD + like/unlike, Topic CRUD, Comment/Reply CRUD, `getCommentsByPostIdApi`, `getRepliesApi` |
| `chatService.js` | Chatbot | `getAllRoomsApi`, `getMessagesInRoomApi`, `createRoomApi`, `renameRoomApi`, `deleteRoomApi`, `sendMessageApi` |
| `cloudinaryService.js` | Upload | `uploadOneFileToCloudinary`, `uploadMultipleFilesToCloudinary` — dùng native `fetch()` cho multipart FormData, tự detect token từ CLIENT hoặc ADMIN storage |
| `notificationService.js` | Notification API + Mapping | gọi REST `/notification/*`, map payload BE sang UI model, đồng bộ trạng thái đọc |
| `appointmentDiagnosisService.js` | AI Diagnosis Orchestration | WebSocket AI diagnosis + fallback + local cache |
| `clientGoogleAuthService.js` | Auth Orchestration | bridge Firebase Google token -> backend `/auth/login-google` |

#### Business logic modules (sau chuẩn hóa)
- `src/services/notificationService.js` — wrapper API thông báo (list/mark-one/mark-all) + mapper UI dùng chung.
- `src/services/appointmentDiagnosisService.js` — WebSocket AI diagnosis, fallback markdown, cache local theo appointment.
- `src/hooks/Clinic/useVeterinarians.js` — React hook quản lý veterinarian list, delegate sang `services/`.
- `src/config/firebaseClient.js` — Firebase bootstrap + analytics + popup token.
- `src/services/clientGoogleAuthService.js` — xử lý Google login/register phía client.
- `src/utils/storage/clinicInfoStorage.js` — helper localStorage cho card phòng khám.
- `src/utils/storage/clinicHomeStorage.js` — helper localStorage cho nội dung HomePage theo clinic.
- `src/config/homePageClinicContent.js` — default content + builder cho HomePageClinic.

#### Cách thêm API mới đúng chuẩn
1. Xác định domain → mở service file tương ứng trong `src/services/`.
2. Thêm function với signature `export const doSomethingApi = async (instance, ...params) => { ... }`.
3. Consumer import function + instance getter: `import { doSomethingApi } from '../../services/myService'` + `import { getClientInstance } from '../../services/apiClient'`.
4. Gọi: `const response = await doSomethingApi(getClientInstance(), payload)`.
5. **Không tạo file API mới** trong `src/data/*` (đã loại bỏ) — mọi endpoint phải nằm trong `src/services/`.

### 3) Các nhóm API endpoint
- Auth: `/auth/login`, `/auth/register`, `/auth/login-google`, `/auth/forgot-password`, `/auth/reset-password`, `/auth/change-password`.
- User: `/user/profile`, `/user/:id`, upload cloudinary.
- Pet: `/pet`, `/pet/:id`, `/pet/species`, `/pet/species/:species/breed`.
- Clinic/Veterinarian: `/clinic`, `/veterinarian`.
- Appointment: `/appointment`, `/appointment/my`, `PATCH /appointment/:id`.
- Medical: `/medical/*`, `/medical/:id/medical-order`, `/medical/:id/medicine`, `/medical-order`, `/medicine`.
- Forum: `/post`, `/comment`, `/topic`.
- Chatbot: `/room`, `/room/:id/messages` + socket events.

## Client Portal - Trạng thái tính năng

### 1) Auth
- Login/register thường + Google login/register.
- Role-based redirect sau đăng nhập.
- Validation form đầy đủ.
- Header client có popup `Đổi mật khẩu` trong dropdown tài khoản:
  - Field: mật khẩu hiện tại, mật khẩu mới, xác nhận mật khẩu mới.
  - Có toggle hiện/ẩn ký tự cho từng field.
  - Validate inline (required, độ dài tối thiểu, confirm khớp) và gọi API `POST /auth/change-password`.
  - Sau đổi mật khẩu thành công, FE tự động lấy `accessToken` mới từ response backend và cập nhật vào AuthContext + localStorage qua `login(newToken)`, đảm bảo session liên tục không cần đăng nhập lại.

### 2) Home & chọn phòng khám
- `/home`: landing/marketing.
- `/choose-clinic`: lấy clinic từ API, lưu `selectedClinicId` vào sessionStorage, điều hướng `/clinic`.
- Dữ liệu card phòng khám ở `/choose-clinic` có thể được cá nhân hóa theo từng clinic bằng localStorage key `clinicInfo_{clinicId}` (avatar/tên/địa chỉ/ngày-giờ mở cửa/số điện thoại), fallback về dữ liệu API nếu chưa có dữ liệu lưu.
- `/clinic`: load nội dung HomePageClinic theo phòng khám được chọn (`selectedClinicId`) và CTA đẩy sang `/booking`.
- Dữ liệu HomePageClinic được tách theo key localStorage `homePage_{clinicId}` (fallback về default content nếu chưa có dữ liệu lưu).
- Phần giới thiệu bệnh viện chỉ hiển thị ~100 từ đầu + nút `Đọc thêm`; bấm `Đọc thêm` mở popup hiển thị toàn bộ nội dung, đóng bằng nút `X`.

### 3) Booking Appointment
Luồng đang chạy (cập nhật 2026-04-13):

1. Chọn pet (card ngang, drag scroll).
2. Chọn dịch vụ + clinic (dropdown Ant Design Select).
3. **Chọn Khoa / Chuyên khoa** (button group ngang) — lọc theo `VETERINARY_SPECIALTY_LABELS` từ `src/constants/enumLabels.js`, có option "Tất cả". Khi chọn khoa → gọi `getVeterinarianByClinicApi(instance, clinicId, 1, 50, '', specialty)` để filter bác sĩ phía API.
4. **Chọn Bác sĩ** (card grid 2 cột desktop / 1 cột mobile) — mỗi card hiển thị avatar, tên, specialty badge. Card được chọn có border highlight + checkmark icon. Loading state khi fetch, Empty state khi không có bác sĩ.
   - **TODO placeholder** tại `src/pages/client/User/BookingAppointment/index.jsx` dòng `{/* TODO: Doctor description panel - cần BE bổ sung field 'description' vào API GET /api/veterinarian */}` — chờ BE bổ sung field `description`, sau đó hiển thị panel mô tả chi tiết bác sĩ bên dưới card grid.
5. Nhập triệu chứng.
6. Chọn ngày/giờ (lọc quá khứ và giờ trùng).
7. Xác nhận modal.
8. Gọi `POST /appointment`.
9. Sau khi tạo lịch: tự sinh báo cáo chẩn đoán AI sơ bộ và cache local.

API params đang dùng: `GET /veterinarian?clinicId=...&specialty=...&page=1&limit=50`
Nhãn tiếng Việt specialty lấy từ i18n key `enums.veterinarySpecialty.*` (vi.json/en.json) + fallback `VETERINARY_SPECIALTY_LABELS`.

### 4) Walk-in (Phiếu khám vãng lai)
- Nút **"Phiếu khám khẩn cấp"** ở trang danh sách phiếu khám, mở form tạo mới không cần lịch hẹn.
- Luồng xử lý:
  - Tra cứu khách hàng theo email (cần backend hỗ trợ search email hoặc endpoint riêng).
  - Nếu chưa có tài khoản: tự tạo với password tạm `Baophan1234` (placeholder, backend sẽ thay bằng random + gửi email).
  - Tra cứu thú cưng theo tên + chủ nhân (cần backend hỗ trợ filter theo ownerId).
  - Nếu chưa có: tạo thú cưng mới rồi mới tạo phiếu khám.
- Loại phiếu khám (walk-in): dropdown bắt buộc lấy từ `ServiceEnum`, label tiếng Việt qua `getServiceLabel`.
- Hiển thị loading state và thông báo kết quả theo từng bước.
- **Phiếu khám có lịch hẹn**: ẩn toàn bộ phần thông tin khách hàng & thú cưng trên UI (không ảnh hưởng payload gửi API).
- **Walk-in**: ẩn tab Hồ sơ y tế vì chưa có pet lịch sử rõ ràng.
1. Chọn pet.
2. Chọn dịch vụ + clinic.
3. Chọn bác sĩ + nhập triệu chứng.
4. Chọn ngày/giờ (lọc quá khứ và giờ trùng).
5. Xác nhận modal.
6. Gọi `POST /appointment`.
7. Sau khi tạo lịch: tự sinh báo cáo chẩn đoán AI sơ bộ và cache local.

### 4) Appointment Detail
- Lấy `GET /appointment/my`.
- Tab `Lịch sắp tới` và `Lịch sử khám`.
  - Walk-in Emergency flow: tạo user/pet trước khi tạo phiếu khám.
  - Ẩn UI khách hàng/thú cưng khi có lịch hẹn.
- Cả 2 tab đều hiển thị **trạng thái lịch hẹn** (Chờ khám/Đang khám/Đã hoàn thành/Đã hủy) thay vì badge thời gian kiểu `Hôm nay`, `x ngày`.
- Auto refresh 20 giây + refresh khi tab active lại.
- Hủy lịch (PATCH status).
- Xem chi tiết lịch.
- `src/services/userService.js`:
  - Tra cứu user theo email và tạo user tạm (`getUserByIdApi`).
- `src/services/petService.js`:
  - Tra cứu pet theo owner (`getPetsByOwnerApi`) và tạo pet mới cho walk-in (`createPetApi`).
- Mở modal chẩn đoán AI (`PetDiagnosisContent`).
- Đã tích hợp `ScrollToTopButton` dùng chung cho trang lịch hẹn (áp dụng cho cả 2 tab section).

### 5) PetDiagnosis (AI report)
- Module `appointmentDiagnosis.js`:
  - gửi prompt qua socket,
  - nhận phản hồi AI,
  - fallback markdown khi timeout/lỗi,
  - cache theo `appointmentId` trong localStorage.

### 6) Pet Management
- Add pet: species/breed theo API, upload avatar rồi tạo pet.
- List pet (`ListPetMedicalRecords`):
  - Hiển thị thêm tuổi thú cưng ở góc phải trên card, tính từ `dateOfBirth`.
  - Format tuổi: `X tuổi` (>= 1 năm) hoặc `X tháng tuổi` (< 1 năm).
  - Thêm menu ba chấm (`...`) trên card: chỉnh sửa thông tin thú cưng + xóa thú cưng (kèm confirm dialog).
  - Giữ nút `Xem hồ sơ y tế` hiển thị độc lập ngoài dropdown.
- Pet profile: xem/sửa thông tin pet, cập nhật ảnh.

### 7) Medical Records
- List pet trước khi vào hồ sơ.
- Medical records lấy theo `petId` hoặc `medicalId`.
- Các màn chi tiết có thể enrich record bằng medical orders + medicines (ví dụ: RecordExaminationForm).
- Render timeline + reminder block.
- Tên phiếu khám được map từ enum dịch vụ sang tiếng Việt (nếu backend trả enum).
- Ngày tái khám không có dữ liệu hiển thị `Không` thay vì `Chưa cập nhật`.
- Timeline chi tiết bổ sung các chỉ số sinh tồn (cân nặng, nhiệt độ, nhịp tim, huyết áp).
- Đơn thuốc hiển thị thêm đơn vị (Viên, Gói, Ống...) nếu có.
- Phía chủ nuôi đã bổ sung hiển thị `Chỉ định xét nghiệm`; nếu không có dữ liệu chỉ định sẽ hiện `Không có`.
- Nhãn ngày trong timeline hồ sơ y tế đã thống nhất `Ngày khám` (không dùng `Ngày tạo hồ sơ`).
- Thứ tự hiển thị phần nội dung chi tiết đã được thống nhất: `Chẩn đoán` -> `Kết luận` -> `Lời dặn bác sĩ` -> `Chỉ định xét nghiệm` -> `Đơn thuốc`.
- Bấm `Xem chi tiết` để mở toàn bộ chỉ số sinh tồn và nội dung chẩn đoán/kết luận/triệu chứng/lời dặn.
- Danh sách được sắp xếp mới nhất trước để giảm thao tác cuộn khi có nhiều hồ sơ.
- Tab `Hồ sơ y tế` trong RecordExaminationForm dùng cơ chế thu gọn tương tự; khi mở chi tiết, nhãn thông tin hiển thị tông xanh để đồng bộ trải nghiệm đọc.

### 8) Forum
- Đã nối API thật:
  - Tạo/sửa/xóa bài.
  - Like/unlike.
  - Comment + reply nhiều cấp.
  - Upload ảnh cho post/comment/reply.
- Có parse token nội dung:
  - `[[title:...]]`
  - `[[img:...]]`
- Có lọc chủ đề, ranking contributor, featured post theo engagement.
- Đã tích hợp `ScrollToTopButton` dùng chung, bám theo scroll của cột feed (`leftColumn`).

### 9) ChatBot AI
- Không còn là UI mock thuần.
- Có room list/create/rename/delete qua API.
- Có message history theo room.
- Có streaming token AI qua socket (`aiResponse` + `serverResponseAIMessage`).
- Có persistence hội thoại theo room từ backend.

## Admin Clinic Portal - Trạng thái tính năng

### 1) Auth & layout
- Dùng login chung `/login`.
- Sidebar quản trị có account dropdown giống client (`Trang cá nhân`, `Đổi mật khẩu`, `Đăng xuất`) cho role ADMIN_CLINIC.
- `Trang cá nhân` mở popup chỉnh sửa trực tiếp: avatar, họ tên, email, SĐT, địa chỉ (layout form 2 cột theo style form thêm bác sĩ).
- `Đổi mật khẩu` dùng popup trong layout (không điều hướng sang màn khác), sau khi thành công sẽ cập nhật token mới vào AuthContext.
- `Đăng xuất` chỉ clear phiên hiện tại và điều hướng về `/login`.
- Sidebar có nút `Chỉnh Sửa Trang Chủ` ngay dưới `Xem phiếu khám`; nút mở tab mới tới route editor của chính phòng khám đang đăng nhập.

### 2) Appointment Management
- Lấy lịch khám từ API, có filter ngày/giờ/search.
- Chia cột trạng thái (`BOOKED`, `IN_PROGRESS`, `COMPLETED`).
- Hỗ trợ drag & drop đổi trạng thái (PATCH).
- Modal chi tiết pet/chủ nuôi/lịch khám.
- Cho phép hủy lịch khi đang `BOOKED`.

### 3) Veterinarian Management
- `useVeterinarians` xử lý resolve clinicId từ:
  - state,
  - localStorage,
  - JWT payload,
  - fallback gọi profile API.
- Có CRUD bác sĩ + filter + phân trang + upload avatar.
- Form "Thêm mới bác sĩ" (`AddNewVererianrian`) bắt buộc nhập 6 field: Tên, Chuyên khoa, Email, Mật khẩu, Số điện thoại, Địa chỉ.
  - Luồng tạo bác sĩ chia 2 bước API:
    1. `POST /veterinarian` chỉ gửi 5 field: `fullName`, `email`, `password`, `clinicId`, `specialty`.
    2. `PUT /user/{userId}` gửi `phone`, `address`, `avatarUrl` (nếu có) để cập nhật thông tin liên lạc.
  - Nếu bước 2 thất bại → rollback bằng `DELETE /veterinarian/{userId}` để tránh tài khoản rỗng trong DB.
  - Số điện thoại validate đúng 10 số bắt đầu bằng `0` (regex `^0\d{9}$`).
  - Địa chỉ bắt buộc nhập.

### 4) Exam Slips & Medical Records
- `ListPetExaminationRecords`: đã dùng API appointment để liệt kê thú cưng theo lịch khám.
- `ListPetMedicalRecords`: đã dùng API appointment để nhóm hồ sơ theo pet.
- `ViewMedicalRecords`: đã dùng API medical thật để xem timeline chi tiết.
- `PetMedicalRecords`: ưu tiên hydrate thông tin thú cưng bằng `GET /pet/:id` khi chỉ có `petId` từ phiếu khám hoặc appointment.
- `PetMedicalRecords` (màn xem phiếu khám phía phòng khám) đã được chuẩn hóa UI tiếng Việt có dấu, đồng bộ căn lề/spacing giữa label-input để bỏ lệch hàng.
- Phần `Loài` và `Giống loài` trên `PetMedicalRecords` đã chuyển sang dùng helper tập trung `getPetSpeciesLabel` + `getPetBreedLabel` (không hiển thị enum thô).
- Tên phiếu khám ở `PetMedicalRecords` ưu tiên map qua `getServiceLabel` để hiển thị nhãn dịch vụ thân thiện khi backend trả enum.
- Đơn thuốc ở `PetMedicalRecords` đã map đơn vị thuốc enum bằng `getMedicineUnitLabel` (ví dụ `AMPOULE` -> `Ống`), không hiển thị enum thô.
- Quy ước fallback cho nhóm màn hồ sơ y tế phía phòng khám:
  - Mặc định dữ liệu trống hiển thị `Không`.
  - Riêng `SĐT` và `Địa chỉ` chủ nuôi hiển thị `Chưa cập nhật được`.
- `PetMedicalRecords` đã bổ sung hydrate dữ liệu đầy đủ theo chuỗi API: `GET /medical/pet/:petId` -> `GET /medical/:id` -> `GET /pet/:id` -> `GET /user/:id` để giảm thiếu dữ liệu ở phần chỉ số và thông tin chủ nuôi.
- `ViewMedicalRecords` đã bổ sung gọi `GET /pet/:id` để điền đủ ngày sinh/giới tính thú cưng khi payload từ medical list thiếu trường chi tiết.
- `ListPetMedicalRecords` đã đồng bộ nhãn loài/giống theo helper enum tập trung và áp dụng quy tắc fallback mới cho số điện thoại.
- Luồng hóa đơn phía phòng khám đã đổi: thao tác `In hóa đơn` và `Thanh toán` thực hiện trực tiếp tại `PetMedicalRecords` (không còn điều hướng qua màn `PetMedicalBill`).
- Màn thanh toán trong `PetMedicalRecords` dùng modal tóm tắt chi phí thuốc + chỉ định xét nghiệm, sau đó gọi `upsertPaidInvoiceByMedicalApi` và phát `APPOINTMENT_PAYMENT_SYNC_EVENT_KEY` để đồng bộ trạng thái lịch hẹn.
- Nút `In hóa đơn` ở `PetMedicalRecords` đã dùng template in A4 riêng (mở cửa sổ in chuyên biệt), không in toàn bộ màn hình hiện tại.
- Template in hóa đơn gồm: thông tin phòng khám, thông tin khách hàng/thú cưng, bảng thuốc, bảng chỉ định, tạm tính/tổng cộng, lời dặn bác sĩ, chữ ký bác sĩ.
- Nguồn dữ liệu phòng khám cho template in ưu tiên theo thứ tự: `clinicInfoStorage` (đã chỉnh ở ClinicSelectionEditor) -> `GET /clinic/:id` (nguồn chính để lấy địa chỉ/SĐT phòng khám) -> dữ liệu `appointment.clinic` -> `GET /user/profile` (fallback phone/address).
- Màn `PetMedicalRecords` resolve `clinicId` theo chuỗi: appointment/state -> auth storage/token/profile (`getCurrentAdminClinicId`) để giảm trường hợp thiếu `clinicId` khi payload lịch hẹn không hydrate đầy đủ quan hệ clinic.
- Với metadata in hóa đơn, các giá trị placeholder như `Chưa cập nhật được` sẽ không ghi đè dữ liệu thật từ API/profile nếu các nguồn sau có dữ liệu hợp lệ.
- Header template in giữ bố cục 2 cột trái/phải (không tự stack xuống 2 hàng); khối trái dùng nhãn ngắn + value mềm để địa chỉ dài xuống nhiều dòng tự nhiên, tránh khoảng trắng thô và vẫn giữ cân bằng thị giác với khối meta bên phải.
- Để tránh popup `about:blank` bị chặn, luồng in hiện tại ưu tiên in qua iframe ẩn trong cùng tab (không mở tab/cửa sổ mới).

### 5) Các màn còn template/mock trong admin clinic
- Luồng `PetMedicalBill` đã được loại bỏ khỏi route để giảm thao tác lặp; nghiệp vụ thanh toán/in hóa đơn được dồn về `PetMedicalRecords`.

### 6) Admin Clinic Profile
- Lấy profile `/user/profile`.
- Cho sửa phone/address và đồng bộ lại context.

### 7) HomePageClinic Editor (ADMIN_CLINIC)
- Route editor: `/clinic/home-editor/:clinicId` (nằm trong `AdminClinicLayout`).
- Editor chỉ cho phép sửa **nội dung bên trong** HomePageClinic (banner, giới thiệu, tính năng, đội ngũ bác sĩ, dịch vụ, community), không chỉnh Header/Footer.
- Cơ chế phân quyền chỉnh sửa:
  - Chỉ admin clinic đăng nhập mới mở được editor qua sidebar.
  - Chỉ được sửa dữ liệu của clinic hiện tại; nếu `clinicId` trên URL khác clinic đang đăng nhập thì bị chặn và điều hướng về trang quản trị lịch hẹn.
- Cơ chế lưu dữ liệu:
  - Lưu theo từng clinic bằng localStorage key `homePage_{clinicId}`.
  - Dữ liệu giữa các phòng khám độc lập hoàn toàn, không ghi đè chéo.
- Nút cuối trang:
  - `Lưu thay đổi`: lưu theo `clinicId`, toast `Lưu thành công`, sau đó reload trang.
  - `Hủy`: nếu có thay đổi chưa lưu thì hiện confirm `Bạn có muốn tiếp tục chỉnh sửa hay hủy bỏ thay đổi?`.
- Có khối `Xem trước trang chủ sau khi lưu`; phần giới thiệu trong preview cũng áp dụng logic 100 từ + popup `Đọc thêm` tương tự chế độ xem người dùng.

### 8) ClinicSelection Editor (ADMIN_CLINIC)
- Route editor: `/clinic/clinic-editor/:clinicId` (nằm trong `AdminClinicLayout`).
- Sidebar có nút `Chỉnh Sửa Phòng Khám` đặt ngay dưới `Chỉnh Sửa Trang Chủ`, mở editor bằng tab mới theo đúng `clinicId` đang đăng nhập.
- Cơ chế phân quyền chỉnh sửa:
  - Chỉ admin clinic đăng nhập mới mở được editor qua sidebar.
  - Chỉ được chỉnh sửa dữ liệu của clinic hiện tại; nếu `clinicId` trên URL khác clinic đang đăng nhập thì bị chặn và điều hướng về trang quản trị lịch hẹn.
- Cơ chế lưu dữ liệu:
  - Lưu theo từng clinic bằng localStorage key `clinicInfo_{clinicId}`.
  - Dữ liệu giữa các phòng khám độc lập hoàn toàn, không ghi đè chéo.
  - Trang `/choose-clinic` đọc dữ liệu theo `clinicId` để hiển thị card thông tin đã chỉnh sửa.
- Các field trong form chỉnh sửa:
  - Ảnh đại diện phòng khám (upload ảnh, lưu `avatarUrl`).
  - Tên phòng khám.
  - Địa chỉ.
  - Số điện thoại.
  - Ngày mở cửa (`openingDays`).
  - Giờ mở cửa (`openingTime`).
  - Giờ đóng cửa (`closingTime`).
  - Trường hiển thị thời gian được chuẩn hóa thành `timeDisplay` để render card ở `/choose-clinic`.
- Nút cuối trang:
  - `Lưu thay đổi`: lưu theo `clinicId`, toast `Lưu thành công`, sau đó reload trang.
  - `Hủy`: nếu có thay đổi chưa lưu thì hiện confirm `Bạn có muốn tiếp tục chỉnh sửa hay hủy bỏ thay đổi?`.

## Super Admin Portal (ADMIN) - Trạng thái tính năng

### 1) Layout & Routing
- `AdminLayout` (`src/layouts/admin/AdminLayout.jsx`):
  - Sidebar dark theme (navy) + header "Dashboard Admin" + search + notification.
  - Menu: Tổng quan, Quản lý phòng khám, Quản lý người dùng, Quản lý bài đăng.
  - Account dropdown ở bottom sidebar giống client: `Trang cá nhân`, `Đổi mật khẩu`, `Đăng xuất`.
  - Popup `Trang cá nhân` hỗ trợ sửa avatar, họ tên, email, SĐT, địa chỉ.
  - Popup `Đổi mật khẩu` dùng chung behavior với client và refresh token ngay sau khi đổi thành công.
  - Dùng auth context chung từ `hooks/adminClinic/AuthContext`.
- Routes đã khai báo:
  - `/admin/home` → `Clinics` (trang chính khi ADMIN đăng nhập).
  - `/admin/dashboard/clinics` → `Clinics`.
  - `/admin/dashboard/posts` → `Posts`.
- CSS: `styles/admin/colorsToken.css` (biến màu riêng cho admin, sidebar dark theme, stat cards).
- `authRole.js` đã tách: `ADMIN` → `/admin/home`, `ADMIN_CLINIC` → `/admin/clinic/appointments`.

### 2) Clinics Management (pages/admin/Dashboard/Clinics)
- UI hoàn chỉnh: 3 stat cards (nền màu + icon trong hộp vuông) + bảng danh sách + phân trang.
- Stat cards: phòng khám (nền xanh dương nhạt), người dùng (nền xanh lá nhạt), bài đăng (nền cam nhạt).
- Cột bảng: tên (kèm Avatar viết tắt), SĐT, địa chỉ, ngày tạo (dd/MM/yyyy), email, trạng thái (Tag theo field `deleted`), thao tác (xem/xóa).
- Nút "Thêm phòng khám" dùng màu brand theo token admin.
- **Đã nối API thật:**
  - `GET /api/clinic?page&limit&search` — phân trang danh sách phòng khám.
  - `DELETE /api/clinic/:id` — xóa phòng khám (có Popconfirm).
  - `POST /api/clinic` — thêm phòng khám mới qua Modal (thông tin phòng khám + tài khoản admin clinic).
- Modal "Thêm phòng khám mới": 2 section (thông tin phòng khám: tên, email, SĐT, địa chỉ, mô tả; tài khoản quản trị: họ tên, email, mật khẩu). Có validation form đầy đủ.
- API layer tập trung: `src/services/clinicService.js` (5 hàm CRUD) + `src/services/apiClient.js` (`getAdminInstance()` dùng `ADMIN_AUTH_STORAGE`).

### 3) Users Management (pages/admin/Dashboard/Users)
- UI dùng cùng token màu admin (`styles/admin/colorsToken.css`), layout thống nhất với Clinics.
- Danh sách người dùng phân trang + tìm kiếm theo tên/email.
- Cột hiển thị: avatar/tên, SĐT, địa chỉ, ngày tạo, email, vai trò, trạng thái.
- API: `GET /api/user?page&limit&search` qua `src/services/userService.js` (`getUserListApi`).

### 4) Posts Management (pages/admin/Dashboard/Posts)
- UI thống nhất với Clinics/Users (stat cards + bảng + thanh tìm kiếm).
- API: `GET /api/post?limit&lastPostTime` (phân trang theo thời gian).
- Cột hiển thị: tác giả, chủ đề, nội dung, bình luận, lượt thích, ngày đăng.
- Tìm kiếm client-side trên dữ liệu đã tải (tác giả/chủ đề/nội dung).

### 5) Các màn chưa có nội dung
- `Overview/`: thư mục đã tạo sẵn, chưa có file component.

## Veterinarian Portal - Trạng thái tính năng

### 1) Lịch hẹn bác sĩ
- Danh sách lịch hẹn bác sĩ chỉ hiển thị theo **ngày hiện tại** (local date `YYYY-MM-DD`); không hiển thị trộn ngày khác.
- Có cơ chế tự đồng bộ mốc ngày (interval + focus + visibility) để khi qua ngày mới, danh sách tự chuyển sang lịch của ngày mới mà không cần reload trang.
  - icon lớn hơn,
  - icon + tiêu đề nằm ngang hàng ở dòng trên,
  - số liệu nằm giữa, cân đối theo trục của tiêu đề.
- Nút **"Bắt đầu khám"**:
- Trên route editor, ẩn cụm action bar góc phải (Language Switcher + Notification bell) để tập trung chỉnh sửa nội dung.
  - Khi đã `IN_PROGRESS`, nút vẫn bấm được để mở lại tab phiếu khám, không gọi API đổi trạng thái lần nữa.
- Trên route editor, ẩn cụm action bar góc phải (Language Switcher + Notification bell), đồng nhất với HomePageClinic Editor.
### 2) Hồ sơ bệnh án
- `ListMedicalRecords`: lấy từ API appointment theo ngày, xem chi tiết hồ sơ.
- `ViewPetMedicalRecords`: lấy medical records thật theo `petId/medicalId`, render timeline.
  - Giao diện đã đồng bộ với client MedicalRecords: timeline marker, icon pet và nhịp bố cục giống nhau.
  - Rule bảo mật ở màn bác sĩ: phần meta chỉ hiển thị `Ngày khám` và `Ngày tái khám`, ẩn tên phòng khám và tên bác sĩ khám.
  - Layout phần mở chi tiết được tinh gọn để đọc liền mạch; nội dung được gom theo một luồng text duy nhất thay vì tách block dưới cùng.
  - Gọi trực tiếp `GET /api/pet/{id}` để lấy đầy đủ thông tin thú cưng (dateOfBirth, breed, gender, weight) thay vì chỉ dựa vào nested pet data trong medical record.
  - Enrich records với medical orders + medicines để hiển thị đơn thuốc trong chi tiết.
- Timeline chi tiết hiển thị thêm chỉ số sinh tồn và map tên phiếu khám theo enum dịch vụ.
- Ngày tái khám trống hiển thị `Không`, đơn thuốc hiển thị đơn vị nếu có.

### 3) Phiếu khám
- `ListExaminationForm`: lấy lịch hẹn theo ngày, điều hướng vào phiếu khám theo `appointmentId`.
  - Nút tạo walk-in đã đổi nhãn thành `Phiếu khám khẩn cấp`.
  - Có auto-refresh khi tab được focus lại (focus + visibilitychange listener) để đồng bộ trạng thái sau khi phiếu khám được tạo ở tab khác.
  - Dùng `inFlightRef` chống duplicate request khi tab focus nhanh liên tục.
  - Silent refresh không hiển thị loading spinner hoặc error toast.
- `RecordExaminationForm`: đã nối API thật:
  - tạo medical record ở lần lưu đầu,
  - cập nhật lại chính medical record đó ở các lần sau,
  - đồng bộ lại medical orders + medicines theo lần lưu mới,
  - tự cập nhật appointment sang `COMPLETED` khi lưu thành công.
  - Tab "Hồ sơ y tế": lấy toàn bộ medical history theo `petId`, sắp xếp mới nhất trước và hiển thị đơn thuốc + chỉ định.
  - Tab "Hồ sơ y tế" (màn bác sĩ) áp dụng rule bảo mật: meta chỉ còn `Ngày khám` và `Ngày tái khám`.
  - Phần mở rộng card lịch sử đã bỏ block liệt kê riêng ở cuối, chuyển sang flow nội dung thống nhất để giao diện mượt và dễ đọc hơn.
  - Tab "Hồ sơ y tế": ưu tiên hydrate thông tin thú cưng bằng `GET /pet/:id` khi chỉ có `petId`.
  - Walk-in: ẩn tab Hồ sơ y tế, chỉ hiển thị ở phiếu khám có lịch hẹn.
  - TODO bảo mật: cần kiểm tra quyền chia sẻ hồ sơ của chủ nuôi trước khi hiển thị (đánh dấu trực tiếp trong code).
- **Lưu ý quan trọng về hydrate medical record khi mở lại phiếu khám**:
  - Backend Appointment entity **KHÔNG có relation** tới MedicalRecord → `appointment.medical` luôn null từ API.
  - Khi mở lại phiếu khám, hệ thống dùng `getMedicalByPetId` (list API) để tìm record, sau đó **luôn gọi `getMedicalById`** (detail API) để lấy đầy đủ dữ liệu bao gồm vital signs (`temperature`, `heartRate`, `systolic`, `diastolic`, `weight`).
  - List API (`GET /medical/pet/{petId}`) **KHÔNG trả về** vital signs — chỉ detail API (`GET /medical/{id}`) mới trả đầy đủ.
  - Nếu detail API fail → fallback về data từ list API (vital signs sẽ trống nhưng form không crash).
- Cơ chế khóa chỉnh sửa 15 phút:
  - Mốc thời gian tính từ `medical.createdAt` (server).
  - Trong 15 phút: cho phép chỉnh sửa, có hiển thị đếm ngược thời gian còn lại.
  - Hết 15 phút: form chuyển read-only, input và nút chỉnh sửa bị disable/ẩn.
  - FE có fallback đồng hồ cục bộ (midpoint request) khi không đọc được `Date` header / `serverTime` do CORS, nhằm tránh cảnh báo sync sai trong khi vẫn giữ khóa 15 phút ổn định mà không cần sửa BE.
  - Nếu thiếu `createdAt`: UI hiển thị cảnh báo yêu cầu backend trả `createdAt` cho medical.

### 5) Vị trí file chính cho luồng "Bắt đầu khám" + khóa 15 phút
- `src/pages/Vererianrian/PetAppointmentVererianrian/petAppointmentVererianrian.jsx`:
  - Handler mở tab mới khi bấm "Bắt đầu khám".
  - Logic chuyển `BOOKED -> IN_PROGRESS` và giữ nút bấm lại được ở trạng thái `IN_PROGRESS`.
- `src/pages/Vererianrian/ListExaminationForm/listExaminationForm.jsx`:
  - Điều hướng tới trang phiếu khám theo `appointmentId`.
  - Nút "Phiếu khám khẩn cấp" mở form walk-in.
  - Mang theo dữ liệu `medical` của appointment để hydrate form.
- `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx`:
  - Cơ chế lock chỉnh sửa 15 phút.
  - Hiển thị countdown + cảnh báo hết hạn.
  - Chế độ read-only sau khi hết hạn.
  - Tab Hồ sơ y tế: appointment -> petId -> medical history.
  - TODO: kiểm tra quyền chia sẻ hồ sơ trước khi hiển thị.
- `src/services/appointmentService.js`:
  - `getServerNowApi()` dùng đồng bộ clock server cho countdown.
- `src/services/medicalService.js`:
  - API create/update medical record và CRUD medical orders/medicines phục vụ lưu/cập nhật phiếu khám.
  - `getMedicalByPetIdApi`, `getMedicalOrdersByMedicalIdApi`, `getMedicinesByMedicalIdApi` dùng cho tab hồ sơ y tế.

## Styling & Design System

### 1) Token CSS
- `src/styles/client/colorsToken.css` — biến màu cho client portal (prefix `--color-*`, `--page-*`).
- `src/styles/Clinic/colorsToken.css` — biến màu cho admin clinic portal (prefix `--color-*`, `--page-*`).
- `src/styles/admin/colorsToken.css` — biến màu riêng cho super admin: sidebar dark, stat cards, brand (prefix `--admin-*`).
- `src/styles/vererianrian/colorsToken.css` — biến màu cho veterinarian portal (prefix `--vet-*`): brand, surface, border, text, status tag, pet card, record meta, shadow, button, timeline marker.

Thư mục `styles/admin/colorsToken.css` chứa thêm biến sidebar dark theme (`--admin-sidebar-*`) và stat cards (`--admin-stat-*`).
Style component đặt cạnh page (`pages/admin/Dashboard/Clinics/style.css`).

**Quy ước veterinarian CSS**: Toàn bộ CSS module trong `pages/Vererianrian/` và `layouts/Vererianrian/` đã chuyển sang dùng CSS variables `--vet-*` thay vì hardcode màu. File token được import tại `AdminVererianrianLayout.jsx`.

### 2) Global style
- `src/index.css` chứa:
  - reset cơ bản,
  - animation,
  - custom AntD,
  - alias token cho auth/home/user.

### 3) Layout components
- Client header/footer riêng trong `src/components/layouts/client`.
- Admin clinic và veterinarian dùng layout riêng trong `src/layouts`.
- Super admin dùng `AdminLayout` (`src/layouts/admin/`) với sidebar dark navy + header.
- Có thêm component dùng chung `src/components/common/PortalAccountMenu/` để đồng bộ account dropdown/popup cho cả 3 portal backend-facing.

## Luồng dữ liệu chính

### 1) Client login -> booking -> AI diagnosis
1. Login thành công, phân role và portal.
2. Chọn clinic (`selectedClinicId`).
3. Booking tạo appointment.
4. Ngay sau tạo lịch, sinh báo cáo AI sơ bộ qua socket và cache local.

### 2) Client chatbot
1. Lấy danh sách room.
2. Mở room -> tải lịch sử message.
3. Gửi message qua socket.
4. Nhận stream token AI + bản trả lời cuối.

### 3) Admin clinic appointment board
1. Tải danh sách appointment theo ngày/giờ.
2. Kéo thả card giữa các trạng thái.
3. Patch trạng thái lên backend.

### 3.1) HomePageClinic personalization
1. Admin clinic mở `Chỉnh Sửa Trang Chủ` từ sidebar (new tab theo `clinicId` hiện tại).
2. Chỉnh nội dung, lưu vào localStorage key `homePage_{clinicId}`.
3. Người dùng chọn phòng khám ở `/choose-clinic` sẽ xem `/clinic` theo đúng dữ liệu đã lưu của clinic đó.
4. Ở chế độ xem người dùng chỉ có CTA `Đặt lịch khám ngay`; không có nút quản trị `Lưu/Hủy`.

### 3.2) ClinicSelection personalization
1. Admin clinic mở `Chỉnh Sửa Phòng Khám` từ sidebar (new tab theo `clinicId` hiện tại).
2. Chỉnh thông tin card phòng khám và lưu vào localStorage key `clinicInfo_{clinicId}`.
3. Trang `/choose-clinic` hiển thị thông tin card theo đúng dữ liệu đã lưu của clinic tương ứng, fallback về dữ liệu API khi chưa có dữ liệu lưu.
4. Dữ liệu từng phòng khám độc lập theo `clinicId`, không ghi đè lẫn nhau.

### 3.3) Sidebar Account Menu (Admin/Clinic/Veterinarian)
1. Người dùng bấm vào profile box ở cuối sidebar.
2. Dropdown hiển thị 3 tác vụ: `Trang cá nhân`, `Đổi mật khẩu`, `Đăng xuất`.
3. `Trang cá nhân`: mở popup form 2 cột, cho sửa avatar + thông tin liên hệ và lưu trực tiếp qua `PUT /user/:id`.
4. `Đổi mật khẩu`: mở popup đổi mật khẩu, gọi `POST /auth/change-password`, nhận token mới và cập nhật lại phiên đăng nhập.
5. `Đăng xuất`: chỉ logout tài khoản hiện tại và quay về `/login`.

### 4) Veterinarian exam workflow
1. Bác sĩ bấm "Bắt đầu khám" từ danh sách lịch hẹn.
2. Hệ thống mở tab mới vào phiếu khám theo `appointmentId` (có thể mở lại tab nếu lỡ đóng) và cập nhật trạng thái lịch hẹn sang `IN_PROGRESS`.
3. Danh sách lịch hẹn đổi trạng thái ngay bằng optimistic update, sau đó refetch nhẹ để đồng bộ.
4. Tab Hồ sơ y tế: lấy `petId` từ lịch hẹn -> `getMedicalByPetId` -> đơn thuốc + chỉ định (TODO kiểm tra quyền chia sẻ).
5. Bác sĩ điền/lưu phiếu khám.
6. Sau lần tạo đầu tiên, bác sĩ chỉ được chỉnh sửa trong 15 phút kể từ `createdAt`.
7. Lưu thành công sẽ đồng bộ trạng thái appointment sang `COMPLETED`.

## Điểm mạnh hiện tại
- Tách rõ 4 portal client/admin clinic/veterinarian/super admin theo route + layout.
- RBAC hậu đăng nhập rõ ràng, login chung dễ vận hành.
- Booking flow đã có validation tốt và tích hợp AI diagnosis.
- Forum đã là module tương tác đầy đủ, không còn chỉ demo.
- Chatbot có backend persistence + realtime streaming.
- Module phiếu khám bác sĩ đã nối API thật cho nghiệp vụ cốt lõi.

## Trade-off & kỹ thuật cần lưu ý

### 1) HTTP layer chưa thống nhất
- Vẫn song song Axios và Fetch wrappers.

### 2) Chưa có route guard tập trung
- Hiện chủ yếu dựa interceptor 401 để redirect.

### 3) Một số màn còn mock/template
- `adminVererianrian/PetAppointmentVererianrian`

### 4) Một số route điều hướng chưa khớp route khai báo
- Route thực tế đang dùng là nhóm `/clinic/*` và `/veterinarian/*`; các đường dẫn legacy `/admin/clinic/*`, `/admin/veterinarian/*` được redirect.
- Cần tiếp tục rà soát các link cũ có prefix `/admin/*` để tránh nhầm lẫn khi maintain.

### 5) Socket URL đang hardcoded
- `src/socket/socket.js` dùng cố định `http://localhost:3000/chat`, chưa đưa vào env.

### 6) Token CSS trùng lặp
- Client/Clinic token gần như giống nhau, nên cân nhắc single source.
- Veterinarian token (`--vet-*`) đã tách riêng và áp dụng cho toàn bộ portal bác sĩ.

### 7) Một số dữ liệu UI vẫn hardcoded
- Nhiều block marketing và thông tin clinic (rating/time/demo content).

### 8) Admin posts dùng cursor pagination
- `GET /api/post` chỉ trả về danh sách theo `limit` + `lastPostTime`, nên FE hiển thị “Tải thêm” thay vì phân trang số.

## Workspace chuẩn khi thao tác
- Web client root path chuẩn: `F:\capstone 2\code\PetcareX\FE\Web\client`
- Quy ước chạy lệnh: chạy từ root trên.

## Biến môi trường đang dùng thực tế
- `VITE_API_URL`
- `VITE_FIREBASE_WEB_API_KEY`
- `VITE_FIREBASE_AUTH_DOMAIN`
- `VITE_FIREBASE_PROJECT_ID`
- `VITE_FIREBASE_STORAGE_BUCKET`
- `VITE_FIREBASE_MESSAGING_SENDER_ID`
- `VITE_FIREBASE_WEB_APP_ID`
- `VITE_FIREBASE_WEB_MEASUREMENT_ID`

Ghi chú:
- `VITE_GOOGLE_CLIENT_ID` hiện không được dùng trong code web client hiện tại.

## Bảo mật env & commit policy
- `.env` phải nằm trong `.gitignore`, không commit key thật.
- Chỉ commit `.env.example` với placeholder.
- Trên CI/CD (Vercel/Netlify/GitHub Actions), set biến `VITE_*` bằng secrets.
- Khi ghi file bằng PowerShell (`Set-Content`, `Out-File`), luôn chỉ định UTF-8 để tránh lỗi tiếng Việt.

## Hướng dẫn chạy nhanh
1. `Set-Location "F:\capstone 2\code\PetcareX\FE\Web\client"`
2. `npm install`
3. Tạo `.env` từ `.env.example` và điền giá trị thật.
4. `npm run dev`
5. Build production: `npm run build`

### 9) Chưa có clinic status enum
- Enum folder chưa có `clinic-status.enum.ts`. Trang Clinics dùng local constant `CLINIC_STATUS` tạm thời.
- Cần backend cung cấp enum clinic status để đồng bộ FE.

## Chuẩn hóa Enum Label Tiếng Việt (2026-04)

### Mục tiêu
- Loại bỏ hiển thị raw enum như `BOOKED`, `IN_PROGRESS`, `PERIODIC_HEALTH_CHECK` trên UI.
- Loại bỏ mapping rải rác/hardcode trùng lặp trong nhiều component.
- Đảm bảo toàn bộ web client dùng **một nguồn dịch enum tiếng Việt duy nhất**.

### Nguồn dịch tập trung (single source of truth)
- `src/constants/enumLabels.js`
  - Chứa toàn bộ mapping enum -> nhãn tiếng Việt theo domain:
    - Appointment status, service, role, veterinary specialty
    - Pet species, pet breed
    - Invoice status, sender, medicine unit
    - Medical record completion status

### Utility dùng chung
- `src/utils/enumLabel.js`
  - Cung cấp API chuẩn để lấy nhãn:
    - `getEnumLabel(enumKey, value)`
    - `getAppointmentStatusLabel(...)`
    - `getServiceLabel(...)`
    - `getRoleLabel(...)`
    - `getVeterinarySpecialtyLabel(...)`
    - `getPetSpeciesLabel(...)`
    - `getPetBreedLabel(...)`
    - `getInvoiceStatusLabel(...)`
    - `getMedicalRecordStatusLabel(...)`
  - Có fallback an toàn (`Chưa cập nhật`) và chuẩn hóa key (`trim`, uppercase, normalize `_`).

### Tương thích ngược
- `src/constants/veterinaryLabels.js` giữ nguyên tên hàm public (`getRoleLabel`, `getSpecialtyLabel`, `getSpecialtyOptions`) nhưng delegate sang `src/utils/enumLabel.js`.
- `src/services/appointmentService.js` export `SERVICE_OPTIONS`, `APPOINTMENT_STATUS_LABEL` — dữ liệu lấy từ `src/constants/enumLabels.js`.
- `src/services/petService.js` re-export `getSpeciesLabel`, `getBreedLabel` — dùng mapping tập trung từ `src/utils/enumLabel.js`.

### Quy tắc maintain bắt buộc
1. Không hardcode nhãn enum tiếng Việt trực tiếp trong page/component.
2. Không tạo thêm mapping enum cục bộ trong component (object/switch/ternary) nếu đã có trong `enumLabels.js`.
3. Mọi enum mới từ backend phải bổ sung vào `src/constants/enumLabels.js` trước khi render UI.
4. Component chỉ gọi helper từ `src/utils/enumLabel.js` (hoặc wrapper tương thích) để hiển thị label.

### Chuẩn canonical cho Appointment Status
- Canonical frontend chỉ dùng: `BOOKED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
- Không dùng biến thể sai chính tả của `CANCELLED` trong hằng số public hoặc mapping label.
- `src/services/appointmentService.js` có bước normalize dữ liệu cũ (`SUCCESS`, `DONE`, và biến thể CANCEL*ED) về canonical status trước khi render UI.

## Bug Fix Log: Đồng bộ dữ liệu sau tạo phiếu khám (2026-04)

### Vấn đề gốc
1. Sau khi bác sĩ tạo phiếu khám → danh sách phiếu khám không cập nhật trạng thái mới.
2. Mở lại phiếu khám vừa tạo → vital signs (nhiệt độ, nhịp tim, huyết áp, cân nặng) bị trống.

### Nguyên nhân đã xác định
1. **List API trả thiếu dữ liệu**: `GET /medical/pet/{petId}` (findAllPaginationByPet) chỉ select `id, name, diagnosis, symptoms, conclusion, note, createdAt, followUpDate`. KHÔNG select `temperature, heartRate, systolic, diastolic, weight`. Code cũ dùng trực tiếp data từ list API mà không gọi detail API để lấy đầy đủ.
2. **ListExaminationForm không có cơ chế refresh**: Phiếu khám mở trong tab mới, nhưng tab gốc (danh sách) không có focus/visibility listener nên không biết phiếu khám đã được tạo.
3. **Appointment entity không có relation tới MedicalRecord**: Backend `appointment.entity.ts` không có field `medical`, nên `item?.medical?.id` luôn null từ API appointment. Phát hiện phiếu khám chỉ dựa vào `status === COMPLETED`.

### Cách fix đã áp dụng
1. **RecordExaminationForm** (`hydrateLatestMedicalRecord`): Khi tìm được medical record match từ list API → luôn gọi `getMedicalById(id)` để lấy record đầy đủ vital signs. Fallback về data list nếu detail API fail.
2. **ListExaminationForm**: Thêm focus + visibilitychange listener với silent refresh + inFlightRef chống duplicate. Khi bác sĩ quay lại tab danh sách → tự refetch → nút đổi từ "Tạo phiếu khám" sang "Mở phiếu khám".

### Luồng hoàn chỉnh sau fix
1. Bác sĩ bấm "Tạo phiếu khám" → mở tab mới `/veterinarian/exam-forms/create?appointmentId=...`
2. Điền form → lưu → `POST /medical` tạo record → extract `medicalId` từ response
3. `POST /medical/medical-order` và `POST /medical/medicine` dùng `medicalId` vừa nhận
4. `PATCH /appointment/:id` cập nhật status → `COMPLETED`
5. Navigate về `/veterinarian/exam-forms` (trong tab phiếu khám)
6. Khi quay lại tab danh sách gốc → focus listener trigger silent refetch → UI đồng bộ
7. Mở lại phiếu khám → `getMedicalByPetId` tìm record → `getMedicalById` lấy đầy đủ → form populate vital signs đúng

### Điểm cần chú ý để không tái phát
- **Không dùng data từ list API cho form edit**: List API chỉ phục vụ danh sách, thiếu nhiều field. Luôn gọi detail API khi cần dữ liệu đầy đủ.
- **Cross-tab sync**: Mọi màn mở phiếu khám bằng `window.open` đều cần focus/visibility listener ở tab gốc.
- **Backend chưa có appointment→medical relation**: Phát hiện medical record chỉ dựa vào status COMPLETED và fuzzy scoring theo ngày/clinic. Nếu backend thêm relation sau, cần cập nhật logic `hasMedicalRecord` và `hydrateLatestMedicalRecord`.

## Bug Fix Log: Token không cập nhật sau đổi mật khẩu (2026-04)

### Vấn đề gốc
- Sau khi đổi mật khẩu thành công, FE không lấy `accessToken` mới từ response backend.
- Token cũ vẫn nằm trong localStorage và AuthContext, dùng cho mọi request tiếp theo.

### Nguyên nhân đã xác định
- **FE bỏ qua response**: `handleSubmitChangePassword` trong `header.jsx` gọi `await changePasswordApi(...)` nhưng không gán response, không extract `accessToken`.

### Tại sao user chưa gặp lỗi ngay
- JWT stateless: token cũ vẫn valid đến khi hết hạn (7 ngày), nên user không bị logout.
- Tuy nhiên, nếu tương lai thêm token blacklist/rotation, token cũ sẽ bị reject ngay lập tức → user bị logout bất ngờ.

### Cách fix đã áp dụng (chỉ FE)
- **FE `header.jsx`**: Lấy `response` từ `changePasswordApi`, extract `response.data.accessToken`, gọi `login(newToken)` để cập nhật AuthContext + localStorage. AuthContext tự trigger `useEffect` re-fetch user profile.

### Ghi chú cho BE (chưa sửa, cần báo team BE)
- `auth.service.ts` method `changePassword` dùng `avatar_url` trong JWT payload, trong khi method `login` dùng `avatarUrl`. Không nhất quán nhưng **không ảnh hưởng FE** vì FE chỉ dùng chuỗi JWT nguyên vẹn, không decode payload.

### Lưu ý khi maintain
- API `POST /auth/change-password` luôn trả `{ message, accessToken }`. FE bắt buộc phải dùng `accessToken` mới này.
- `changePasswordApi` trong `src/services/authService.js` dùng chung cho mọi portal. Khi triển khai đổi mật khẩu cho Clinic/Vet portal, phải áp dụng cùng pattern: lấy token mới từ response và gọi `login()`.

## Bug Fix Log: Lỗi khởi tạo phiếu khám + không tải catalog Thuốc/Chỉ định (2026-04-06)

### Vấn đề gốc
1. Bác sĩ bấm `Bắt đầu khám` mở tab `/veterinarian/exam-forms/create?appointmentId=...` thì xuất hiện toast lỗi ngay khi mount: `Cannot read properties of undefined (reading 'get')`.
2. Trong form phiếu khám, bấm `Thêm thuốc` hoặc `Thêm chỉ định` thì dropdown danh sách trống vì không tải được catalog.

### Nguyên nhân đã xác định
1. `src/services/medicalService.js` quy ước toàn bộ hàm nhận `instance` ở tham số đầu (`(instance, ...)`), bao gồm cả alias catalog (`getMedicalOrderCatalogApi`, `getMedicineCatalogApi`) và nhóm create/update medical.
2. `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx` gọi nhiều hàm medical service **thiếu tham số instance**.
3. Khi mount form, `loadMetaData` gọi catalog thiếu instance nên ném TypeError trước khi gửi request HTTP; lỗi bị bắt tại catch và hiển thị toast `Không thể tải dữ liệu phiếu khám`.

### Cách fix đã áp dụng
1. Chuẩn hóa toàn bộ call tới medical service trong `RecordExaminationForm` theo đúng chữ ký: luôn truyền `getAdminInstance()` làm tham số đầu.
2. Sửa cả 2 nhóm call:
  - Nhóm khởi tạo metadata (catalog chỉ định/thuốc) khi mount form.
  - Nhóm lưu dữ liệu (create/update medical record, create chỉ định, create thuốc) cho cả luồng thường và walk-in.
3. Giữ nguyên toàn bộ nghiệp vụ hiện có; chỉ sửa wiring API để loại bỏ false error và khôi phục tải dữ liệu.

### Trạng thái sau fix
1. Mở tab phiếu khám từ `Bắt đầu khám` không còn toast lỗi giả ngay khi vào form.
2. Dropdown `Chọn loại chỉ định` và `Chọn thuốc` nạp dữ liệu bình thường khi thêm dòng.
3. Luồng lưu phiếu không còn rủi ro TypeError do thiếu instance ở nhóm API medical.

### Điểm dễ tái phát và cách phòng ngừa
1. Các alias service (`getMedicalOrderCatalogApi`, `getMedicineCatalogApi`, `createMedicalRecordApi`, ...) vẫn giữ chữ ký `(instance, ...)`; alias **không** tự bind instance.
2. Khi thêm API mới trong `src/services/`, bắt buộc follow rule: consumer luôn truyền đúng instance (`getAdminInstance()` hoặc `getClientInstance()`).
3. Trước khi merge các màn form lớn, cần grep nhanh các call service theo pattern `*Api(` để phát hiện call thiếu instance sớm.

## Bug Fix: loadMetaData resilience & loadHistoryRecords error suppression (2026-04-07)

### Vấn đề
1. `loadMetaData` trong `RecordExaminationForm` dùng `Promise.all` → **1 API fail = toàn bộ fail** → error toast xuất hiện + catalog Thuốc/Chỉ định **không bao giờ được set** → Select dropdown trống.
2. `hydrateByAppointmentId()` chạy **tuần tự trước** `Promise.all` trong cùng `try/catch` → appointment fetch fail kéo theo catalog loading không bao giờ chạy.
3. `loadHistoryRecords` throws `message.error()` cho non-critical data (tab Hồ sơ y tế) → toast lỗi không cần thiết khi chưa chuyển sang tab đó.

### Nguyên nhân kiến trúc
- `Appointment` entity KHÔNG có relation với `MedicalRecord` → `appointment.medical` luôn `null` khi fetch từ `GET /appointment`
- `GET /appointment` KHÔNG select `owner.email` → `ownerEmail` luôn rỗng
- `loadMetaData` gộp 5 concern khác nhau (appointment hydration + 4 catalogs) vào 1 try/catch duy nhất

### Fix đã áp dụng

| File | Thay đổi | Lý do |
|------|----------|-------|
| `RecordExaminationForm` | Wrap `hydrateByAppointmentId()` trong try/catch riêng | Appointment fail không block catalog loading |
| `RecordExaminationForm` | Đổi `Promise.all` → `Promise.allSettled` cho 4 catalogs | Mỗi catalog load độc lập, 1 fail không kéo theo cái khác |
| `RecordExaminationForm` | Set state từ từng settled result | Catalog nào thành công thì set, catalog nào fail thì log warning |
| `RecordExaminationForm` | `loadHistoryRecords` catch: `message.error()` → `console.warn()` | History load fail không gây toast lỗi trên tab Phiếu khám |

### Trạng thái sau fix
1. Mở tab phiếu khám → không còn toast lỗi nếu chỉ 1 API fail
2. Catalog Thuốc/Chỉ định load độc lập → dropdown có data ngay cả khi appointment hydration hoặc species API fail
3. History tab errors chỉ log ra console, không ảnh hưởng UX tab Phiếu khám chính

### Phòng ngừa tái phát
1. **Không dùng `Promise.all` cho các API calls không phụ thuộc nhau** — luôn dùng `Promise.allSettled` khi các calls có thể fail independently
2. **Tách concern mount-time**: appointment hydration, catalog loading, history loading phải có error boundary riêng
3. **`message.error()` chỉ dùng cho lỗi trực tiếp ảnh hưởng UX hiện tại** — non-critical hoặc lazy-loaded data chỉ log console

## I18n Migration Status (Client/Clinic/Veterinarian/Admin) - 2026-04-08

### Trạng thái tổng quan
- Client portal: ✓ Hoàn tất i18n.
- Clinic portal: ✓ Hoàn tất i18n.
- Veterinarian portal (`vererianrian`): ✓ Hoàn tất i18n theo 4 nhóm ưu tiên.
- Super Admin portal (`admin`): ✓ Hoàn tất i18n theo 4 nhóm ưu tiên.

### Cấu trúc locale hiện tại
- `src/locales/client/vi.json`
- `src/locales/client/en.json`
- `src/locales/clinic/vi.json`
- `src/locales/clinic/en.json`
- `src/locales/vererianrian/vi.json`
- `src/locales/vererianrian/en.json`
- `src/locales/admin/vi.json`
- `src/locales/admin/en.json`

### I18n Core Config (cập nhật)
- `src/i18n.js` đã khai báo đủ 4 namespace:
  - `client`
  - `clinic`
  - `vererianrian`
  - `admin`
- Resource map hiện tại:
  - `vi.client`, `vi.clinic`, `vi.vererianrian`, `vi.admin`
  - `en.client`, `en.clinic`, `en.vererianrian`, `en.admin`
- Vẫn giữ:
  - `defaultNS: 'client'`
  - `fallbackNS: 'client'`
  - `lng` lấy từ `getInitialLanguage()` (đọc localStorage `lang` dùng chung cho cả 4 portal)
  - `fallbackLng: 'vi'`

### Super Admin I18n Migration (theo nhóm)

#### Nhóm 1 — Layout / Sidebar / Header / Notification Panel
- `src/layouts/admin/AdminLayout.jsx`
- Đã migrate toàn bộ text hiển thị:
  - Sidebar/menu, brand subtitle, profile fallback.
  - Header title.
  - Notification panel (title, tab, empty state, mark-all-read).
  - Time-ago labels (`justNow`, `minutesAgo`, `hoursAgo`, `daysAgo`) qua namespace `admin`.
  - Logout/open-notification aria/title.

#### Nhóm 2 — Clinics Management
- `src/pages/admin/Dashboard/Clinics/index.jsx`
- Đã migrate:
  - Stat card, table column labels, search placeholder, pagination summary.
  - Add clinic modal (section title, label, placeholder, validation message).
  - Delete confirm modal + toast success/error.
  - Status labels: `active`, `deleted`.

#### Nhóm 3 — Users Management
- `src/pages/admin/Dashboard/Users/index.jsx`
- Đã migrate:
  - Stats, page title/subtitle, search/filter placeholder.
  - Table columns + empty state.
  - Role labels qua key `users.role.*` (`CUSTOMER`, `ADMIN`, `ADMIN_CLINIC`, `VETERINARIAN`).
  - Status labels + confirm deactivate + toast.

#### Nhóm 4 — Posts Management
- `src/pages/admin/Dashboard/Posts/index.jsx`
- Đã migrate:
  - Stats, page title/subtitle, search/topic filter placeholder.
  - Table columns, load-more button, all-loaded state.
  - Empty state + delete confirm + toast.
  - Detail modal labels.

### Validation sau migrate
- Build production (`npm run build`): thành công sau mỗi nhóm migrate.
- Rà soát toàn bộ 4 file Super Admin: không còn hardcode text UI (trừ comment code).
- Không thay đổi business logic; chỉ thay text hiển thị và wiring i18n.

### Quy ước maintain bắt buộc
- Mọi text UI mới của Super Admin phải dùng namespace `admin`.
- Không hardcode text mới trong component; luôn thêm key vào cả:
  - `src/locales/admin/vi.json`
  - `src/locales/admin/en.json`
- Không trộn key chéo namespace giữa `client`, `clinic`, `vererianrian`, `admin`.
## Notification System (updated 2026-04-09)

### BE Notification Mechanism
- **Protocol:** REST + WebSocket (Socket.io)
- **REST endpoints (đang có thật ở BE):**
  - `GET /notification?limit=<number>&filter=<ALL|UNREAD>&createdAt=<optional>`
  - `PATCH /notification/mark-one/:id`
  - `PATCH /notification/mark-all`
- **Socket namespace:** `/notification`
- **Authentication:** JWT token truyền qua `handshake.auth.accessToken`
- **Event (server -> client):** `severSendNotification` (giữ nguyên theo BE)

### BE Notification Entity
```
id:          UUID (auto-generated)
recipientId: UUID (FK -> user.id)
type:        NotificationEnum
isRead:      boolean (default: false)
target:      JSONB
createdAt:   Date (auto)
```

### Notification Types (NotificationEnum)
- `APPOINTMENT_BOOKED`
- `APPOINTMENT_CANCELLED`
- `APPOINTMENT_STATUS_UPDATED_BY_CLIENT`
- `APPOINTMENT_REMINDER`
- `AI_DIAGNOSIS`
- `FOLLOW_UP_REMINDER`
- `COMMENT_REPLY`

### FE Integration Architecture (backend-first)

#### Service Layer: `src/services/notificationService.js`
- `getNotificationsApi(instance, { limit, filter, createdAt })` -> gọi `GET /notification`
- `markNotificationAsReadApi(instance, id)` -> gọi `PATCH /notification/mark-one/:id`
- `markAllNotificationsAsReadApi(instance)` -> gọi `PATCH /notification/mark-all`
- `mapBeNotification(raw)` -> map payload BE sang UI model dùng chung
- `loadClientNotifications(...)` giữ compatibility cho Client Header nhưng dữ liệu lấy trực tiếp từ BE notification API

#### Shared Hook: `src/hooks/useNotificationSocket.js`
- Vẫn subscribe realtime qua socket namespace `/notification`
- Bổ sung hydrate danh sách notification từ REST API khi mount
- Poll đồng bộ mỗi 60 giây + refetch khi tab active trở lại
- Tự refetch khi đổi ngôn ngữ (`languageChanged`) để remap tiêu đề/mô tả notification theo locale hiện tại
- `markAsRead`/`markAllAsRead` đồng bộ trực tiếp lên backend (không còn local-only)
- Exposes: `notifications`, `readIdSet`, `unreadCount`, `markAsRead()`, `markAllAsRead()`, `connected`, `loading`, `refreshNotifications()`

#### Layout Integration
| Layout | Data Source |
|--------|-------------|
| **Client Header** (`components/layouts/client/header.jsx`) | REST `/notification` + socket realtime |
| **Clinic Admin** (`layouts/Clinic/AdminClinicLayout.jsx`) | Hook dùng REST + socket |
| **Veterinarian** (`layouts/Vererianrian/AdminVererianrianLayout.jsx`) | Hook dùng REST + socket |
| **Super Admin** (`layouts/admin/AdminLayout.jsx`) | Hook dùng REST + socket |

### Time-ago Labels — Periodic Refresh
- `formatNotificationTimeAgo()` tính `Date.now() - createdAt` tại thời điểm render → nếu component không re-render, nhãn "Vừa xong" bị đóng băng.
- **Fix:** Mỗi layout có `setTimeTick` state cập nhật mỗi **30 giây** → ép re-render → time-ago labels luôn cập nhật.
- Áp dụng: `header.jsx`, `AdminClinicLayout.jsx`, `AdminVererianrianLayout.jsx`.
- `formatNotificationTimeAgo` tồn tại độc lập trong mỗi layout (không abstract), trả về: "Vừa xong" / "X phút trước" / "X giờ trước" / "X ngày trước".

### Files Changed (notification API integration 2026-04-09)
| Action | File |
|--------|------|
| **Modified** | `src/services/notificationService.js` — chuyển sang backend notification REST + mapper dùng chung |
| **Modified** | `src/hooks/useNotificationSocket.js` — hydrate REST + sync mark read lên backend + realtime socket |
| **Modified** | `src/components/layouts/client/header.jsx` — bỏ local read-state, dùng `isRead` từ backend |
| **Modified** | `src/locales/client/vi.json` — bổ sung key i18n cho notification events |
| **Modified** | `src/locales/client/en.json` — bổ sung key i18n cho notification events |
| **Modified** | `src/utils/enumLabel.js` — `getVeterinarySpecialtyOptions()` trả label theo i18n runtime |
| **Modified** | `src/layouts/admin/AdminLayout.jsx` — truyền `getAdminInstance()` vào notification hook |
| **Modified** | `src/layouts/Clinic/AdminClinicLayout.jsx` — truyền `getAdminInstance()` vào notification hook |
| **Modified** | `src/layouts/Vererianrian/AdminVererianrianLayout.jsx` — truyền `getAdminInstance()` vào notification hook |

### Services Directory Convention
All API service files live in `services/` with pattern `{domain}Service.js`.
`notificationService.js` hiện là service API chuẩn cho notification backend (không còn tổng hợp từ appointment/forum ở FE).

## Backlog ưu tiên đề xuất (Web)
1. ~~Chuẩn hóa HTTP layer: gom toàn bộ fetch wrapper về Axios instance.~~ ✓ Đã hoàn thành — toàn bộ API tập trung trong `src/services/`, chỉ Cloudinary upload dùng native `fetch()`.
2. Thêm `ProtectedRoute` cho client/admin/veterinarian để chặn route sớm.
3. Rà soát và dọn các đường dẫn legacy `/admin/*` còn sót trong code/component để thống nhất route canonical.
4. Thay mock bằng API thật cho các màn admin/veterinarian còn template.
5. Đưa `SOCKET_URL` vào env (`VITE_SOCKET_URL`) thay vì hardcoded.
6. Gộp token CSS thành single-source để giảm duplicate.
7. ~~Mở rộng chuẩn hóa i18n cho phần ngoài client portal (admin/clinic/veterinarian) và các text mới phát sinh.~~ ✓ Đã hoàn thành toàn bộ 4 portal (client + clinic + vererianrian + admin); tiếp tục maintain key mới phát sinh.
8. Tạo enum `clinic-status.enum.ts` khi backend xác nhận giá trị trạng thái phòng khám.
9. Hoàn thiện trang super admin còn lại: Overview.
10. Tạo auth context riêng cho super admin (hiện dùng chung `adminClinic/AuthContext`).
