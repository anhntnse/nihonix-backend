# BÁO CÁO TOÀN DIỆN KIẾN TRÚC VÀ MÃ NGUỒN BACKEND NIHONIX (BACKEND AUDIT)

> **Dự án**: Nihonix Server (Backend API cho Ứng dụng học tiếng Nhật Nihonix)  
> **Phiên bản mã nguồn**: 0.0.1  
> **Thời điểm kiểm toán**: Tháng 11/2026  
> **Mục tiêu**: Đánh giá toàn diện kiến trúc, bảo mật, tính năng và khả năng sẵn sàng phục vụ ứng dụng Android Client.

---

## 1. TỔNG QUAN KIẾN TRÚC & TECH STACK

### 1.1. Công nghệ nền tảng
- **Runtime**: Node.js v24+ (kiểm tra thực tế: v24.21.0), npm v11+
- **Framework**: NestJS 11 (`@nestjs/core`: ^11.0.1, `@nestjs/common`: ^11.0.1)
- **Ngôn ngữ**: TypeScript 5.7 (`typescript`: ^5.7.3, `ts-node`: ^10.9.2)
- **Cơ sở dữ liệu**: PostgreSQL 16 (chạy container Docker `nihonix_db`, port 5432)
- **ORM**: TypeORM 0.3 (`typeorm`: ^0.3.27, `@nestjs/typeorm`: ^11.0.0, driver `pg`: ^8.16.3)
- **Xác thực & Ủy quyền**: Passport JWT (`@nestjs/jwt`: ^11.0.1, `passport-jwt`: ^4.0.1), `bcrypt`: ^6.0.0
- **Validation**: `class-validator`: ^0.14.2, `class-transformer`: ^0.5.1
- **Tài liệu API**: Swagger UI Express (`@nestjs/swagger`: ^11.2.1, `swagger-ui-express`: ^5.0.1) tại `/api-docs`
- **Dịch vụ tích hợp bên thứ ba**:
  - Gửi email: Nodemailer (`nodemailer`: ^7.0.10) qua SMTP
  - Lưu trữ media: Cloudinary (`cloudinary`: ^2.8.0, `streamifier`: ^0.1.1, `multer`: ^2.0.2)
  - Trí tuệ nhân tạo (AI): Google Gemini API (`gemini-2.0-flash`) và OpenRouter API (`google/gemini-2.5-pro`)

### 1.2. Mô hình phân lớp (Layered Architecture)
Backend tuân thủ mô hình module hóa tiêu chuẩn của NestJS:
```
src/
├── app.module.ts              # Root Module gom toàn bộ 15 feature modules
├── main.ts                    # Entry point: CORS, Pipes, Filters, Interceptors, Swagger
├── config/                    # Cấu hình môi trường qua @nestjs/config
├── common/                    # Dùng chung: decorators, enums, filters, guards, interceptors, utils
├── database/                  # Cấu hình kết nối TypeORM DatabaseModule
├── services/seed/             # SeedService khởi tạo dữ liệu mẫu
└── modules/                   # 14 modules nghiệp vụ chức năng
```

---

## 2. PHÂN TÍCH CHI TIẾT TỪNG MODULE NGHIỆP VỤ

### 2.1. Module Xác thực (`AuthModule`)
- **Tập tin chính**: [auth.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/auth/auth.controller.ts), [auth.service.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/auth/auth.service.ts), [jwt.strategy.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/auth/strategies/jwt.strategy.ts)
- **Cơ chế Token**:
  - Sử dụng Access Token (thời hạn mặc định `15m`) và Refresh Token (thời hạn mặc định `7d`).
  - Refresh Token được hash bằng bcrypt (`bcrypt.hash(refreshToken, 10)`) và lưu vào bảng `sessions` kèm `ip`, `user_agent`, `expires_at`.
  - Bảng `user_auth` quản lý `token_version` để thu hồi toàn bộ phiên đăng nhập khi đổi mật khẩu (`token_version += 1`).
