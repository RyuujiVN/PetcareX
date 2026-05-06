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
- Charts: `recharts` (Area chart cho Revenue Dashboard).

## Cập nhật mới nhất (2026-05-06)

### Cập nhật (2026-05-06) — Popup chỉnh sửa bài post Forum đồng bộ multi-image cho 4 role

**Yêu cầu nghiệp vụ mới:**
- Ở Forum của cả 4 role `admin`, `client`, `clinic`, `veterinarian`, popup chỉnh sửa bài post phải dùng cùng kiểu upload ảnh như lúc đăng.
- Nút chọn ảnh trong popup chỉnh sửa đổi về nhãn `Chọn ảnh`, không dùng `Chọn ảnh khác`.
- Khi chỉnh sửa bài post vẫn phải cho phép chọn nhiều ảnh, không giới hạn 1 ảnh.

**Phạm vi thay đổi (FE Web only):**
- `src/pages/client/User/Forum/forum.jsx`
- `src/pages/Clinic/Forum/ClinicForum.jsx`
- `src/pages/Vererianrian/Forum/VetForum.jsx`
- `src/pages/admin/Forum/AdminForum.jsx`

**Chi tiết kỹ thuật đã áp dụng:**
- Popup chỉnh sửa bài post được đồng bộ sang cùng pattern với popup đăng: input `multiple`, preview nhiều ảnh, và nút gỡ ảnh từng item.
- UI của popup chỉnh sửa cũng bám sát popup đăng hơn: dùng cùng container fixed-height, tiêu đề canh giữa, và label chủ đề đồng nhất để 4 portal nhìn giống nhau.
- Khi mở bài viết để chỉnh sửa, FE prefill lại danh sách ảnh hiện có từ `post.images` (fallback `post.image` nếu cần) để không làm mất ảnh cũ.
- Khi lưu bài viết, FE chỉ upload các file mới được chọn; ảnh cũ được giữ nguyên và ghép chung vào `imageUrls` khi build content.

**Tự kiểm tra:**
- `get_errors` trên 4 file Forum đã sửa: không có lỗi.
- `npm run build` (FE/Web/client): thành công.

### Cập nhật (2026-05-06) — Bắt buộc nén ảnh toàn cục trên FE + xử lý lỗi upload 413

**Bối cảnh lỗi người dùng:**
- Cùng một ảnh khoảng 1.1MB: upload thành công trên local nhưng khi deploy thì API upload multi-file trả `413 Payload Too Large`.
- Yêu cầu mới: mọi ảnh upload từ FE đều phải resize/nén, đồng thời xử lý hợp lý khi gặp 413.

**Nguyên nhân gốc (đã xác nhận):**
- FE trước đó gửi multipart trực tiếp lên `/cloudinary/upload/multi-file`; nếu tầng hạ tầng production giới hạn request thấp hơn local thì có thể bị chặn trước khi BE xử lý.
- Một số luồng upload (đặc biệt avatar profile) còn đi đường `FormData` riêng, chưa thống nhất vào một pipeline nén dùng chung.

**Tự phản biện & phương án tối ưu đã chọn:**
- Phương án A: chỉ bắt lỗi 413 và báo người dùng tự đổi ảnh nhỏ hơn.
  - Nhược: UX kém, người dùng phải thao tác thủ công nhiều lần.
- Phương án B (được chọn): nén bắt buộc ở FE cho tất cả luồng upload + fallback thông minh khi gặp 413.
  - Ưu điểm: giữ nguyên contract BE, giảm rủi ro lỗi deploy/local mismatch, thay đổi tập trung ở service dùng chung nên ít lan man.

**Phạm vi thay đổi (FE Web only):**
- `src/services/cloudinaryService.js`
- `src/services/userService.js`
- `src/pages/client/User/ProfileUser/index.jsx`
- `.env.example`

**Chi tiết kỹ thuật đã triển khai:**
- `cloudinaryService.js`:
  - Thêm pipeline nén ảnh client-side bắt buộc (canvas) trước khi upload cho cả one-file và multi-file.
  - Chuẩn hóa output ảnh nén sang `.webp` để giảm dung lượng và tương thích whitelist BE (`.webp` được chấp nhận).
  - Cố định cấu hình nén trực tiếp trong code (không dùng env) theo ngưỡng thực tế:
    - `IMAGE_MAX_DIMENSION = 1600`
    - `IMAGE_QUALITY = 0.8`
    - `IMAGE_MIN_QUALITY = 0.5`
    - `IMAGE_MAX_OUTPUT_BYTES = 0.75MB`
    - `AGGRESSIVE_IMAGE_MAX_OUTPUT_BYTES = 0.55MB`
  - Tối ưu theo BE limit (`5MB/file`) nhưng đặt target thấp hơn nhiều để tránh lỗi `413` từ tầng hạ tầng deploy.
  - Chuẩn hóa lỗi upload thành `Error` có `status/code` để nhận diện 413 rõ ràng.
  - Luồng multi-file: nếu dính 413 thì tự fallback sang upload tuần tự từng ảnh qua one-file sau khi nén.
  - Luồng one-file và file-resize: nếu dính 413 thì retry với cấu hình nén aggressive trước khi fail.
- `userService.js`:
  - `uploadAvatarApi` không còn upload raw FormData trực tiếp; chuyển sang dùng `uploadOneFileToCloudinary` để đi qua pipeline nén bắt buộc.
- `ProfileUser/index.jsx`:
  - Upload avatar chuyển sang truyền trực tiếp `file`.
  - Hiển thị `error.message` từ service để người dùng thấy thông báo 413 rõ nghĩa thay vì message chung.
- `.env.example`:
  - Không thêm biến nén ảnh, vì cấu hình đã được cố định trực tiếp trong service để tránh lệch môi trường.

**Thông báo khi gặp 413 (đã chuẩn hóa):**
- `Da thu nen anh nhung van vuot gioi han upload cua he thong (413). Vui long chon anh nho hon.`

**Xác nhận không ảnh hưởng BE:**
- Không sửa file nào trong `BE/petcare/*`.
- Không đổi endpoint, method, DTO hay contract API upload hiện tại.

**Tự kiểm tra:**
- `npm run build` (FE/Web/client): thành công.

### Cập nhật (2026-05-06) — Phiếu khám: cho phép để trống kết luận + giảm giật UI ở cột liều dùng

**Yêu cầu nghiệp vụ mới:**
- Ở form tạo/chỉnh sửa phiếu khám, trường `KẾT LUẬN CHUYÊN MÔN` không bắt buộc nhập.
- Khi field `LIỀU DÙNG` báo lỗi validation, UI không được gây cảm giác giật/nhảy lên trên.
- Ở bảng `Phiếu chỉ định xét nghiệm/X-Quang` và `Đơn thuốc chỉ định`, không bắt buộc phải chọn ngay `Loại chỉ định` hoặc `Tên thuốc`.

**Phạm vi thay đổi (FE only):**
- `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx`
- `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.module.css`

**Chi tiết kỹ thuật đã cập nhật:**
- Bỏ rule `required` khỏi field `conclusionSummary` để bác sĩ có thể lưu phiếu khám mà không cần nhập kết luận chuyên môn.
- Bỏ rule `required` khỏi field `medicalOrderId` (chỉ định) và `medicineId` (thuốc), cho phép lưu form khi chưa chọn hai trường này.
- Tinh chỉnh hành vi auto-scroll khi submit lỗi từ `block: 'center'` sang `block: 'nearest'` để tránh hiện tượng nhảy màn hình không cần thiết khi lỗi nằm ngay trong vùng nhìn thấy.
- Với field `quantity` (cột `LIỀU DÙNG`), bỏ validation `required` để không còn bắt buộc nhập; đồng thời giữ class đồng bộ `dynamicFieldItem` cho toàn bộ ô input trong 2 bảng (chỉ định + thuốc) và căn `dynamicRow`/`dynamicRowMedicine` theo top để ổn định layout khi có lỗi ở các cột khác.

**Tự kiểm tra:**
- `npm run build` (FE/Web/client): thành công.


### Cập nhật (2026-05-05) — Fix hiển thị bình luận thô (raw HTML) trên Forum Web

**Bối cảnh lỗi người dùng:**
- Ở phần bình luận Forum, một số comment cũ hiển thị thô chuỗi HTML như `<p>...</p>` và `<img src="..." />` thay vì hiển thị text + ảnh đúng UI.

**Nguyên nhân gốc (đã xác nhận):**
- FE đang parse nội dung bằng `extractMediaFromContent`, nhưng hàm này trước đó chỉ hỗ trợ token nội bộ `[[img:...]]`/`[[title:...]]`.
- Dữ liệu legacy từ BE có comment/post lưu theo HTML (`<p>`, `<br>`, `<img>`) không được parser bóc tách.
- UI render chuỗi bằng React text node (`<p>{content}</p>`) nên HTML bị escape và hiện ra dạng chữ thô.

**Tự phản biện & phương án tối ưu đã chọn:**
- Phương án A: render HTML trực tiếp bằng `dangerouslySetInnerHTML` + sanitize.
  - Nhược: tăng rủi ro XSS nếu sanitize lệch cấu hình; diff lớn hơn và khó kiểm soát consistency giữa 4 portal.
- Phương án B (được chọn): giữ cơ chế render text/image hiện tại, chỉ nâng parser để hỗ trợ cả token nội bộ và HTML legacy.
  - Ưu điểm: an toàn hơn (không render HTML trực tiếp), diff nhỏ, không đổi contract BE, không phá UI hiện có.

**Phạm vi thay đổi (FE Web only):**
- `src/pages/client/User/Forum/forum.jsx`
- `src/pages/Clinic/Forum/ClinicForum.jsx`
- `src/pages/Vererianrian/Forum/VetForum.jsx`
- `src/pages/admin/Forum/AdminForum.jsx`

**Chi tiết kỹ thuật đã sửa:**
- Bổ sung parser HTML nội bộ để:
  - phát hiện nội dung có tag HTML,
  - tách `src` từ thẻ `<img>` thành danh sách ảnh,
  - chuẩn hóa text (xử lý `<p>`, `<div>`, `<br>`, xuống dòng),
  - fallback regex khi DOMParser không khả dụng.
- Nâng `extractMediaFromContent` để merge ảnh từ 2 nguồn:
  - token `[[img:...]]` (format mới),
  - thẻ `<img>` HTML (format legacy),
  - sau đó dedupe URL và giữ `firstImage` như flow cũ.
- Giữ nguyên render layer hiện tại (text + image riêng), nên không ảnh hưởng style/layout comment bubble.

**Xác nhận không ảnh hưởng BE:**
- Không sửa endpoint/forum contract.
- Không thay đổi payload format khi tạo/sửa comment mới.

**Tự kiểm tra:**
- `npm run build` (FE/Web/client): thành công.
- `npx eslint` các file Forum đã sửa: không có lỗi mới từ parser; còn warning hooks và 1 lỗi `no-unused-vars` pre-existing ở `src/pages/client/User/Forum/forum.jsx` không thuộc phạm vi fix này.

### Cập nhật (2026-05-05) — Fix lỗi mở lại phiếu khám chưa thanh toán bị báo "Không tìm thấy thú cưng từ lịch hẹn"

**Bối cảnh lỗi người dùng:**
- Ở portal bác sĩ, sau khi đã tạo phiếu khám (chưa thanh toán) và mở lại từ danh sách phiếu khám để chỉnh sửa, khi bấm lưu có thể bị chặn với thông báo:
  - `Không tìm thấy thú cưng từ lịch hẹn, vui lòng chọn lại lịch hẹn trước khi lưu`.

**Nguyên nhân gốc (đã xác nhận):**
- Luồng mở lại từ danh sách phiếu khám có thể đi bằng `medicalId` mà không có đầy đủ context `appointment`.
- Trong `RecordExaminationForm`, nhánh lưu non-walk-in trước đó lấy `petId` và owner info quá phụ thuộc vào `appointment?.petRaw`, nên khi `appointment` null sẽ ném lỗi dù dữ liệu `pet/owner` đã có trong `editableMedicalRecord`.
- Đây là mismatch logic ở FE (submit resolver), không phải bug nghiệp vụ từ BE.

**Tự phản biện & phương án tối ưu đã chọn:**
- Phương án A (chỉ vá mỗi `petId` ở submit): diff nhỏ nhưng còn rủi ro thiếu dữ liệu owner/pet fields trong payload.
- Phương án B (được chọn): vá resolver đầy đủ trong cùng file form:
  - `petId`: ưu tiên appointment, fallback về `editableMedicalRecord` / `latestMedicalRecord`.
  - owner/pet identity fields: fallback theo chuỗi an toàn từ form values -> appointment -> medical record.
  - đồng thời prefill initial hidden fields cho non-walk-in bằng dữ liệu từ medical record khi appointment context thiếu.
- Lý do chọn B: vẫn FE-only, rủi ro thấp, xử lý triệt để hơn A nhưng không cần đụng BE.

**Phạm vi thay đổi (FE only):**
- `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx`:
  - Cập nhật `buildInitialValues` để non-walk-in có fallback từ `editableMedicalRecord.pet` + `owner`.
  - Cập nhật `onFinish` (nhánh non-walk-in) để resolve `petId`, owner info, species/breed/petName theo fallback chain.

**Xác nhận không ảnh hưởng BE:**
- Không sửa file nào trong `BE/petcare/*`.
- Không đổi endpoint, method, payload contract, DTO, migration hay schema DB.
- Không thêm API call mới bắt buộc ở runtime.

**Tự kiểm tra:**
- `get_errors` trên file đã sửa: không có lỗi.
- `npx eslint src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx`: không phát sinh lỗi lint.
- `npm run build` (FE/Web/client): thành công.

### Cập nhật (2026-05-05) — Đồng bộ màn Admin Activity với API `GET /api/revenue/top-booked-clinic`

**Bối cảnh nghiệp vụ:**
- Team BE chốt API admin cho bảng hoạt động phòng khám là `GET /api/revenue/top-booked-clinic?orderByType=DESC`.
- Màn `Hoạt động phòng khám` trước đó đang tự tổng hợp từ `/clinic` + `/medical/clinic` theo từng kỳ thời gian (`tháng này/tháng trước/quý này`) nên phát sinh sai lệch với contract BE admin.

**Phạm vi thay đổi (FE Web only):**
- `src/services/adminActivityService.js`:
  - Bỏ luồng gọi `/medical/clinic` theo từng phòng khám.
  - Chuyển sang gọi trực tiếp `/revenue/top-booked-clinic`.
  - Chuẩn hóa dữ liệu raw từ BE về dạng `id`, `name`, `address`, `visits`, `active`.
  - KPI summary tính trực tiếp từ dataset API (tổng phòng khám, tổng lượt khám); trạng thái phòng khám được quy về hoạt động theo yêu cầu nghiệp vụ hiện tại.
- `src/hooks/admin/useAdminActivity.js`:
  - Bỏ state/logic `period`.
  - Giữ lại search theo tên/địa chỉ trên danh sách ranking.
- `src/pages/admin/Dashboard/Activity/index.jsx`:
  - Tiêu đề đổi thành `Thống kê hoạt động phòng khám tháng {tháng hiện tại}`.
  - Bỏ cụm tab lọc kỳ `Tháng này / Tháng trước / Quý này`.
- `src/pages/admin/Dashboard/Activity/components/ClinicActivityRankingTable.jsx`:
  - Bỏ cột `Kỳ trước` và `Tăng/giảm`.
  - Đổi nhãn `Lượt khám kỳ này` thành `Lượt khám`.
  - Trạng thái hiển thị theo hướng tất cả đang hoạt động theo yêu cầu admin.
- `src/locales/admin/{vi,en}.json`:
  - Bổ sung key tiêu đề theo tháng `activity.pageTitleWithMonth`.
  - Cập nhật nhãn cột lượt khám.

**Tự phản biện & quyết định tối ưu đã chọn:**
- Phương án 1 (giữ logic cũ + vá quyền BE): đổi role endpoint `/medical/clinic` để admin đọc được theo `clinicId` query.
  - Nhược điểm: vẫn lệch contract API admin đã chốt, FE phải gọi N request theo số clinic, chi phí network cao.
- Phương án 2 (được chọn): dùng trực tiếp API admin `top-booked-clinic`.
  - Ưu điểm: đúng contract BE hiện tại, ít request hơn, code đơn giản hơn, diff nhỏ đúng nguyên tắc surgical change.

**Tự kiểm tra:**
- Rà lại import/props của hook và component Activity sau khi bỏ `period`.
- Bảo toàn scope thay đổi trong module Activity + i18n admin, không lan sang portal khác.

## Cập nhật trước đó (2026-05-04)

### Cập nhật (2026-05-04) — Booking validation + Admin search/pagination + Vet phone rule + Clinic Editor upload UI + HomePageClinic review carousel

