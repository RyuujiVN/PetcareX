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
- `src/data/admin/api/instance.js`
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
- Dữ liệu card phòng khám ở `/choose-clinic` có thể được cá nhân hóa theo từng clinic bằng localStorage key `clinicInfo_{clinicId}` (avatar/tên/địa chỉ/ngày-giờ mở cửa/số điện thoại), fallback về dữ liệu API nếu chưa có dữ liệu lưu.
- `/clinic`: load nội dung HomePageClinic theo phòng khám được chọn (`selectedClinicId`) và CTA đẩy sang `/booking`.
- Dữ liệu HomePageClinic được tách theo key localStorage `homePage_{clinicId}` (fallback về default content nếu chưa có dữ liệu lưu).
- Phần giới thiệu bệnh viện chỉ hiển thị ~100 từ đầu + nút `Đọc thêm`; bấm `Đọc thêm` mở popup hiển thị toàn bộ nội dung, đóng bằng nút `X`.

### 3) Booking Appointment
Luồng đang chạy:

### 4) Walk-in (Phiếu khám vãng lai)
- Nút **"Tạo phiếu khám Vãng Lai"** ở trang danh sách phiếu khám, mở form tạo mới không cần lịch hẹn.
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
- `src/data/Vererianrian/api/userApi.js`:
  - Tra cứu user theo email và tạo user tạm.
- `src/data/Vererianrian/api/petApi.js`:
  - Tra cứu pet theo owner và tạo pet mới cho walk-in.
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
  - Profile box + logout ở bottom sidebar.
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
- API layer riêng: `src/data/admin/api/` (instance.js dùng `ADMIN_AUTH_STORAGE`, clinicApi.js có 5 hàm CRUD).

### 3) Users Management (pages/admin/Dashboard/Users)
- UI dùng cùng token màu admin (`styles/admin/colorsToken.css`), layout thống nhất với Clinics.
- Danh sách người dùng phân trang + tìm kiếm theo tên/email.
- Cột hiển thị: avatar/tên, SĐT, địa chỉ, ngày tạo, email, vai trò, trạng thái.
- API: `GET /api/user?page&limit&search` qua `src/data/admin/api/userApi.js`.

### 4) Posts Management (pages/admin/Dashboard/Posts)
- UI thống nhất với Clinics/Users (stat cards + bảng + thanh tìm kiếm).
- API: `GET /api/post?limit&lastPostTime` (phân trang theo thời gian).
- Cột hiển thị: tác giả, chủ đề, nội dung, bình luận, lượt thích, ngày đăng.
- Tìm kiếm client-side trên dữ liệu đã tải (tác giả/chủ đề/nội dung).

### 5) Các màn chưa có nội dung
- `Overview/`: thư mục đã tạo sẵn, chưa có file component.

## Veterinarian Portal - Trạng thái tính năng

### 1) Lịch hẹn bác sĩ
- `PetAppointmentVererianrian` đã dùng API thật theo ngày hiện tại.
- Nút **"Bắt đầu khám"**:
  - Lần đầu nhấn (khi `BOOKED`): mở tab mới tới `/veterinarian/exam-forms/create?appointmentId=<id>` và gọi `PATCH /appointment/:id` để chuyển trạng thái sang `IN_PROGRESS`.
  - UI danh sách lịch hẹn đổi ngay sang `IN_PROGRESS` (optimistic update) và sync lại bằng refetch nhẹ sau khi API thành công.
  - Khi đã `IN_PROGRESS`, nút vẫn bấm được để mở lại tab phiếu khám, không gọi API đổi trạng thái lần nữa.
- Việc chuyển `COMPLETED` không làm thủ công ở màn danh sách lịch nữa; trạng thái hoàn tất đồng bộ sau khi lưu phiếu khám.

### 2) Hồ sơ bệnh án
- `ListMedicalRecords`: lấy từ API appointment theo ngày, xem chi tiết hồ sơ.
- `ViewPetMedicalRecords`: lấy medical records thật theo `petId/medicalId`, render timeline.

### 3) Phiếu khám
- `ListExaminationForm`: lấy lịch hẹn theo ngày, điều hướng vào phiếu khám theo `appointmentId`.
  - Có auto-refresh khi tab được focus lại (focus + visibilitychange listener) để đồng bộ trạng thái sau khi phiếu khám được tạo ở tab khác.
  - Dùng `inFlightRef` chống duplicate request khi tab focus nhanh liên tục.
  - Silent refresh không hiển thị loading spinner hoặc error toast.
- `RecordExaminationForm`: đã nối API thật:
  - tạo medical record ở lần lưu đầu,
  - cập nhật lại chính medical record đó ở các lần sau,
  - đồng bộ lại medical orders + medicines theo lần lưu mới,
  - tự cập nhật appointment sang `COMPLETED` khi lưu thành công.
  - Tab "Hồ sơ y tế": lấy toàn bộ medical history theo `petId`, sắp xếp mới nhất trước và hiển thị đơn thuốc + chỉ định.
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
  - Nếu thiếu `createdAt`: UI hiển thị cảnh báo yêu cầu backend trả `createdAt` cho medical.