- **Quy trình Quên & Đặt lại mật khẩu (Password Reset Flow)**:
  1. `POST /api/auth/forgot-password`: Tạo mã OTP 6 chữ số ngẫu nhiên, hash bằng bcrypt, lưu vào bảng `verification_tokens` (hạn 15 phút), gửi mail qua Nodemailer. Có rate limit mức ứng dụng 2 phút giữa 2 lần xin mã.
  2. `POST /api/auth/verify-reset-code`: Xác minh mã OTP 6 chữ số. Nếu đúng, cấp một `tempToken` JWT (hạn 10 phút, `type: 'password_reset'`).
  3. `POST /api/auth/reset-password`: Nhận `tempToken` và `password` mới, hash mật khẩu, tăng `token_version`, xóa toàn bộ `sessions` cũ.
  4. `POST /api/auth/resend-code`: Gửi lại mã OTP tương tự bước 1.

### 2.2. Module Người dùng (`UsersModule`)
- **Tập tin chính**: [users.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/users/users.controller.ts), [users.service.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/users/users.service.ts)
- **Chức năng**:
  - `GET /api/users`: Lấy danh sách toàn bộ người dùng (Yêu cầu `RolesGuard` với quyền `UserRole.ADMIN`).
  - `GET /api/users/:id`: Lấy chi tiết user theo UUID.
  - `PUT /api/users/:id`: Cập nhật thông tin profile (`username`, `email`, `full_name`, `language`, `status`). Kiểm tra quyền: Admin hoặc chính chủ.
  - `DELETE /api/users/:id`: Xóa user. Kiểm tra quyền: Admin hoặc chính chủ.
  - `GET /api/users/me/level`: Lấy trình độ JLPT hiện tại của người dùng.
  - `PATCH /api/users/me/level`: Cập nhật trình độ JLPT (`level_code`: N5 -> N1).
  - `POST /api/users/me/avatar`: Upload ảnh đại diện lên Cloudinary (giới hạn 10MB, định dạng ảnh), lưu `avatar_url` vào bảng `users`.

### 2.3. Module Trình độ (`levels`) - THIẾU TẦNG CONTROLLER
- **Tập tin hiện có**: Chỉ có [level.entity.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/levels/entity/level.entity.ts).
- **Thực trạng**: **KHÔNG CÓ** `levels.controller.ts`, `levels.service.ts`, `levels.module.ts`.
- **Hệ quả**: Endpoint `GET /api/levels` hoàn toàn **không tồn tại** (trả về HTTP 404). Client Android hiện không thể lấy danh sách các Level độc lập qua REST API thông thường mà phải dựa vào `entity-sync` hoặc bảng `topics`.

### 2.4. Module Chủ đề bài học (`TopicsModule`)
- **Tập tin chính**: [topics.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/topics/topics.controller.ts), [topics.service.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/topics/services/topics.service.ts)
- **Chức năng**:
  - `GET /api/topics`: Lấy danh sách bài học, có filter theo `levelCode` (N5, N4, N3, N2, N1). Mỗi topic tự động đính kèm trường `etag` phục vụ đồng bộ dữ liệu.
  - `GET /api/topics/:identifier`: Tìm topic bằng UUID hoặc slug.
  - `POST /api/topics`: Tạo topic mới, tự động đồng bộ sang bảng `entity_sync`.
  - `POST /api/topics/seed`: Endpoint trigger seed dữ liệu topics từ code (N3-N5).

### 2.5. Module Ngữ pháp con (`GrammarSubTopicsModule`)
- **Tập tin chính**: [grammar-sub-topics.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/grammar-sub-topics/grammar-sub-topics.controller.ts)
- **Chức năng**:
  - Cung cấp các API đọc: `GET /api/grammar-sub-topics`, `GET /api/grammar-sub-topics/:slug`, `GET /api/grammar-sub-topics/topic/:topicSlug`, `GET /api/grammar-sub-topics/level/:levelCode`.
  - Chưa có API tạo, sửa, xóa (CRUD Admin).

### 2.6. Module Mẫu ngữ pháp (`GrammarPatternsModule`)
- **Tập tin chính**: [grammar-patterns.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/grammar-patterns/grammar-patterns.controller.ts), [grammar-patterns.service.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/grammar-patterns/services/grammar-patterns.service.ts)
- **Chức năng**:
  - `GET /api/grammar-patterns`: Danh sách mẫu ngữ pháp, hỗ trợ lọc theo `grammar_sub_topic_slug`.
  - `GET /api/grammar-patterns/:slug`: Chi tiết mẫu ngữ pháp theo slug.
  - `GET /api/grammar-patterns/sub-topic/:grammarSubTopicSlug`: Lấy danh sách mẫu ngữ pháp theo sub-topic.
  - `POST /api/grammar-patterns/generate`: Tạo nội dung ngữ pháp tự động bằng AI (Gemini).
  - **Lưu ý**: Dữ liệu ban đầu sau khi seed là **0 mẫu ngữ pháp**; chỉ có khi gọi API AI generate hoặc nạp thủ công.

