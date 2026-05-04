# PetCareX Mobile Project Summary

## 📌 Tổng quan dự án
PetCareX là ứng dụng di động quản lý chăm sóc thú cưng được phát triển bằng Flutter, tích hợp với hệ thống Backend NestJS. Dự án vừa trải qua một đợt tối ưu hóa mã nguồn (Refactoring) và đồng bộ hóa giao diện (UI/UX) toàn diện.

## 🛠 Tech Stack
- **Frontend:** Flutter (Dart)
- **State Management:** `provider` (MultiProvider)
- **Đa ngôn ngữ:** `flutter_localizations` (Hỗ trợ Tiếng Việt & Tiếng Anh).
- **Networking:** Custom `ApiClient` (http) với cơ chế tự động đính kèm JWT Token.
- **Lưu trữ:** `shared_preferences` (Cài đặt) & `flutter_secure_storage` (Thông tin đăng nhập).

## ⚡ Community Performance & UX Optimization (2026-03-25)

### 1) Tối ưu tốc độ đăng bài có nhiều ảnh (Pre-upload)
- **Vấn đề cũ:** Ảnh chỉ được upload khi bấm `Đăng`, nên thời gian chờ dài và cảm giác app bị “đơ”.
- **Giải pháp mới:** Upload ảnh **ngay khi người dùng chọn ảnh** (pre-upload), đến lúc bấm `Đăng` chỉ gửi nội dung + danh sách URL đã upload.
- **Triển khai chính:**
    - `CommunityProvider` thêm `preUploadImages(...)`.
    - `createNewPost(...)` hỗ trợ `uploadedImageUrls` để bỏ qua upload lại.
    - `CreatePostPage` quản lý trạng thái từng ảnh: `isUploading`, `isUploadFailed`, `uploadedUrl`.
- **Lợi ích:** Giảm đáng kể thời gian chờ tại thao tác `Đăng`, UX mượt hơn trên mạng chậm.

### 2) Sửa lỗi Edit Post hiển thị raw HTML script
- **Vấn đề cũ:** Dialog `Chỉnh sửa bài viết` bind trực tiếp `post.content` (HTML), khiến người dùng thấy full script `<p>`, `<img ...>`.
- **Giải pháp mới:**
    - Tách `text` và `imageUrls` từ HTML trước khi hiển thị.
    - Text hiển thị trong `TextField` dạng plain text.
    - Ảnh hiển thị preview riêng, có thể xóa từng ảnh trước khi `Cập nhật`.
    - Cho phép thêm ảnh mới trong lúc edit, upload ngay (pre-upload), sau đó ghép lại HTML chuẩn khi submit.
- **Lợi ích:** Trải nghiệm chỉnh sửa đúng kỳ vọng người dùng, không lộ định dạng kỹ thuật.

### 3) Cải thiện UX chọn nhiều ảnh và xóa ảnh trước khi đăng
- **Vấn đề cũ:** Người dùng khó kiểm soát danh sách ảnh đã chọn, dễ phải thoát màn để làm lại.
- **Giải pháp mới:**
    - Dải preview ảnh luôn hiển thị trong màn tạo bài.
    - Mỗi ảnh có nút xóa trực tiếp.
    - Overlay trạng thái upload/failed theo từng ảnh giúp người dùng biết ảnh nào đã sẵn sàng.
- **Lợi ích:** Người dùng kiểm soát chính xác ảnh trước khi đăng, giảm thao tác lặp và khó chịu.

### 4) Phản biện & trade-off đã cân nhắc
- **Pre-upload** tăng số request sớm hơn trong phiên thao tác, nhưng đổi lại giảm độ trễ ở action quan trọng nhất (`Đăng/Cập nhật`) và cải thiện cảm nhận hiệu năng.
- Chưa thêm cơ chế “hủy ảnh đã pre-upload trên cloud khi user xóa khỏi draft” do cần contract backend riêng; hiện tại ưu tiên tốc độ và UX phía mobile.
- Thiết kế hiện tại ưu tiên ổn định và khả dụng ngay, có thể mở rộng retry ảnh lỗi theo từng item ở iteration tiếp theo.

### 5) Community Comment/Reply Image Composer Sync (2026-03-27)
- **Vấn đề cũ:**
    - Comment có ảnh vẫn upload khi bấm `Gửi`, làm thao tác gửi dễ bị chờ lâu.
    - Luồng `Trả lời` chưa có trải nghiệm upload ảnh rõ ràng như tạo bài, gây cảm giác reply chỉ gửi text.
- **Giải pháp triển khai:**
    - Chuẩn hóa composer ảnh ở bottom sheet comment/reply sang **pre-upload ngay khi chọn ảnh**.
    - Mỗi ảnh có state riêng: `isUploading`, `isUploadFailed`, `uploadedUrl` (tương tự Create Post).
    - Nút `Gửi` chỉ submit khi:
        - Không còn ảnh đang upload.
        - Không có ảnh lỗi upload.
        - Có ít nhất text hoặc ảnh đã upload thành công.
    - Payload gửi comment/reply ưu tiên `uploadedImageUrls` đã có sẵn; provider vẫn giữ fallback upload bằng `imagePaths` để tương thích ngược.
- **Tối ưu UX UI:**
    - Ảnh đang upload hiển thị **mờ (opacity)** + spinner để tạo cảm giác “đang xử lý” kiểu feed social.
    - Ảnh lỗi có overlay đỏ + icon lỗi, cho phép xóa từng ảnh trước khi gửi.
    - Hiển thị bộ đếm `uploaded/total` trong composer để người dùng biết ảnh nào đã sẵn sàng.
- **Kết quả:**
    - Comment có ảnh gửi nhanh và ổn định hơn do URL ảnh đã sẵn trước khi submit.
    - Reply đã hỗ trợ upload ảnh đầy đủ và dùng chung một flow nhất quán với comment.

### 6) Community Self Comment Edit/Delete (2026-03-27)
- **Nhu cầu:** Người dùng cần sửa/xóa bình luận của chính mình khi gõ sai nội dung hoặc đăng nhầm.
- **API backend đã có sẵn:**
    - `PUT /api/comment/{id}`: sửa `content`.
    - `DELETE /api/comment/{id}`: xóa bình luận.
- **Triển khai FE mobile:**
    - Trong bottom sheet comment, mỗi comment/reply của **chính chủ** (`comment.author.id == currentUser.id`) hiển thị menu thao tác (`...`) gồm `Cập nhật` và `Xóa`.
    - Luồng sửa comment mở dialog nhập lại text; ảnh cũ trong content HTML được giữ nguyên để tránh mất dữ liệu media khi người dùng chỉ sửa chữ.
    - Luồng xóa comment có confirm dialog trước khi gọi API.
    - Sau khi API thành công, Provider cập nhật local state ngay cho list comment/reply + đồng bộ giảm `commentCount` ở card bài viết.
- **Phản biện UX/tech:**
    - Giữ quyền thao tác trực tiếp trong từng item comment giúp giảm số bước, đúng kỳ vọng social feed.
    - Dùng check quyền ở FE để ẩn thao tác với comment người khác; quyền thực tế vẫn do BE xác thực để đảm bảo an toàn.

### 7) Community Edit Comment With Images (2026-03-27)
- **Vấn đề cũ:** Dialog `Cập nhật` bình luận chỉ sửa được text, không cho quản lý ảnh nên người dùng không thể xóa ảnh cũ hoặc thêm ảnh mới khi sửa comment.
- **Giải pháp triển khai:** Đồng bộ luồng `Edit Comment` theo đúng pattern đã dùng ở `Edit Post`.
    - Parse comment HTML thành `text` + `existingImageUrls` để hiển thị đúng ngữ nghĩa.
    - Cho phép xóa từng ảnh cũ ngay trong dialog trước khi bấm `Cập nhật`.
    - Cho phép thêm ảnh mới và **pre-upload ngay khi chọn ảnh** (không đợi tới lúc submit).
    - Ảnh mới có state per-item: `isUploading`, `isUploadFailed`, `uploadedUrl`.
    - Khi submit, FE build lại HTML từ `text + existingImageUrls còn lại + uploadedImageUrls mới`.
- **Guard khi submit:**
    - Chặn `Cập nhật` nếu còn ảnh đang upload.
    - Chặn `Cập nhật` nếu có ảnh upload lỗi.
    - Chỉ gửi payload khi nội dung cuối cùng không rỗng (text và ảnh đều trống thì báo lỗi).
- **Kết quả:**
    - Người dùng có thể chỉnh sửa comment có ảnh một cách đầy đủ: giữ/xóa ảnh cũ + thêm ảnh mới + cập nhật text trong cùng một luồng nhất quán.

