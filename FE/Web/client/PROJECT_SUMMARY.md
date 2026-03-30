# PetCareX Web Client Project Summary

## Tổng quan dự án
PetCareX Web Client là ứng dụng frontend cho 3 nhóm người dùng chính:
- Client Portal: Chủ nuôi thú cưng (đặt lịch, quản lý thú cưng, hồ sơ y tế, diễn đàn, chatbot AI).
- Admin Clinic Portal: Quản lý phòng khám (quản lý lịch hẹn, bác sĩ, hồ sơ khám).
- Veterinarian Portal: Bác sĩ thú y (quản lý lịch, lập phiếu khám, xem hồ sơ bệnh án).

Dự án được xây dựng theo kiến trúc route-based, tách khá rõ theo từng portal trong `src/pages`, `src/layouts`, `src/data`, `src/hooks`.

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

### 4) State và realtime
- Redux store:
  - `roomSlice`: danh sách room chat, create/rename/delete.
  - `messageSlice`: danh sách message theo room, load phân trang cũ, stream token AI.
- Socket realtime:
  - Kết nối `http://localhost:3000/chat` (hardcoded).
  - Auth qua `clientAccessToken`.

## Authentication & Role Split

### 1) Dual auth context (Client/Admin)
- `src/hooks/client/AuthContext.jsx`
- `src/hooks/adminClinic/AuthContext.jsx`

Mỗi context quản lý:
- `token`
- `userProfile`
- `login/logout`
- `refreshUserProfile`

### 2) Storage key tách biệt
- Client:
  - `clientAccessToken`
  - `clientUserInfo`
- Admin:
  - `adminAccessToken`
  - `adminUserInfo`
- Legacy keys (`accessToken`, `userInfo`) luôn được clear để tránh nhiễu phiên.

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

### 2) Axios instances
- `src/data/client/api/instance.js`
- `src/data/adminClinic/api/instance.js`
- `src/data/adminVererianrian/api/instance.js`

Chức năng chính:
- Auto attach Bearer token đúng storage key.
- Normalize error message backend.
- 401 -> clear auth và redirect `/login`.

### 3) Fetch wrappers còn tồn tại
- `src/data/client/api/forumFetchClient.js`
- `src/data/client/api/medicalApi.js`
- `src/data/shared/api/cloudinaryUploadFetch.js`

=> Codebase vẫn đang chạy song song Axios và Fetch.

### 4) Các nhóm API nổi bật
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

### 2) Home & chọn phòng khám
- `/home`: landing/marketing.
- `/choose-clinic`: lấy clinic từ API, lưu `selectedClinicId` vào sessionStorage, điều hướng `/clinic`.
- `/clinic`: nội dung marketing + CTA đẩy sang `/booking`.

### 3) Booking Appointment
Luồng đang chạy:
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
- Auto refresh 20 giây + refresh khi tab active lại.
- Hủy lịch (PATCH status).
- Xem chi tiết lịch.
- Mở modal chẩn đoán AI (`PetDiagnosisContent`).

### 5) PetDiagnosis (AI report)
- Module `appointmentDiagnosis.js`:
  - gửi prompt qua socket,
  - nhận phản hồi AI,
  - fallback markdown khi timeout/lỗi,
  - cache theo `appointmentId` trong localStorage.

### 6) Pet Management
- Add pet: species/breed theo API, upload avatar rồi tạo pet.
- List pet: xem + xóa pet.
- Pet profile: xem/sửa thông tin pet, cập nhật ảnh.

### 7) Medical Records
- List pet trước khi vào hồ sơ.
- Medical records lấy theo `petId` hoặc `medicalId`.
- Enrich từng record bằng medical orders + medicines.
- Render timeline + reminder block.

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

### 9) ChatBot AI
- Không còn là UI mock thuần.
- Có room list/create/rename/delete qua API.
- Có message history theo room.
- Có streaming token AI qua socket (`aiResponse` + `serverResponseAIMessage`).
- Có persistence hội thoại theo room từ backend.

## Admin Clinic Portal - Trạng thái tính năng

### 1) Auth & layout
- Dùng login chung `/login`.
- Sidebar quản trị + profile menu + đổi mật khẩu trong layout.

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

### 4) Exam Slips & Medical Records
- `ListPetExaminationRecords`: đã dùng API appointment để liệt kê thú cưng theo lịch khám.
- `ListPetMedicalRecords`: đã dùng API appointment để nhóm hồ sơ theo pet.
- `ViewMedicalRecords`: đã dùng API medical thật để xem timeline chi tiết.

### 5) Các màn còn template/mock trong admin clinic
- `PetMedicalRecords`: dữ liệu cứng (template phiếu khám).
- `PetMedicalBill`: dữ liệu tiền thuốc/xét nghiệm cứng; chỉ phần xác nhận thanh toán có gọi API cập nhật status appointment.

### 6) Admin Clinic Profile
- Lấy profile `/user/profile`.
- Cho sửa phone/address và đồng bộ lại context.

## Super Admin Portal (ADMIN) - Trạng thái tính năng

### 1) Layout & Routing
- `AdminLayout` (`src/layouts/admin/AdminLayout.jsx`):
  - Sidebar dark theme (navy) + header "Dashboard Admin" + search + notification.
  - Menu: Tổng quan, Quản lý phòng khám, Quản lý người dùng, Quản lý bài đăng.
  - Profile box + logout ở bottom sidebar.
  - Dùng auth context chung từ `hooks/adminClinic/AuthContext`.
- Routes đã khai báo:
  - `/admin/home` → `Clinics` (trang chính khi ADMIN đăng nhập).
  - `/admin/dashboard/clinics` → `Clinics`.
