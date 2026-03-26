# PetCareX Web Client Project Summary

## 📌 Tổng quan dự án
PetCareX Web Client là ứng dụng frontend cho 2 nhóm người dùng:
- **Client Portal**: Chủ nuôi thú cưng (đặt lịch, quản lý thú cưng, hồ sơ y tế, diễn đàn, chatbot).
- **Admin Clinic Portal**: Quản trị/phòng khám/bác sĩ (quản lý lịch hẹn, bác sĩ, hồ sơ khám).

Dự án được phát triển bằng React + Vite, tổ chức theo kiến trúc route-based với tách lớp `client` và `adminClinic` khá rõ ở `src/pages`, `src/hooks`, `src/data`.

## 🛠 Tech Stack
- **Frontend core**: React 19, Vite.
- **Routing**: `react-router-dom` (BrowserRouter + nested routes layout).
- **UI library**: Ant Design (Form, Modal, Select, Tabs, Card, Avatar, ...).
- **Icons**: Ant Design Icons, React Icons, Lucide.
- **HTTP**: Axios (chính) + Fetch wrapper (một số module).
- **Date handling**: `dayjs`.
<<<<<<< HEAD
- **OAuth**: `@react-oauth/google` (client portal).
=======
- **Auth social login**: Firebase Web SDK (`firebase/auth`) + backend endpoint `/auth/login-google`.
>>>>>>> eee3bfd9178250eeddb5e73e9ebbd217738f6ec5
- **Styling**: CSS modules + page CSS + token CSS variables.

## 🧩 Kiến trúc ứng dụng

### 1) Bootstrap & Provider Chain
- Entry tại `src/main.jsx`:
  - Nạp CSS token cho cả client/admin.
  - Bọc `BrowserRouter`.
  - Bọc **2 auth context song song**:
    - `ClientAuthProvider`
    - `AdminAuthProvider`
<<<<<<< HEAD
  - Chỉ bọc `GoogleOAuthProvider` khi `VITE_GOOGLE_CLIENT_ID` hợp lệ.
=======
  - Khởi tạo Firebase Analytics an toàn (nếu browser hỗ trợ và có `measurementId`), không làm crash app khi bị chặn analytics.
>>>>>>> eee3bfd9178250eeddb5e73e9ebbd217738f6ec5

### 2) Routing & Layout phân tầng
- Định tuyến tập trung tại `src/routes/AppRoutes.jsx`.
- 3 layout chính:
  - `MainLayout`: Header + Footer (`/`, `/home`, `/clinic`, `/choose-clinic`, `/booking`, `/appointments`, `/success-booking`).
  - `HeaderLayout`: Header-only cho các màn nghiệp vụ (`/add-pet`, `/chatbot`, `/user/profile`, `/listPet`, `/medical-records`, `/forum`, ...).
  - `AdminClinicLayout`: Sidebar quản trị cho `/admin/clinic/*`.

### 3) Scroll behavior
- `src/ScrollToTop.jsx` reset vị trí cuộn khi đổi route để giữ UX ổn định.

## 🔐 Authentication & Role Split

### 1) Dual auth context (Client/Admin)
- `src/hooks/client/AuthContext.jsx`
- `src/hooks/adminClinic/AuthContext.jsx`

Mỗi context quản lý riêng:
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
- Legacy key (`accessToken`, `userInfo`) luôn được clear để tránh nhiễu phiên cũ.

### 3) Role guard theo cổng đăng nhập
- Hàm `isAdminClinicAccount(...)` tại `src/constants/authRole.js`.
- Client login sẽ chặn role admin/clinic/vet và điều hướng sang `/admin/login`.
- Admin login sẽ chặn role user thường và điều hướng sang `/login`.

<<<<<<< HEAD
=======
### 4) Google Login/Register (Client) - kiến trúc mới gọn hơn
- Firebase config tập trung tại `src/utils/firebaseClient.js`.
- Luồng Google auth cho client gom tại `src/utils/clientGoogleAuth.js` để tái sử dụng cho cả màn Login và Register.
- Login/Register không còn parse token thủ công bằng `atob`; thay bằng `signInWithPopup` + `GoogleAuthProvider.credentialFromResult(...)` để lấy `googleIdToken`.
- Sau khi lấy token Google từ Firebase, FE gọi API `/auth/login-google` như cũ để backend thống nhất cấp `accessToken` nội bộ.
- Nếu account thuộc role admin/clinic/vet thì vẫn redirect về `/admin/login` (đảm bảo không lẫn phiên giữa 2 portal).