### 8) Edit Comment Dialog Premature Close Fix (2026-03-27)
- **Vấn đề phát sinh:** Khi người dùng bấm `Cập nhật` trong lúc ảnh mới vẫn đang upload, dialog bị đóng trước rồi mới báo lỗi `Đang tải ảnh lên, vui lòng đợi...`, làm mất ngữ cảnh chỉnh sửa.
- **Root cause:** Validate trạng thái upload được đặt **sau** `Navigator.pop(...)` (sau khi dialog đã đóng).
- **Sửa triệt để:**
    - Chuyển validate upload/failed/empty-content vào ngay trong `onPressed` của nút `Cập nhật` trong dialog.
    - Nếu chưa hợp lệ thì chỉ hiển thị thông báo lỗi và **giữ nguyên dialog đang mở**.
    - Chỉ `Navigator.pop(true)` khi toàn bộ điều kiện hợp lệ.
- **Kết quả UX:** Người dùng không còn bị đá ra khỏi dialog khi bấm cập nhật quá sớm; có thể chờ upload xong rồi tiếp tục chỉnh sửa trong cùng ngữ cảnh.

### 9) Community Single-Image Render Fix — "1 ảnh mà nhìn như 2-3 ảnh" (2026-04-22)
- **Triệu chứng:** Ở comment/post chỉ có **1 ảnh**, UI xuất hiện các dải trắng trên-dưới/hai bên nên mắt người đọc tách thành 2-3 vùng hình riêng biệt, nhất là với ảnh có mảng màu đồng nhất (trần trắng, tường, bầu trời).
- **Root cause (phân tích + phản biện kỹ):**
    - Nhánh `count == 1` trong `_buildImageGrid` ở `community_page.dart` dùng `Container(height: fixed) + BoxFit.contain + color: AppColors.background`.
    - Khi tỉ lệ ảnh gốc **không khớp** với khung cố định (120px cho comment compact, 220px cho post), `contain` sinh **letterbox** bằng nền sáng `AppColors.background`.
    - Letterbox này + các mảng màu đồng nhất trong ảnh → tạo cảm giác nhiều ô ảnh, KHÔNG phải do HTML có nhiều `<img>` trùng URL.
    - Trước đó đã thêm dedup URL ở `_extractImageUrlsFromHtml` như defensive fix (giữ lại), nhưng không giải quyết được trường hợp layout này.
- **Các giải pháp đã cân nhắc:**
    - A. Đổi sang `BoxFit.cover` + `AspectRatio` cố định 4:3 → đơn giản nhưng portrait bị crop quá đà cho post.
    - B. Đọc tỉ lệ thực của ảnh rồi **clamp theo dải**, sau đó `BoxFit.cover` (Facebook-style) → đồng nhất, không letterbox, portrait không bị ép landscape.
    - C. Chỉ đổi màu letterbox → xử lý triệu chứng, vẫn thấy 2 vùng → loại.
- **Giải pháp đã áp dụng (B):** Thêm widget `_AdaptiveSingleImage` (Stateful) trong `community_page.dart`:
    - Dùng `CachedNetworkImageProvider.resolve(...)` + `ImageStreamListener` để đọc `width/height` thực của ảnh sau khi tải.
    - Clamp tỉ lệ `w/h` theo ngữ cảnh:
        - **Comment (compact = true):** dải `[4/3, 16/9]` — luôn landscape-leaning cho gọn thread, portrait bị center-crop có chủ đích.
        - **Post (compact = false):** dải `[4/5, 16/9]` — cho phép portrait vừa phải như feed Facebook.
    - Bọc ảnh trong `AspectRatio` + `BoxFit.cover` → không còn dải letterbox trắng.
    - Placeholder/error dùng nền `AppColors.background` đồng bộ với phần còn lại của card.
    - Dọn dẹp `ImageStreamListener` trong `dispose()` để tránh leak.
- **Nguyên tắc tuân thủ khi triển khai:**
    - **Không đụng BE** theo đúng rule dự án; toàn bộ fix nằm ở FE mobile.
    - Giữ logic grid cho `count >= 2` nguyên vẹn, chỉ thay nhánh `count == 1`.
    - Giữ dedup URL ở `_extractImageUrlsFromHtml` làm defensive layer.
- **Kết quả:** 1 ảnh trong comment/post hiển thị như một khung hình thống nhất, không còn "viền trắng tách đôi" khiến người dùng tưởng có 2-3 ảnh. Portrait không bị stretch; landscape không bị letterbox.

### 10) Community Comment Multi-Image Facebook-style Grid (2026-04-22)
- **Vấn đề phát hiện sau fix (9):**
    - Ở comment có **2+ ảnh**, các nhánh `count == 2/3/4/5+` trong `_buildImageGrid` ép tất cả ảnh vào khung cao ~120px (vì `compact=true`, `totalHeight=160`, `h = totalHeight * 0.75`).
    - Với 5+ ảnh, chỉ hiển thị 5 cái đầu kèm overlay "+N", các ảnh còn lại bị ẩn khỏi bubble comment → user cảm giác "không hiển thị đầy đủ".
    - Mỗi ảnh trong grid bị co nhỏ tới mức không đọc/nhìn được nội dung.
- **Lần lặp 1 (đã loại):** Horizontal carousel ngang. Mọi ảnh đều xem được nhưng break pattern social feed quen thuộc, user mong đợi kiểu FB "thumbnail + số ảnh còn lại".
- **Lần lặp 2 (đã áp dụng theo request của user):** **Facebook comment-style thumbnail grid + "+N" overlay**.
    - Container: `Align(centerLeft) + FractionallySizedBox(widthFactor: 0.75) + AspectRatio(1:1)` → block vuông, căn trái, rộng 75% bubble comment.
    - Layout theo số ảnh hiển thị (tối đa 4):
        - 2 ảnh: 2 cột đều
        - 3 ảnh: 1 tile trái + 2 tile nhỏ phải xếp dọc (FB style)
        - 4 ảnh: grid 2×2
        - ≥5 ảnh: grid 2×2, tile thứ 4 có overlay **+N** (N = count - 4)
    - Tái sử dụng helper `_fbImage(..., overlayCount: ...)` đã có sẵn cho post feed → đồng bộ render (cover, bo góc, overlay) giữa post và comment, giảm trùng code.
    - Tap bất kỳ tile nào mở `ImageViewer` với đúng `initialIndex` — tile "+N" mở viewer từ ảnh thứ 4, user vuốt để xem hết các ảnh bị ẩn.
- **Giữ nguyên cho post feed (non-compact):** các nhánh grid `count == 2/3/4/5+` gốc không đổi để nhịp đọc feed nhất quán.
- **Nguyên tắc tuân thủ:** chỉ sửa FE mobile, không đụng BE; giữ nguyên contract HTML content.
- **Kết quả:**
    - Comment nhiều ảnh giờ gọn gàng theo đúng pattern FB/social feed.
    - Thumbnail đủ lớn để nhìn (tile ~(0.75 × bubble_width) / 2 ≈ 100–130px mỗi tile).
    - Không ảnh nào bị "mất" — user tap "+N" là vào full gallery.
    - Reuse `_fbImage` giúp post và comment có visual language đồng nhất.

## 🐾 Pet Avatar Fullscreen Fix (2026-03-27)

### Bối cảnh lỗi
- Khi người dùng vào màn xem/sửa thú cưng và chạm vào avatar để xem ảnh lớn, có trường hợp ảnh không tải được dù thumbnail avatar vẫn hiển thị bình thường.

### Phân tích nguyên nhân
- Thumbnail đang dùng URL Cloudinary đã transform qua helper (`w,h,c_fill,q_auto`) là hợp lý cho danh sách/avatar nhỏ.
- Nhưng popup xem ảnh lớn trước đó cũng tiếp tục dùng URL transform, làm tăng rủi ro fail do khác biệt policy/giới hạn transform giữa môi trường backend-cloud (ví dụ rule strict transform, giới hạn biến thể, hoặc edge-case URL dẫn xuất).

### Quyết định triển khai (Mobile-only)
- Giữ nguyên cơ chế thumbnail cho avatar nhỏ để tối ưu băng thông.
- Đổi riêng luồng **xem ảnh fullscreen** của pet avatar sang dùng **URL gốc Cloudinary** (không ép transform) để tăng tính tương thích và độ ổn định.

### Trade-off đã phản biện
- Dùng URL gốc ở màn fullscreen có thể tải nặng hơn một chút so với URL đã resize.
- Tuy nhiên đây là hành vi người dùng chủ động xem ảnh lớn, nên ưu tiên đúng trải nghiệm và tỷ lệ tải thành công cao hơn tối ưu băng thông tuyệt đối.

### Phạm vi thay đổi
- `lib/features/pet/presentation/edit_pet_page.dart`: popup preview avatar dùng `imageUrl: _uploadedAvatarUrl!` thay vì URL thumbnail transform.
- Không thay đổi backend.

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