### 5) Vị trí file chính cho luồng "Bắt đầu khám" + khóa 15 phút
- `src/pages/Vererianrian/PetAppointmentVererianrian/petAppointmentVererianrian.jsx`:
  - Handler mở tab mới khi bấm "Bắt đầu khám".
  - Logic chuyển `BOOKED -> IN_PROGRESS` và giữ nút bấm lại được ở trạng thái `IN_PROGRESS`.
- `src/pages/Vererianrian/ListExaminationForm/listExaminationForm.jsx`:
  - Điều hướng tới trang phiếu khám theo `appointmentId`.
  - Nút "Tạo phiếu khám Vãng Lai" mở form walk-in.
  - Mang theo dữ liệu `medical` của appointment để hydrate form.
- `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx`:
  - Cơ chế lock chỉnh sửa 15 phút.
  - Hiển thị countdown + cảnh báo hết hạn.
  - Chế độ read-only sau khi hết hạn.
  - Tab Hồ sơ y tế: appointment -> petId -> medical history.
  - TODO: kiểm tra quyền chia sẻ hồ sơ trước khi hiển thị.
- `src/data/Vererianrian/api/appointmentApi.js`:
  - `getVeterinarianServerNowApi()` dùng đồng bộ clock server cho countdown.
- `src/data/Vererianrian/api/medicalApi.js`:
  - API create/update medical record và CRUD medical orders/medicines phục vụ lưu/cập nhật phiếu khám.
  - `getMedicalByPetId`, `getMedicalOrdersByMedicalId`, `getMedicinesByMedicalId` dùng cho tab hồ sơ y tế.

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
- `adminClinic/PetMedicalRecords`
- `adminClinic/PetMedicalBill`
- `adminVererianrian/PetAppointmentVererianrian`

### 4) Một số route điều hướng chưa khớp route khai báo
- Route thực tế đang dùng là nhóm `/clinic/*` và `/veterinarian/*`; các đường dẫn legacy `/admin/clinic/*`, `/admin/veterinarian/*` được redirect.
- Cần tiếp tục rà soát các link cũ có prefix `/admin/*` để tránh nhầm lẫn khi maintain.

### 5) Socket URL đang hardcoded
- `src/socket/socket.js` dùng cố định `http://localhost:3000/chat`, chưa đưa vào env.

### 6) Token CSS trùng lặp
- Client/Admin token gần như giống nhau, nên cân nhắc single source.

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
- `src/data/client/api/appointmentApi.js` và `src/data/Clinic/api/appointmentApi.js` giữ export cũ (`SERVICE_OPTIONS`, `APPOINTMENT_STATUS_LABEL`) nhưng dữ liệu lấy từ `src/constants/enumLabels.js`.
- `src/data/client/api/petApi.js` giữ API cũ (`getSpeciesLabel`, `getBreedLabel`) nhưng dùng mapping tập trung.

### Quy tắc maintain bắt buộc
1. Không hardcode nhãn enum tiếng Việt trực tiếp trong page/component.
2. Không tạo thêm mapping enum cục bộ trong component (object/switch/ternary) nếu đã có trong `enumLabels.js`.
3. Mọi enum mới từ backend phải bổ sung vào `src/constants/enumLabels.js` trước khi render UI.
4. Component chỉ gọi helper từ `src/utils/enumLabel.js` (hoặc wrapper tương thích) để hiển thị label.

### Chuẩn canonical cho Appointment Status
- Canonical frontend chỉ dùng: `BOOKED`, `IN_PROGRESS`, `COMPLETED`, `CANCELLED`.
- Không dùng biến thể sai chính tả của `CANCELLED` trong hằng số public hoặc mapping label.
- `src/data/client/api/appointmentApi.js` có bước normalize dữ liệu cũ (`SUCCESS`, `DONE`, và biến thể CANCEL*ED) về canonical status trước khi render UI.

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

## Backlog ưu tiên đề xuất (Web)
1. Chuẩn hóa HTTP layer: gom toàn bộ fetch wrapper về Axios instance.
2. Thêm `ProtectedRoute` cho client/admin/veterinarian để chặn route sớm.
3. Rà soát và dọn các đường dẫn legacy `/admin/*` còn sót trong code/component để thống nhất route canonical.
4. Thay mock bằng API thật cho các màn admin/veterinarian còn template.
5. Đưa `SOCKET_URL` vào env (`VITE_SOCKET_URL`) thay vì hardcoded.
6. Gộp token CSS thành single-source để giảm duplicate.
7. Tiếp tục chuẩn hóa i18n và giảm hardcoded text tiếng Việt trong UI.
8. Tạo enum `clinic-status.enum.ts` khi backend xác nhận giá trị trạng thái phòng khám.
9. Hoàn thiện trang super admin còn lại: Overview.
10. Tạo auth context riêng cho super admin (hiện dùng chung `adminClinic/AuthContext`).