### 2.7. Module Từ vựng & Bộ từ vựng (`VocabularyItemsModule` & `VocabularySetsModule`)
- **Tập tin chính**: [vocabulary-items.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/vocabulary-items/vocabulary-items.controller.ts), [vocabulary-sets.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/vocabulary-sets/vocabulary-sets.controller.ts)
- **Chức năng**:
  - `GET /api/vocabulary-items`: Danh sách từ vựng, lọc theo `topic_id`.
  - `GET /api/vocabulary-items/sets/all`: Nhóm từ vựng theo từng topic.
  - `GET /api/vocabulary-items/:slug`: Chi tiết từ vựng theo slug.
  - `POST /api/vocabulary-items/generate`: Sinh từ vựng kèm ví dụ bằng AI.
  - `GET /api/vocabulary-sets`: Lấy danh sách bộ từ vựng.
  - `GET /api/vocabulary-sets/by-topic/:topicId`: Lấy các bộ từ vựng thuộc topic kèm số lượng từ (`items_count`).
  - `GET /api/vocabulary-sets/:id`: Lấy chi tiết bộ từ vựng kèm danh sách `vocabulary_items`.
  - `POST /api/vocabulary-sets`: Tạo bộ từ vựng mới.
  - **Lưu ý**: Tương tự ngữ pháp, seed database **chưa có dữ liệu từ vựng** (0 items).

### 2.8. Module Flashcard & Thư mục Flashcard (`FlashcardsModule` & `FlashcardFoldersModule`)
- **Tập tin chính**: [flashcards.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/flashcards/flashcards.controller.ts), [flashcard-folders.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/flashcard-folders/flashcard-folders.controller.ts)
- **Chức năng**:
  - Quản lý Folder: `GET`, `POST`, `PUT`, `DELETE` tại `/api/flashcard-folders`.
  - Thao tác Flashcard Set: `POST /api/flashcards` (bulk create), `POST /api/flashcards/generate` (AI sinh thẻ flashcard), `PUT /api/flashcards/bulk` (bulk update/delete trong set), `GET /api/flashcards/sets?folderId=...`, `GET /api/flashcards/sets/:setId/cards`, `DELETE /api/flashcards/sets/:setId`.
- **Phát hiện quan trọng**:
  - Bảng `flashcard_folders`, `flashcard_sets`, `flashcards` **hoàn toàn không có cột `user_id`**.
  - Toàn bộ thư mục và flashcard hiện tại là **dữ liệu toàn cục (global/shared)**. Bất kỳ người dùng đã đăng nhập nào cũng có thể xem, sửa hoặc xóa flashcard của người khác. Chưa có khái niệm bộ thẻ cá nhân.
  - Chưa triển khai thuật toán lặp lại ngắt quãng (Spaced Repetition System - SRS như SM-2 hay Leitner).

### 2.9. Module Luyện tập (`PracticeModule`)
- **Tập tin chính**: [practice.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/practice/practice.controller.ts), [practice.service.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/practice/practice.service.ts)
- **Chức năng**:
  - `POST /api/practice/fill-blank`: Gọi AI sinh 10 câu hỏi điền từ dựa trên từ vựng và ngữ pháp có sẵn của topic, lưu vào `practice_sessions` và `practice_exercises`.
  - `POST /api/practice/multiple-choice`: Gọi AI sinh 10 câu hỏi trắc nghiệm tương tự.
  - `GET /api/practice/sets`: Lấy lịch sử các phiên làm bài của người dùng hiện tại (lọc theo `topic_id`, `exercise_type`, `status`).
  - `GET /api/practice/sets/:id`: Lấy chi tiết bài tập kèm câu hỏi.
  - `POST /api/practice/submit`: Nộp bài, chấm điểm tự động (`correct_count`, `score`), cập nhật trạng thái session thành `completed`.