**Phạm vi thay đổi:**
- `src/pages/client/User/BookingAppointment/index.jsx`, `src/pages/client/User/BookingAppointment/styles.css`, `src/locales/client/{vi,en}.json`:
  - Bỏ hoàn toàn cơ chế đổi ảnh header theo `userProfile.avatarUrl`; chuyển về background cố định (`/bannerBooking.png`) để UI ổn định theo mẫu.
  - Khi nhấn `Xác nhận` mà thiếu giờ khám: hiển thị lỗi rõ ràng qua toast từ validator (`Vui lòng chọn khung giờ khám!`) thay vì fail im lặng trên field ẩn.
  - Khi click khung giờ bị chặn do lead-time (< 3 giờ): hiển thị ngay thông báo `Bạn cần đặt lịch trước ít nhất 3 tiếng!`.
  - Bổ sung xử lý hiển thị lỗi đầu tiên từ `form.validateFields` để người dùng luôn nhận được feedback.

- `BE/petcare/src/clinic/clinic.service.ts` (BE fix theo đúng bug nghiệp vụ Admin):
  - Sửa search clinic từ match cứng theo tên sang match gần đúng (`ILIKE %keyword%`) cho cả `clinic.name` **hoặc** `clinic.phone`.
  - Giải quyết đúng triệt để lỗi `no data` khi admin search theo tên phòng khám/SĐT.

- `src/pages/admin/Dashboard/Posts/index.jsx`, `src/locales/admin/{vi,en}.json`:
  - Đổi cơ chế `Load more` thành pagination chuẩn AntD.
  - Giới hạn mỗi trang `10` bài và hỗ trợ chuyển trang bằng nút next/prev hoặc chọn số trang (page 2, page 3...).
  - Khi đổi keyword/chủ đề: reset về page 1 để tránh trang rỗng.

- `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx`, `src/locales/vererianrian/{vi,en}.json`:
  - Chuẩn hóa validate SĐT cho luồng phiếu khám ngoài: regex `^0\d{9}$`.
  - Thêm sanitize input phone (chỉ số, tối đa 10 ký tự) ở form walk-in.
  - Thống nhất message: `SĐT phải gồm 10 chữ số, bắt đầu bằng 0`.

- `src/pages/Clinic/ClinicPortalEditor/HomePageEditorTab.jsx`:
  - Xóa phần hiển thị link URL ảnh ở khu vực upload ảnh banner và ảnh bác sĩ.
  - Giữ nút `Tải ảnh lên` + preview ảnh như yêu cầu.

- `src/components/common/ClinicReview/{ClinicReviewSection.jsx,ClinicReviewList.jsx,ClinicReviewItem.jsx,ClinicReviewSection.module.css}`, `src/locales/client/{vi,en}.json`:
  - Đổi phần review trên HomePageClinic sang chế độ carousel ngang.
  - Desktop hiển thị 4 review/card mỗi viewport; muốn xem thêm thì kéo qua phải, xem lại kéo trái.
  - Bổ sung kéo ngang bằng chuột (drag), nút điều hướng trái/phải và tự tải thêm khi kéo gần cuối danh sách.
  - Nếu nội dung review dài: rút gọn có `...` + nút `Xem thêm/Thu gọn` theo từng card.

**Phản biện & phương án tối ưu đã chọn:**
- Admin clinic search:
  - Không vá FE kiểu filter local vì dữ liệu đang phân trang server-side, dễ lệch total/meta.
  - Chọn fix ngay tại BE query để thống nhất cho mọi consumer và đúng bản chất lỗi.

- Admin posts pagination:
  - Không thêm endpoint page mới ở BE trong lần này để tránh phá contract forum hiện tại.
  - Chọn fetch batch lớn + phân trang UI 10 dòng/trang để đạt yêu cầu UX ngay, giữ thay đổi nhỏ, ít rủi ro.

- HomePageClinic review:
  - Không làm lại toàn bộ section để tránh ảnh hưởng flow gửi review/điều kiện đủ điều kiện đánh giá.
  - Chỉ thay đổi tầng hiển thị list sang carousel + truncate, giữ nguyên pipeline dữ liệu hiện hữu.

**Tự kiểm tra:**
- `npx eslint` các file FE đã sửa: sạch lỗi.
- `npm run build` (FE/Web/client): thành công.
- `npm run build` (BE/petcare): thành công.

### Cập nhật (2026-04-28) — Tinh chỉnh UI/UX đa portal: Doctor Panel, Vet Fields, ChatBot Header, Sidebar Toggle, Forum Search

**Phạm vi (FE only):**
- `src/pages/client/User/BookingAppointment/index.jsx` + `styles.css`:
  - Doctor detail panel truncate 100 ký tự cho `experience`/`description`, thêm nút **Xem thêm** mở AntD Modal.
  - `experience` hiển thị dạng text (không ép hậu tố "năm").
  - Thêm style `.doctor-read-more`.
- `src/pages/Clinic/InformationVererianrian/InformationVererianrian.jsx` + `src/pages/Clinic/AddNewVererianrian/addNewVererianrian.jsx`:
  - Field `experience` dùng `Input` (string), `description` dùng `TextArea` ở cả form thêm mới và chỉnh sửa.
  - Payload update gửi `experience`, `description`, `introduce` (alias).
- `src/layouts/Clinic/AdminClinicLayout.jsx`, `src/layouts/Vererianrian/AdminVererianrianLayout.jsx`, `src/layouts/admin/AdminLayout.jsx`:
  - Khi route ChatBot: ẩn header nội bộ `.chatbot-header`, title AI hiển thị ở layout header/action bar.
  - Admin layout thêm nút toggle sidebar (fixed) để luôn mở lại khi collapsed; Clinic toggle hiển thị cả ở fullscreen route.
- `src/pages/Clinic/Forum/ClinicForum.jsx`, `src/pages/Vererianrian/Forum/VetForum.jsx`, `src/pages/admin/Forum/AdminForum.jsx`:
  - Reuse `ForumSearchBar` và áp dụng limit = `keyword ? 50 : 1000` khi search.
  - Thêm UI search card + empty state cho kết quả rỗng.
- i18n: bổ sung key `pages.booking.doctor.*` và `pages.forum.search.*` cho `client`, `clinic`, `vererianrian`, `admin`.

**Tự kiểm tra:**
- `npx eslint` (các file chỉnh sửa) → còn warnings pre-existing:
  - `InformationVererianrian.jsx`: `react-hooks/exhaustive-deps` (useMemo).
  - `ClinicForum.jsx` / `VetForum.jsx` / `AdminForum.jsx`: `react-hooks/exhaustive-deps` (useEffect/useCallback).
- `npm run build` → thành công (vite build, 5985 modules, 15.79s).

### Cập nhật (2026-04-27) — Cải thiện Select "Phòng khám gần bạn" trong BookingAppointment: hiện tên + địa chỉ + khoảng cách

**Phạm vi (FE only):**
- `src/pages/client/User/BookingAppointment/index.jsx`:
  - Import thêm `formatDistance` (`src/utils/formatDistance.js`) và `DEFAULT_LOCATION` (`src/constants/location.js`).
  - `useUserLocation` lấy thêm `isDefault: locationIsDefault`, `retry: retryLocation`.
  - Refactor Select clinicId từ `options=[{label,value}]` (1 dòng tên) sang `<Select.Option>` JSX với 3 thông tin:
    - **Selected (collapsed)** dùng `optionLabelProp="displayLabel"` → hiển thị compact `"Tên phòng khám · 2.3km"` (không tràn input).
    - **Option (dropdown row)**: grid 2 cột — left: tên (line 1, đậm) + địa chỉ kèm icon `EnvironmentOutlined` (line 2, nhạt, ellipsis); right: badge khoảng cách (`formatDistance(item.distance)`).
    - `popupMatchSelectWidth={420}` → dropdown rộng đủ để show address mà không bóp tên/địa chỉ.
  - Banner fallback `clinic-location-banner` hiện ngay dưới Select khi `locationIsDefault=true` và không có `preselectedClinicId`: icon vị trí + text "Đang tính khoảng cách từ Đà Nẵng (vị trí mặc định)" + nút "Cho phép vị trí của tôi" → gọi `retryLocation`. Nút disabled khi `locationLoading` để tránh double-fire.
- `src/pages/client/User/BookingAppointment/styles.css`:
  - Thêm `.clinic-option`, `.clinic-option-main`, `.clinic-option-name`, `.clinic-option-address`, `.clinic-option-distance` (badge pill màu brand-primary).
  - Thêm `.clinic-location-banner` + `.clinic-location-banner-action` cho banner fallback.
- `src/locales/client/{vi,en}.json` — thêm `pages.booking.form.locationFallbackNotice` (`{{city}}` placeholder) + `pages.booking.form.locationFallbackAction`. Reuse `DEFAULT_LOCATION.label` ("Đà Nẵng") làm `city` thay vì hardcode.

**Định vị — đã rà soát chính xác:**
- `useUserLocation` đã có `enableHighAccuracy: true` + timeout 10s + cache module-scope → tận dụng GPS/WiFi triangulation, tránh IP-based fallback (ISP/datacenter lệch hàng chục km).
- BookingAppointment chờ `!locationLoading` mới `bootstrapData()` (line 306-311) → đảm bảo `lat/lon` truyền vào `getNearbyClinicListApi` luôn là vị trí đã resolve (real or default), không bao giờ là `null`.
- Banner fallback CHỈ hiện khi `isDefault=true` → user biết được khoảng cách hiển thị đang tính từ Đà Nẵng (default), không bị nhầm tưởng đó là vị trí thật.

**Phương án UI/UX đã chọn — Phương án A (custom render trong AntD Select qua `optionLabelProp`):**
- Lý do: surgical, đồng bộ pattern doctor select đã dùng (line 750-775 cùng file), giữ nguyên AntD Form integration (validation, keyboard nav, tab order).
- Đã phản biện và **loại Phương án B** (custom Popover + List): linh hoạt hơn nhưng phá vỡ pattern Form Select hiện có, mất kiểu validation tự động của AntD → vi phạm "match existing style" trong CLAUDE.md.

**Tự kiểm tra:**
- `npm run build` → thành công (vite build, 22.90s).
- Backward-compat: 3 caller khác của `getNearbyClinicListApi` (ClinicSelection, các nơi khác) không bị ảnh hưởng — chỉ thay đổi UI hiển thị tại BookingAppointment.

**Ghi chú kiến trúc để tham khảo sau:**
- Khi cần hiển thị nhiều thông tin trong AntD `<Select>` value mà giữ collapsed view gọn: dùng `optionLabelProp` + JSX option children. Đây là pattern chuẩn của AntD, đã có 2 chỗ dùng trong codebase (doctor select + clinic select mới).
- Nếu sau này cần search trong Select clinic → bật `showSearch` + custom `filterOption` so với cả `name` và `address`.

### Cập nhật (2026-04-27) — Thêm tính năng Search vào Forum (Client portal)

**Phạm vi (FE only, không đụng BE):**
- `src/services/forumService.js` — `getPostsApi(instance, { limit, lastPostTime, keyword, topicId, sortRecent })`: thêm 3 param optional `keyword`, `topicId`, `sortRecent`. Param chỉ append vào query khi có giá trị (giữ backward-compat: 3 caller khác `AdminForum`, `VetForum`, `ClinicForum` truyền `{ limit: 1000 }` không bị ảnh hưởng).
- `src/pages/client/User/Forum/ForumSearchBar.jsx` (mới) — component search input tái sử dụng được:
  - Icon `FaMagnifyingGlass` bên trái + input + nút clear `FaXmark` bên phải (chỉ hiện khi có text).
  - Debounce 500ms (configurable qua prop `debounceMs`) — không gọi API mỗi ký tự.
  - Pattern đồng bộ external `value` ↔ internal state qua `lastEmittedRef` để tránh loop khi parent reset.
  - Props: `value`, `onSearch(keyword)`, `placeholder`, `debounceMs`, `ariaLabel`. Style nhúng từ `forum.module.css` (token màu `--forum-primary*`, không hardcode hex cho màu chủ đạo).
- `src/pages/client/User/Forum/forum.jsx`:
  - Thêm state `searchKeyword` + `searchKeywordRef` để `loadPosts` đọc keyword hiện tại không cần là dependency.
  - `loadPosts({ keyword })` truyền `keyword` xuống `getPostsApi`. Khi gọi không param thì lấy `searchKeywordRef.current` (giữ keyword hiện tại sau create/update/delete post).
  - **Limit động theo trạng thái search**: `limit = keyword ? 50 : 1000`. Lý do: BE Elasticsearch RRF hardcode `rank_window_size: 50` (`post-search.service.ts:110`), ES yêu cầu `size <= rank_window_size` → khi search mà truyền `limit > 50` sẽ throw `action_request_validation_exception` (500). Khi không search BE đi nhánh query thường (không RRF) nên `limit: 1000` vẫn OK.
  - `useEffect([searchKeyword])` + `didMountSearchRef` để bỏ qua lần fire đầu tiên (initial load đã fetch rồi) → mỗi lần keyword thay đổi sẽ refetch.
  - JSX: thêm `searchCard` ngay trên `composeCard` trong `leftColumn`, chứa `<ForumSearchBar/>` + status row khi đang search (chip "Đang tìm: ...", nút "Xóa tìm kiếm", số lượng kết quả).
  - Empty state khi search rỗng kết quả: icon kính lúp + tiêu đề + gợi ý "Thử tìm với từ khóa khác".
- `src/pages/client/User/Forum/forum.module.css` — thêm `.searchCard`, `.searchBar`, `.searchBarIcon`, `.searchBarInput`, `.searchBarClearBtn`, `.searchStatusRow`, `.searchActiveChip`, `.searchClearLink`, `.searchResultCount`, `.searchEmptyState`, `.searchEmptyIcon`, `.searchEmptyTitle`, `.searchEmptyHint`. Dùng token `--forum-primary` / `--forum-primary-soft` cho màu nhấn (đồng bộ với rest of forum).
- `src/locales/client/{vi,en}.json` — thêm namespace `pages.forum.search`: `placeholder`, `activeLabel`, `clear`, `resultCount`, `emptyTitle`, `emptyHint`.

**BE API đã confirm (đọc file, không sửa):**
- `GET /api/post` (`BE/petcare/src/forum/post/post.controller.ts:36-83`): query params `limit` (required), optional `lastPostTime`, `topicId`, `keyword`, `sortRecent`.
- Search engine: Elasticsearch RRF kết hợp BM25 full-text trên field `content` (fuzziness AUTO) + semantic search trên `semantic_content` (`post-search.service.ts:55-128`). Filter `topicId` áp dụng cho cả 2 retriever → có thể kết hợp keyword + topic.
- Search **chỉ trên content** (BE entity không có cột `title` riêng — title nhúng trong content qua token `[[title:...]]` ở FE, không index riêng).

**Phương án UI/UX đã chọn — Phương án A (search bar tách card riêng phía trên composeCard):**
- Lý do: tách rõ vai trò "find" (search) vs "create" (composer). Giữ được topic filter Dropdown đã có sẵn trong `composeActions` không bị xáo trộn.
- Search bar full-width trong card riêng → dễ nhận biết, không tranh chỗ với composer.
- Status row chỉ hiện khi đang search → không tốn không gian khi user chưa search.

**Tự kiểm tra:**
- `npm run build` (thư mục `FE/Web/client`) → thành công (vite build, 5985 modules transformed, 19.32s).
- `npx eslint` các file đã sửa → 0 lỗi mới (3 issue pre-existing không liên quan ở line 330/1236/1558).

**⚠️ Vấn đề BE cần dev biết (không tự fix):**
- `BE/petcare/src/forum/post/post-search.service.ts:51` — sai chính tả `createAt` (thiếu chữ `d`, đúng phải là `createdAt`) trong sort khi `sortRecent=true` → sort không có hiệu lực. FE chưa truyền `sortRecent` nên không phá feature hiện tại.
- `BE/petcare/src/forum/post/post-search.service.ts:55-128` — khi có `keyword` nhưng `sortRecent=false`, ES không có sort fallback theo `createdAt` → pagination cursor `lastPostTime` không deterministic. FE hiện fetch `limit:1000` không pagination thật nên chưa lộ vấn đề; cần fix nếu sau này bật infinite scroll.
- `BE/petcare/src/forum/post/post.service.ts:40` — còn `console.log(postIds)` sót trong production code.
- `BE/petcare/src/forum/post/post-search.service.ts:110` — `rank_window_size: 50` hardcoded → khi FE muốn search trả nhiều hơn 50 kết quả phải BE nâng `rank_window_size` (đồng thời chấp nhận tải nặng hơn cho ES rerank). FE đang clamp `limit=50` khi search để tránh 500.

### Cập nhật (2026-04-23) — Tích hợp vị trí địa lý (lat/lon) vào tìm kiếm phòng khám gần nhất