>>>>>>> eee3bfd9178250eeddb5e73e9ebbd217738f6ec5
## 🌐 API Layer & Networking

## 1) Base URL & env
- Base URL: `VITE_API_URL` (fallback `http://localhost:3000/api`).
- File cấu hình mẫu: `.env.example`.

### 2) Axios instances
- `src/data/client/api/instance.js`
- `src/data/adminClinic/api/instance.js`

Tính năng chung:
- Auto attach Bearer token theo đúng storage key từng portal.
- Normalize lỗi backend (`message` array -> lấy phần tử đầu).
- Xử lý `401`:
  - Client redirect `/login`.
  - Admin redirect `/admin/login`.

### 3) Fetch wrappers (song song với Axios)
- `src/data/client/api/medicalApi.js`
- `src/data/client/api/forumFetchClient.js`

Hiện tại codebase đang tồn tại song song 2 phong cách gọi API:
- Axios cho phần lớn module.
- Fetch wrapper cho medical/forum helper.

### 4) Các nhóm API chính
- Auth: `/auth/login`, `/auth/register`, `/auth/login-google`, `/auth/forgot-password`, `/auth/reset-password`.
- User: `/user/profile`, `/user/:id`, `/cloudinary/upload/one-file`.
- Pet: `/pet`, `/pet/:id`, `/pet/species`, `/pet/species/:species/breed`, `/pet/upload`.
- Clinic: `/clinic`, `/clinic/:id`, `/clinic/upload`.
- Veterinarian: `/veterinarian`.
- Appointment: `/appointment`, `/appointment/my`, `PATCH /appointment/:id`.
- Medical: `/medical/*`, `/medical/:id/medical-order`, `/medical/:id/medicine`.
- Forum:
  - Post: `/post`, `/post/:id`, `/post/:id/like`, `/post/:id/remove-like`, `/post/:id/comments`
  - Comment: `/comment`, `/comment/:id`, `/comment/replies`
  - Topic: `/topic`, `/topic/get-all`

## 👤 Client Portal - Trạng thái tính năng

### 1) Auth (Login/Register/Forgot/Reset)
- Đầy đủ form validation và thông báo lỗi.
<<<<<<< HEAD
- Google login/register dùng `login-google` + decode token để lấy `fullName/avatarUrl`.
=======
- Google login/register dùng Firebase popup auth + helper dùng chung, sau đó gọi `login-google` để nhận token hệ thống.
>>>>>>> eee3bfd9178250eeddb5e73e9ebbd217738f6ec5
- OTP reset password có:
  - Countdown hết hạn OTP (300s).
  - Cooldown resend (60s).

### 2) Home & Clinic Selection
- Home (`/home`) mang tính landing/marketing.
- Chọn phòng khám (`/choose-clinic`):
  - Tải danh sách clinic từ API.
  - Lưu `selectedClinicId` vào `sessionStorage`.
  - Điều hướng sang `/clinic`.

### 3) HomePageClinic
- Là trang giới thiệu clinic theo hướng nội dung/marketing.
- Chứa nhiều dữ liệu tĩnh (đội ngũ bác sĩ, bài post cộng đồng, dịch vụ mô tả).
- CTA chính đẩy qua luồng booking.

### 4) Booking Appointment
- Luồng chính:
  1. Chọn thú cưng.
  2. Chọn dịch vụ + clinic.
  3. Chọn bác sĩ + nhập triệu chứng.
  4. Chọn ngày/giờ.
  5. Xác nhận summary modal.
  6. Gửi `POST /appointment`.
- Có kiểm tra:
  - Không cho đặt quá khứ.
  - Loại trừ khung giờ trùng trên bác sĩ đã chọn.

### 5) Appointment Detail
- Lấy `GET /appointment/my`.
- Chia tab:
  - Sắp tới.
  - Lịch sử.
- Có auto refresh định kỳ 20 giây + refresh khi tab browser active lại.
- Hỗ trợ hủy lịch (PATCH trạng thái).