- **Phụ thuộc**: Bắt buộc Topic phải có sẵn cả `vocabulary_items` VÀ `grammar_patterns` trong DB thì AI mới sinh được bài tập; nếu thiếu sẽ trả về lỗi `BadRequestException`.

### 2.10. Module Chuỗi ngày học (`LearningStreaksModule`)
- **Tập tin chính**: [learning-streaks.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/learning-streaks/learning-streaks.controller.ts), [learning-streaks.service.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/learning-streaks/learning-streaks.service.ts)
- **Chức năng**:
  - `GET /api/learning-streaks`: Lấy `current_streak`, `longest_streak`, `total_learning_days` của user. Tự động kiểm tra nếu bỏ lỡ quá 1 ngày thì reset streak về 0.
  - `POST /api/learning-streaks/activity`: Ghi nhận hoạt động học (tăng streak nếu là ngày mới liên tiếp, upsert vào bảng `user_learning_activities`).
  - `GET /api/learning-streaks/calendar`: Lấy danh sách các ngày đã học trong tháng kèm số lượng hoạt động phục vụ hiển thị Heatmap/Lịch học trên app Android.

### 2.11. Module Đồng bộ dữ liệu (`EntitySyncModule`)
- **Tập tin chính**: [entity-sync.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/entity-sync/entity-sync.controller.ts), [entity-sync.service.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/entity-sync/services/entity-sync.service.ts)
- **Chức năng**:
  - `POST /api/entity-sync/check`: Client gửi danh sách ETag của các entity hiện có trên máy offline. Server so sánh với bảng `entity_sync` và trả về 3 danh sách: `changed` (kèm dữ liệu mới), `deleted`, `unchanged`.
  - `GET /api/entity-sync/:entityKind/:entityKey`: Lấy entity đơn lẻ kèm HTTP Header `ETag`. Nếu client gửi header `If-None-Match` khớp với ETag hiện tại, server trả về ngay HTTP 304 Not Modified giúp tiết kiệm băng thông.
  - Hỗ trợ hiện tại: Mới chỉ có chiến lược đồng bộ cho `topic` và `level`.

### 2.12. Module Trí tuệ nhân tạo (`AiModule`)
- **Tập tin chính**: [ai.module.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/ai/ai.module.ts), [gemini.provider.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/ai/providers/gemini.provider.ts), [openrouter.provider.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/ai/providers/openrouter.provider.ts), [ai-generation.service.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/ai/services/ai-generation.service.ts), [ai-json-parser.service.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/ai/services/ai-json-parser.service.ts)
- **Cơ chế**:
  - `AiJsonParserService`: Tự động tách và sửa lỗi cú pháp JSON sinh ra từ mô hình AI (loại bỏ markdown blocks, auto-repair thiếu ngoặc).
  - `AiGenerationService`: Có cơ chế tự động thử lại (retry up to 3 times) nếu kết quả trả về không parse được hoặc thiếu trường dữ liệu.

---

## 3. ĐÁNH GIÁ BẢO MẬT & ĐỘ TIN CẬY (SECURITY & RELIABILITY AUDIT)