**Phạm vi (FE only, không đụng BE):**
- `src/constants/location.js` (mới) — `DEFAULT_LOCATION = { lat: 16.061063335944954, lon: 108.21931990, label: 'Đà Nẵng' }`, `GEOLOCATION_TIMEOUT_MS = 10000`, `GEOLOCATION_MAX_AGE_MS = 5 * 60 * 1000`.
- `src/utils/formatDistance.js` (mới) — `formatDistance(distanceKm)` format theo quy ước `<1km → "Xm"`, `>=1km → "X.Xkm"`. Lưu ý: BE trả distance **đơn vị km** (ES `_geo_distance` với `unit: 'km'`).
- `src/hooks/client/useUserLocation.js` (mới) — hook quản lý vị trí user: gọi `navigator.geolocation.getCurrentPosition` với timeout 10s, thất bại/từ chối/không support → fallback về `DEFAULT_LOCATION` + `isDefault: true`. Cache ở module scope để không hỏi permission mỗi lần mount. Trả về `{ lat, lon, isDefault, isLoading, error, retry }`.
- `src/services/clinicService.js`:
  - `getClinicListApi(instance, page, limit, search)` **đã đổi path** từ `/clinic/user` → `/clinic` (endpoint admin, trả `{items, meta}` chuẩn `nestjs-typeorm-paginate`). Admin dashboard và `adminActivityService` dùng hàm này.
  - Thêm `getNearbyClinicListApi(instance, { page, limit, search, lat, lon, sortBy })` hit `/clinic/user`. BE trả raw array (không có `items/meta`), mỗi item kèm field `distance` (km). Hàm normalize về array đã chuẩn hoá `openingTime/closingTime`.
- `src/pages/client/Home/ClinicSelection/index.jsx` + `styles.css` + `locales/client/{vi,en}.json`:
  - Dùng `useUserLocation` + `getNearbyClinicListApi` với `sortBy: 'distance'`.
  - Bỏ sort theo rating ở FE (BE đã sort theo khoảng cách — phải giữ thứ tự BE trả).
  - Thêm banner fallback `.clinic-location-banner` khi `isDefault`: icon địa chỉ + text + button "Cho phép vị trí của tôi" → gọi `retry`.
  - Thêm `.clinic-distance` trong card (icon `FaMapMarkerAlt` + `formatDistance(clinic.distance)`) ngay dưới địa chỉ.
  - i18n key mới: `pages.home.clinicSelection.locationFallbackNotice`, `pages.home.clinicSelection.locationFallbackAction`.
- `src/pages/client/User/BookingAppointment/index.jsx`: dùng `useUserLocation` + `getNearbyClinicListApi`, `useEffect` bootstrap chờ `!locationLoading` mới fetch để tránh 2 lần gọi (default + real). Logic preselectedClinicId giữ nguyên.

**BE API đã confirm (đọc file, không sửa):**
- Clinic entity (`BE/petcare/src/clinic/entities/clinic.entity.ts`): field `lat: decimal`, `lon: decimal` (tên chính xác).
- Endpoint `GET /api/clinic/user` (`clinic.controller.ts`): query params **bắt buộc** `page`, `limit`, `lat`, `lon`; optional `sortBy: 'distance' | 'rating'` (default `'distance'`) và `search`. Role cho phép: ADMIN, ADMIN_CLINIC, VETERINARIAN, CUSTOMER.
- Service: `ClinicSearchService.searchClinics` (Elasticsearch) sort theo `_geo_distance` (km), trả `hits.hits.map(hit => ({ ...hit._source, distance: hit.sort.at(-1) }))` — **raw array**, không có pagination wrapper.
- Endpoint `GET /api/clinic` (admin-only, `paginate<Clinic>`) trả `{items, meta, links}` — FE `getClinicListApi` chuyển sang dùng endpoint này cho admin dashboard.

**Phương án fallback UX:**
- Khi đang hỏi permission (`locationLoading`): `<Spin>` bao quanh lưới clinic, không fire request.
- Thất bại/từ chối → dùng `DEFAULT_LOCATION`, hiện banner không obtrusive với nút retry. Không spam toast.
- Có vị trí thật → không banner, load danh sách bình thường.
- Không tự tính Haversine ở FE (BE đã sort theo ES geo_distance, nếu sau này BE không trả `distance` thì chỉ bỏ dòng hiển thị, không cần tính lại phía client).

**Tự kiểm tra:**
- `npx eslint` các file đã sửa → sạch (1 warning pre-existing về `fetchDoctorsByClinic` không liên quan).
- `npm run build` → thành công (5984 modules, 29.66s).

**⚠️ Vấn đề BE cần dev biết (không tự fix):**
- `GET /api/clinic/user` hiện trả raw array từ Elasticsearch, không còn `{items, meta}`. Nếu muốn phân trang phía user (load more / infinite scroll) thì BE cần wrap lại response (ví dụ: `{ items, meta: { totalItems, currentPage, itemsPerPage, totalPages } }`). FE tạm thời fetch `limit=50` không phân trang ở user portal.
- `page` ở ES search hiện truyền thẳng vào `from` — nếu `page > 1` thì ý nghĩa khác (ES `from` là offset, không phải page). Không ảnh hưởng FE hiện tại vì chỉ gọi `page=1, limit=50`, nhưng cần lưu ý khi bật pagination.

### Cập nhật (2026-04-21) — Fix nghiêm trọng layout ChatBot Client: thanh nhập bị dồn lên cao ở route `/chatbot`

**Phạm vi:**
- `src/pages/client/Home/ChatBotAI/index.jsx`
- `src/pages/client/Home/ChatBotAI/styles.css`

**Triệu chứng người dùng báo:**
- Khi mở mới route `/chatbot`, ô nhập chat không bám đáy mà nhảy lên vùng trên.
- Khi bấm vào một lịch sử chat thì nội dung trông ổn hơn, nhưng vị trí thanh nhập vẫn cao hơn mong muốn.

**Phân tích nguyên nhân gốc (đã tự phản biện):**
- Client/Clinic/Veterinarian/Admin ChatBot đang dùng chung các class global trùng tên (`.chatbot-container`, `.chatbot-main`, ...).
- Trong `AppRoutes.jsx`, các page ChatBot của nhiều portal được import tĩnh, nên CSS của các portal cùng được nạp và có thể override lẫn nhau theo thứ tự bundle.
- Trên màn Client, rule đúng cần cho root là chiều cao theo viewport (trừ header cố định). Nhưng khi bị rule portal khác ghi đè thành `height: 100%`, root mất chiều cao hữu hiệu, làm dock input không còn bám đáy.

**Tự phản biện phương án:**
- Phương án 1: thêm `!important` cho nhiều thuộc tính.
  - Nhanh nhưng khó bảo trì, dễ tạo hiệu ứng phụ khi sửa UI về sau.
- Phương án 2: đổi toàn bộ sang CSS Modules cho ChatBot.
  - Sạch nhất dài hạn nhưng diff lớn, rủi ro regression cao cho hotfix UI.
- Phương án 3 (đã chọn): giữ cấu trúc hiện tại, **cô lập scope Client bằng class đặc thù + tăng specificity có kiểm soát**.
  - Diff nhỏ, xử lý đúng gốc xung đột cross-portal, ít rủi ro nhất.

**Fix đã triển khai (tối ưu):**
- `index.jsx`: thêm class scope cho root: `chatbot-container client-chatbot-page`.
- `styles.css`:
  - Đổi selector root thành `.chatbot-container.client-chatbot-page` để thắng override global từ portal khác.
  - Chuẩn hóa chiều cao root theo header fixed:
    - `height: calc(100dvh - var(--petcare-header-height, 70px))`
    - `margin-top: var(--petcare-header-height, 70px)`
    - bỏ `padding-top` để tránh cộng dồn theo box model.
  - Tăng độ ổn định cho vùng nội dung:
    - `.chatbox-layout { height: 100%; }`
    - `.empty-state { flex: 1; }`
  => đảm bảo thanh nhập luôn neo ở đáy cả khi chưa chọn lịch sử lẫn khi đang chat.

**Ghi chú kiến trúc để tránh lặp lỗi:**
- Không nên dùng class global trùng nhau cho nhiều portal nếu không có namespace/scoping rõ ràng.
- Với route có header fixed, nên ưu tiên công thức `height: calc(100dvh - headerHeight)` + `margin-top: headerHeight` thay vì padding-top trên container chính khi cần kiểm soát layout full-height.

### Cập nhật (2026-04-21) — Fix triệt để sticky header `PHIẾU KHÁM BỆNH & CHỈ ĐỊNH` (dời scroll container lên `formRoot`)

**Phạm vi:** `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.module.css`.

**Triệu chứng người dùng báo:**
- Header `PHIẾU KHÁM BỆNH & CHỈ ĐỊNH` (khối `Mã hồ sơ` + `Ngày khám`) vẫn trôi đi khi cuộn nội dung phía dưới, dù đã đặt `position: sticky; top: 0` và tăng `z-index` ở lần fix trước.

**Phân tích nguyên nhân gốc (tự phản biện):**
- `position: sticky` chỉ dính với **scroll container gần nhất chứa chính nó**. Cấu trúc DOM trước đây:
  - `.formRoot` (Form, height:100%, flex column, KHÔNG scroll)
    - `.formHeader` (sticky top:0) ← nằm ngoài scroll container
    - `Tabs` (flex:1) → mỗi `TabPane` chứa `.formScrollableContent` (`overflow-y:auto`) ← đây mới là scroll container thật.
- Vì vậy khi người dùng cuộn `.formScrollableContent`, sticky của `.formHeader` hoàn toàn vô hiệu (không cùng container).
- Phản biện phương án "duplicate header vào từng tab": xấu, lặp i18n, khó bảo trì, mỗi lần đổi tab header bị re-mount.
- Phương án tối ưu đã chọn: **chuyển scroll container lên `.formRoot`**, bỏ scroll nội bộ ở `.formScrollableContent` và bỏ `flex:1` ở `.tabsRoot` để nội dung Tabs flow tự nhiên. Khi đó `.formHeader` nằm trong đúng scroll container và sticky hoạt động đúng.

**Thay đổi đã triển khai (CSS):**
- `.formRoot`: thêm `overflow-y:auto; overflow-x:hidden; scrollbar-width:none; -ms-overflow-style:none;` + `::-webkit-scrollbar { width:0; height:0; }` để biến nó thành scroll container ẩn scrollbar.
- `.formScrollableContent`: bỏ `overflow-y:auto` và các thuộc tính ẩn scrollbar (không còn cần — giờ chỉ là wrapper nội dung tab).
- `.tabsRoot`: bỏ `flex:1` (giữ `min-height:0`) để Tabs flow chiều cao theo nội dung, cho phép `formRoot` cuộn toàn bộ.
- `.formHeader`: tăng `z-index` từ `12` → `20` và thêm `flex-shrink:0` đảm bảo không bị co khi flex column container cuộn.

**Tác dụng phụ đã cân nhắc:**
- Tab bar của Ant Tabs sẽ cuộn cùng với nội dung (không còn fixed). Người dùng chỉ yêu cầu cố định header phiếu khám nên chấp nhận được. Nếu về sau cần cố định tab bar, có thể thêm `position: sticky; top: <height formHeader>; z-index: 15; background: ...;` cho `.ant-tabs-nav` trong `.tabsRoot`.
- Không đổi JSX, không đổi BE, không đổi i18n → tuân thủ rule "không sửa cross-boundary".

**Regression:**
- `npm run build` (thư mục `FE/Web/client`) → thành công (vite build, 5982 modules transformed, 28.93s).

### Cập nhật (2026-04-21) — Tối ưu cuộn role bác sĩ (ẩn scrollbar), giữ cố định header phiếu khám, fix lỗi hiển thị key dạng "code"

**Phạm vi:**
- `src/layouts/Vererianrian/AdminVererianrianLayout.module.css`
- `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.module.css`
- `src/locales/vererianrian/vi.json`
- `src/locales/vererianrian/en.json`

**Yêu cầu nghiệp vụ mới từ người dùng:**
- Khôi phục cơ chế cuộn nhưng **không hiển thị thanh cuộn dài** (vẫn lăn chuột/touchpad bình thường).
- Khối tiêu đề `PHIẾU KHÁM BỆNH & CHỈ ĐỊNH` phải bám cố định khi lướt nội dung.
- Trong tab `Hồ sơ y tế` (ở form phiếu khám), không được hiện text kiểu "code".

**Nguyên nhân gốc + tự phản biện:**
- Sau fix trước, layout đã có scroll container ở `.content` nên cuộn hoạt động, nhưng thanh cuộn mặc định của trình duyệt hiển thị rõ → không đúng UX mong muốn.
- Header phiếu khám đã dùng `position: sticky`, nhưng cần tăng độ ưu tiên layer để ổn định hơn khi cuộn nội dung dài.
- Lỗi "hiện code" trong `Hồ sơ y tế` đến từ i18n key thiếu:
  - Code dùng `t('common.actions.expand')` / `t('common.actions.collapse')`
  - Locale `common.actions` chưa có 2 key này, nên UI render nguyên key path (trông như code).
- Phương án tối ưu đã chọn:
  - Không phá kiến trúc scroll hiện tại.
  - Ẩn scrollbar bằng CSS cross-browser, vẫn giữ khả năng cuộn.
  - Bổ sung key i18n thiếu thay vì hardcode text trong JSX.

**Thay đổi đã triển khai:**
- `AdminVererianrianLayout.module.css`
  - Giữ `overflow-y: auto` cho `.content`.
  - Thêm ẩn scrollbar cross-browser (`scrollbar-width: none`, `-ms-overflow-style: none`, `::-webkit-scrollbar { width: 0; height: 0; }`).
- `recordExaminationForm.module.css`
  - Thêm ẩn scrollbar cho `.formScrollableContent` (vẫn cuộn được).
  - Tăng `z-index` của `.formHeader` từ `5` → `12` để sticky header ổn định hơn khi lướt.
- `locales/vererianrian/{vi,en}.json`
  - Thêm `common.actions.expand` và `common.actions.collapse` để chấm dứt hiện key i18n dạng "code" trên UI.

**Regression:**
- `npm run build` (thư mục `FE/Web/client`) → thành công (`vite build`, 5982 modules transformed).

### Cập nhật (2026-04-21) — Fix lỗi role bác sĩ không cuộn được trong các form

**Phạm vi:** `src/layouts/Vererianrian/AdminVererianrianLayout.module.css`.

**Triệu chứng người dùng báo:**
- Khi vào portal bác sĩ (`/veterinarian/*`), các trang form dài (đặc biệt phiếu khám) không thể cuộn, dẫn đến không thao tác được phần nội dung phía dưới.

**Phân tích nguyên nhân gốc (đối chiếu code):**
- Layout bác sĩ đang khóa viewport bằng:
  - `.layout { height: 100vh; overflow: hidden; }`
  - `.main { height: 100vh; overflow: hidden; }`
- Vùng nội dung chính `.content` lại bị comment mất cơ chế cuộn (`overflow-y: auto; overflow-x: hidden;`).
- Kết quả: nội dung vượt chiều cao màn hình bị cắt, không có scroll container ở tầng layout.
- Đối chiếu với `AdminLayout` và `AdminClinicLayout`: cả hai đều bật `overflow-y: auto` cho vùng content/main nên không gặp lỗi tương tự.

**Tự phản biện các phương án trước khi fix:**
- Phương án 1: vá từng page form (thêm scroll nội bộ cho từng màn).
  - Nhược: tốn công, dễ thiếu sót, khó bảo trì, có thể phát sinh nhiều scrollbar lồng nhau.
- Phương án 2: mở cuộn ở `body`/`html` toàn cục.
  - Nhược: phá kiến trúc layout hiện tại vốn dựa trên viewport shell, dễ ảnh hưởng portal khác.
- Phương án 3 (chọn): khôi phục đúng trách nhiệm của `content` trong Vet layout (`overflow-y: auto`).
  - Ưu điểm: diff nhỏ nhất, đúng gốc lỗi, đồng bộ với 2 portal còn lại, rủi ro thấp.

**Fix đã áp dụng (tối ưu):**
- Trong `AdminVererianrianLayout.module.css`, bật lại:
  - `overflow-y: auto;`
  - `overflow-x: hidden;`
  cho class `.content`.
- Giữ nguyên `contentChatbot { overflow: hidden; }` để không làm thay đổi hành vi màn chatbot.

**Regression:**
- `npm run build` (thư mục `FE/Web/client`) → thành công (`vite build`, 5982 modules transformed).

**Bài học kiến trúc (để tránh lặp lại):**
- Với layout dạng shell `100vh` + `overflow: hidden`, bắt buộc phải có ít nhất một scroll container rõ ràng (`main` hoặc `content`) cho route nội dung dài.

### Cập nhật (2026-04-21) — Điều chỉnh card chọn phòng khám: giữ giao diện cũ, chỉ đổi vị trí hiển thị đánh giá

**Phạm vi:** `src/pages/client/Home/ClinicSelection/index.jsx`, `src/pages/client/Home/ClinicSelection/styles.css`, `src/locales/client/vi.json`, `src/locales/client/en.json`.

**Yêu cầu nghiệp vụ cuối cùng:**
- Giữ nguyên giao diện cũ (typography, spacing, cấu trúc thông tin, nút `Chọn`).
- Chỉ thay phần đánh giá: chuyển lên badge nổi ở góc trên ảnh, giống mock tham chiếu.

**Phân tích + phản biện (đã áp dụng):**
- Đã thử hướng redesign toàn card theo style hiện đại hơn, nhưng không phù hợp yêu cầu thực tế vì làm thay đổi quá nhiều thành phần ngoài phạm vi.
- Phương án tối ưu cuối cùng: rollback toàn bộ thay đổi ngoài phạm vi và giữ diff nhỏ nhất, chỉ gồm phần rating badge.