### 6) Pet Management
- `AddPet`:
  - Tải species/breed từ API.
  - Upload avatar rồi mới tạo pet.
- `ListPet`:
  - Xem danh sách + xóa pet.
- `PetProfile`:
  - Xem/sửa thông tin pet, đổi avatar, update dữ liệu.

### 7) Medical Records
- `ListPetMedicalRecords`: chọn pet trước.
- `MedicalRecords`:
  - Lấy hồ sơ theo `petId` hoặc `medicalId`.
  - Enrich chi tiết bằng order + medicine theo từng medical record.
  - Render timeline + reminder block.

### 8) Forum
- Hỗ trợ:
  - Tạo/sửa/xóa bài viết.
  - Like/unlike.
  - Bình luận + reply nhiều cấp.
  - Upload ảnh cho post/comment/reply.
- Cách nhúng ảnh trong content:
  - Token `[[img:url]]`.
- Cách nhúng title:
  - Token `[[title:text]]`.
- Có featured ranking theo engagement score.
- Có filter theo topic.

### 9) ChatBot AI
- Trạng thái hiện tại: **UI mock**.
- Chưa gọi API AI thực tế, chưa có persistence (refresh trang sẽ mất state).

## 🏥 Admin Clinic Portal - Trạng thái tính năng

### 1) Auth
- Bộ màn login/register/forgot/reset riêng cho admin path.
- Xác thực role trước khi cho vào cổng quản trị.

### 2) Layout quản trị
- Sidebar điều hướng:
  - Lịch hẹn.
  - Sổ y tế.
  - Doanh thu.
  - Bác sĩ.
  - Xem phiếu khám.
- Có box profile admin ở cuối sidebar.

### 3) Appointment Management
- Lấy lịch khám clinic từ API.
- Filter theo ngày/giờ + search text.
- Hiển thị kiểu cột trạng thái (BOOKED/IN_PROGRESS/COMPLETED).
- Drag & drop giữa các cột để cập nhật status bằng API.
- Modal chi tiết pet + lịch khám.
- Cho phép hủy lịch nếu đang BOOKED.

### 4) Veterinarian Management
- Hook `useVeterinarians` chịu trách nhiệm:
  - Resolve clinicId (state/storage/token/profile API).
  - Fetch danh sách có phân trang + search + specialty filter.
  - CRUD bác sĩ.
- Có màn thêm bác sĩ mới + màn xem/chỉnh sửa thông tin bác sĩ.

### 5) Admin Clinic Profile
- Tải profile từ `/user/profile`.
- Hiển thị role/email/phone/address.

### 6) Exam Slips & Medical Records (Admin)
- `ListPetExaminationRecords` đã dùng API appointment để liệt kê hồ sơ theo ngữ cảnh khám.
- `ListPetMedicalRecords` đang dùng dữ liệu mock cứng.
- `PetMedicalRecords` hiện là template form UI, dữ liệu chủ yếu mock.

## 🎨 Styling & Design System

### 1) Token CSS
- `src/styles/client/colorsToken.css`
- `src/styles/adminClinic/colorsToken.css`

Hiện hai file gần như đồng nhất, cùng semantic token cho:
- Brand, surface, border, text, state colors.
- Shadow tokens.
- Page-level alias tokens (`--page-*`).

### 2) Global style
- `src/index.css` chứa:
  - Reset cơ bản.
  - Keyframes.
  - Tùy biến antd ở vài khu vực.
  - Alias biến màu cho auth/user/home.

### 3) Layout components
- Header/Footer client dùng component riêng tại `src/components/layouts/client/*`.
- Admin hiện dùng sidebar layout chính; component admin header cũ vẫn còn trong source.

## ⚡ Luồng dữ liệu chính

### 1) Client login -> booking
1. Đăng nhập -> nhận token + profile.
2. Chọn clinic -> lưu `selectedClinicId` session.
3. Vào booking:
   - Lấy pets + clinics + appointments hiện có.
   - Lấy doctor theo clinic.
   - Validate slot.
4. Submit appointment -> điều hướng success.

