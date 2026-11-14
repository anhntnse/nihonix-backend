# PHÂN TÍCH KHOẢNG TRỐNG TÍNH NĂNG VÀ KHẢ NĂNG SẴN SÀNG CHO ANDROID CLIENT (FEATURE GAP ANALYSIS)

> **Mục tiêu**: Đối chiếu toàn bộ chức năng hiện có của Backend Nihonix với yêu cầu nghiệp vụ của ứng dụng di động học tiếng Nhật (Android Client), phân loại mức độ hoàn thiện, chỉ rõ các điểm nghẽn kỹ thuật (blockers) và đưa ra lộ trình xử lý.

---

## 1. KHUNG PHÂN LOẠI MỨC ĐỘ HOÀN THIỆN
- **Implemented** (Đã triển khai & hoạt động): Mã nguồn hoàn chỉnh từ Controller -> Service -> Repository, API đã test hoạt động bình thường trên môi trường thực tế.
- **Partially Implemented** (Đã triển khai một phần): Đã có Entity/Database hoặc Controller nhưng còn thiếu sót nghiệp vụ, thiếu tầng kết nối, hoặc phụ thuộc vào điều kiện chưa đáp ứng.
- **Not Implemented** (Chưa triển khai): Hoàn toàn chưa có mã nguồn, Entity hoặc API trong Backend.
- **Needs Verification** (Cần xác minh thêm): Có mã nguồn hoặc tài liệu đề cập nhưng chưa đủ dữ liệu hoặc cần môi trường bên ngoài để xác minh.

---

## 2. BẢNG MA TRẬN ĐỐI CHIẾU TÍNH NĂNG TOÀN DIỆN