## 💬 Streaming AI Chat Architecture (2026-04-09)

### Kiến trúc streaming token-by-token
- **Socket event flow:**
    1. User gửi message → `ChatSocketService.sendMessage()` emit `message` + `sendMessage` events.
    2. Backend xác nhận → emit `serverResponseMessage` (user message saved to DB).
    3. AI streaming → emit nhiều `aiResponse` với `{ "type": "token", "token": "từng_chữ", ... }`.
    4. AI hoàn thành → emit `aiResponse` với `{ "type": "done" }`.
    5. Final DB record → emit `serverResponseAIMessage` hoặc `aiFinalMessage` (AI message saved to DB).
- **Socket service** (`lib/features/chat/data/chat_socket_service.dart`):
    - `onAiChunk` callback: nhận từng token khi `type == "token"` hoặc `"chunk"` hoặc empty.
    - `onAiStreamDone` callback: signal khi `type == "done"`.
    - `onAiFinalMessage` callback: nhận message cuối cùng từ DB.
    - Đọc content từ field `token` > `answer` > `content` (fallback chain).
- **Provider** (`lib/features/chat/presentation/provider/chat_provider.dart`):
    - `_appendAiChunk()`: Token đầu tiên tạo `ChatMessage` mới với `isStreaming: true`, các token sau append vào `content`.
    - `_markStreamingDone()`: Set `isStreaming: false`, clear `_streamingMessageId`. Gọi khi nhận `type: "done"`.
    - `_finalizeAiMessage()`: Replace local streaming message bằng DB record từ server. Tìm theo `_streamingMessageId` hoặc fallback tìm message có id prefix `ai_stream`.
    - Race condition handling: Nếu stream đã done nhưng token mới đến → tạo message streaming mới.
- **UI** (`lib/features/chat/presentation/chat_page.dart`):
    - Bubble message hiển thị cursor `▍` khi `message.isStreaming == true`.
    - Auto-scroll-to-bottom khi đang streaming (check `hasStreaming`).
    - State management: Provider pattern — `notifyListeners()` mỗi token → `context.watch<ChatProvider>()` rebuild.
- **Cleanup khi dispose:** `ChatProvider.dispose()` gọi `_socketService.disconnect()` → disconnect + dispose socket.

### Debug logging policy
- Chat feature: **không có debug log** — tất cả `AppLogger.logError` đã xóa khỏi socket service và provider.
- `AppLogger.logError()` luôn print prefix `"API ERROR"` — chỉ nên dùng cho actual errors, không dùng cho info/debug logging.
- HTTP API logging (`AppLogger.logRequest/logResponse` trong `api_client.dart`) vẫn giữ nguyên, đã có guard `kDebugMode`.

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
- **Booking Step Order Update (2026-03-25):** Đổi thứ tự luồng đặt lịch thành **Clinic -> Pet -> Service -> Doctor -> Time**. Các bước còn lại giữ nguyên logic validate/nghiệp vụ; mục tiêu UX là chốt ngữ cảnh phòng khám trước rồi mới chọn thú cưng.
- **Booking Symptoms Input UX (2026-03):** Ở bước `Dịch vụ`, ô nhập `Triệu chứng` (bắt buộc) được đưa lên đầu màn và kèm helper text để người dùng nhận biết ngay từ đầu, không cần cuộn xuống cuối danh sách dịch vụ mới thấy. Đồng thời tối ưu controller nhập liệu để tránh reset con trỏ khi Provider rebuild.
- **Chuẩn hóa Enum Chuyên môn bác sĩ:** `VeterinarySpecialtyEnum` dùng `getTranslatedName(context)` + `fromValue(...)` để parse ổn định theo enum key backend và hiển thị theo locale.
- **Chuẩn hóa Enum trạng thái lịch hẹn:** `AppointmentStatusEnum` được bổ sung `getTranslatedName(context)` + `fromValue(...)`; luồng `AppointmentProvider` và `AppointmentPage` bắt buộc map status qua enum, không hardcode chuỗi tại UI/Provider.
- **Mở rộng coverage i18n cho enum (2026-03):** Bổ sung key VI/EN + `getTranslatedName(context)` cho các nhóm: `InvoiceStatusEnum`, `RoleEnum`, `MedicineUnitEnum`, `PetSpeciesEnum`, `PetBreedEnum`; đồng bộ quy tắc parse qua `fromValue(...)` theo chuẩn hóa chữ hoa.
- **Type-safe Appointment Status (2026-03):** `Appointment.status` được nâng cấp sang kiểu `AppointmentStatusEnum` (không còn giữ `String` ở model). Các luồng lọc `upcoming/historical` và hiển thị badge trạng thái dùng so sánh enum trực tiếp, giữ nguyên logic nghiệp vụ nhưng an toàn kiểu dữ liệu hơn.
- **Loại bỏ hardcoded status payload (2026-03):** `AppointmentService.cancelAppointment(...)` và `updateAppointmentStatus(...)` gửi trạng thái bằng `AppointmentStatusEnum.value` thay vì chuỗi cứng (`Đã huỷ`, ...), giúp đồng bộ contract FE-BE và giảm rủi ro sai chính tả trạng thái.
- **RBAC Sync — Cancel Appointment Endpoint (2026-04-09):**
    - **Bối cảnh:** BE cập nhật RBAC, endpoint `PATCH /api/appointment/:id` giờ yêu cầu `ADMIN_CLINIC` hoặc `VETERINARIAN`. Customer phải dùng `PATCH /api/appointment/client/:id`.
    - **Fix FE:** Thêm `END_POINT_APPOINTMENT_CLIENT` vào `app_constants.dart`, thêm helper `appointmentClientByIdEndpoint()` vào `api_helper.dart`. `cancelAppointment()` trong `appointment_service.dart` đổi sang endpoint `/api/appointment/client/{id}` (không cần body — BE tự set CANCELLED).
    - Xóa method `updateAppointmentStatus()` (dead code, gọi sai endpoint RBAC, không ai gọi).
    - **Lỗi BE phát hiện kèm (cần BE team fix):** Migration `1775632467242-update-notification-table` (DROP cột `sender_type` khỏi bảng notification) chưa chạy → INSERT notification khi tạo appointment bị `NOT NULL constraint violation` trên `sender_type` → HTTP 500. FE không liên quan, BE cần chạy migration.
    - **RBAC Matrix cho Mobile CUSTOMER:** Tất cả 48 API call từ mobile đều tương thích RBAC ngoại trừ lỗi cancel đã fix ở trên. Các endpoint chính: Pet (CUSTOMER), Appointment POST/GET (CUSTOMER), Medical GET (CUSTOMER), Clinic/Vet GET (ALL roles), Forum/Chat/Notification (JwtAuth only), Cloudinary (public).