**Thay đổi chính đã triển khai (minimal diff):**
- JSX:
  - Bỏ khối rating cũ trong thân card.
  - Thêm badge `clinic-rating-badge` hiển thị điểm ở góc phải trên ảnh.
  - Giữ nguyên layout cũ của tên, địa chỉ, giờ mở cửa, điện thoại và nút `Chọn`.
- CSS:
  - Giữ nguyên stylesheet cũ.
  - Chỉ thêm `position: relative` cho `.clinic-card` và các class badge rating.
  - Bổ sung tinh chỉnh vị trí badge cho mobile.
- i18n:
  - Thêm key `pages.home.clinicSelection.ratingBadgeFallback`:
    - vi: `Mới`
    - en: `New`

**Regression:**
- `npx eslint src/pages/client/Home/ClinicSelection/index.jsx` → clean.

**Quy ước thao tác file (bổ sung để dùng lại):**
- Khi ghi file bằng PowerShell (`Set-Content` / `Out-File`) phải chỉ định `-Encoding utf8` để tránh lỗi tiếng Việt.

### Cập nhật (2026-04-20) — Fix UI treo khi tạo phiếu khám ngoài lỗi + bắt buộc chỉ số sinh tồn

**Phạm vi:** `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx` + `recordExaminationForm.module.css`.

**Bug 1 — UI treo loading "Đang tạo phiếu khám..." khi BE trả lỗi (ví dụ số điện thoại đã được dùng):**
- Nguyên nhân gốc: helper `showWalkInStep(content, type='loading')` mở `message.loading` với `key: 'walkin-step'` và `duration: 0` (persistent). Trong `handleWalkInSubmit` catch block, code cũ gọi `message.error(buildErrorMessage(...))` KHÔNG truyền `key: 'walkin-step'` → toast loading cũ không bị thay thế, vẫn hiển thị vĩnh viễn → UI "treo".
- Fix:
  - Catch block chuyển sang gọi `showWalkInStep(buildErrorMessage(...), 'error')` để thay thế toast cùng key.
  - Nới duration cho `type === 'error'` → 4s (mặc định success 2s, loading 0s persistent) trong `showWalkInStep`.
- Phản biện/tối ưu: cân nhắc dùng `message.destroy('walkin-step')` rồi `message.error(...)` — nhưng cùng-key-replace gọn hơn 1 call, không có flicker, và giữ a11y (role=alert của toast cũ bị cập nhật thay vì tạo mới).

**Bug 2 — Chỉ số sinh tồn chưa hiển thị dấu `*` bắt buộc nhập:**
- Quan sát: 5 field (`weight`, `temperature`, `heartRate`, `systolic`, `diastolic`) đã có `rules: [{ required: true, ... }]` (validate khi submit đã hoạt động), NHƯNG label được render bằng `<p className={styles.vitalLabel}>` nằm NGOÀI `Form.Item` và `Form.Item` không có prop `label` → AntD không tự chèn asterisk → user không biết bắt buộc.
- Fix: thêm `<span className={styles.vitalLabelRequired} aria-hidden="true">*</span>` (đỏ `#ff4d4f`) vào mỗi `<p>` vitalLabel. Class mới `.vitalLabelRequired` thêm vào CSS module.
- Phản biện: tại sao không chuyển sang dùng prop `label` của `Form.Item` (AntD tự làm asterisk)? Vì layout hiện tại `.vitalGrid > .vitalBox > <p> + <Form.Item>` là grid custom, đổi sang `label` prop sẽ phá spacing (AntD label có margin/padding riêng). Giải pháp asterisk thủ công giữ nguyên visual, đồng nhất với các field walk-in khác (`customerName`, `petName`) cũng dùng pattern label-ngoài.

**Regression:** `npx eslint` trên file thay đổi → clean.

### Cập nhật (2026-04-17) — Booking Doctor Panel + Forum Report Service + Clinic Vet Fields + Admin View-as-User

**1) Forum Report Service (FE):**
- Tạo mới `src/services/forumReportService.js`.
- Cung cấp các hàm:
  - `reportPostApi(instance, postId, payload)` → `POST /post/:postId/report`
  - `reportCommentApi(instance, commentId, payload)` → `POST /comment/:commentId/report`
  - `getReportsApi(instance, params)` → `GET /report`
  - `updateReportStatusApi(instance, reportId, payload)` → `PATCH /report/:id`
  - `createGenericReportApi(instance, payload)` → fallback `POST /report`
- FE Forum đã dùng try/catch fallback: ưu tiên endpoint report theo post/comment; nếu BE chưa hỗ trợ thì fallback sang `POST /report`; nếu vẫn không có thì hiện toast ghi nhận.

**2) Booking Appointment — Doctor Detail Panel:**
- File sửa: `src/pages/client/User/BookingAppointment/index.jsx`, `src/pages/client/User/BookingAppointment/styles.css`.
- Khi chọn bác sĩ, panel bên phải hiển thị:
  - Avatar + tên
  - Chuyên khoa
  - Kinh nghiệm (nếu có)
  - Giới thiệu (đọc từ `description` hoặc `introduce` hoặc `bio` nếu có)
- Có fallback an toàn khi dữ liệu null/undefined.

**3) Clinic Portal — bổ sung field kinh nghiệm & giới thiệu cho bác sĩ:**
- File sửa: `src/pages/Clinic/InformationVererianrian/InformationVererianrian.jsx`.
- Thêm vào form chỉnh sửa:
  - `experience` (InputNumber)
  - `description` (TextArea)
- Payload update đã gửi thêm: `experience`, `description`, `introduce` (để tương thích contract BE hiện có).
- Bổ sung hiển thị 2 field này trong phần thông tin cá nhân.
- i18n đã thêm key cho `clinic/vi.json` và `clinic/en.json`.

**4) Admin View-as-User mode cho Forum:**
- Tạo utility mới: `src/utils/storage/adminViewModeStorage.js` (dùng `sessionStorage`).
- Admin notification click (đặc biệt report) trong `src/layouts/admin/AdminLayout.jsx`:
  - điều hướng sang forum kèm query param mục tiêu (nếu có).
- Client header (`src/components/layouts/client/header.jsx` + `header.css`):
  - tích hợp điều hướng thống nhất tới khu vực forum xử lý.
- Forum (`src/pages/client/User/Forum/forum.jsx`):
  - khi user là ADMIN và vào forum quản trị, menu post/comment có thêm quyền xóa mở rộng “Xóa (Admin)”,
  - dùng `adminDeletePostApi` / `adminDeleteCommentApi` (fallback client instance) trong `src/services/forumService.js`.

**5) Notification mapping/href cho admin report flow:**
- File sửa: `src/services/notificationService.js`.
- Bổ sung mapping cho các type `REPORT`, `POST_REPORTED`, `COMMENT_REPORTED`.
- Chuẩn hóa thêm field target `reportId`, `reportType` và hỗ trợ resolve portal `admin`.
### Cập nhật (2026-04-17) — Tái cấu trúc luồng Phiếu khám: đổi tên + gộp danh sách + fix dữ liệu trống

**Phạm vi:**
- Đổi tên "Phiếu khám khẩn cấp" → "Phiếu khám ngoài" (UI, i18n, mã code prefix `EMG` → `WK`).
- Gộp 2 danh sách (lịch hẹn + walk-in) thành **1 danh sách thống nhất** dùng API mới `GET /api/medical/veterinarian?page=&limit=`.
- Fix lỗi khi mở lại phiếu walk-in hiển thị trống toàn bộ thông tin khách hàng & thú cưng.
- Bỏ 2 field `gender` và `dateOfBirth` của pet khỏi form walk-in (BE DTO không hỗ trợ, lưu sẽ thất lạc).

**Thay đổi i18n (`src/locales/vererianrian/{vi,en}.json`):**
- `examForm.list.actions.createWalkIn`: "Phiếu khám ngoài" / "Walk-in Examination".
- Thêm `examForm.list.table.type` = "LOẠI" / "TYPE".
- Thêm `examForm.list.badges` = { appointment, walkIn } cho badge phân loại.
- Bỏ `examForm.list.tabs` (không còn Tabs), gộp `pagination.summary` (bỏ `walkInSummary`).
- Bỏ `states.emptyWalkIn` (gộp vào `states.empty`).
- Thêm `examForm.record.messages.ownerContactMissing` để báo BE không trả email/phone walk-in.
- Đổi nội dung `walkInSaveSuccess/Error` từ "khẩn cấp" → "ngoài".

**Form walk-in (`src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx`):**
- Xóa imports `ManOutlined`, `WomanOutlined`; xóa helper `normalizeGenderValue`, `resolveDateOfBirth`; xóa `genderSelectOptions` useMemo.
- `buildInitialValues`: với walk-in reopen, hydrate `customerName / email / phone / petName / species / breed` từ `editableMedicalRecord.pet` + `editableMedicalRecord.pet.owner` (trước đây luôn rỗng vì `isWalkIn=true` đi nhánh clear).
- Bỏ `Form.Item` ẩn `petGender / petDateOfBirth / petAge` và cả 3 `<Col>` nhập tay tương ứng trong block walk-in.
- Đơn giản hóa `handleWalkInSubmit`: bỏ validate `genderValue` / `petDateOfBirth`, không còn gửi 2 field trên trong payload.
- Prefix mã phiếu `EMG` → `WK`.

**Danh sách gộp (`src/pages/Vererianrian/ListExaminationForm/listExaminationForm.jsx` — rewrite):**
- Data source DUY NHẤT: `getVeterinarianMedicalRecordsApi(instance, page, 10)` → `GET /medical/veterinarian`.
- Pagination server-side dùng `meta.totalPages` + `meta.totalItems`, nút prev/next.
- Bỏ `Tabs`, bỏ `DatePicker`, bỏ 2 luồng fetch song song (`getMyAppointmentsApi` + `getMedicalByClinicApi`).
- Thêm cột **LOẠI** hiển thị `<Tag>`: `Lịch hẹn` (blue) vs `Khám ngoài` (orange).
- Classifier (heuristic FE do BE thiếu field): `isAppointment = appointmentLinkedIds.has(record.id)`, với set = hợp của:
  1. localStorage `veterinarian:appointmentMedicalMap` (từ flow tạo qua appointment).
  2. `GET /appointment/my` → gom `item.medical.id` (fail-safe, lỗi chỉ log).
- Click "Mở phiếu khám": điều hướng theo phân loại — appointment mở `?medicalId=`, walk-in mở `?mode=walkin&medicalId=`.
- Focus/visibilitychange refresh cả records + appointmentLinkedIds (silent).

**Service (`src/services/medicalService.js`):**
- Thêm `getVeterinarianMedicalRecordsApi(instance, page, limit)` gọi `GET /medical/veterinarian`.
- Fix bug pre-existing: `getLatestMedicalByPetIdApi` có dòng `const payload = ...` bị comment-out → uncommented (đang reference biến không tồn tại, 6 lint errors).

**Root cause — dữ liệu trống khi mở walk-in:**
- `buildInitialValues` có nhánh `isWalkIn ? '' : ...` → mọi lần mở lại phiếu walk-in đều set customer/pet rỗng (không đọc từ `editableMedicalRecord`).
- Fix: với walk-in mode + có `editableMedicalRecord`, ưu tiên lấy `recordPet = editableMedicalRecord.pet` và `recordOwner = recordPet.owner`.

**Giới hạn BE (báo cáo, không tự sửa):**
1. ~~`GET /medical/:id` KHÔNG trả `pet.owner.email` và `pet.owner.phone`~~ → **ĐÃ FIX bởi BE**: giờ trả `pet.owner.{id, fullName, email, phone}`, `pet.gender`, `pet.dateOfBirth`, `veterinarian.{id, fullName, specialty}`, `clinic.{id, name}`. FE đã đồng bộ UI hiển thị thông tin owner + bác sĩ trong ViewPetMedicalRecords.
2. ~~`GET /medical/:id` KHÔNG trả `pet.gender`, `pet.dateOfBirth`, `pet.weight`~~ → **ĐÃ FIX bởi BE**: giờ trả đầy đủ.
3. `MedicalRecord` entity KHÔNG có `appointmentId` hay `type` để phân biệt walk-in vs appointment → FE phải dùng heuristic localStorage + map từ `/appointment/my`. Đề xuất BE: thêm cột `type: ENUM('APPOINTMENT','WALK_IN')` hoặc FK `appointmentId NULL`.
4. `GET /user/:id` restricted ADMIN/ADMIN_CLINIC → VET không thể recover email/phone chủ nuôi từ ownerId. **Workaround**: FE lấy owner info từ `GET /medical/:id` response (pet.owner) thay vì gọi `/user/:id`.

**Fix cập nhật SĐT từ danh sách gộp (ListExaminationForm → RecordExaminationForm):**
- Thêm `directMedicalId`: khi mở phiếu khám từ list với `?medicalId=XXX` (non-walkin, không có appointmentId), form load record trực tiếp bằng `getMedicalByIdApi`.
- `onFinish` fallback `ownerId` từ `editableMedicalRecord.pet.owner.id` khi `appointment` state là null.
- `existingOwnerPhone` fallback từ `editableMedicalRecord.pet.owner.phone`.

**Regression:**
- `npx eslint` trên 3 file thay đổi: clean.
- `npx vite build`: thành công (5960 modules, ~21s).

---

### Cập nhật (2026-04-17) — Đơn giản hóa luồng Walk-in (khám cấp cứu) & loại bỏ tạo tài khoản FE

**Vấn đề gốc:**
- Walk-in flow gọi `registerApi` (POST /api/auth/register) với mật khẩu hardcode `Baophan1234` để tạo tài khoản khách hàng mới từ FE.
- Mật khẩu hardcode là lỗ hổng bảo mật nghiêm trọng.
- BE đã chuyển sang tự tạo tài khoản bên trong `POST /api/medical` (random password + email thông báo), nên FE không cần tạo nữa.

**Fix FE đã triển khai:**
- File sửa: `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx`.
- Xóa `import { registerApi }` và hằng số `EMERGENCY_TEMP_PASSWORD`.
- Xóa `import { createPetApi }` (không còn gọi tạo pet riêng lẻ từ FE).
- Viết lại hoàn toàn `handleWalkInSubmit`:
  - Bỏ multi-step flow (checking owner → creating owner → checking pet → creating pet → saving).
  - Luồng mới: validate → best-effort tìm user/pet hiện tại (nếu RBAC cho phép) → gọi POST /api/medical (có/không petId) → best-effort cập nhật SĐT cho user hiện tại → success.
  - User lookup (`findExistingUserByEmail`) và pet lookup (`findPetByOwnerAndName`) đều fail-safe: nếu RBAC chặn (vet không có quyền GET /user) thì bỏ qua, để BE tự xử lý.
- Đổi tên `findUserByEmail` → `findExistingUserByEmail`, cả 2 helper giờ dùng try/catch trả `null` thay vì throw.
- Dọn i18n: xóa 8 key multi-step cũ (`walkInStepCheckingOwner`, `walkInStepCreatingOwner`, `walkInStepOwnerReady`, `walkInStepUpdatingOwner`, `walkInStepUpdateOwnerError`, `walkInStepCheckingPet`, `walkInStepCreatingPet`, `walkInStepPetReady`), giữ lại `walkInStepSaving` với text mới "Đang tạo phiếu khám..." / "Creating examination form...".
- Luồng appointment (onFinish): đã đúng — dùng `appointment?.petRaw?.owner?.id` cho cập nhật SĐT, không thay đổi.

**Regression:**
- `npx vite build` → thành công (5960 modules transformed, built in ~16s).

---

## Lịch sử cập nhật trước (2026-04-17)

### Cập nhật bổ sung (2026-04-17) — Fix nhầm khóa thanh toán giữa 2 lịch hẹn gần nhau (Veterinarian RecordExaminationForm)

**Triệu chứng thực tế:**
- Cùng 1 thú cưng đặt 2 lịch hẹn gần nhau (cùng bác sĩ/phòng khám), sau khi lịch 1 đã thanh toán thì mở lịch 2 ở màn `RecordExaminationForm` có thể bị báo khóa do đã thanh toán.
- Form của lịch 2 bị prefill dữ liệu từ phiếu khám cũ (lịch 1), dẫn đến nguy cơ ghi đè sai hồ sơ.

**Nguyên nhân gốc đã xác nhận:**
- FE đang dùng heuristic `selectMedicalRecordByAppointment` để đoán phiếu khám theo `pet + cùng ngày + gần giờ`, thay vì liên kết định danh tường minh theo appointment.
- Khi có 2 lịch gần giờ, heuristic có thể match nhầm sang medical record cũ đã `PAID`.
- API `GET /appointment/my` (role VETERINARIAN) hiện không trả `medical.id`, nên FE thiếu khóa liên kết chắc chắn giữa lịch hẹn và phiếu khám.

**Fix FE đã triển khai (an toàn, không sửa BE):**
- File sửa: `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx`.
- Gỡ hoàn toàn heuristic match theo thời gian gần đúng.
- Chỉ hydrate phiếu khám khi có liên kết định danh rõ ràng:
  - `appointment.medical.id` (nếu BE trả về), hoặc
  - map cục bộ `appointmentId -> medicalId` trong localStorage key `veterinarian:appointmentMedicalMap`.