- CSS: `styles/admin/colorsToken.css` (biến màu riêng cho admin, sidebar dark theme, stat cards).
- `authRole.js` đã tách: `ADMIN` → `/admin/home`, `ADMIN_CLINIC` → `/admin/clinic/appointments`.

### 2) Clinics Management (pages/admin/Dashboard/Clinics)
- UI hoàn chỉnh: 3 stat cards (nền màu + icon trong hộp vuông) + bảng danh sách + phân trang.
- Stat cards: phòng khám (nền xanh lá nhạt), người dùng (nền xanh dương nhạt), bài đăng (nền cam nhạt).
- Cột bảng: tên (kèm Avatar viết tắt), SĐT, vị trí, ngày thành lập (dd/MM/yyyy), email, trạng thái (Tag), thao tác (xem/xóa).
- Nút "Thêm phòng khám" màu teal (#2dd4a8) theo theme admin.
- Trạng thái phòng khám: dùng local constant `CLINIC_STATUS` (ACTIVE/INACTIVE) — TODO: chuyển sang enum khi backend cung cấp.
- Toàn bộ dữ liệu đang mock (useState rỗng), các handler đều là TODO chờ nối API.

### 3) Các màn chưa có nội dung
- `Overview/`, `Users/`, `Posts/`: thư mục đã tạo sẵn, chưa có file component.

## Veterinarian Portal - Trạng thái tính năng

### 1) Lịch hẹn bác sĩ
- `PetAppointmentVererianrian` hiện chủ yếu dùng dữ liệu mock cứng (summary card + danh sách lịch).

### 2) Hồ sơ bệnh án
- `ListMedicalRecords`: lấy từ API appointment theo ngày, xem chi tiết hồ sơ.
- `ViewPetMedicalRecords`: lấy medical records thật theo `petId/medicalId`, render timeline.

### 3) Phiếu khám
- `ListExaminationForm`: lấy lịch hẹn theo ngày, tạo phiếu khám hoặc xóa lịch.
- `RecordExaminationForm`: đã nối API thật:
  - tạo medical record,
  - cập nhật follow-up/note,
  - tạo medical orders,
  - tạo medicines,
  - tự cập nhật appointment sang `COMPLETED`.

## Styling & Design System

### 1) Token CSS
- `src/styles/client/colorsToken.css`
- `src/styles/adminClinic/colorsToken.css`
- `src/styles/admin/colorsToken.css` (biến màu riêng cho super admin: sidebar dark, stat cards, brand)

Thư mục `styles/admin/colorsToken.css` chứa thêm biến sidebar dark theme (`--admin-sidebar-*`) và stat cards (`--admin-stat-*`).
Style component đặt cạnh page (`pages/admin/Dashboard/Clinics/style.css`).

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

### 4) Veterinarian exam workflow
1. Chọn lịch hẹn từ danh sách phiếu khám.
2. Điền form khám.
3. Lưu medical record + chỉ định + thuốc.
4. Đồng bộ trạng thái appointment sang `COMPLETED`.

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
- `adminClinic/PetMedicalRecords`
- `adminClinic/PetMedicalBill`
- `adminVererianrian/PetAppointmentVererianrian`
- `admin/Dashboard/Clinics` (UI hoàn chỉnh, dữ liệu mock — chờ API)

### 4) Một số route điều hướng chưa khớp route khai báo
- Điều hướng tới `/admin/clinic/medical-records/view` nhưng chưa có route tương ứng.
- Điều hướng tới `/admin/clinic/exam-slips/:appointmentId/bill` nhưng chưa có route tương ứng.
- `PetAppointmentVererianrian` điều hướng tới `/admin/veterinarian/exam-slips/:id` nhưng route hiện có là `/admin/veterinarian/exam-forms/*`.
- Super admin routes (`/admin/dashboard/users`, `/admin/dashboard/posts`) chưa có component tương ứng.

### 5) Socket URL đang hardcoded
- `src/socket/socket.js` dùng cố định `http://localhost:3000/chat`, chưa đưa vào env.

### 6) Token CSS trùng lặp
- Client/Admin token gần như giống nhau, nên cân nhắc single source.

### 7) Một số dữ liệu UI vẫn hardcoded
- Nhiều block marketing và thông tin clinic (rating/time/demo content).

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

### 8) Chưa có clinic status enum
- Enum folder chưa có `clinic-status.enum.ts`. Trang Clinics dùng local constant `CLINIC_STATUS` tạm thời.
- Cần backend cung cấp enum clinic status để đồng bộ FE.

## Backlog ưu tiên đề xuất (Web)
1. Chuẩn hóa HTTP layer: gom toàn bộ fetch wrapper về Axios instance.
2. Thêm `ProtectedRoute` cho client/admin/veterinarian để chặn route sớm.
3. Sửa các route điều hướng chưa khớp khai báo (medical-records/view, bill, exam-slips).
4. Thay mock bằng API thật cho các màn admin/veterinarian còn template.
5. Đưa `SOCKET_URL` vào env (`VITE_SOCKET_URL`) thay vì hardcoded.
6. Gộp token CSS thành single-source để giảm duplicate.
7. Tiếp tục chuẩn hóa i18n và giảm hardcoded text tiếng Việt trong UI.
8. Tạo enum `clinic-status.enum.ts` khi backend xác nhận giá trị trạng thái phòng khám.
9. Hoàn thiện các trang super admin còn lại: Overview, Users, Posts.
10. Tạo auth context riêng cho super admin (hiện dùng chung `adminClinic/AuthContext`).