| Nhóm chức năng | Tính năng chi tiết | Trạng thái | Đánh giá thực tế trong mã nguồn | Mức độ ảnh hưởng Android Client |
|---|---|---|---|---|
| **1. Xác thực & Tài khoản** | Đăng ký tài khoản (`POST /api/auth/register`) | **Implemented** | Hoạt động tốt. Băm mật khẩu bcrypt, tạo user và user_auth. | Có thể tích hợp ngay. |
| | Đăng nhập (`POST /api/auth/login`) | **Implemented** | Hoạt động tốt. Cấp Access Token (15m) và Refresh Token (7d). | Có thể tích hợp ngay. |
| | Làm mới token (`POST /api/auth/refresh`) | **Implemented** | Hoạt động. Token rotation và session storage. | Android cần xây dựng `Authenticator` trong OkHttpClient. |
| | Đăng xuất (`POST /api/auth/logout`) | **Implemented** | Xóa session trong DB theo refresh token. | Có thể tích hợp ngay. |
| | Xem profile cá nhân (`POST /api/auth/me`) | **Implemented** | Hoạt động. *(Lưu ý method là POST)*. | Có thể tích hợp ngay. |
| | Quên & Đặt lại mật khẩu (OTP qua Email) | **Implemented** | Luồng 4 bước đầy đủ, nhưng cần cấu hình SMTP thật. | Phụ thuộc SMTP server. |
| **2. Hồ sơ người dùng** | Xem & Cập nhật Level JLPT cá nhân | **Implemented** | `GET /api/users/me/level` và `PATCH /api/users/me/level`. | Có thể tích hợp ngay vào màn Onboarding/Settings. |
| | Upload Avatar cá nhân | **Implemented** | `POST /api/users/me/avatar`. Yêu cầu cấu hình Cloudinary. | Cần cấu hình Cloudinary key. |
| | Cập nhật thông tin profile (`PUT /api/users/:id`) | **Implemented** | Sửa `username`, `full_name`, `language`. | Có thể tích hợp ngay. |
| **3. Cấp độ JLPT (Levels)** | Lấy danh sách Level (`GET /api/levels`) | **Partially Implemented** | **THIẾU CONTROLLER**. DB đã có N5, N4, N3 nhưng gọi `GET /api/levels` trả về HTTP 404. | **BLOCKER**: Android không lấy được danh sách Level độc lập qua REST API thông thường. |
| **4. Chủ đề bài học (Topics)** | Danh sách bài học theo Level (`GET /api/topics`) | **Implemented** | Hoạt động tốt. Seed sẵn 25 topic cho N5, N4, N3. Kèm ETag. | Có thể tích hợp ngay vào màn hình chính/danh sách bài học. |
| | Chi tiết bài học theo slug hoặc ID | **Implemented** | `GET /api/topics/:identifier`. | Có thể tích hợp ngay. |
| **5. Ngữ pháp (Grammar)** | Danh sách chủ đề con (`Grammar Sub-topics`) | **Implemented** | Hoạt động tốt. Đã seed 61 sub-topics chi tiết cho N5. | Có thể tích hợp ngay vào cây bài học ngữ pháp. |
| | Danh sách mẫu ngữ pháp (`Grammar Patterns`) | **Partially Implemented** | API đọc hoạt động nhưng **DATABASE RỖNG (0 items)**. Phải gọi API generate AI mới có dữ liệu. | **BLOCKER NỘI DUNG**: Không có nội dung để học sinh học trừ khi nạp dữ liệu. |
| | Tự động sinh ngữ pháp bằng AI | **Implemented** | `POST /api/grammar-patterns/generate`. Gọi Gemini sinh dữ liệu. | Cần Google API Key để kích hoạt. |
| **6. Từ vựng (Vocabulary)** | Danh sách từ vựng & Bộ từ vựng | **Partially Implemented** | API đọc hoạt động nhưng **DATABASE RỖNG (0 items)**. Phải gọi API generate AI mới có dữ liệu. | **BLOCKER NỘI DUNG**: Màn hình từ vựng sẽ trắng trơn nếu chưa seed/sinh từ vựng. |
| | Tự động sinh từ vựng bằng AI | **Implemented** | `POST /api/vocabulary-items/generate`. Sinh bộ từ và câu ví dụ. | Cần Google API Key để kích hoạt. |
| **7. Flashcard (Thẻ ghi nhớ)** | CRUD Thư mục Flashcard (`flashcard-folders`) | **Implemented** | Hoạt động đầy đủ CRUD. | Có thể tích hợp ngay. |
| | Thao tác Bộ thẻ Flashcard (`flashcards`) | **Implemented** | Bulk create, bulk update, AI generation, lấy thẻ theo set. | Có thể tích hợp ngay. |
| | Flashcard cá nhân của người dùng | **Not Implemented** | Toàn bộ flashcard là **global**, không có `user_id`. Mọi user nhìn thấy và sửa chung. | Rủi ro trải nghiệm: User A sửa làm mất thẻ của User B. |
| | Thuật toán lặp lại ngắt quãng (SRS / Spaced Repetition) | **Not Implemented** | Chưa có logic hẹn giờ ôn tập (Leitner/SM-2, next_review_date). | Chưa thể làm tính năng "Ôn tập hôm nay". |
| **8. Luyện tập & Đố vui (Practice)** | Sinh bài tập Điền từ (`fill-blank`) | **Implemented** | AI tự sinh 10 bài tập dựa trên từ vựng và ngữ pháp của topic. | Yêu cầu Topic phải có sẵn cả từ vựng và ngữ pháp trong DB. |
| | Sinh bài tập Trắc nghiệm (`multiple-choice`) | **Implemented** | AI tự sinh 10 câu trắc nghiệm 4 đáp án. | Tương tự trên. |
| | Lịch sử luyện tập & Chấm điểm (`submit`) | **Implemented** | Lưu kết quả, chấm điểm, lưu chi tiết câu đúng/sai. | Có thể tích hợp màn Luyện tập & Kết quả thi. |
| **9. Chuỗi ngày học & Lịch học** | Xem Streak hiện tại | **Implemented** | Tính toán chuỗi ngày học liên tục, tự động reset nếu ngắt quãng. | Tích hợp vào Header trang chủ Android. |
| | Ghi nhận hoạt động học | **Implemented** | `POST /api/learning-streaks/activity`. | Gọi sau khi hoàn thành 1 bài học hoặc bài thi. |
| | Xem lịch học trong tháng (Calendar Heatmap) | **Implemented** | Trả về danh sách ngày học và số hoạt động trong tháng. | Tích hợp vẽ biểu đồ đóng băng/chấm xanh lịch học. |
| **10. Tiến độ học tập (Progress)** | Đánh dấu bài đã học / từ đã nhớ / ngữ pháp đã hiểu | **Not Implemented** | **KHÔNG CÓ BẢNG & API**. Backend chưa có bảng `user_progress`. | **BLOCKER**: Android Client không thể lưu trạng thái "Đã hoàn thành bài 1", "Đã thuộc từ này". |
| **11. Đánh dấu & Yêu thích (Bookmarks)** | Lưu từ vựng / ngữ pháp yêu thích | **Not Implemented** | Chưa có bảng `bookmarks` hay API tương ứng. | Chưa thể làm màn hình "Từ vựng đã lưu". |
| **12. Tìm kiếm (Search)** | Tìm kiếm từ vựng, ngữ pháp, kanji | **Not Implemented** | Chưa có API Search tập trung. | Phải filter thủ công ở client hoặc bổ sung API search. |
| **13. Đồng bộ ngoại tuyến (Offline Sync)** | Kiểm tra thay đổi dữ liệu qua ETag | **Partially Implemented** | Hoạt động cho `level` và `topic`. Chưa có cho `vocabulary_items` hay `grammar_patterns`. | Android có thể sync offline Topics, nhưng từ vựng phải gọi API online. |
| **14. Thông báo & Thành tích** | Push notification, Huy hiệu (Badges) | **Not Implemented** | Chưa có bảng `achievements`, `notifications`. | Để dành cho giai đoạn sau. |

---

## 3. CÁC ĐIỂM NGHẼN KỸ THUẬT QUAN TRỌNG CẦN XỬ LÝ (CRITICAL BLOCKERS)