- Mỗi lần vào appointment mới, reset ngay `editableMedicalRecord/orders/medicines` trước khi hydrate để tránh "rò" UI từ phiếu trước.
- Sau khi tạo/cập nhật phiếu khám thành công, lưu lại map `appointmentId -> medicalId` để lần mở lại sau khớp đúng record.
- Nếu map cục bộ bị stale (medical id không còn thuộc pet/clinic hiện tại), FE tự xóa map stale và không auto-link.

**Kết quả mong đợi sau fix:**
- Lịch hẹn 2 không còn bị khóa thanh toán nhầm bởi invoice của lịch 1.
- Dữ liệu form không còn tự kéo từ phiếu cũ chỉ vì "gần giờ".

**Regression:**
- `npx eslint src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx` → không lỗi.
- `npx vite build` → thành công (5960 modules transformed, built in ~13s).

**⚠️ BE cần báo lại dev (không thể giải quyết dứt điểm chỉ bằng FE):**
1. `GET /appointment/my` cần trả liên kết medical định danh (`medical.id` hoặc `medicalRecordId`) cho từng appointment.
2. Nên bổ sung liên kết dữ liệu cứng giữa appointment và medical record (ví dụ `appointment_id` trong bảng `medical_record`, unique theo nghiệp vụ) để triệt tiêu hoàn toàn việc FE phải đoán.
3. Có thể cân nhắc endpoint truy vấn theo appointment (ví dụ `GET /medical/by-appointment/:appointmentId`) để mở đúng phiếu khám mà không phụ thuộc cache cục bộ.

### Cập nhật bổ sung (2026-04-17) — Follow-up: mở lại phiếu khám đã tạo khi thiếu liên kết định danh

**Bối cảnh phát sinh sau bản fix trước:**
- Sau khi bỏ hoàn toàn heuristic theo giờ để tránh lock nhầm, một số lịch hẹn đã tạo phiếu nhưng thiếu `medicalId` trong payload `/appointment/my` và chưa có map local sẽ hiển thị như "chưa từng tạo phiếu" khi mở lại.

**Fix FE follow-up đã triển khai:**
- File sửa tiếp: `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx`.
- Thêm fallback có điều kiện `inferMedicalRecordForCompletedAppointment(records, appointment)`:
  - **Chỉ chạy khi appointment status = `COMPLETED`**.
  - Match chặt theo cùng `appointmentDate` (theo ngày), `clinicId`, `petName`, `service`.
  - Ưu tiên record có `createdAt` gần `appointmentTime` nhất (cửa sổ strict 12 giờ).
- Nếu infer thành công, FE tự persist lại map `appointmentId -> medicalId` vào localStorage để lần mở sau dùng link định danh trực tiếp.

**Guard để không quay lại bug cũ:**
- Fallback infer **không chạy** cho trạng thái `BOOKED/IN_PROGRESS`, nên không còn tự kéo nhầm phiếu đã thanh toán của lịch hẹn khác trong ngày.

**Regression (follow-up):**
- `npx eslint src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx` → không lỗi.
- `npx vite build` → thành công (5960 modules transformed, built in ~13.6s).

### Cập nhật bổ sung (2026-04-17) — UX fix: bỏ hiện tượng "chớp" trạng thái phiếu khám khi mở lại

**Triệu chứng:**
- Khi mở lại phiếu đã hoàn thành, UI có thể chớp alert: thoáng hiện trạng thái "đang chỉnh sửa" rồi mới chuyển sang "đã khóa sau thanh toán".

**Nguyên nhân:**
- Trước đó trạng thái payment lock được hydrate ở effect riêng, đến sau effect hydrate medical record nên có một khoảng ngắn render trạng thái trung gian.

**Fix FE đã triển khai:**
- File: `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx`.
- Gom resolve `medical record + invoice lock` vào cùng luồng hydrate ban đầu của phiếu khám.
- Thêm state `isResolvingExamState` để:
  - tạm khóa form trong lúc resolve trạng thái,
  - chỉ render các alert trạng thái (notCreated/editable/paymentLocked) sau khi resolve xong.
- Bỏ effect hydrate payment lock riêng để tránh race condition render.

**Kết quả UX:**
- Không còn hiệu ứng chớp trạng thái khi mở phiếu khám đã hoàn thành.
- Người dùng chỉ thấy trạng thái cuối cùng, đúng với dữ liệu thực tế.

**Regression (UX fix):**
- `npx eslint src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx` → không lỗi.
- `npx vite build` → thành công (5960 modules transformed, built in ~18s).

### Cập nhật bổ sung (2026-04-17) — 3 nhóm: SĐT trong phiếu khám + Tối ưu Clinic Chart + Đổi trang Admin Revenue → Activity

**Nhóm 1 — Cập nhật SĐT khách hàng khi tạo phiếu khám:**
- Luồng thường (`recordExaminationForm.jsx`): sau khi submit phiếu khám thành công, nếu SĐT input ≠ SĐT hiện tại của owner → gọi `PUT /api/user/{ownerId}` cập nhật `phone`. Vai trò Veterinarian được phép sửa hồ sơ user.
- Luồng walk-in: chèn bước "đang cập nhật thông tin chủ" giữa "owner-ready" và "checking-pet" → gọi `PUT /api/user/{ownerId}` cập nhật `phone` + `fullName` (best-effort, lỗi chỉ warn). Thêm 2 i18n key `walkInStepUpdatingOwner` / `walkInStepUpdateOwnerError` cho cả vi/en.
- ⚠️ **VẤN ĐỀ BE CẦN BÁO LẠI CHO DEV:** `POST /api/auth/register` chỉ trả `{ message }`, không trả user id → walk-in flow phải workaround bằng `GET /api/user?email=` (admin-only). Veterinarian vẫn 403 nếu BE không bổ sung quyền hoặc thay register response.

**Nhóm 2 — Tối ưu biểu đồ doanh thu Clinic:**
- `revenueService.js#getChartParams`: chuẩn hóa mapping period → `dateStart` / `dateEnd` / `groupBy`. Đổi key `7days` → `week`, tính Mon-Sun thủ công (không có isoWeek plugin). Month/Year dùng `endOf('month')` / `endOf('year')` thay vì `endOf('day')`.
- `useRevenue.js`: tách `fetchChart` riêng (tự refetch khi đổi period), `fetchRevenue` lấy summary qua `GET /revenue/summary`, top vet + recent invoices vẫn từ aggregate cũ (BE chưa có endpoint thay thế).
- `RevenueDashboard.jsx`: khi `period === TODAY` và chart có ≤ 1 điểm → render `TodayHighlightCard` (component mới: card lớn show tổng doanh thu hôm nay, số hóa đơn paid/unpaid). Các period còn lại render Area chart như cũ.
- `RevenueChart.jsx`: format trục X `DD/MM` (kết hợp ngày + tháng), parse `total` (string) → number.
- i18n vi/en: đổi label `period.week` thành `Tuần này / This week`; thêm block `todayHighlight.*`.

**Nhóm 3 — Thay trang Admin Revenue → Thống kê Hoạt động Phòng khám:**
- Xóa hoàn toàn: `pages/admin/Dashboard/Revenue/`, `hooks/admin/useAdminRevenue.js`, `services/adminRevenueService.js`.
- Thay bằng: `pages/admin/Dashboard/Activity/{index.jsx, activity.module.css, components/ActivityKPICards.jsx, components/ClinicActivityRankingTable.jsx}`, `hooks/admin/useAdminActivity.js`, `services/adminActivityService.js`.
- Routing: `/admin/dashboard/revenue` → `/admin/dashboard/activity` (`AppRoutes.jsx`); menu `AdminLayout.jsx` đổi key `revenue` → `activity`, icon `DollarOutlined` → `BarChartOutlined`.
- i18n admin vi/en: đổi `layout.menu.revenue` → `layout.menu.activity`; thay block `revenue` → `activity` (KPI: totalClinics/totalVisits/activeClinics/inactiveClinics; period: thisMonth/lastMonth/thisQuarter; ranking columns + status badges).
- UI: 4 KPI cards (tổng phòng khám, lượt khám tháng này, active/inactive); bảng xếp hạng phòng khám theo lượt khám (kỳ hiện tại / kỳ trước / % tăng trưởng / trạng thái); period tabs + search clinic. **Ẩn hoàn toàn doanh thu** theo yêu cầu SaaS.
- ⚠️ **VẤN ĐỀ BE CẦN BÁO LẠI CHO DEV:** Không có endpoint admin-scoped để lấy số lượt khám per clinic (`GET /medical/clinic` dùng `req.user.clinicId` từ JWT → admin gọi sẽ trống). Visit count hiện sẽ = 0 cho admin cho đến khi BE bổ sung endpoint `/medical?clinicId=` hoặc `/admin/clinic-activity`.
- ⚠️ **VẤN ĐỀ BE CẦN BÁO LẠI CHO DEV (vẫn tồn đọng):** 3 API `/revenue/*` (summary/chart/top-veterinarian) chỉ allow `ADMIN_CLINIC` → admin vẫn không gọi được nếu sau này muốn dùng cho dashboard tổng.

**Regression:** `npx eslint` 0 lỗi trên các file đã sửa, `npx vite build` thành công (5960 modules transformed, 19.41s).

### Cập nhật bổ sung (2026-04-16) — Khôi phục Clinic Revenue UI (giữ Recent Invoices, bỏ Pie chart)

**Yêu cầu nghiệp vụ:** Trả dashboard `/clinic/revenue` về UI gần phiên bản trước (có lại bảng hóa đơn gần đây), nhưng **không dùng lại biểu đồ theo loại dịch vụ**.

**Kết quả UI:**
- Giữ 3 summary cards + chart doanh thu theo ngày (Area chart).
- Giữ period filter trong header chart (`Hôm nay / 7 ngày / Tháng này / Năm nay`).
- **Không render Pie chart** theo loại dịch vụ.
- Khôi phục hàng dưới gồm:
  - `Top 5 Bác sĩ khám nhiều nhất — Tháng {{month}}`
  - `Hóa đơn gần đây` + filter trạng thái (`Tất cả / Đã thanh toán / Chưa thanh toán`).

**Chiến lược dữ liệu sau khi self-review (tối ưu hơn bản cũ):**
- Khôi phục luồng aggregate từ `medical + invoice` để có đủ dữ liệu cho `Recent Invoices` và top bác sĩ theo tháng.
- Tối ưu N+1: chỉ gọi `GET /medical/:id` khi record từ `GET /medical/clinic` thiếu thông tin bác sĩ.
- Fetch invoice/detail theo batch (`Promise.allSettled`) để tránh fail toàn bộ màn khi một vài record lỗi.
- Period filter và invoice status filter xử lý client-side từ cùng một dataset đã aggregate.

**Lý do không dùng hoàn toàn 3 API revenue mới:**
- API mới chưa có endpoint trả danh sách hóa đơn gần đây.
- `GET /revenue/top-veterinarian` đang trả dữ liệu theo hôm nay, không khớp yêu cầu bảng top bác sĩ theo tháng của UI cũ.

**Files đã sửa:**

| File | Thay đổi |
|---|---|
| `src/services/revenueService.js` | Khôi phục hàm aggregate (`aggregateRevenueData`, `calculateSummary`, `calculateDailyRevenue`, `calculateTopVeterinariansByVisits`, `getRecentInvoices`) và tối ưu gọi detail có điều kiện |
| `src/hooks/Clinic/useRevenue.js` | Trả lại state/filter của UI cũ: period filter + invoice filter + recent invoices + top vets monthly |
| `src/pages/Clinic/Revenue/RevenueDashboard.jsx` | Khôi phục render `RecentInvoicesTable` ở bottom row cùng `TopVeterinariansTable` |
| `src/pages/Clinic/Revenue/components/TopVeterinariansTable.jsx` | Đổi title về monthly và hỗ trợ cả `recordCount`/`totalAppointment` |

### Cập nhật bổ sung (2026-04-16) — Tích hợp API Revenue mới cho Clinic Revenue Dashboard

**Bối cảnh:** BE đã cung cấp 3 API revenue chuyên biệt, thay thế hoàn toàn cách fetch cũ (batch fetch medical records + invoices + details qua nhiều API phức tạp).

**3 API Revenue mới (RBAC: ADMIN_CLINIC only):**

| Endpoint | Params | Response |
|---|---|---|
| `GET /api/revenue/summary` | Không (dùng clinicId từ JWT) | `{ total: number, totalPaid: number, totalUnpaid: number }` — dữ liệu HÔM NAY |
| `GET /api/revenue/chart` | `dateStart`, `dateEnd`, `groupBy` (DAY\|MONTH) | `[{ total, date? (day number), month? (1-12) }]` |
| `GET /api/revenue/top-veterinarian` | Không | `[{ fullName, avatarUrl, id, totalAppointment, specialty }]` — HÔM NAY |

**Mapping filter thời gian → params:**

| Filter UI | dateStart | dateEnd | groupBy |
|---|---|---|---|
| Hôm nay | startOfDay | endOfDay | DAY |
| 7 ngày | 6 ngày trước | endOfDay | DAY |
| Tháng này | đầu tháng | endOfDay | DAY |
| Năm nay | đầu năm | endOfDay | MONTH |

**Thay đổi kiến trúc FE:**
- Summary cards luôn hiển thị dữ liệu hôm nay (từ `/revenue/summary`)
- Chart Area thay đổi theo period filter (dùng `/revenue/chart` với params tương ứng)
- Top bác sĩ luôn hiển thị hôm nay (từ `/revenue/top-veterinarian`)
- **Đã xóa:** Pie chart (phân bổ theo specialty) — không còn data source vì bỏ enrichedRecords
- **Đã xóa:** Recent Invoices table — không có API endpoint tương ứng
- **Đã xóa:** Toàn bộ code fetch phức tạp (batch fetch medical → invoice → detail)

**Code cũ đã xóa:**
- `aggregateRevenueData()`, `fetchAllClinicMedicalRecords()`, `calculateSummary()`, `calculateDailyRevenue()`, `calculateTopVeterinariansByVisits()`, `getRecentInvoices()` trong `revenueService.js`
- Client-side period filtering, invoice filtering trong `useRevenue.js`

**Files đã sửa:**

| File | Thay đổi |
|---|---|
| `src/services/revenueService.js` | Rewrite hoàn toàn: 3 API functions + `transformChartData()` + `getChartParams()` |
| `src/hooks/Clinic/useRevenue.js` | Đơn giản hóa: gọi 3 API, period chỉ ảnh hưởng chart |
| `src/pages/Clinic/Revenue/RevenueDashboard.jsx` | Bỏ RecentInvoices, bỏ enrichedRecords |
| `src/pages/Clinic/Revenue/components/RevenueChart.jsx` | Xóa Pie chart, bỏ enrichedRecords prop, chart full-width |
| `src/pages/Clinic/Revenue/components/TopVeterinariansTable.jsx` | Dùng `totalAppointment`, hiển thị avatar thực, title "Hôm nay" |
| `src/pages/Clinic/Revenue/revenue.module.css` | chartsRow 1 cột, thêm `.vetAvatarImg` |
| `src/locales/clinic/vi.json` | Thêm `topVets.titleToday` |
| `src/locales/clinic/en.json` | Thêm `topVets.titleToday` |
| `src/pages/admin/Dashboard/Revenue/index.jsx` | Xóa banner warning "đợi BE" |
| `src/locales/admin/vi.json` | Xóa key `noRevenueDataBanner` |
| `src/locales/admin/en.json` | Xóa key `noRevenueDataBanner` |

**Admin Revenue Dashboard:** Giữ nguyên luồng cũ (fetch clinics → aggregate). 3 API revenue mới chỉ ADMIN_CLINIC → Admin chưa gọi được. Cần BE bổ sung ADMIN role vào RBAC của 3 endpoint hoặc tạo endpoint mới.

**⚠️ Vấn đề BE cần báo dev:**
1. `GET /revenue/top-veterinarian` — `.orderBy('totalAppointment')` mặc định ASC (tăng dần), cần đổi thành DESC để lấy bác sĩ nhiều lượt nhất.
2. `GET /revenue/top-veterinarian` — `veterinarian.specialty` có trong SELECT nhưng thiếu trong GROUP BY, có thể gây lỗi ở strict SQL mode.
3. `GET /revenue/chart` — groupBy=DAY trả về EXTRACT(DAY) chỉ là số ngày (1-31), không phân biệt tháng. Nếu query span 2 tháng → ambiguous. FE đã workaround nhưng nên cân nhắc trả full date string.
4. 3 API revenue chỉ cho ADMIN_CLINIC → Admin dashboard chưa dùng được. Cần thêm ADMIN vào `@RequiredRole` hoặc tạo endpoint aggregate riêng.

### Cập nhật bổ sung (2026-04-16) — Admin Revenue Dashboard (Doanh thu toàn hệ thống)

**Mục đích:** Cung cấp cho Super Admin (role ADMIN) cái nhìn tổng quan doanh thu toàn hệ thống từ tất cả phòng khám, phục vụ quyết định kinh doanh.