### 2) Client pet -> medical
1. User chọn pet tại list medical records.
2. Mở medical records theo `petId` query.
3. Tải danh sách medical theo pet.
4. Với mỗi record tải thêm orders + medicines.
5. Render timeline đầy đủ.

### 3) Forum post/comment flow
1. Tạo bài hoặc bình luận kèm ảnh.
2. Upload ảnh cloudinary one-file.
3. Embed URL vào content token.
4. Reload feed/comment thread.

## ✅ Điểm mạnh hiện tại
- Tách rõ client/admin theo route + context + storage.
- API layer đã chuẩn hóa phần lớn qua axios instance + interceptor.
- Booking flow có validate thời gian và check trùng lịch theo bác sĩ.
- Forum hỗ trợ tương tác khá đầy đủ (post/comment/reply/like/image/topic).
- Hook `useVeterinarians` xử lý tốt bài toán resolve clinic context.

## ⚠️ Trade-off & kỹ thuật cần lưu ý

### 1) Song song Axios và Fetch
- Gây phân mảnh cách xử lý lỗi/response/auth.
- Nên chuẩn hóa về một HTTP layer duy nhất trong iteration sau.

### 2) Chưa có route guard tập trung
- Hiện chủ yếu dựa vào interceptor 401 để redirect.
- UX có thể bị nháy trang khi vào route không hợp lệ.

### 3) Một số màn admin còn mock
- `ListPetMedicalRecords` và `PetMedicalRecords` chưa nối full API thực tế.

### 4) Một số dữ liệu UI đang hardcoded
- Ví dụ time/rating ở clinic selection, nhiều block giới thiệu ở Home/HomePageClinic.

### 5) ChatBot mới ở mức mô phỏng
- Chưa có backend AI, chưa lưu hội thoại.

## 📂 Workspace chuẩn khi thao tác
- **Web client root path chuẩn:** `F:\capstone 2\code\PetcareX\FE\Web\client`
- **Quy ước chạy lệnh:** tất cả lệnh `npm run dev/build/lint` chạy từ root trên.
- **Biến môi trường chính:**
  - `VITE_API_URL`
<<<<<<< HEAD
  - `VITE_GOOGLE_CLIENT_ID`
=======
  - `VITE_FIREBASE_WEB_API_KEY`
  - `VITE_FIREBASE_AUTH_DOMAIN`
  - `VITE_FIREBASE_PROJECT_ID`
  - `VITE_FIREBASE_STORAGE_BUCKET`
  - `VITE_FIREBASE_MESSAGING_SENDER_ID`
  - `VITE_FIREBASE_WEB_APP_ID`
  - `VITE_FIREBASE_WEB_MEASUREMENT_ID`

## 🔒 Bảo mật env & commit policy
- `.env` đã nằm trong `.gitignore`, không được commit lên repo.
- Chỉ commit `.env.example` với placeholder, không chứa key thật.
- Trên môi trường CI/CD (Vercel/Netlify/GitHub Actions), set biến `VITE_*` qua dashboard secrets thay vì hardcode.
- Với tác vụ ghi file bằng PowerShell (`Set-Content`, `Out-File`), luôn bắt buộc dùng UTF-8 để tránh lỗi tiếng Việt.
>>>>>>> eee3bfd9178250eeddb5e73e9ebbd217738f6ec5

## 🧪 Hướng dẫn chạy nhanh
1. `Set-Location "F:\capstone 2\code\PetcareX\FE\Web\client"`
2. `npm install`
3. Tạo `.env` từ `.env.example` và điền giá trị thật.
4. `npm run dev`
5. Build production: `npm run build`

## 📌 Backlog ưu tiên đề xuất (Web)
1. Chuẩn hóa HTTP layer: bỏ fetch wrapper trùng chức năng, gom về axios instance thống nhất.
2. Bổ sung ProtectedRoute cho client/admin để chặn route sớm (trước khi render screen).
3. Kết nối API thật cho các màn admin đang mock (`medical-records`, `exam slip detail`).
4. Nâng ChatBot từ UI mock lên API thật + lưu lịch sử hội thoại.
5. Chuẩn hóa token/theme theo single-source (tránh duplicate giữa client/admin token CSS).
6. Hoàn thiện i18n cho web (hiện labels phần lớn đang hardcoded tiếng Việt).