- **Booking Clinic List Pagination & Rating Sort (2026-04-20):**
    - **Bối cảnh:** Bước `Phòng khám` trước đây chỉ hiển thị tối đa 10 phòng khám (trang 1) do `BookingRepository.getClinics()` dùng `limit=10` mặc định và `BookingProvider.fetchClinics()` không có cơ chế paginate/load more. BUG-009 đã mô tả vấn đề "mất các phòng khám tiếp theo".
    - **Kịch bản rating (Kịch bản A):** BE đã lưu sẵn `avgRating` (`decimal(2,1)`) và `totalReviews` (`int`) trong entity `Clinic` (được cập nhật tại `ClinicReviewService.createClinicReview(...)` sau mỗi review mới). FE **không cần fetch review riêng cho từng clinic** — chỉ đọc trực tiếp từ response `GET /api/clinic` và sort ở FE sau khi fetch.
    - **API contract:** `GET /api/clinic` trả về `{items, meta: {totalItems, totalPages, currentPage, ...}, links}` theo chuẩn `nestjs-typeorm-paginate`. BE hiện **không hỗ trợ sort param** → FE tự sort phía client.
    - **Fix pagination (Infinite Scroll):**
        - `BookingRepository.getClinics()` đổi default `limit=20`, trả thêm `totalPages`/`currentPage` để FE biết còn bao nhiêu trang.
        - `BookingProvider` thêm state pagination: `_clinicsPageSize=20`, `_clinicsCurrentPage`, `_clinicsTotalPages`, `_hasMoreClinics`, `_isLoadingMoreClinics`, cùng getter `isLoadingMoreClinics` / `hasMoreClinics`.
        - `fetchClinics()` reset list + page=1; bổ sung `loadMoreClinics()` để append trang tiếp theo, tự set `_hasMoreClinics=false` khi chạm trang cuối.
        - `booking_page.dart` tạo `_clinicScrollController` gắn vào `CustomScrollView` khi `_currentStep==0`; listener gọi `loadMoreClinics()` khi scroll >= 80% `maxScrollExtent` và guard theo `_isLoadingMore` / `_hasMore` để không gọi API thừa.
    - **Rating & Sort UI:**
        - Thêm `Clinic.avgRating` (double) + `Clinic.totalReviews` (int) + `Clinic.avatarUrl` vào `booking_models.dart` (parse an toàn cả khi BE trả string/number cho decimal).
        - Sort theo rule: clinic có đánh giá (`totalReviews > 0`) xếp trước theo `avgRating` giảm dần; clinic chưa có đánh giá xếp cuối. Re-sort sau mỗi lần `loadMoreClinics()` để giữ thứ tự nhất quán trong danh sách tích lũy.
        - Tạo widget dùng chung `lib/core/widgets/star_rating_widget.dart` dùng `Icons.star_rounded` / `star_half_rounded` / `star_outline_rounded` (không cần package thứ 3), màu `AppColors.warning`, hỗ trợ filled/half/empty theo rule `>=N` / `>=N-0.5`.
        - `step_clinic_selector.dart` được refactor thành **sliver** (`SliverMainAxisGroup` + `SliverList.builder`) để dùng lazy render trong `CustomScrollView` hiện hữu; kèm `SliverToBoxAdapter` loading indicator ở cuối khi đang load more. Card hiển thị: icon, tên, địa chỉ, sao + điểm số (1 số thập phân) + số lượt đánh giá (i18n plural), hoặc `clinicNoReviews` khi `totalReviews == 0`.
    - **Trade-off đã phản biện:**
        - Sort phía FE nghĩa là thứ tự chỉ đúng trong phạm vi đã load. Khi load thêm trang mới, clinic có rating cao hơn có thể "chen" vào giữa list đã hiển thị — chấp nhận được vì BE hiện chưa hỗ trợ sort và limit page 20 đủ lớn để case này hiếm xảy ra trong thực tế.
        - Không chọn Kịch bản B (fetch `/api/clinic-review` cho từng clinic) vì BE đã cung cấp rating aggregate sẵn — tránh N+1 request và latency không cần thiết.
    - **i18n mới:** `clinicNoReviews` + `clinicReviewCount` (ICU plural) cho VI/EN.
    - **Files sửa:**
        - `lib/features/booking/data/models/booking_models.dart`
        - `lib/features/booking/data/booking_repository.dart`
        - `lib/features/booking/presentation/provider/booking_provider.dart`
        - `lib/features/booking/presentation/booking_page.dart`
        - `lib/features/booking/presentation/widget/step_clinic_selector.dart`
        - `lib/core/widgets/star_rating_widget.dart` (mới)
        - `lib/l10n/app_vi.arb`, `lib/l10n/app_en.arb`
- **Booking Success Summary Contract Sync (2026-04-20):**
    - **Bối cảnh thực tế sau khi rà BE:** `POST /api/appointment` (AppointmentService.createAppointment) trả về `savedAppointment` dạng entity mỏng (id/date/time/service/status + foreign keys), không join sẵn `pet/clinic/veterinarian.user` như payload màn success từng giả định.
    - **Triệu chứng ở mobile:** Ở màn `Đặt lịch thành công`, các field `Thú cưng/Phòng khám/Bác sĩ` có thể rỗng dù đặt lịch thành công (thường chỉ còn `Dịch vụ/Giờ`).
    - **Fix FE tối ưu:** `booking_page.dart` đổi sang ưu tiên dữ liệu local đã chọn trong flow booking (`selectedClinic`, `selectedDoctor`, `selectedPetName`, `selectedTime`, `selectedDate`) và chỉ fallback sang response BE nếu có.
    - **Chi tiết triển khai:**
        - `BookingProvider` bổ sung `selectedPetName` và cập nhật `selectPet(petId, {petName})` để lưu snapshot tên thú cưng ngay khi user chọn.
        - `StepSummary` và `StepSuccess` dùng chiến lược fallback nhiều tầng (local-first), đồng thời parse an toàn nhiều shape response (`veterinarian.user.fullName` hoặc `veterinarian.fullName`) để chịu được biến động contract BE.
    - **Nguyên tắc maintain mới:** Không phụ thuộc relation object trong response của `POST /api/appointment` để render UI tóm tắt/success; coi đó là response xác nhận tạo lịch, còn dữ liệu hiển thị ưu tiên từ state đã chọn ở client.
- **Booking Success Screen Simplification (2026-04-22):**
    - **Bối cảnh:** Màn `Đặt lịch thành công` trước đây hiển thị kèm khối **Mã QR check-in** (icon QR placeholder + hướng dẫn xuất trình tại quầy). Do mobile hiện chưa có pipeline sinh/verify QR thật và luồng check-in tại clinic chưa chốt, khối này chỉ là UI trống gây hiểu nhầm cho người dùng.
    - **Thay đổi UI:** Gỡ toàn bộ block QR (`bookingCheckinQrTitle`, icon `Icons.qr_code_2`, `bookingQrInstruction`) trong `step_success.dart`; màn thành công chỉ còn icon check + tiêu đề + bảng tóm tắt lịch hẹn.
    - **Thay đổi điều hướng – thứ tự tối ưu (quan trọng):** `BookingPage` được push bằng `MaterialPageRoute` đè lên `IndexedStack` của `MainNavigationWrapper`. Khi đóng màn success, thứ tự bắt buộc là:
        1. `MainNavigationWrapper.activeState?.setSelectedIndex(1)` – đổi `IndexedStack.index` sang **Lịch hẹn** TRƯỚC khi pop. Vì `BookingPage` vẫn đang đè lên trên, user không nhìn thấy tab đang chuyển bên dưới.
        2. `Navigator.pop(context)` – animation pop của `MaterialPageRoute` reveal thẳng vào `AppointmentPage` ngay từ frame đầu tiên, không còn hiện Home flash.
    - **Lý do phải đảo thứ tự so với bản trước:** Nếu pop trước rồi mới `setSelectedIndex` (kể cả bọc trong `addPostFrameCallback`), toàn bộ animation pop (~300ms) vẫn diễn ra trên nền tab cũ (Home) do `IndexedStack` chưa đổi index → user thấy Home nhấp nháy trước khi chuyển sang Lịch hẹn. Đổi index trước thì frame nền đã sẵn là Appointment trước khi pop animation bắt đầu.
    - **Back-gesture / nút back cứng:** `PopScope.canPop` KHÔNG được set `true` ở trạng thái success. Thay vào đó `canPop = _currentStep == 0 && Navigator.canPop(context)` và `onPopInvokedWithResult` nhận `didPop=false` ở success để gọi cùng hàm `_closeSuccessAndGoToAppointments(...)`. Nếu để `canPop=true`, hệ thống auto-pop ngay sẽ quay về bước 1 (pop trước khi đổi tab) và tái hiện flash Home.
    - **Dùng `MainNavigationWrapper.activeState` (static) thay vì `of(context)`:** đảm bảo lấy được state wrapper bất kể context của `BookingPage` đang ở đâu trong tree và tránh edge case `findAncestorStateOfType` trả null trong quá trình unmount.
    - **Files sửa:**
        - `lib/features/booking/presentation/widget/step_success.dart`
        - `lib/features/booking/presentation/booking_page.dart`
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
- **Appointment Navigation Refresh Rule (2026-03-25):** Khi người dùng bấm tab **Lịch hẹn** ở bottom navigation, app chủ động tải lại dữ liệu để ưu tiên độ mới. Tối ưu chống gọi dư: lần mở tab đầu tiên dùng fetch khởi tạo của `AppointmentPage`; các lần bấm sau (kể cả bấm lại tab đang đứng) sẽ trigger refresh từ navigation.
- **Trade-off hiệu năng đã chấp nhận (2026-03-25):** Refresh chủ động làm tăng tải mạng và thời gian chờ nhẹ ở một số thiết bị, nhưng đổi lại dữ liệu lịch hẹn nhất quán hơn sau các luồng tạo/hủy/chuyển màn; phù hợp ưu tiên reliability của sản phẩm hiện tại.
- **Home Header & Background UX (2026-03-24):**
    - Home chuyển từ `SingleChildScrollView` sang `CustomScrollView` + `SliverPersistentHeader(pinned: true)` để ghim cứng cụm header gồm **logo PetCareX, icon QR và icon thông báo** khi người dùng cuộn xuống.
    - Nền Home được đặt rõ ràng `AppColors.white` ở root container và phần pinned header để loại bỏ cảm giác xám/mờ, giữ trải nghiệm sáng và đồng nhất.
    - Quy tắc maintain: nếu mở rộng thêm action trên header Home, cần giữ cùng cơ chế pinned (không quay lại header trôi theo nội dung).