### Điểm nghẽn 1: Thiếu API Quản lý Level độc lập (`GET /api/levels`)
- **Vấn đề**: `levels` có entity và dữ liệu seed trong DB, nhưng không có Controller/Module. Khi Android gọi `GET /api/levels` sẽ nhận lỗi 404.
- **Giải pháp**:
  - *Phương án A (Tạm thời phía Android)*: Android Client có thể lấy danh sách Level qua `POST /api/entity-sync/check` với `entityKind: "level"` hoặc đọc thông qua quan hệ `topic.level`.
  - *Phương án B (Khuyến nghị phía Backend)*: Tạo `LevelsModule`, `LevelsController` với endpoint `GET /api/levels` và `GET /api/levels/:code`.

### Điểm nghẽn 2: Thiếu dữ liệu Từ vựng và Ngữ pháp mẫu trong Cơ sở dữ liệu (Empty Content)
- **Vấn đề**: `npm run seed` hiện chỉ nạp Level, Topic và 61 Grammar Sub-topic. Số lượng `vocabulary_items` và `grammar_patterns` trong DB là **0**. Khi Android mở màn hình bài học từ vựng hoặc bài tập luyện tập, API sẽ trả về rỗng hoặc báo lỗi `BadRequestException: No vocabulary items found for this topic`.
- **Giải pháp**:
  - Cần cấu hình `GOOGLE_API_KEY` trong `.env.develop` và chạy sinh dữ liệu qua các API `/generate` cho các topic của N5, hoặc viết script seed nạp sẵn một bộ từ vựng và ngữ pháp N5 cố định.

### Điểm nghẽn 3: Chưa có cơ chế Lưu Tiến độ Học tập của Người dùng (User Progress)
- **Vấn đề**: Đây là chức năng cốt lõi của bất kỳ ứng dụng học tập nào. Hiện tại Backend hoàn toàn không có bảng lưu xem user đã hoàn thành topic nào, đã học từ vựng nào hay đã nắm vững cấu trúc ngữ pháp nào.
- **Giải pháp**:
  - *Ngắn hạn*: Android Client có thể tạm lưu tiến độ cục bộ trong Room Database / DataStore trên máy người dùng.
  - *Dài hạn*: Cần bổ sung bảng `user_progress` (`user_id`, `item_type`, `item_id`, `status: 'learning'|'mastered'`) trên Backend.

### Điểm nghẽn 4: Lệch cấu hình nhà cung cấp AI (Gemini vs OpenRouter)
- **Vấn đề**: Trong [src/config/configuration.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/config/configuration.ts), provider mặc định là `gemini`, URL mặc định là `generativelanguage.googleapis.com`. Trong khi file [env.md](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/env.md) lại lưu `OPENROUTER_API_KEY`. Nếu nạp OpenRouter key vào mà không đổi URL và provider thì gọi AI sinh từ vựng/bài tập sẽ bị lỗi 400.
- **Giải pháp**: Thống nhất dùng Google Gemini API key trực tiếp (`GOOGLE_API_KEY`) với model `gemini-2.0-flash`.

### Điểm nghẽn 5: Flashcard chưa gắn với người dùng (No User Isolation)
- **Vấn đề**: Bảng `flashcard_folders` và `flashcards` không có `user_id`. Mọi bộ thẻ tạo ra là public cho tất cả người dùng trong hệ thống.
- **Giải pháp**: Nếu giai đoạn 1 chấp nhận các bộ Flashcard là thư viện bài học chung của hệ thống thì không sao. Nếu muốn user tự tạo bộ thẻ cá nhân, bắt buộc phải thêm cột `user_id` vào các bảng flashcard.

---

## 4. KHUYẾN NGHỊ LỘ TRÌNH TRIỂN KHAI CHO DỰ ÁN ANDROID

### Giai đoạn 1: Kết nối và Hoàn thiện luồng Core (Có thể làm ngay với Backend hiện tại)
1. **Module Xác thực**: Xây dựng UI Đăng nhập, Đăng ký, Đổi mật khẩu, Onboarding chọn trình độ JLPT (`PATCH /api/users/me/level`).
2. **Khung Mạng & Kiến trúc Android**: Xây dựng Retrofit Client với Interceptor xử lý `ApiResponse<T>`, tự động đính kèm `Bearer token` và tự động gọi `/api/auth/refresh` khi token hết hạn.
3. **Màn hình Học tập (Curriculum & Lessons)**: Gọi `GET /api/topics?levelCode=...` để hiển thị lộ trình học.
4. **Màn hình Thư viện Flashcard chung**: Gọi `GET /api/flashcard-folders` và `GET /api/flashcards/sets/:setId/cards` để hiển thị thẻ học lật mặt trước/sau.
5. **Màn hình Chuỗi ngày học (Streak & Heatmap)**: Gọi `GET /api/learning-streaks` và `GET /api/learning-streaks/calendar` để render Widget chuỗi ngày học trên trang chủ.

### Giai đoạn 2: Bổ sung dữ liệu và Hoàn thiện tính năng mở rộng
1. Nạp sẵn bộ từ vựng và ngữ pháp N5 vào Backend để màn hình Học từ vựng và Luyện tập hoạt động trơn tru.
2. Bổ sung endpoint `GET /api/levels` trên Backend.
3. Bổ sung bảng và API `user_progress` để lưu tiến độ học tập trên máy chủ.