**Phương án kỹ thuật:**
- FE tổng hợp: Fetch danh sách clinics (`GET /clinic`, admin có quyền) → với mỗi clinic, cố gắng fetch medical records + invoices → tổng hợp phía client.
- **Giới hạn hiện tại:** BE chưa có API admin-scoped cho invoice/medical. Các endpoint hiện tại (`GET /invoice/:medicalRecordId`, `GET /medical/clinic`) chỉ cho ADMIN_CLINIC + VETERINARIAN. Revenue module hoàn toàn trống. Do đó, dữ liệu doanh thu chi tiết chưa hiển thị được cho đến khi BE bổ sung RBAC hoặc API mới.
- Khi BE fix → dashboard sẽ tự hoạt động mà không cần sửa FE.

**KPI hiển thị:**
- Tổng doanh thu toàn hệ thống (format `formatVND()`)
- Tổng phòng khám hoạt động (từ `GET /clinic` — hoạt động ngay)
- Tổng lượt khám (chờ BE)
- Hóa đơn đã thanh toán / tổng (chờ BE)

**Components tạo mới:**

| File | Mô tả |
|---|---|
| `src/services/adminRevenueService.js` | Service layer: fetch clinics, aggregate medical/invoice per clinic, tính KPI/chart/ranking |
| `src/hooks/admin/useAdminRevenue.js` | Hook: state management, period filter (today/week/month/year), clinic search, cache |
| `src/pages/admin/Dashboard/Revenue/index.jsx` | Trang chính Admin Revenue Dashboard |
| `src/pages/admin/Dashboard/Revenue/adminRevenue.module.css` | CSS Module, dùng admin color tokens |
| `src/pages/admin/Dashboard/Revenue/components/AdminRevenueKPICards.jsx` | 4 KPI cards tổng hệ thống |
| `src/pages/admin/Dashboard/Revenue/components/AdminRevenueChart.jsx` | Area chart doanh thu theo ngày (recharts) |
| `src/pages/admin/Dashboard/Revenue/components/ClinicRevenueRankingTable.jsx` | Bảng xếp hạng phòng khám theo doanh thu, có search |
| `src/pages/admin/Dashboard/Revenue/components/AdminRecentInvoicesTable.jsx` | Bảng hóa đơn gần đây toàn hệ thống, có filter PAID/UNPAID |

**Files đã sửa:**

| File | Thay đổi |
|---|---|
| `src/routes/AppRoutes.jsx` | Thêm route `/admin/dashboard/revenue` |
| `src/layouts/admin/AdminLayout.jsx` | Thêm menu item "Doanh thu hệ thống" (icon `DollarOutlined`) |
| `src/styles/admin/colorsToken.css` | Thêm 8 token `--admin-revenue-*` cho dashboard |
| `src/locales/admin/vi.json` | Thêm block `revenue.*` (~50 keys) |
| `src/locales/admin/en.json` | Thêm block `revenue.*` (~50 keys) |

**Tái sử dụng từ codebase:**
- `formatVND()` từ `src/utils/currencyFormat.js` — không tạo lại.
- `formatDateDDMMYYYY()` từ `src/utils/dateTimeFormat.js`.
- `recharts` (Area chart) — cùng thư viện chart với Clinic Revenue.
- `getAdminInstance()` từ `src/services/apiClient.js`.
- `INVOICE_STATUS` từ `src/services/invoiceService.js`.

**⚠️ BE cần bổ sung để dashboard hoạt động đầy đủ:**
1. Thêm `ADMIN` vào `@RequiredRole` của `GET /invoice/:medicalRecordId` (hoặc tạo endpoint mới)
2. Tạo endpoint mới `GET /medical/admin?clinicId=xxx` cho ADMIN (vì `/medical/clinic` dùng `req.user.clinicId` từ JWT)
3. Hoặc tốt hơn: tạo aggregate API trong Revenue module (`GET /revenue/system`, `GET /revenue/clinics`)

**Build:** `npx vite build` → built in ~24s, 0 error.

### Cập nhật bổ sung (2026-04-16) — Tinh chỉnh UI/UX Booking, AddPet, Choose-clinic, Forum, ChatBot AI

**1) BookingAppointment — mapping Service -> Specialty, lọc bác sĩ theo dịch vụ, hiển thị chuyên khoa rõ hơn**
- Bổ sung `SERVICE_TO_SPECIALTY_MAP` trực tiếp trong `src/constants/enumLabels.js`.
  - Map service sang veterinary specialty theo enum hiện tại của dự án.
  - Có thêm alias key để tương thích khi backend trả biến thể service khác.
- `src/pages/client/User/BookingAppointment/index.jsx`:
  - Khi đổi dịch vụ, set lại specialty filter và reset bác sĩ đã chọn.
  - Gọi `getVeterinarianByClinicApi(..., specialty)` để chỉ lấy danh sách bác sĩ đúng chuyên khoa tương ứng dịch vụ.
  - Dropdown bác sĩ tiếp tục hiển thị 2 dòng (tên + chuyên khoa), có thêm trạng thái loading khi fetch.
  - Khi đã chọn bác sĩ, hiển thị thêm badge chuyên khoa ngay dưới Select để người dùng xác nhận nhanh.
  - Field `Triệu chứng` bật required mark chuẩn của AntD + giữ validation chặn input chỉ chứa khoảng trắng.
- `src/pages/client/User/BookingAppointment/styles.css`:
  - Tinh chỉnh toàn bộ UI khối chọn ngày/giờ theo style card/pill giống mock: day-pill bo góc, hiệu ứng glow khi chọn ngày, slot giờ dạng card với state hover/selected/disabled rõ ràng.
  - Chỉ thay đổi presentation/UI, không đổi logic tính ngày quá khứ, lead-time 3 giờ, hay availability.

**2) AddPet — dấu * đứng trước label bắt buộc**
- `src/pages/client/User/AddPet/index.jsx`:
  - Đổi helper label required từ dạng `Tên *` sang `* Tên`.
- `src/pages/client/User/AddPet/styles.css`:
  - Đổi spacing của `.required-mark` sang `margin-right` để dấu sao hiển thị đúng vị trí phía trước.

**3) Choose-clinic — format số điện thoại dạng 0979 387 171**
- `src/pages/client/Home/ClinicSelection/index.jsx`:
  - Khai báo helper `formatPhoneVN(phone)` ngay trong file.
  - Chuẩn hóa về digits, format nhóm `4-3-3` khi đủ 10 số, fallback giữ nguyên đầu vào nếu không đủ điều kiện format.
  - Áp dụng `formatPhoneVN` khi render số điện thoại trên card phòng khám.
  - Bổ sung fallback dữ liệu phone từ local clinic content nếu field chính không có.

**4) Forum — đổi ngôn ngữ không còn giật page**
- `src/pages/client/User/Forum/forum.jsx`:
  - Tách dependency i18n khỏi effect fetch dữ liệu ban đầu: chỉ fetch topics/posts khi mount lần đầu.
  - Khi đổi ngôn ngữ: remap lại label/time ngay trên state hiện có (không refetch API) để tránh nháy feed.
  - Thêm cơ chế lưu và restore `scrollTop` của feed container khi language change, giúp giữ nguyên vị trí đọc.

**5) ChatBot AI — TypingIndicator thay cho text "Đang trả lời..."**
- `src/pages/client/Home/ChatBotAI/MessageBox.jsx`:
  - Khai báo `TypingIndicator` ngay trong file MessageBox (không tách file riêng).
  - UI 3 chấm nhấp nhô (CSS animation thuần, không thêm thư viện).
  - Thay loading bubble text cũ bằng TypingIndicator + avatar robot trong lúc chờ token đầu tiên.
  - Giữ nguyên state `isAiLoading` / `isAiWaitingFirstToken` và luồng socket hiện hữu.
- `src/pages/client/Home/ChatBotAI/styles.css`:
  - Bổ sung class `.typing-indicator`, `.typing-indicator-dot`, `.typing-avatar` và keyframes `typing-bounce`.

### Cập nhật bổ sung (2026-04-14) — Fix Icon Chuông, Báo cáo bài viết, Notification Like/Comment UI
- Notification bell badge (Client/Admin/Clinic/Veterinarian):
  - Dùng Ant `Badge` style đỏ tròn đồng nhất (`#ff4d4f`) với text canh giữa bằng `display:flex`, `alignItems:center`, `justifyContent:center`, `lineHeight: normal`, `fontWeight: 600`.
  - Đồng bộ cho:
    - `src/components/layouts/client/header.jsx`
    - `src/layouts/admin/AdminLayout.jsx`
    - `src/layouts/Clinic/AdminClinicLayout.jsx`
    - `src/layouts/Vererianrian/AdminVererianrianLayout.jsx`
- Toast realtime góc phải (Client Header):
  - Không dùng `icon` prop của Ant notification để tránh đè text.
  - Render custom message layout bằng flex:
    - wrapper: `display:flex`, `alignItems:flex-start`, `gap:12`
    - icon: `flexShrink:0`
    - text: `flex:1`, `minWidth:0`
  - Kết quả: icon không che chữ, text wrap ổn định.
- Forum post menu (`...`) phân quyền:
  - Chủ bài: `Chỉnh sửa`, `Xóa bài viết`.
  - Người không phải chủ bài: `Báo cáo bài viết`.
  - Nút `...` luôn hiển thị cho cả hai nhóm.
  - Modal báo cáo bài viết gồm:
    - dropdown lý do (`Spam`, `Nội dung không phù hợp`, `Thông tin sai lệch`, `Khác`)
    - textarea mô tả thêm (optional).
  - Nếu BE chưa có endpoint `POST /post/:id/report`: FE fallback toast `Đã ghi nhận báo cáo của bạn` và log console để theo dõi.
- Notification item UI cho like/comment/reply trong popup:
  - Hiển thị avatar người thao tác + badge action icon nhỏ ở góc avatar.
  - Dòng text ưu tiên định dạng: **senderName** + hành động (`đã thích`, `đã bình luận`, `đã trả lời`).
  - Nội dung bài viết được truncate 60 ký tự.
- Notification mapping từ BE (forum):
  - Map đầy đủ `COMMENT_REPLY`, `COMMENT`, `LIKE`, `POST_LIKED`.
  - Normalize target field: `postId`, `commentId`, `senderName`, `senderAvatar`, `appointmentId`.
  - Ưu tiên lấy sender từ nhiều biến thể payload (`senderName/commenterName/userName`, `senderAvatar/commenterAvatar/avatarUrl`).
- Forum like button UX:
  - Khi đã like, icon đổi sang dạng filled (`FaThumbsUp`) và style nổi bật hơn (bold + nền nhấn nhẹ).
### Cập nhật bổ sung (2026-04-14) — List pages (Phiếu khám & Hồ sơ bệnh án) chuyển sang `/appointment/my` (vet-scoped)

**Phát hiện:** Hai trang list của portal Vererianrian đang gọi endpoint `/appointment` (`getAppointmentsApi`) — endpoint này `@RequiredRole(ADMIN_CLINIC)`, vet gọi sẽ bị chặn (401/403) hoặc rơi vào filter không đúng scope. Đồng thời file `ViewPetMedicalRecords` import dead `getMedicalByPetIdApi` (CUSTOMER-only).

**Files đã sửa:**

1. [listExaminationForm.jsx](src/pages/Vererianrian/ListExaminationForm/listExaminationForm.jsx)
   - `getAppointmentsApi` → `getMyAppointmentsApi(instance, 1, 500)`.
   - Bỏ helper `getCurrentVeterinarianUserId` + filter client-side theo vet user id (BE đã tự filter theo `veterinarian.userId = req.user.id` trong `findAllMyAppointments`).
   - Giữ lại filter `CANCELLED` và thêm filter `appointmentDate` client-side bằng `dayjs(...).format('YYYY-MM-DD') === targetDate` (vì `/appointment/my` không nhận param `date`).
   - Bỏ import `ADMIN_AUTH_STORAGE/getAdminAuthItem` không còn dùng.

2. [listMedicalRecords.jsx](src/pages/Vererianrian/ListMedicalRecords/listMedicalRecords.jsx)
   - Áp dụng cùng thay đổi như (1): switch API, bỏ client-side vet-id filter, thêm date filter client-side.

3. [viewPetMedicalRecords.jsx](src/pages/Vererianrian/ViewPetMedicalRecords/viewPetMedicalRecords.jsx)
   - Xóa import `getMedicalByPetIdApi` (dead import — đang dùng `getMedicalByPetIClinicdApi` đúng scope vet/clinic).

**Nguyên tắc chốt cho portal Vererianrian (áp dụng lại sau này):**

| Màn | Endpoint đúng (role VETERINARIAN) | Endpoint KHÔNG dùng |
|-----|-----------------------------------|---------------------|
| Danh sách phiếu khám (hôm nay) | `GET /appointment/my` | `GET /appointment` (ADMIN_CLINIC) |
| Danh sách hồ sơ bệnh án (hôm nay) | `GET /appointment/my` | `GET /appointment` (ADMIN_CLINIC) |
| Lịch sử phiếu khám theo pet | `GET /medical/clinic/pet/:petId` | `GET /medical/pet/:petId` (CUSTOMER), `GET /user/:id` (ADMIN) |
| Chi tiết pet | `GET /pet/:id` ✓ | — |
| Chi tiết user/owner | *(không có endpoint riêng cho vet)* — dùng `appointment.pet.owner` từ `/appointment/my` | `GET /user/:id` (ADMIN) |
| Phiếu khám theo medical id | `GET /medical/:id` ✓ | — |

**Lưu ý BE contract của `/appointment/my` (role VET):**
- Select không có `medical` relation → FE không thể biết chắc pet đã có medical record nào chưa từ appointment. Hiện `ListExaminationForm` fallback sang `status === COMPLETED` để quyết định nút "Mở" vs "Tạo". Chấp nhận được cho MVP; nếu muốn chính xác tuyệt đối cần BE bổ sung field `medical.id` vào select.
- Select không có `pet.gender`, `pet.dateOfBirth` → nếu list cần hiển thị cần gọi thêm `/pet/:id` hoặc yêu cầu BE bổ sung.

**Kiểm tra build:** `npx vite build` → ✓ built in ~14s, 0 error.


### Cập nhật bổ sung (2026-04-14) — RecordExaminationForm: bỏ lock 15 phút + bỏ call /user/:id (vet bị 403)

**Bối cảnh & quyết định:**
- Logic cũ: sau khi tạo phiếu khám, vet chỉ có **15 phút** để chỉnh sửa (lock-by-time dựa trên `createdAt` đồng bộ `serverTimeOffsetMs`). Gây UX kém khi vet cần sửa muộn, phụ thuộc server time sync, có rất nhiều branch alert phức tạp.
- Logic mới (đồng thuận với yêu cầu nghiệp vụ): **vet sửa thoải mái cho tới khi hóa đơn `PAID` → khóa vĩnh viễn**. Không còn time-based lock.
- Tab **Hồ sơ y tế** trước đây gọi `getUserByIdApi` (`/user/:id`) để enrich email/phone của owner → endpoint này chỉ cho `ADMIN` + `ADMIN_CLINIC`, vet gọi sẽ 403. Sau khi BE appointment đã trả `owner.email` + `owner.phone` trực tiếp (xem section ngay dưới), call này **dư thừa và bị chặn** → xóa hẳn.

**Thay đổi trong `src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx`:**
- Xóa hằng số `EDITABLE_DURATION_SECONDS`, helpers `parseDateToMs()`, `formatRemainingTime()`.
- Xóa state/effect liên quan time-sync: `serverTimeOffsetMs`, `serverTimeSynced`, `remainingEditableSeconds`, interval 1s cập nhật countdown, effect fetch server time header.
- Xóa state `ownerDetail`, `ownerLoading` và useEffect gọi `getUserByIdApi` — chỉ dùng `appointment.pet.owner` (đã có email/phone từ BE).
- Xóa import `getUserByIdApi` trong `services/userService.js`.
- Hợp nhất lock thành `const isReadOnlyForm = isLockedByPayment;` — mọi `disabled` prop của field trong form đều tham chiếu biến này.
- Rút gọn khối `<Alert>` từ 6 nhánh xuống còn 3 nhánh:
  1. `notCreated` — khi chưa có medical, hướng dẫn vet tạo phiếu.
  2. `editable` — khi đã có medical nhưng hóa đơn chưa `PAID`, nhắc vet còn được sửa đến khi thanh toán.
  3. `paymentLocked` — khi hóa đơn đã `PAID`, form read-only.
- Bỏ nhánh spinner `ownerLoading` trong `PatientInfoPanel` (không còn fetch riêng nên không cần loading state).

**i18n cleanup (`src/locales/vererianrian/{vi,en}.json` — block `examForm.record.alerts`):**
- Xóa các key cũ: `editingWindowTitle`, `editingWindowDesc`, `expiredTitle`, `expiredDesc`, `serverSyncFailTitle`, `serverSyncFailDesc`, `missingCreatedAtTitle`, `missingCreatedAtDesc`.
- Giữ + rewrite: `notCreatedTitle`, `notCreatedDesc` (đổi nội dung — không còn nhắc 15 phút), `paymentLockedTitle`, `paymentLockedDesc`.
- Thêm mới: `editableTitle`, `editableDesc` — cho trạng thái "đã tạo nhưng chưa thanh toán".