- **Home Floating Chatbot CTA (2026-03-24):**
    - Đã bổ sung icon chatbot nổi ở **góc dưới bên phải** màn Home bằng `Stack + Positioned` trong `home_page.dart`.
    - Nút nổi điều hướng trực tiếp tới `ChatPage` và dùng `Tooltip` với text localization `aiChatbot` để giữ chuẩn i18n.
    - Vị trí đáy được tính theo `MediaQuery.padding.bottom + 84` để không đè lên thanh điều hướng dưới (bottom nav), ưu tiên thao tác một tay và không che CTA chính.
    - Tinh chỉnh thẩm mỹ/độ rõ (2026-03-24): dùng shadow trung tính (`AppColors.black` alpha thấp) + viền trắng mảnh thay cho quầng xanh theo màu primary; giữ `Stack(clipBehavior: Clip.none)` để tránh cảm giác lệch/cắt bóng ở mép.
    - Tinh chỉnh vị trí/size (2026-03-24): tăng nút lên `60x60`, icon `27`; đặt thấp ở góc phải với offset `right: 14`, `bottom: 8` để gần khu vực thao tác ngón tay cái và đúng layout mong muốn.
    - Tinh chỉnh thời điểm hiển thị (2026-03-24): nút chatbot nổi được trì hoãn **5 giây** sau khi vào Home rồi mới hiện (`Timer` trong `HomePage`), giảm cảm giác xuất hiện quá gấp ngay khi màn vừa render.
    - Tối ưu trợ giúp người dùng (2026-03-24): bỏ `Tooltip` dạng nhấn giữ; thay bằng label gợi ý tự động **nằm phía trên icon** (`aiChatbot`) với `AnimatedSwitcher`, tự hiện sau 5 giây và tự ẩn sau vài giây để không che nội dung.
    - Đồng bộ theo luồng tab (2026-03-24): khi người dùng từ tab khác quay về Home, countdown 5 giây được reset qua `HomeChatbotHintController` do `MainNavigationWrapper` phát tín hiệu, đảm bảo hành vi nhất quán sau login và trong suốt phiên sử dụng.
- **Global Notification Placement Rule (2026-03-24):**
    - Theo yêu cầu UX của mentor, thông báo lỗi/thông tin/success **không hiển thị dưới topbar** (không dùng `ScaffoldMessenger/SnackBar` trực tiếp) mà hiển thị ở vùng **phía trên topbar**.
    - Đã chuẩn hóa cơ chế chung qua `lib/core/utils/app_notifier.dart` với **Fluttertoast thuần** (`Fluttertoast.showToast`) để tránh lỗi layout/animation từ custom overlay.
    - `AppNotifier` giữ API ổn định `showInfo/showSuccess/showError/showWarning` để module gọi không phải đổi business flow.
    - Toast global dùng `ToastGravity.TOP`, `toastLength` + `timeInSecForIosWeb` để auto-dismiss; màu nền toast dùng semantic colors trong `AppColors`.
    - Các module đã migrate khỏi SnackBar cũ: `auth` (login/register/forgot/reset/change password), `home`, `booking`, `appointment`, `pet` (add/edit), `community` (list/create post), `account` (profile/my pets).
    - Quy tắc maintain: mọi thông báo ngắn trong UI flow phải đi qua `AppNotifier`; tránh tạo lại cơ chế toast/snackbar cục bộ để giữ trải nghiệm nhất quán toàn app.

### 2.1 Login Notification UX Pattern (2026-03-24)
- **Phạm vi:** `LoginPage` (Flutter mobile). Dù mô tả nghiệp vụ có thể tham chiếu React Native, implementation chuẩn trong repo này là Flutter.
- **Pattern 1 - Inline Field Error:**
    - Bỏ kiểu báo lỗi dạng banner full-width trong login flow.
    - Khi sai tài khoản/mật khẩu, hiển thị lỗi trực tiếp bằng `errorText` của `InputDecoration` trong field liên quan.
    - Input lỗi dùng semantic colors từ theme (không hardcode): border đỏ + nền đỏ nhạt + errorStyle đỏ đậm.
    - Khi người dùng nhập lại, lỗi field được clear ngay trong `onChanged`.
- **Pattern 2 - Top Toast Notification:**
    - Toast top dùng `AppNotifier` bọc `Fluttertoast.showToast` (`ToastGravity.TOP`) với style màu theo loại thông báo.
    - Hỗ trợ `subMessage` optional (ghép thành message nhiều dòng), tự ẩn theo `toastLength/timeInSecForIosWeb`.
    - Vẫn giữ nguyên logic API, response handling và navigation; chỉ thay đổi lớp hiển thị thông báo.
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
    - **Tinh chỉnh UX ảnh thú cưng ở chế độ xem (2026-03-27):**
        - Đã bỏ icon `pets` đứng cạnh tiêu đề section `Thông tin thú cưng` để giao diện gọn hơn, tránh trùng ngữ nghĩa thị giác.
        - Ở **view mode**, avatar thú cưng hỗ trợ thao tác **tap để mở preview phóng to** (overlay nền tối + `InteractiveViewer` để pinch zoom), thay vì chỉ hiển thị ảnh tròn kích thước cố định.
        - Ở **edit mode**, hành vi upload ảnh giữ nguyên (nút camera và luồng pick/upload không đổi).
        - Quy tắc maintain: chỉ cho phép đổi ảnh khi `_isEditMode = true`; khi `_isEditMode = false` thì ưu tiên hành vi xem ảnh (preview) để tối ưu trải nghiệm người dùng cuối.
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

### 7. Community Topic Filter Column (2026-03-25)
- **Yêu cầu nghiệp vụ:** Khi người dùng bấm vào một chủ đề trong khu vực lọc của Community, danh sách bài viết chỉ hiển thị bài thuộc chủ đề đó.
- **Triển khai hiện tại trên mobile:**
    - Khu vực lọc chủ đề (category tabs) đã được chuẩn hóa như một cột lọc ngang dạng chip để dễ nhận biết trạng thái đang chọn.
    - Nhãn chủ đề hiển thị theo locale hiện tại:
        - `vi` ưu tiên `nameVn`
        - `en` ưu tiên `nameEng`
    - Khi chọn chủ đề, FE gọi lại danh sách bài viết với `topicId` qua `GET /api/post?topicId=...`.
- **Tối ưu độ chắc dữ liệu (defensive filtering):**
    - Ngoài filter từ backend, Provider có thêm lớp lọc dự phòng theo `post.topic.id == selectedTopicId` trước khi render.
    - Mục tiêu: đảm bảo UX đúng ngay cả khi backend trả dư dữ liệu trong giai đoạn chuyển contract hoặc cache chưa nhất quán.
- **Tối ưu tránh trùng bài khi phân trang:**
    - Khi `loadMore`, FE chỉ append bài viết chưa tồn tại theo `post.id` để giảm khả năng lặp item do phân trang/cursor.
- **Nguồn danh sách chủ đề cho cột lọc:**
    - Ưu tiên `GET /api/topic/get-all` để lấy đầy đủ topic cho bộ lọc.
    - Nếu endpoint này không khả dụng, fallback sang `GET /api/topic?page=1&limit=50` và parse `items`.
- **Phản biện kỹ thuật & quyết định tối ưu:**
    - Chỉ filter client-side sẽ nhẹ backend nhưng sai dữ liệu khi feed lớn/pagination server.
    - Chỉ filter server-side sẽ gọn nhưng dễ phụ thuộc hoàn toàn vào tính đúng của API tại từng thời điểm.
    - Giải pháp được chọn: **server-side filter là chính + client-side verify là phụ** để cân bằng hiệu năng, tính đúng và khả năng chống lỗi chuyển tiếp.

### 8. Community Comment/Like Counter Consistency (2026-03-25)
- **Vấn đề người dùng gặp:** Card bài viết hiển thị `2 comments` nhưng khi mở bottom sheet chỉ thấy 1 comment, gây cảm giác sai bộ đếm.
- **Phân tích root cause (FE + BE):**
    - Backend `post.commentCount` đang tăng cho **mọi comment bao gồm cả reply** (`CommentService.createComment` luôn increment `ForumPost.commentCount`, kể cả khi có `parentId`).
    - API `GET /api/post/{id}/comments` chỉ trả **comment cấp 1** (`parentId IS NULL`).
    - Mobile trước đó không parse `replyCount` của từng comment cha và điều kiện hiển thị nút `Xem câu trả lời` dựa vào `comment.replies`, trong khi API list comment cha không trả sẵn mảng replies.
    - Kết quả: reply tồn tại nhưng không có tín hiệu UI để mở ra xem, nên người dùng thấy thiếu comment so với counter.