### 3.1. Các vấn đề Bảo mật Nghiêm trọng (Critical & High)
1. **Fallback Secret cố định khi thiếu biến môi trường**:
   - Vị trí: [jwt.strategy.ts:24](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/auth/strategies/jwt.strategy.ts#L24)
   - Code: `secretOrKey: configService.get<string>('jwt.secret') || 'default-secret'`
   - Rủi ro: Nếu file cấu hình không đọc được, server dùng secret `'default-secret'`, kẻ tấn công có thể tự sinh JWT giả mạo bất kỳ ai.
2. **Không kiểm tra `token_version` và `status` khi xác thực Request**:
   - Vị trí: [auth.service.ts:311](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/auth/auth.service.ts#L311) (`validateUser`)
   - Thực trạng: Khi một request gửi Access Token, `JwtStrategy` gọi `validateUser(payload.sub)`. Hàm này chỉ kiểm tra user có tồn tại hay không, **KHÔNG** so sánh `payload.tokenVersion` với `user_auth.token_version`, và **KHÔNG** kiểm tra `user.status === 'active'`.
   - Rủi ro: Khi user đổi mật khẩu hoặc bị vô hiệu hóa tài khoản, Access Token cũ vẫn tiếp tục gọi API thành công cho đến khi hết hạn (15 phút).
3. **Quét tuyến tính mã OTP Reset Password (Linear Bcrypt Scan)**:
   - Vị trí: [auth.service.ts:400](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/auth/auth.service.ts#L400) (`verifyResetCode`)
   - Thực trạng: DTO `VerifyResetCodeDto` chỉ nhận `code` mà không nhận `email`. Server thực hiện `find()` toàn bộ token chưa sử dụng trong hệ thống và chạy vòng lặp `bcrypt.compare(code, token.token_hash)`.
   - Rủi ro: Gây nghẽn CPU nghiêm trọng (DoS) khi có nhiều token đang chờ; ngoài ra nếu 2 user ngẫu nhiên có cùng mã 6 số thì người này có thể chiếm quyền đặt lại mật khẩu của người kia.
4. **IDOR trong API Người dùng**:
   - Vị trí: [users.controller.ts:84](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/users/users.controller.ts#L84) (`findOne`)
   - Thực trạng: `GET /api/users/:id` chỉ yêu cầu đăng nhập (`JwtAuthGuard`), bất kỳ user nào cũng có thể đọc thông tin chi tiết (email, họ tên, level, ngày tạo) của bất kỳ ai bằng UUID.
5. **Thiếu Rate Limiting**:
   - Không có `@nestjs/throttler` trong toàn bộ hệ thống.
   - Các API nhạy cảm như `/api/auth/login`, `/api/auth/register`, `/api/auth/forgot-password` và các API tốn chi phí như `/api/vocabulary-items/generate` đều không có giới hạn số lần gọi, dễ bị brute-force hoặc cạn kiệt tài nguyên.

### 3.2. Cấu hình CORS & Lỗi hiển thị
- Tại [main.ts:30](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/main.ts#L30): `app.enableCors({ origin: true })` cho phép phản hồi mọi Origin.
- Tại [global-exception.filter.ts:95](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/common/filters/global-exception.filter.ts#L95): Khi ở môi trường development, `stack trace` được trả về trực tiếp trong response lỗi JSON.

---

## 4. ĐÁNH GIÁ TƯƠNG THÍCH VỚI ANDROID CLIENT

### 4.1. Cấu trúc Response đồng nhất (Unified Envelope)
Tất cả các response trả về từ Backend (thông qua [ResponseInterceptor](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/common/interceptors/response.interceptor.ts) và [GlobalExceptionFilter](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/common/filters/global-exception.filter.ts)) đều được đóng gói theo định dạng chuẩn:
```json
{
  "success": true,
  "message": "Lấy dữ liệu thành công",
  "data": { ... },
  "errors": null,
  "statusCode": 200
}
```
Khi xảy ra lỗi:
```json
{
  "success": false,
  "message": "Validation failed",
  "data": null,
  "errors": {
    "validation": ["username should not be empty"],
    "error": "Bad Request",
    "statusCode": 400
  },
  "statusCode": 400
}
```
*Đánh giá cho Android*: Rất thuận lợi. Android Client có thể định nghĩa 1 lớp generic `ApiResponse<T>` trong Retrofit/Ktor để giải mã toàn bộ API.

### 4.2. Khả năng đồng bộ Offline
Hệ thống có sẵn bảng `entity_sync` và endpoint `POST /api/entity-sync/check`, hỗ trợ ETag HTTP 304. Điều này hỗ trợ cực tốt cho ứng dụng Android lưu trữ Room Database offline và chỉ tải về các mục có thay đổi khi có mạng.
*Hạn chế*: Hiện mới chỉ đồng bộ được `topics` và `levels`, chưa hỗ trợ `vocabulary_items` hay `grammar_patterns`.

### 4.3. Phân trang (Pagination)
**Chưa có**: Tất cả các danh sách (`/api/topics`, `/api/vocabulary-items`, `/api/grammar-patterns`, `/api/flashcards`) đều trả về mảng đầy đủ `find()`, không hỗ trợ `page` hay `limit`. Với tập dữ liệu lớn, client Android có thể gặp hiện tượng lag hoặc quá tải bộ nhớ.