**Nguồn dữ liệu owner cho vet (sau refactor):**
- `/appointment/my` (GET, VETERINARIAN) → response đã embed `pet.owner.{email,phone,fullName,...}`.
- FE chỉ cần `toAppointmentViewModel()` map sang camelCase → không còn API call phụ cho owner.
- Nếu sau này cần thêm field từ bảng `user` mà appointment không trả, BE phải mở endpoint mới phù hợp role vet (KHÔNG dùng lại `/user/:id`).

**Tab "Hồ sơ y tế" (medical history):**
- Dùng `getMedicalByPetIClinicdApi` → `/medical/clinic/pet/:petId` (role: `VETERINARIAN` + `ADMIN_CLINIC`). Đúng scope.
- **KHÔNG** dùng `/medical/pet/:petId` (role `CUSTOMER` only) hay `/user/:id` (role admin only).

**Kiểm tra build:** `npx vite build` → ✓ built in ~16s, 0 error, bundle chưa thay đổi đáng kể.

**Bài học áp dụng cho sau này:**
- Với bất kỳ API call nào trong màn vet, verify role guard ở BE controller trước khi wire FE — dùng đúng endpoint scoped `/my` hoặc `/clinic/...` thay vì endpoint admin-only.
- Khi có time-based business rule (như 15 phút), cân nhắc trade-off UX vs. strictness; nếu không có yêu cầu audit/compliance rõ, thường payment-state là lock boundary tự nhiên hơn.


### Cập nhật bổ sung (2026-04-14) — PatientInfoPanel: phone editable khi thiếu + BE appointment đã trả email/phone

**Bối cảnh:** BE API `/appointment/my` và `/appointment` đã cập nhật response — giờ trả thêm `owner.email` và `owner.phone` trực tiếp, không cần FE gọi thêm `getUserByIdApi` chỉ để lấy 2 field này (call vẫn còn như fallback).

**Thay đổi trong `RecordExaminationForm`:**
- **Sử dụng API lịch hẹn của bác sĩ đúng role**: `hydrateByAppointmentId()` đổi từ `getAppointmentsApi` (chỉ ADMIN_CLINIC, vet sẽ bị 403) sang `getMyAppointmentsApi` (dùng `/appointment/my`, cho VETERINARIAN).
- **`toAppointmentViewModel`**: map thêm `ownerPhone` từ `pet.owner.phone` (normalize về digits).
- **`buildInitialValues`**: khi khởi tạo form value `phone`, fallback chain: `owner?.phone` → `appointment?.ownerPhone` → `''`.
- **`patientInfo` memo**: bổ sung cờ `hasPhone: Boolean(resolvedPhone)`, dùng để render điều kiện trong UI.
- **UI field `Số điện thoại`** trong `PatientInfoPanel`:
  - Khi `hasPhone = true`: hiển thị text read-only (giữ nguyên như trước).
  - Khi `hasPhone = false`: hiển thị prompt đỏ `<WarningOutlined/> Chưa có số điện thoại — vui lòng nhập` + `<Form.Item name="phone">` với `<Input maxLength=10 />` kèm rules `required` + `pattern /^\d{10}$/`, `validateTrigger: ['onBlur', 'onSubmit']`. Input tự strip ký tự không phải số qua `onChange`.
- **Hidden `<Form.Item name="phone">`** phía dưới chỉ render khi `patientInfo?.hasPhone` để tránh duplicate cùng tên field với Form.Item visible.
- **Form-level block submit**: thêm prop `scrollToFirstError={{ behavior: 'smooth', block: 'center' }}` để AntD tự scroll tới field lỗi khi submit fail.
- **Double-guard trong `onFinish`**: nếu `resolvedPhone` không match regex → `form.setFields([{name:'phone', errors:[...]}])` + `form.scrollToField('phone')` rồi throw, đảm bảo block submit cả khi value đến từ fallback chain (ownerDetail/petRaw).

**Phone validation rule (chuẩn từ BE):** `/^\d{10}$/` — đúng 10 chữ số (không ràng buộc prefix 0). Source: `src/common/constants/rexgex.constant.ts` của BE; áp dụng trong `CreateMedicalRecordDTO.phone` và `UpdateUserDTO.phone`.

**i18n keys mới** (`src/locales/vererianrian/{vi,en}.json`):
- `examForm.record.patientInfo.phoneMissingPrompt` — prompt khi thiếu SĐT.
- `examForm.record.patientInfo.phonePlaceholder` — placeholder input.

**CSS mới** (`recordExaminationForm.module.css`):
- `.patientInfoPhoneInputWrap`, `.patientInfoPhonePrompt`, `.patientInfoPhoneFormItem` — layout + prompt warning màu đỏ.

**Luồng tự động lấy email/phone từ API appointment mới:**
1. Vet navigate sang form → `location.state.appointment` chứa viewModel đã có `ownerEmail`, `ownerPhone`.
2. Nếu vào bằng URL (refresh): `hydrateByAppointmentId()` gọi `/appointment/my`, parse response qua `toAppointmentViewModel`.
3. `buildInitialValues` pre-fill `phone` field từ appointment data.
4. Nếu phone đã có → hiển thị text + hidden form field giữ value; nếu chưa có → visible input với validation.
5. Submit: AntD auto-validate → nếu fail, scroll + focus vào phone; nếu pass, `onFinish` gửi payload `POST /api/medical` với đầy đủ `email` + `phone`.


### Cập nhật bổ sung (2026-04-14) — tinh chỉnh Icon & điều hướng Notification
- Client Header dùng helper icon thống nhất cho cả popup và toast realtime:
  - `AI_DIAGNOSIS` -> `BsRobot` (tone AI tím/xanh).
  - `APPOINTMENT_BOOKED` / `APPOINTMENT_REMINDER` / `FOLLOW_UP_REMINDER` -> `ScheduleOutlined` (xanh lá).
  - Forum interaction (like/comment/reply) -> avatar người thao tác + badge icon nhỏ kiểu Facebook ở góc phải dưới.
  - Fallback -> bell icon mặc định.
- `notificationService.mapBeNotification()` đã normalize đầy đủ target (`appointmentId`, `postId`, `commentId`) và map thêm `senderName`, `senderAvatar` cho forum notification.
- Quy ước deep-link mới:
  - AI diagnosis: `/appointments?openDiagnosis=<appointmentId>`
  - Like bài viết: `/forum?postId=<postId>`
  - Comment/Reply: `/forum?postId=<postId>&commentId=<commentId>`
- `AppointmentDetail`:
  - đọc query `openDiagnosis`, chờ danh sách lịch hẹn load xong rồi tự mở popup `PetDiagnosisContent` đúng appointment.
  - sau khi xử lý sẽ xóa query param bằng replace để tránh trigger lại.
- `Forum`:
  - đọc `postId` và `commentId`, tự scroll tới bài viết, tự mở phần comment khi cần, scroll tới comment/reply đích.
  - áp dụng highlight ngắn (~1.5s) cho post/comment để người dùng định vị nhanh.
  - xóa query param sau khi xử lý để tránh re-trigger.

### Cập nhật bổ sung (2026-04-14) — Fix Notification runtime (spacing + realtime like + diagnosis auto-open)
- Toast notification (góc phải dưới) đã fix khoảng cách icon-text:
  - icon wrapper thêm `marginRight` + `display:flex` + `alignItems:center`.
  - bổ sung class CSS cho toast để canh icon và text ổn định cả với icon thường và avatar badge.
- Realtime like count trên Forum:
  - khi nhận notification type like có `postId`, frontend phát custom events:
    - `window.dispatchEvent(new CustomEvent('notif:postLiked', { detail: { postId, notificationId } }))`
    - `window.dispatchEvent(new CustomEvent('refreshPost', { detail: { postId, notificationId } }))`
  - Forum lắng nghe 2 event trên và gọi `refreshSinglePost(postId)` để cập nhật `likes + 1` trực tiếp trong state hiện tại, không refetch feed, không mất vị trí scroll.
- Auto-open AI Diagnosis popup:
  - `AppointmentDetail` chỉ xử lý `openDiagnosis` khi danh sách lịch đã load xong (`loading === false` + `appointmentsLoaded === true`).
  - effect phụ thuộc dữ liệu liên quan (`openDiagnosisId`, `appointments/mappedAppointments`, `loading`).
  - dùng `diagnosisOpenedRef` để chặn double-trigger.
  - nếu tìm thấy appointment thì tự mở popup `PetDiagnosisContent`, sau đó clear query bằng replace.

### Cập nhật bổ sung (2026-04-14) — Tinh chỉnh UI Revenue Dashboard

**6 thay đổi UI cho trang `/clinic/revenue`:**
1. Bỏ card "Giá trị TB / lượt" → `summaryGrid` chuyển từ 4 cột sang 3 cột.
2. Format tiền đồng nhất dùng utility `formatVND(amount)` tại `src/utils/currencyFormat.js` — hiển thị đầy đủ kiểu `1,600,000 đ` (locale `vi-VN`), thay cho các hàm `formatCurrency` cũ viết rải rác (đã gỡ).
3. Period filter (Hôm nay / 7 ngày / Tháng này / Năm nay) chuyển từ header trang vào header của card "Doanh thu theo ngày" (prop `periodOptions` + `period` + `onPeriodChange` của `RevenueChart`).
4. Header "BÁO CÁO DOANH THU" kéo lên cao (padding-top giảm từ 40px → 8px, thêm `padding-right: 120px` để không đè lên `mainActionBar`).
5. "Top bác sĩ theo doanh thu" → `Top 5 Bác sĩ khám nhiều nhất — Tháng {{month}}` (key i18n mới: `revenue.topVets.titleMonthly`). Tháng lấy dynamic từ `new Date()`. Xếp hạng theo số **lượt khám** (count medical records có veterinarian) trong tháng hiện tại, bỏ ngưỡng `invoice.status=PAID` — tính từ `allRecords` (không phụ thuộc period filter của chart). Ẩn bác sĩ có 0 lượt, tối đa 5 người. Bỏ cột "Doanh thu" khỏi bảng.
6. Layout hàng cuối → grid 2 cột `minmax(260px, 25%) 1fr` (class `.bottomRow`): Top bác sĩ trái 25% + Hoá đơn gần đây phải 75%. Bỏ cột "Bác sĩ" khỏi bảng Hoá đơn gần đây (5 cột còn lại: Phiếu khám / Thú cưng / Ngày / Tổng tiền / Trạng thái).

**Service:**
- `src/services/revenueService.js`: gỡ `calculateTopVeterinarians` (cũ, sort theo doanh thu); thêm `calculateTopVeterinariansByVisits(records, limit=5)` — filter theo tháng hiện tại, count theo veterinarian, sort giảm dần theo `recordCount`.
- `src/hooks/Clinic/useRevenue.js`: expose `topVeterinariansMonthly` (từ `allRecords`, không filter period).

**Responsive:** `.bottomRow` collapse xuống 1 cột khi `max-width: 1200px`. `.chartCardHeader` đổi layout dọc khi `max-width: 768px`.

### Cập nhật bổ sung (2026-04-14) — Revenue Dashboard (Báo cáo Doanh thu Phòng khám)

**Tính năng mới:** Trang báo cáo doanh thu cho Clinic Portal tại route `/clinic/revenue`.

**Components:**
- `src/pages/Clinic/Revenue/RevenueDashboard.jsx` — Trang chính, tổng hợp 4 khu vực.
- `src/pages/Clinic/Revenue/components/RevenueSummaryCards.jsx` — 4 thẻ tổng quan: tổng doanh thu, số hoá đơn đã thanh toán, chưa thanh toán, giá trị trung bình/lượt.
- `src/pages/Clinic/Revenue/components/RevenueChart.jsx` — Biểu đồ Area (doanh thu theo ngày) + Pie (phân bổ theo chuyên khoa bác sĩ).
- `src/pages/Clinic/Revenue/components/TopVeterinariansTable.jsx` — Top bác sĩ xếp hạng theo doanh thu.
- `src/pages/Clinic/Revenue/components/RecentInvoicesTable.jsx` — Bảng hoá đơn gần đây, filter theo status (Tất cả / Đã TT / Chưa TT).
- `src/pages/Clinic/Revenue/revenue.module.css` — Stylesheet, toàn bộ màu dùng CSS token.

**Service & Hook:**
- `src/services/revenueService.js` — Fetch và aggregate dữ liệu doanh thu: `aggregateRevenueData`, `calculateSummary`, `calculateDailyRevenue`, `calculateTopVeterinariansByVisits`, `getRecentInvoices`.
- `src/hooks/Clinic/useRevenue.js` — Quản lý state doanh thu, filter theo kỳ (Hôm nay / 7 ngày / Tháng / Năm), filter invoice status.

**Cách tính doanh thu:** FE tự tính — không có API aggregate ở BE.
1. Fetch toàn bộ medical records qua `GET /api/medical/clinic` (iterate phân trang).
2. Fetch invoice cho từng record qua `GET /api/invoice/{medicalRecordId}` (batch 10 song song).
3. Fetch medical detail cho từng record qua `GET /api/medical/{id}` (lấy veterinarian info).
4. Aggregate: sum `totalAmount` của invoice `PAID`, group by ngày, group by veterinarian.
5. Filter theo kỳ thời gian trên client side (dùng dayjs).

**API sử dụng:**
- `GET /api/medical/clinic?page=&limit=` — danh sách phiếu khám clinic.
- `GET /api/invoice/{medicalRecordId}` — hoá đơn theo phiếu khám.
- `GET /api/medical/{id}` — chi tiết phiếu khám (lấy veterinarian).

**Color tokens mới** (thêm vào `src/styles/Clinic/colorsToken.css`):
- `--page-revenue-primary`, `--page-revenue-primary-light`, `--page-revenue-paid`, `--page-revenue-paid-bg`, `--page-revenue-unpaid`, `--page-revenue-unpaid-bg`, `--page-revenue-chart-line`, `--page-revenue-chart-area`, `--page-revenue-chart-secondary`, `--page-revenue-card-shadow`, `--page-revenue-card-icon-*`, `--page-revenue-up`, `--page-revenue-down`.

**Chart library:** `recharts` (mới thêm vào dependencies).

**i18n:** Bổ sung namespace `revenue` trong `src/locales/clinic/vi.json` và `en.json`.

---

### Feature: Đánh giá Phòng khám (Clinic Review & Rating)

**Mô tả:** Cho phép khách hàng (role CUSTOMER) đánh giá phòng khám sau khi đã hoàn thành khám bệnh. Rating trung bình và số lượt đánh giá hiển thị trên card phòng khám (ClinicSelection) và trang chi tiết phòng khám (HomePageClinic).

**API sử dụng:**
- `GET /api/clinic-review?clinicId=&page=&limit=` — danh sách review theo clinic (paginated).
- `POST /api/clinic-review` — tạo review mới (fields: `clinicId`, `medicalRecordId`, `rating`, `content?`).
- `GET /api/clinic-review/:id` — chi tiết một review.
- `avgRating` và `totalReviews` lấy trực tiếp từ clinic entity (BE auto-update khi có review mới).

**RBAC:**
- POST review: chỉ CUSTOMER.
- GET review: ADMIN, ADMIN_CLINIC, CUSTOMER, VETERINARIAN.

**Điều kiện để review:**
- User phải có medical record đã hoàn thành (có `conclusion`) tại clinic đó.
- Medical record chưa được review (`isReview === false`).
- Mỗi medical record chỉ review được 1 lần (BE set `isReview=true` sau POST).

**Rating type:** `decimal(2,1)` — 1.0–5.0, hỗ trợ half-star (step 0.5).

**Components tạo mới** (`src/components/common/ClinicReview/`):
- `StarRating.jsx` — wrapper Ant Rate, hỗ trợ readonly + interactive, 3 sizes.
- `ClinicRatingSummary.jsx` — hiển thị điểm trung bình + số lượt đánh giá.
- `ClinicReviewItem.jsx` — một review đơn lẻ (avatar, tên ẩn danh, sao, nội dung, ngày).
- `ClinicReviewList.jsx` — danh sách review + load more pagination.
- `ClinicReviewForm.jsx` — form gửi đánh giá (chọn medical record, star picker, textarea).
- `ClinicReviewSection.jsx` — orchestrator: load data, hiển thị summary + form + list.
- `ClinicReviewSection.module.css` — styles dùng color tokens.
- `index.js` — barrel export.

**Service** (`src/services/clinicReviewService.js`):
- `getClinicReviewsApi()`, `getClinicReviewByIdApi()`, `createClinicReviewApi()`.
- `normalizeRating()` — chuẩn hoá rating về step 0.5.
- `maskReviewerName()` — ẩn một phần họ tên người đánh giá.
- Đã xoá localStorage mock cũ (`getAllClinicReviews`, `upsertClinicReview`, `getClinicRatingSummary`).