- **Phản biện phương án:**
    - Đổi bộ đếm trên card chỉ tính top-level ở FE: dễ hiểu tức thời nhưng lệch contract BE và sai khi hệ thống muốn tính toàn bộ thảo luận.
    - Bắt BE đổi contract ngay: sạch về kiến trúc nhưng tốn thời gian đồng bộ và có rủi ro ảnh hưởng web/admin.
    - Tối ưu thực tế được chọn: giữ contract hiện tại (commentCount = total gồm reply), đồng thời làm UI/logic FE phản ánh đúng tổng này.
- **Thay đổi đã áp dụng trên mobile:**
    - Parse `replyCount` vào model `Comment` để biết mỗi comment cha còn bao nhiêu reply.
    - Hiển thị CTA theo số lượng reply ẩn: `Xem câu trả lời (n)` và fetch replies khi bấm.
    - Khi gửi reply thành công, tăng `post.commentCount` ngay tại FE (đồng bộ với BE vì BE cũng tăng tổng comment).
    - Đồng thời tăng `replyCount` của comment cha trong local state để UI không bị trễ sau khi vừa trả lời.
- **Fix thêm cho like counter để tránh trôi số:**
    - Không chỉ dựa optimistic +/-1; FE đã đọc payload trả về từ API like/unlike (`likeCount`, `liked`) để chốt trạng thái authoritative.
    - Thêm khóa theo từng post khi đang like/unlike (`isLikeUpdating`) để tránh spam tap gây race condition và lệch đếm.

### 9. Community Rich Content Image Flow (2026-03-25)
- **Yêu cầu mới:** Cho phép người dùng upload ảnh khi:
    - Tạo bài viết.
    - Bình luận.
    - Trả lời bình luận (reply).
- **Ràng buộc backend:** API `POST /api/post` và `POST /api/comment` hiện nhận `content` dạng text; backend xác nhận có thể truyền nội dung HTML trực tiếp trong `content`.
- **Phân tích & phản biện phương án:**
    - Thêm field `images` riêng vào payload: rõ ràng dữ liệu nhưng cần đổi contract BE và ảnh hưởng web/admin.
    - Chỉ upload ảnh và chèn URL thuần vào text: triển khai nhanh nhưng khó render nhất quán và khó mở rộng rich content.
    - Giải pháp tối ưu đã chọn: **upload Cloudinary trước, sau đó nhúng `<img src="..." />` vào `content` HTML** để giữ nguyên contract API hiện tại và mở đường cho rich content.
- **Thiết kế triển khai ở mobile:**
    - Tầng UI:
        - `CreatePostPage`: thêm chọn nhiều ảnh từ thư viện, preview thumbnail, xoá ảnh đã chọn.
        - Comment sheet trong `CommunityPage`: thêm chọn nhiều ảnh + preview cho cả comment và reply.
    - Tầng service/repository:
        - `CameraService`: bổ sung `pickImagesFromGallery()` dùng `image_picker.pickMultiImage`.
        - Dùng endpoint Cloudinary multi-file hiện có để upload ảnh và nhận URL.
    - Tầng provider/business:
        - `CommunityProvider` chịu trách nhiệm upload ảnh + build HTML content dùng chung cho post/comment/reply.
        - Logic build content: text được escape HTML + newline -> `<br/>`, ảnh nhúng bằng `<img src="url" />`.
    - Tầng render:
        - `CommunityPage` parse nhẹ HTML để hiển thị text + ảnh (cho post/comment/reply), tránh lộ raw HTML ra UI.
        - Có fallback hiển thị `post.images` cũ khi content chưa chứa `<img>` để đảm bảo tương thích dữ liệu legacy.
- **Kết quả:**
    - Người dùng có thể đính kèm ảnh khi đăng bài, bình luận và trả lời.
    - Không cần thay đổi contract API BE hiện tại.
    - `flutter analyze` sạch cho phạm vi `community` + `camera_service`.

## ⭐ Clinic Review từ Hồ sơ Y tế (2026-04)

### Bối cảnh
- Sau khi khám bệnh xong (đã có medical record), khách hàng có thể đánh giá phòng khám trực tiếp từ thẻ lượt khám trong trang "Hồ sơ y tế".
- API: `POST /api/clinic-review` (CUSTOMER only), payload `{ clinicId, medicalRecordId, rating, content? }`.

### Triển khai FE
- **Model update:** `PetMedicalRecordSummary` bổ sung `clinicId`, `clinicName` (parse từ `json['clinic']`), `isReview` (từ `json['isReview']`) + `copyWith()`.
- **API layer:** `clinic_review_repository.dart` — `createClinicReview()` POST, `getClinicReviews()` GET.
- **Widget mới:**
    - `InteractiveStarRating` — widget sao tương tác (tap chọn 1–5 sao).
    - `ReviewBottomSheet` — bottom sheet gồm interactive stars, rating label, optional comment field, submit/cancel buttons, loading state.
- **Tích hợp vào `pet_medical_records_page.dart`:**
    - Mỗi thẻ medical record hiển thị review section bên dưới ExpansionTile.
    - `isReview == false` + `clinicId != null`: hiện sao trống + text "Đánh giá lượt khám này", tap mở ReviewBottomSheet.
    - `isReview == true`: hiện badge "Đã đánh giá" (icon check + text xanh).
    - Sau submit thành công: cập nhật local state `isReview = true` ngay để phản hồi tức thì.
- **i18n keys mới:** `reviewClinicTitle`, `reviewThisVisit`, `reviewAlreadyReviewed`, `reviewCommentHint`, `reviewSubmit`, `reviewSuccess`, `reviewFailed`, `reviewRating1–5`.
- **Files thay đổi/tạo mới:**
    - `lib/core/constants/app_constants.dart` (sửa)
    - `lib/core/network/api_helper.dart` (sửa)
    - `lib/features/pet/data/models/pet_medical_record_models.dart` (sửa)
    - `lib/features/pet/data/clinic_review_repository.dart` (mới)
    - `lib/core/widgets/interactive_star_rating.dart` (mới)
    - `lib/features/pet/presentation/widgets/review_bottom_sheet.dart` (mới)
    - `lib/features/pet/presentation/pet_medical_records_page.dart` (sửa)
    - `lib/l10n/app_vi.arb`, `lib/l10n/app_en.arb` (sửa)

### BE Issues phát hiện (cần dev BE xử lý)
1. `CreateClinicReviewDTO.rating` không có `@Min/@Max` validation → FE tự enforce 1–5 client-side nhưng BE nên validate.
2. BE set `isReview=true` sau khi tạo review nhưng **không kiểm tra** trước khi tạo → cho phép duplicate review.
3. Không validate `medicalRecordId` thuộc về user đang gọi API → potential data integrity issue.
4. **Không có module Report/Tố cáo** trong BE → Feature "Tố cáo bài viết/bình luận" **không thể triển khai ở FE** cho tới khi BE xây dựng module tương ứng.

## 📝 Hướng dẫn chạy dự án
1. **Vào đúng root mobile trước khi chạy lệnh:** `Set-Location "F:\capstone 2\code\PetcareX\FE\Mobile\petcarex"`.
2. **Đồng bộ ngôn ngữ:** Chạy `flutter gen-l10n` khi có thay đổi trong file `.arb`.
3. **Android USB (mặc định):** Chạy `flutter run` (debug) để kích hoạt auto reverse qua Gradle.
4. **Nếu cần set reverse thủ công:** `adb reverse tcp:3000 tcp:3000` rồi `flutter run`.
5. **Quy ước ghi file bằng PowerShell (tránh lỗi tiếng Việt):** Khi dùng `Set-Content` hoặc `Out-File`, luôn bắt buộc chỉ định `-Encoding UTF8`.

## 🔔 Notification Integration (2026-07)

### Tổng quan
Tích hợp hệ thống thông báo realtime vào Mobile App, đồng bộ UX với Web FE. Sử dụng **WebSocket (socket.io)** cho push realtime và **REST API** cho lịch sử + thao tác đọc.

### Kiến trúc
- **Pattern:** Provider (ChangeNotifier) — nhất quán với toàn bộ app.
- **Realtime:** `socket_io_client` kết nối namespace `/notification`, xác thực JWT qua `handshake.auth.accessToken`.
- **REST API:**
  - `GET /api/notification?limit=20&filter=ALL|UNREAD&createdAt=<cursor>` — phân trang cursor-based.
  - `PATCH /api/notification/mark-one/:id` — đánh dấu đã đọc 1 thông báo.
  - `PATCH /api/notification/mark-all` — đánh dấu đã đọc tất cả.
- **Socket event:** `severSendNotification` (tên event từ BE, giữ nguyên).