**Vị trí tích hợp:**
- `HomePageClinic/index.jsx` — thêm `<ClinicReviewSection>` giữa team section và location section.
- `ClinicSelection/index.jsx` — card clinic hiển thị `avgRating`/`totalReviews` trực tiếp từ BE (thay mock).
- `MedicalRecords/medicalRecords.jsx` — review button dùng `record.isReview` từ BE, submit gọi `createClinicReviewApi`.

**i18n:** Bổ sung key `reviewSection` trong `homePageClinic` namespace ở `src/locales/client/vi.json` và `en.json`.

**Edge cases đã xử lý:**
- User chưa đăng nhập → hiển thị CTA đăng nhập.
- User không có medical record hoàn thành tại clinic → thông báo.
- User đã review hết các record → form ẩn.
- Empty state khi chưa có review nào.
- Loading/error states khi submit.
- Tên reviewer được mask một phần để bảo mật.
- Sau submit thành công → refetch reviews + clinic summary + eligible records.

**Routing:** `/clinic/revenue` → `RevenueDashboard` (trước đây là placeholder trỏ `AppointmentManagement`).

**Hạn chế do BE:**
- BE không có API aggregate doanh thu → nhiều API calls khi load (N+1).
- BE không hỗ trợ filter date range trên medical/invoice endpoints → FE phải load hết rồi filter client-side.
- Hiệu suất phụ thuộc số lượng phiếu khám của phòng khám; với phòng khám lớn (>200 records) có thể chậm.

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
- Popup panel và toast realtime dùng chung helper render icon theo loại thông báo.
- Khi có thông báo mới từ socket:
  - hiển thị toast ở góc dưới bên phải,
  - tự ẩn sau 5 giây,
  - có nút đóng `X` mặc định của Ant Design notification.
- Click item trong panel thông báo sẽ mark-as-read và điều hướng tới page phù hợp theo ngữ cảnh notification.

### 4.1) Client AI diagnosis — fetch từ backend
- Loại bỏ luồng generate chẩn đoán AI local sau khi đặt lịch từ frontend.
- Màn `AppointmentDetail` chuyển sang gọi API backend `GET /appointment/:id/ai-diagnosis` để lấy báo cáo chẩn đoán.
- Notification loại `AI_DIAGNOSIS` điều hướng về lịch hẹn kèm query `openDiagnosis=<appointmentId>` để mở đúng ngữ cảnh dữ liệu.

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
| `revenueService.js` | Aggregate doanh thu phòng khám (FE-side) |

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
- `mapBeNotification(raw)` -> map payload BE sang UI model dùng chung, normalize target (`appointmentId`, `postId`, `commentId`) + sender (`senderName`, `senderAvatar`)
- `loadClientNotifications(...)` giữ compatibility cho Client Header nhưng dữ liệu lấy trực tiếp từ BE notification API

#### Icon Mapping & Navigation Convention (2026-04-14)
- Icon mapping:
  - `AI_DIAGNOSIS` -> `BsRobot`
  - `APPOINTMENT_BOOKED` / `APPOINTMENT_REMINDER` / `FOLLOW_UP_REMINDER` -> `ScheduleOutlined`
  - Forum interaction -> avatar + badge icon (`like/comment/reply`)
  - Fallback -> bell icon
- Query param convention:
  - Diagnosis: `openDiagnosis`
  - Forum target post: `postId`
  - Forum target comment/reply: `commentId`
- `resolveNotificationHref()` cho Client hiện trả deep-link theo convention mới:
  - `/appointments?openDiagnosis=<appointmentId>`
  - `/forum?postId=<postId>`
  - `/forum?postId=<postId>&commentId=<commentId>`

#### Runtime Sync Fixes (2026-04-14)
- Toast icon spacing:
  - icon của Ant Design notification được bọc bằng wrapper có `marginRight` và canh giữa theo trục dọc.
  - thêm class CSS toast để đảm bảo icon không dính text khi icon là avatar badge.
- Realtime like count:
  - Notification socket phát custom event `notif:postLiked` và `refreshPost` khi có forum like notification chứa `postId`.
  - Forum lắng nghe event và gọi `refreshSinglePost(postId)` để tăng `likes` tại chỗ (`+1`) theo đúng `post.id`, không gọi API refetch.
- Diagnosis auto-open stability:
  - xử lý query `openDiagnosis` chỉ sau khi dữ liệu lịch hẹn hoàn tất.
  - ref `diagnosisOpenedRef` ngăn mở lặp trên re-render.

#### Client Page Auto-handle Deep-link
- `AppointmentDetail`:
  - đọc `openDiagnosis` khi mount/query thay đổi
  - sau khi list load xong sẽ tự mở popup diagnosis cho appointment tương ứng
  - xóa query bằng replace để tránh auto-open lặp lại
- `Forum`:
  - đọc `postId`, `commentId`
  - tự scroll tới post, tự mở comment section nếu có `commentId`, scroll tới comment/reply đích
  - highlight post/comment ~1.5s rồi clear query params

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

### Cập nhật bổ sung (2026-04-16) — Tích hợp API Clinic Homepage Setting

**Feature:** Kết nối trang chỉnh sửa và trang chủ phòng khám với BE API thay vì chỉ dùng localStorage.

**BE Entity:** `clinic_homepage_setting`
- `clinicId` (UUID, PK) — ID phòng khám
- `settings` (JSONB) — toàn bộ nội dung trang chủ dạng structured JSON (hero, about, gallery, team, location, services, community...)
- `createdAt` (timestamp)

**API Endpoints:**
- `GET /clinic-homepage-setting/:clinicId` — Lấy setting (roles: ADMIN_CLINIC, CUSTOMER, VETERINARIAN)
- `PUT /clinic-homepage-setting` — Cập nhật setting (role: ADMIN_CLINIC only), clinicId lấy từ JWT token. Body: `{ settings: "<JSON string>" }` (validate `@IsJSON()`).

**Luồng hoạt động:**
1. Admin vào trang editor (`/clinic/editor/:clinicId`) → FE gọi GET API → populate form → fallback localStorage nếu API lỗi/404.
2. Admin chỉnh sửa các section → nhấn "Lưu thay đổi" → FE gọi PUT API với `{ settings: JSON.stringify(contentObj) }` → đồng thời cache vào localStorage.
3. User/Customer truy cập trang chủ phòng khám (`/clinic/:clinicId`) → FE gọi GET API → render nội dung → fallback localStorage/default nếu API lỗi.

**Xử lý nội dung:** Content là structured JSON, render qua React components (không dùng `dangerouslySetInnerHTML`). Không cần DOMPurify hay rich text editor.

**Files liên quan:**
- `src/services/clinicHomepageSettingService.js` — Service layer cho GET/PUT API
- `src/pages/Clinic/ClinicPortalEditor/HomePageEditorTab.jsx` — Editor trang chủ (đã tích hợp API)
- `src/pages/client/Home/HomePageClinic/index.jsx` — Trang chủ public (đã tích hợp API)
- `src/utils/storage/clinicHomeStorage.js` — LocalStorage cache layer (thêm `cacheClinicHomeContent()`)
- `src/config/homePageClinicContent.js` — Default content & builder function

**Lưu ý BE:** GET endpoint yêu cầu JWT auth — user chưa đăng nhập không xem được. FE xử lý bằng fallback default content.

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

### Cập nhật (2026-04-23) — Tố cáo bài viết/bình luận trên Web (Report Post/Comment)

**Phạm vi:**
- `src/pages/client/User/Forum/forum.jsx`
- `src/pages/client/User/Forum/forum.module.css`

**Yêu cầu:**
- Port tính năng tố cáo từ Mobile Flutter lên Web, giao diện tương đương.
- Tố cáo bài viết người khác: chọn lý do preset (6 lý do) + mô tả thêm tùy chọn.
- Tố cáo bình luận người khác: cùng UX (trước đây chỉ có textarea free-text).
- Chặn tố cáo lặp cùng post/comment trong một phiên.
- Fix text "Báo cáo bài viết" bị xuống hàng trong post menu.

**Phân tích & tự phản biện:**
- Phương án A (tracking "đã tố cáo") — `useState + Set` vs `useRef + Set`:
  - `useState`: khi add vào Set sẽ không trigger re-render vì Set là mutation (cần spread mới) → dùng sai.
  - `useRef` (đã chọn): không cần re-render, chỉ cần check trước khi mở modal → đúng use-case.
- Phương án B (cấu trúc lý do tố cáo) — align với Mobile vs giữ nguyên:
  - Web cũ có 4 lý do (spam, inappropriate, misleading, other) → không khớp Mobile (spam, offensive, harassment, misinformation, violence, other).
  - Quyết định: align với Mobile — 6 lý do, value uppercase (SPAM, OFFENSIVE, ...) để admin đọc report đồng nhất.
  - Tạo 1 `reportReasonOptions` dùng chung cho cả post và comment (DRY).
- Phương án C (comment report modal) — giữ textarea vs thêm Select:
  - Textarea free-text: user không biết gõ gì, không nhất quán với post modal.
  - Select + optional textarea (đã chọn): nhất quán với post modal, nhất quán với Mobile.
- Phương án D (CSS text-wrap) — `white-space: nowrap` vs tăng `min-width`:
  - Tăng `min-width`: có thể bị tràn trên màn nhỏ.
  - `white-space: nowrap` (đã chọn): đúng nguyên nhân gốc, text menu không bao giờ bị wrap, an toàn hơn.

**Thay đổi đã triển khai:**

*forum.module.css:*
- `.postMenuItem`: thêm `white-space: nowrap` → fix text bị xuống hàng.

*forum.jsx:*
- Thêm state: `commentReportReason`, `commentReportDetail` (Select + optional textarea cho comment modal).
- Thêm ref: `reportedPostIds` (`useRef(new Set())`), `reportedCommentIds` (`useRef(new Set())`).
- Refactor `postReportReasonOptions` → `reportReasonOptions` dùng chung, 6 lý do align Mobile (value uppercase).
- `handleStartReportPost`: check `reportedPostIds.current.has(postId)` trước khi mở modal → show `message.warning` nếu đã tố cáo.
- `handleSubmitPostReport`: sau khi submit thành công → `reportedPostIds.current.add(postId)`.
- `handleCommentAction` (branch 'report'): check `reportedCommentIds.current.has(commentId)` → show warning nếu đã tố cáo; reset `commentReportReason` và `commentReportDetail` khi mở modal.
- `handleSubmitCommentReport`: validate `commentReportReason` (Select), build payload `{reason, detail}`, fallback generic endpoint cùng pattern post, mark `reportedCommentIds.current.add(commentId)` sau khi thành công.
- `closeReportModal`: reset `commentReportReason` + `commentReportDetail`.
- Comment report modal UI: thêm `<Select>` chọn lý do + `<textarea>` mô tả thêm (tùy chọn), title đặt đúng qua prop `title` của Modal (bỏ `<h3>` inline + `style textAlign: center`), `okButtonProps.disabled` check `commentReportReason`.

**Ghi chú kiến trúc:**
- Tracking "đã tố cáo" là in-memory (reset khi reload page). BE không validate duplicate → đây là UX safeguard phía FE, giống Mobile.
- `forumReportService.js` không thay đổi — fallback chain (endpoint theo post/comment → generic POST /report) vẫn hoạt động.
- Không động BE, không động các forum role khác (AdminForum, ClinicForum, VetForum) — chỉ `client/User/Forum/forum.jsx`.

---

## Fix: Geolocation lấy sai tọa độ + Booking Page 404

**Bối cảnh:**
- Lỗi 1: User cấp quyền vị trí, nhưng nearby clinic list sort sai vì tọa độ truyền vào API không đúng.
- Lỗi 2: Mở `/booking` từ một số entry point → console báo `GET /api/clinic/{id}` 404.

**Root cause Lỗi 1 — Geolocation:**
- `useUserLocation.js` gọi `navigator.geolocation.getCurrentPosition()` với `enableHighAccuracy: false`.
- Browser khi `enableHighAccuracy: false` ưu tiên IP-based geolocation (vị trí ISP/datacenter) thay vì GPS/WiFi triangulation → tọa độ trả về có thể lệch hàng chục–trăm km so với vị trí thật của user.
- State `lat/lon` đúng là tọa độ "thật" do browser trả về, nhưng nguồn dữ liệu (IP) sai bản chất.

**Root cause Lỗi 2 — Booking 404:**
- `BookingAppointment` seed `preselectedClinicId` ưu tiên `location.state.selectedClinicId`, fallback `sessionStorage.getItem('selectedClinicId')`.
- Một số entry point navigate sang `/booking` mà KHÔNG truyền state (`AppointmentDetail.handleBookingNew`, `MedicalRecords` truyền chỉ `service`) → fallback sang sessionStorage.
- sessionStorage có thể giữ ID stale (clinic đã xoá / DB seed reset) từ session cũ → form clinicId = stale ID.
- useEffect cũ trigger `fetchClinicById(clinicId)` ngay khi clinicId đổi, KHÔNG đợi `clinics` list load và KHÔNG validate ID có thuộc list → BE 404 với clinic không tồn tại.

**Thay đổi đã triển khai:**

*FE/Web/client/src/hooks/client/useUserLocation.js:*
- Đổi `enableHighAccuracy: false` → `true` trong options của `getCurrentPosition` → dùng GPS/WiFi triangulation cho tọa độ chính xác.

*FE/Web/client/src/pages/client/User/BookingAppointment/index.jsx:*
- useEffect seed `clinicId` từ `preselectedClinicId`: thêm gate `clinics.length === 0` + validate preselected nằm trong list trước khi `setFieldValue` → tránh đẩy ID stale vào form quá sớm.
- useEffect fetch doctor + clinic detail: thêm gate chờ `clinics` load. Nếu `clinicId` không thuộc nearby list → clear `sessionStorage.selectedClinicId` (nếu match) + fallback `form.clinicId = clinics[0].id` thay vì gọi `GET /clinic/:id` với ID lỗi → 404.

**Lưu ý kiến trúc:**
- Web Geolocation API: property name là `coords.latitude` / `coords.longitude` (không phải `lat`/`lon`); `enableHighAccuracy: true` trên HTTPS hoặc localhost mới hoạt động — HTTP non-localhost browser block hoàn toàn API.
- Guard pattern cho `clinicId` trong booking flow: bất kỳ effect nào dùng clinicId để gọi API chi tiết phải gate trên `clinics.length > 0` + kiểm tra ID thuộc list, vì clinicId có thể đến từ sessionStorage stale.
- Không động BE — không cần (root cause đều ở FE).

## Đơn giản hóa luồng tạo Phiếu khám — chỉ POST /api/medical (2026-04-28)

**Bối cảnh:** BE đã hợp nhất logic xử lý 3 case (có TK + có SĐT / có TK + chưa có SĐT / chưa có TK) vào duy nhất `POST /api/medical`. FE bỏ bước phụ trợ `PUT /api/user/{id}` để cập nhật SĐT khách hàng trong luồng tạo phiếu khám.

**DTO POST /api/medical (BE/petcare/src/medical/dtos/create-medical-record.dto.ts):**
- Required: `species, breed, petName, name, customerName, email, phone, temperature, heartRate, systolic, diastolic, weight, diagnosis, symptoms`.
- Optional: `petId` (FE truyền khi user đã có account → BE cần petId để liên kết phiếu với pet sẵn có).
- `phone`: required, validate theo `regex.phoneRegex`.

**Thay đổi FE (FE/Web/client/src/pages/Vererianrian/RecordExaminationForm/recordExaminationForm.jsx):**
- Xoá import `updateUserProfileApi` (giữ `getUserListApi` để resolve petId của user đã tồn tại).
- Walk-in flow: xoá block `if (existingOwnerId && normalizedPhone) { await updateUserProfileApi(...) }` sau khi tạo orders/medicines. Đơn giản hóa khai báo `existingOwnerId` thành biến block-scope cục bộ.
- Appointment flow: xoá block `ownerId` + `existingOwnerPhone` lookup + call `updateUserProfileApi` đặt giữa cập nhật appointment status và `message.success`.
- Payload `createMedicalRecordApi` không thay đổi — vốn đã gửi `phone` (từ `normalizedPhone` / `resolvedPhone`).
- Validation phone (`/^\d{10}$/`), UI input phone, read-only logic, loading state walk-in (`showWalkInStep`) giữ nguyên.

**⚠️ Vấn đề BE cần dev xử lý (không tự sửa do ràng buộc):**
- File: `BE/petcare/src/medical/medical.service.ts` (dòng 493-512, hàm `createMedicalRecord`).
- Vấn đề: nhánh else (user đã tồn tại) hiện chỉ kiểm tra phone collision với user khác, **không** thực hiện `userRepo.update(existedEmail.id, { phone: createDTO.phone })`. Vì vậy case "Có TK + chưa có SĐT" (hoặc admin nhập SĐT mới khác SĐT cũ) sẽ không thực sự cập nhật user.phone trong DB, dù BE chấp nhận tạo phiếu khám thành công.
- Ảnh hưởng FE: phiếu khám tạo OK, nhưng `user.phone` không đồng bộ với `phone` admin nhập trong form. Trước đây FE bù bằng PUT /api/user; sau task này thì không còn nữa.
- Đề xuất: thêm `await userRepo.update(existedEmail.id, { phone: createDTO.phone })` ngay sau check collision trong nhánh else.