### Notification Types (NotificationEnum)
| Type | Mô tả |
|------|--------|
| `APPOINTMENT_BOOKED` | Lịch hẹn mới được đặt |
| `APPOINTMENT_CANCELLED` | Lịch hẹn bị hủy |
| `APPOINTMENT_STATUS_UPDATED_BY_CLIENT` | Khách hàng cập nhật trạng thái |
| `APPOINTMENT_REMINDER` | Nhắc lịch hẹn sắp tới |
| `AI_DIAGNOSIS` | Kết quả chẩn đoán AI |
| `FOLLOW_UP_REMINDER` | Nhắc tái khám |
| `COMMENT_REPLY` | Có người trả lời bình luận |

### Files mới tạo
| File | Vai trò |
|------|---------|
| `lib/features/notification/data/models/notification_model.dart` | Parse payload từ BE, helper getters cho target fields |
| `lib/features/notification/data/repositories/notification_repository.dart` | REST API calls (get, mark-one, mark-all) |
| `lib/core/services/notification_socket_service.dart` | WebSocket connection, reconnect (15 attempts, 3s delay) |
| `lib/features/notification/presentation/provider/notification_provider.dart` | State management: list, unread count, filter, optimistic updates |
| `lib/features/notification/presentation/screens/notification_screen.dart` | Màn hình danh sách thông báo (filter, pull-to-refresh, infinite scroll) |
| `lib/features/notification/presentation/widgets/notification_item.dart` | Widget item thông báo (icon theo type, unread dot, relative time) |

### Files đã sửa
| File | Thay đổi |
|------|----------|
| `lib/core/constants/app_constants.dart` | Thêm `END_POINT_NOTIFICATION` |
| `lib/main.dart` | Đăng ký `NotificationProvider` vào MultiProvider |
| `lib/features/home/presentation/home_page.dart` | Bell icon badge hiển thị `totalUnread` (cap 99+), navigate sang NotificationScreen |
| `lib/features/main_navigation/presentation/main_navigation_wrapper.dart` | Init notification (socket + fetch) sau khi mount |
| `lib/features/account/presentation/account_page.dart` | Cleanup notification khi logout |
| `lib/l10n/app_vi.arb` | Thêm 25+ i18n keys cho notification |
| `lib/l10n/app_en.arb` | Thêm 25+ i18n keys cho notification |

### UX Features
- **Badge:** Hiển thị số thông báo chưa đọc trên bell icon ở Home, giới hạn hiển thị 99+.
- **Filter:** Tab All / Unread để lọc nhanh.
- **Optimistic update:** Đánh dấu đọc cập nhật UI ngay lập tức, gọi API background.
- **Tap navigation:** Chạm thông báo → đánh dấu đọc + chuyển đến tab tương ứng (Appointments/Community).
- **Pull-to-refresh:** Kéo xuống để tải lại danh sách.
- **Infinite scroll:** Tự động load thêm khi cuộn đến cuối.
- **Cleanup on logout:** Ngắt socket, reset state khi đăng xuất.

## 📍 Geolocation Clinic + Search Forum (2026-04-28) — Port từ Web

### Tính năng 1 — Nearby Clinic theo vị trí user
**Phạm vi (FE only, không đụng BE):**
- `pubspec.yaml` — thêm `geolocator: ^13.0.1` (đã có sẵn `permission_handler`).
- `android/app/src/main/AndroidManifest.xml` — thêm `ACCESS_FINE_LOCATION`, `ACCESS_COARSE_LOCATION`.
- `ios/Runner/Info.plist` — thêm `NSLocationWhenInUseUsageDescription`.
- `lib/core/constants/location_constants.dart` (mới) — `LocationConstants.defaultLat/defaultLon/defaultLabel` (Đà Nẵng) + `geolocationTimeout: 10s`. Đồng bộ với Web `src/constants/location.js`.
- `lib/core/services/location_service.dart` (mới) — `LocationService.getUserLocation()`: kiểm tra service enabled → request permission → `Geolocator.getCurrentPosition(LocationAccuracy.high, timeout 10s)` → fallback `LocationConstants.default*` + `isDefault=true` khi denied/disabled/timeout. Cache module-scope (`_cached`, `_inflight`) để mọi nơi gọi không hỏi lại permission. Có method `refresh()` để force fetch lại.
- `lib/core/utils/distance_formatter.dart` (mới) — `formatDistance(num? km)`: `<1km → "Xm"`, `>=1km → "X.Xkm"`, null/<0 → ''. Đơn vị km vì BE Elasticsearch `_geo_distance` trả về km.
- `lib/core/network/api_helper.dart` — thêm `nearbyClinicsEndpoint(page, limit, lat, lon, sortBy, search)` hit `/clinic/user`. Endpoint cũ `clinicsEndpoint` (`/clinic`, ADMIN-only) giữ nguyên cho admin sau này.
- `lib/features/booking/data/models/booking_models.dart` — `Clinic` thêm field `distance: double?` parse từ `json['distance']` (BE trả km qua `/clinic/user`).
- `lib/features/booking/data/booking_repository.dart` — đổi `getClinics()` → `getNearbyClinics({page, limit, lat, lon, sortBy='distance', search})` hit `/clinic/user`. BE trả raw array (không có items/meta) → suy luận hết trang qua `items.length < pageSize`.
- `lib/features/booking/presentation/provider/booking_provider.dart`:
  - Inject `LocationService`. Field `_isLocationDefault` + getter `isLocationDefault` cho UI hiện SnackBar fallback.
  - `fetchClinics()` & `loadMoreClinics()`: gọi `_locationService.getUserLocation()` → truyền lat/lon vào `getNearbyClinics`. Bỏ `_sortClinicsByRating` (BE đã sort theo distance, FE sort lại sẽ ghi đè thứ tự đúng). Pagination dedup theo id.
- `lib/features/booking/presentation/booking_page.dart` — sau `fetchClinics()` xong, nếu `bp.isLocationDefault` → `AppNotifier.showInfo(context, l10n.locationFallbackNotice)`. Không banner — dùng SnackBar mobile-native pattern.
- `lib/features/booking/presentation/widget/step_clinic_selector.dart` — clinic card hiển thị khoảng cách dưới address: `Icon(Icons.location_on_outlined) + formatDistance(clinic.distance)` màu `AppColors.primary`. Chỉ hiện khi `formatDistance` không rỗng.

**BE đã confirm (đọc, không sửa):**
- `GET /api/clinic/user` — query bắt buộc `page, limit, lat, lon`; optional `sortBy: 'distance'|'rating'` (default `'distance'`), `search`. Role: ADMIN/ADMIN_CLINIC/VETERINARIAN/CUSTOMER. Trả raw array, mỗi item kèm `distance` (km, ES `_geo_distance` unit km).

### Tính năng 2 — Search Forum
**Phạm vi (FE only, không đụng BE):**
- `lib/core/network/api_helper.dart` — `postsEndpoint` thêm param optional `keyword`.
- `lib/features/community/data/community_repository.dart` — `getPosts(...)` thêm param optional `keyword`.
- `lib/features/community/presentation/provider/community_provider.dart`:
  - State `_searchKeyword` + getters `searchKeyword`, `isSearching`. Const `_searchLimit = 50` (BE Elasticsearch RRF `rank_window_size` hardcode 50, > 50 → 500).
  - Helper `_limitForSearch()` trả `_searchLimit` khi đang search, null (→ default 20) khi không.
  - `setSearchKeyword(keyword)`: trim, skip nếu không đổi, reset post list, fetch lại với `limit=50` (search) / `limit=20` (no search).
  - `fetchInitialData()` & `selectTopic()`: thread keyword + limit động xuống `getPosts`.
  - `loadMore()`: bỏ qua khi đang search (BE RRF không hỗ trợ pagination ổn định, đồng bộ Web FE).
- `lib/features/community/presentation/widgets/forum_search_bar.dart` (mới) — `ForumSearchBar` widget tái sử dụng:
  - `TextField` debounce 500ms, icon `Icons.search` bên trái, nút clear `Icons.close` bên phải (chỉ hiện khi có text).
  - Đồng bộ external `value` ↔ internal controller qua `_lastEmitted` để tránh loop khi parent reset.
  - Props: `value, onSearch(keyword), hintText, debounce`.
- `lib/features/community/presentation/community_page.dart`:
  - `_buildSearchBar()` đổi từ placeholder UI tĩnh → bind vào `ForumSearchBar` + `provider.setSearchKeyword`.
  - Thêm `_buildSearchStatusChip()` chip "Đang tìm: [keyword]" + nút "Xóa tìm kiếm" — chỉ hiện khi `provider.isSearching`.
  - Thêm `_buildSearchEmptyState()` — icon `Icons.search_off` + title + hint khi search không có kết quả.
- `lib/l10n/app_vi.arb` + `lib/l10n/app_en.arb` — thêm i18n: `forumSearchPlaceholder`, `forumSearchActive` (placeholder `keyword`), `forumSearchClear`, `forumSearchEmptyTitle`, `forumSearchEmptyHint`, `locationFallbackNotice`.

**Phương án UI/UX đã chọn:**
- **Search bar**: Phương án A (luôn visible ở đầu trang community) — `_buildSearchBar` đã có sẵn vị trí header, chỉ cần biến nó thành chức năng thật. Phương án B (icon → expand AppBar) bị loại vì community page không có AppBar và sẽ phá layout hiện có (vi phạm "match existing style").
- **Geolocation fallback**: SnackBar via `AppNotifier.showInfo` (mobile-native), không banner.
- **Distance display**: chỉ hiện khi BE trả `distance` — adaptive, không gây rỗng UI khi endpoint khác không có field này.

**BE đã confirm (đọc, không sửa):**
- `GET /api/post` — optional `keyword` filter qua Elasticsearch RRF (BM25 trên `content` + semantic search).
- BE rank_window_size hardcode 50 → FE clamp `limit=50` khi search.

**Tự kiểm tra:**
- `flutter analyze` các file đã sửa → 0 issue mới (1 info warning pre-existing tại `community_provider.dart:412` về curly braces, không liên quan).
- `flutter pub get` → resolved geolocator 13.0.1 thành công.
- `flutter gen-l10n` → 5 keys mới được generate cho cả vi & en.

**Ghi chú kiến trúc:**
- `LocationService` cache module-scope tương đương Web `useUserLocation` — cùng pattern, port 1-1.
- `formatDistance` đơn vị km — đồng bộ Web (BE trả km).
- Khi search forum → BE đi nhánh ES RRF, limit phải <= 50 và pagination cursor `lastPostTime` không deterministic → FE bỏ infinite scroll trong chế độ search.

## 🏥 Nearby Clinic Feature (2026-04-29)

### Bối cảnh nghiệp vụ
- Home đã có CTA `Tìm phòng khám gần nhất` (action tile thứ 3) nhưng trước đó chỉ hiển thị toast `Developing...`. Feature này hoàn thiện luồng: từ Home → list clinic gần nhất → detail clinic → đặt lịch.
- **Permission strict**: khác booking flow (booking dùng fallback Đà Nẵng + info notice), nearby clinic feature **không cho phép browse với fallback** vì mục đích chính là "gần nhất". Nếu không lấy được vị trí thật → toast lỗi + pop về Home.

### Phản biện kiến trúc đã chọn
- **Re-use BookingProvider hay tạo provider riêng?** → Tạo `NearbyClinicProvider` riêng. Re-use sẽ phá state booking đang dở (selectedClinic, selectedPet, ...). Trade-off: duplicate ~30 dòng fetch logic, đáng đánh đổi để decouple.
- **Force re-prompt permission**: dùng `LocationService.getUserLocation()` trước (tận dụng cache nếu user đã grant ở booking). Nếu cache là default (denied/disabled trước đó) → gọi `refresh()` để re-prompt OS dialog. Tránh annoy user khi đã có cached real location.
- **Không gọi BE khi `isLocationDefault==true`**: feature mất ý nghĩa nếu fallback Đà Nẵng → return sớm + caller pop.
- **Nút "Đặt lịch" ở detail page**: pre-select clinic vào BookingProvider trước khi push BookingPage → user thấy flow tiếp tục từ step **Pet** thay vì phải chọn lại clinic. Có gọi `bookingProvider.reset()` trước để đảm bảo clean state.

### API contract (BE đã có sẵn — không sửa BE)
- `GET /api/clinic/user?page=&limit=&lat=&lon=&sortBy=distance` — list clinic gần (đã dùng ở booking).
- `GET /api/clinic-homepage-setting/{clinicId}` — trả `{ banner: {title, subtitle}, introduction, services[], workingHours, contactPhone }`. Parser tolerant (chấp nhận thiếu field, trả về setting rỗng nếu BE chưa cấu hình).
- `GET /api/clinic-review?clinicId=&page=&limit=` — trả `{ items, meta }`. FE chỉ load top 10 review ở detail page (không paginate).

### Files mới tạo
| File | Vai trò |
|------|---------|
| `lib/features/clinic/data/models/clinic_homepage_setting.dart` | Model parse `ClinicHomepageSetting` (banner/intro/services/workingHours/contactPhone). |
| `lib/features/clinic/data/models/clinic_review_models.dart` | Model `ClinicReviewItem` + `ClinicReviewAuthor`. |
| `lib/features/clinic/data/clinic_repository.dart` | `getHomepageSetting(clinicId)` + `getClinicReviews({clinicId, page, limit})`. |
| `lib/features/clinic/presentation/provider/nearby_clinic_provider.dart` | State list (pagination dedup theo id) + detail (homepage setting + reviews fetch song song qua `Future.wait`). Strict permission: không fallback. |
| `lib/features/clinic/presentation/widgets/nearby_clinic_card.dart` | Card list — copy layout từ `step_clinic_selector` nhưng bỏ trạng thái selected, thêm chevron right. |
| `lib/features/clinic/presentation/nearby_clinic_page.dart` | Trang list. Guard permission strict: hiện dialog `Mở Cài đặt` cho service-disabled / permanently-denied; với denied/unknown → toast lỗi + pop. Sau khi user trở lại từ Settings, retry; nếu vẫn fail thì lại pop. |
| `lib/features/clinic/presentation/clinic_detail_page.dart` | SliverAppBar gradient + body sections (intro, contact, services chips, reviews top 10) + bottom action bar nút "Đặt lịch ngay". Tap nút → reset BookingProvider + selectClinic + push BookingPage. |

### Files đã sửa
| File | Thay đổi |
|------|----------|
| `lib/core/constants/app_constants.dart` | Thêm `END_POINT_CLINIC_HOMEPAGE_SETTING`. |
| `lib/core/network/api_helper.dart` | Thêm `clinicHomepageSettingByIdEndpoint(clinicId)`. |
| `lib/main.dart` | Đăng ký `NearbyClinicProvider` vào `MultiProvider`. |
| `lib/features/home/presentation/home_page.dart` | Action tile `findClinic` chuyển từ toast `Developing...` sang push `NearbyClinicPage`. |
| `lib/l10n/app_vi.arb`, `lib/l10n/app_en.arb` | 13 keys mới: `nearbyClinicTitle`, `nearbyClinicEmpty`, `nearbyClinicLocationRequiredDenied/ServiceDisabled/PermanentlyDenied`, `clinicDetailIntroduction/IntroEmpty/Contact/WorkingHours/Phone/Email/ContactEmpty/Services/ServicesEmpty/Reviews/BookNow`. |

### UX guard permission (chi tiết)
- `serviceDisabled` → dialog "Bật dịch vụ vị trí" → user mở Settings → retry. Nếu user bấm `Để sau` → toast lỗi + pop.
- `permissionPermanentlyDenied` → dialog "Cấp quyền vị trí" → mở App Settings → retry. Nếu `Để sau` → toast lỗi + pop.
- `permissionDenied` (denied lần này, có thể hỏi lại) / `unknown` (timeout) → toast lỗi + pop trực tiếp.
- Mọi nhánh đều set `_hasHandledLocationOutcome` để không trigger 2 lần khi `notifyListeners` rebuild.

### UX detail page (đã chọn vs đã loại)
- **Đã chọn**: SliverAppBar (220px) hiển thị banner gradient/avatar + overlay tối + title/subtitle từ `ClinicHomepageSetting.banner`. Body: summary card (tên, address, distance, rating) + 4 section card (Giới thiệu, Liên hệ, Dịch vụ, Đánh giá). Bottom action bar fixed có nút `Đặt lịch ngay`.
- **Đã loại**: layout flat scroll (không có banner) — kém visual hierarchy; placement nút đặt lịch ở giữa body — dễ miss, user cần CTA luôn visible.
- Section card pattern dùng cùng border + shadow với existing widget để đồng bộ visual language.
- Service chips dùng `Wrap` với primary background + border alpha — match accent color của booking flow.
- Review item: avatar + tên + ngày + sao + content. Empty state hiển thị `clinicNoReviews` (i18n đã có sẵn, reuse).

### Tự kiểm tra
- `flutter gen-l10n` → 13 keys mới generate sạch cho cả vi & en (l10n.yaml chạy tự động khi build).
- `flutter analyze lib/features/clinic lib/features/home/presentation/home_page.dart lib/main.dart` → **No issues found**.
- Tuân thủ memory rule **không cross-boundary edit BE/FE**: toàn bộ thay đổi nằm ở FE mobile, không đụng BE.
- Tuân thủ semantic colors: chỉ dùng `AppColors.*`, không hardcode màu mới.
