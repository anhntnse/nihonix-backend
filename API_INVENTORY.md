# DANH MỤC TOÀN BỘ API BACKEND NIHONIX (API INVENTORY)

> **Tổng số Controller**: 14  
> **Tổng số Endpoint**: 39 API  
> **Global Prefix**: `/api` (trừ route mặc định `/` của ứng dụng)  
> **Base URL Development**: `http://localhost:3010/api`  
> **Swagger UI**: `http://localhost:3010/api-docs`

---

## 1. AUTHENTICATION CONTROLLER (`/api/auth`)
*Tập tin*: [src/modules/auth/auth.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/auth/auth.controller.ts)

| # | Phương thức & Đường dẫn | Quyền truy cập | Request Payload | Response Data | Mô tả nghiệp vụ & Ghi chú |
|---|---|---|---|---|---|
| 1 | `POST /api/auth/register` | Public | Body: `RegisterDto`<br>- `username`: string, 3-50 ký tự<br>- `email`: email hợp lệ<br>- `password`: string, tối thiểu 6 ký tự<br>- `full_name`: string, optional | `{ user: UserProfile }` | Kiểm tra trùng `username`/`email`, hash mật khẩu bằng bcrypt, tạo bản ghi `users` và `user_auth`, trả về thông tin user mới. |
| 2 | `POST /api/auth/login` | Public | Body: `LoginDto`<br>- `username`: string, bắt buộc<br>- `password`: string, bắt buộc | `{ user: UserProfile, tokens: { accessToken, refreshToken } }` | Xác thực `username` và `password_hash`, sinh Access Token (15m) & Refresh Token (7d), băm Refresh Token lưu vào bảng `sessions`. |
| 3 | `POST /api/auth/refresh` | Public | Body: `RefreshTokenDto`<br>- `refreshToken`: string JWT hợp lệ | `{ accessToken, refreshToken }` | Xác minh chữ ký refresh token, đối chiếu hash trong bảng `sessions`, kiểm tra `token_version` trong bảng `user_auth`, xoay vòng cấp cặp token mới. |
| 4 | `POST /api/auth/logout` | `JwtAuthGuard` | Body: `LogoutDto`<br>- `refreshToken`: string | `{ message: "Logged out successfully" }` | Tìm session khớp với refresh token của user hiện tại và xóa khỏi bảng `sessions`. |
| 5 | `POST /api/auth/me` | `JwtAuthGuard` | None | `{ id, username, email, full_name, role }` | Lấy profile rút gọn của user hiện tại từ token payload. *(Lưu ý: Dùng POST thay vì GET)*. |
| 6 | `POST /api/auth/forgot-password` | Public | Body: `ForgotPasswordDto`<br>- `email`: email hợp lệ | `{ message: string }` | Kiểm tra email, chặn gọi liên tục trong 2 phút, sinh OTP 6 số, băm lưu vào `verification_tokens` (hạn 15m), gửi mail qua SMTP. |
| 7 | `POST /api/auth/verify-reset-code` | Public | Body: `VerifyResetCodeDto`<br>- `email`: email hợp lệ<br>- `code`: string 6 số | `{ valid: true, token: string, message: string }` | Tìm token theo email của user (O(1)), xác minh mã OTP. Nếu đúng, cấp `tempToken` JWT (hạn 10m) để đổi mật khẩu. |
| 8 | `POST /api/auth/reset-password` | Public | Body: `ResetPasswordDto`<br>- `token`: tempToken JWT từ bước verify<br>- `password`: string, tối thiểu 6 ký tự | `{ message: string }` | Xác minh `tempToken`, cập nhật hash mật khẩu mới, tăng `token_version` để hủy toàn bộ session cũ, đánh dấu token đã dùng. |
| 9 | `POST /api/auth/resend-code` | Public | Body: `ResendCodeDto`<br>- `email`: email hợp lệ | `{ message: string }` | Hủy các token reset cũ của user, sinh mã OTP 6 số mới và gửi lại qua email. |

---

## 2. USERS CONTROLLER (`/api/users`)
*Tập tin*: [src/modules/users/users.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/users/users.controller.ts)

| # | Phương thức & Đường dẫn | Quyền truy cập | Request Payload | Response Data | Mô tả nghiệp vụ & Ghi chú |
|---|---|---|---|---|---|
| 10 | `GET /api/users` | `JwtAuthGuard` + `RolesGuard(ADMIN)` | None | `User[]` | Lấy danh sách toàn bộ người dùng trong hệ thống (chỉ dành cho Admin). |
| 11 | `GET /api/users/:id` | `JwtAuthGuard` | Param: `id` (UUID) | `User` | Lấy thông tin chi tiết của 1 user theo UUID. *(Lưu ý: Chưa chặn IDOR)*. |
| 12 | `PUT /api/users/:id` | `JwtAuthGuard` | Param: `id` (UUID)<br>Body: `UpdateUserDto` (`username`, `email`, `full_name`, `language`, `status`) | `User` | Cập nhật thông tin tài khoản. Chỉ Admin hoặc chính chủ mới được sửa. |
| 13 | `DELETE /api/users/:id` | `JwtAuthGuard` | Param: `id` (UUID) | Empty (204 No Content) | Xóa tài khoản người dùng. Chỉ Admin hoặc chính chủ mới được xóa. |
| 14 | `GET /api/users/me/level` | `JwtAuthGuard` | None | `{ user_id, level_code, level }` | Lấy thông tin trình độ tiếng Nhật (JLPT) hiện tại của user đang đăng nhập. |
| 15 | `PATCH /api/users/me/level` | `JwtAuthGuard` | Body: `UpdateUserLevelDto`<br>- `level_code`: `N5` \| `N4` \| `N3` \| `N2` \| `N1` | `{ message, user }` | Cập nhật trình độ JLPT mong muốn của user hiện tại. |
| 16 | `POST /api/users/me/avatar` | `JwtAuthGuard` | Multipart/form-data: `avatar` (File ảnh tối đa 10MB) | `{ message, avatar_url, public_id }` | Upload ảnh đại diện lên Cloudinary (folder `nihonix/avatars`) và lưu link vào bảng `users`. |

---

## 3. LEVELS CONTROLLER (`/api/levels`)
*Tập tin*: [src/modules/levels/levels.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/levels/levels.controller.ts)

| # | Phương thức & Đường dẫn | Quyền truy cập | Request Payload | Response Data | Mô tả nghiệp vụ & Ghi chú |
|---|---|---|---|---|---|
| 17 | `GET /api/levels` | Public | None | `Level[]` | Lấy danh sách các cấp độ tiếng Nhật (JLPT N5-N1). |
| 18 | `GET /api/levels/:code` | Public | Param: `code` (N5..N1) | `Level` | Lấy chi tiết thông tin một cấp độ tiếng Nhật theo code. |

---

## 4. TOPICS CONTROLLER (`/api/topics`)
*Tập tin*: [src/modules/topics/topics.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/topics/topics.controller.ts)

| # | Phương thức & Đường dẫn | Quyền truy cập | Request Payload | Response Data | Mô tả nghiệp vụ & Ghi chú |
|---|---|---|---|---|---|
| 17 | `GET /api/topics` | Public | Query: `levelCode` (optional: N5, N4, N3, N2, N1) | `Array<Topic & { etag }>` | Lấy danh sách chủ đề bài học, sắp xếp theo `order ASC`. Mỗi topic trả về kèm chuỗi ETag để hỗ trợ cache. |
| 18 | `GET /api/topics/:identifier` | Public | Param: `identifier` (UUID hoặc slug) | `Topic` | Lấy thông tin chi tiết một chủ đề kèm quan hệ `level`. |
| 19 | `POST /api/topics` | Public *(Thiếu Guard)* | Body: `CreateTopicDto` (`slug`, `level_code`, `title`, `icon_type`, `icon_code`, `order`) | `Topic & { etag }` | Tạo chủ đề bài học mới, tự động ghi nhận ETag vào bảng `entity_sync`. |
| 20 | `POST /api/topics/seed` | Public *(Thiếu Guard)* | None | `{ message: "Seed completed successfully" }` | Kích hoạt script seed toàn bộ Levels, Topics, Grammar Sub-topics vào DB. |

---

## 4. GRAMMAR SUB-TOPICS CONTROLLER (`/api/grammar-sub-topics`)
*Tập tin*: [src/modules/grammar-sub-topics/grammar-sub-topics.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/grammar-sub-topics/grammar-sub-topics.controller.ts)

| # | Phương thức & Đường dẫn | Quyền truy cập | Request Payload | Response Data | Mô tả nghiệp vụ & Ghi chú |
|---|---|---|---|---|---|
| 21 | `GET /api/grammar-sub-topics` | Public | Query: `topic_id` (UUID, optional) | `GrammarSubTopic[]` | Lấy danh sách chủ đề con ngữ pháp, có thể lọc theo `topic_id`. |
| 22 | `GET /api/grammar-sub-topics/:slug` | Public | Param: `slug` | `GrammarSubTopic` | Lấy chi tiết chủ đề con ngữ pháp theo slug. |
| 23 | `GET /api/grammar-sub-topics/topic/:topicSlug` | Public | Param: `topicSlug` | `GrammarSubTopic[]` | Lấy danh sách chủ đề con ngữ pháp theo slug của chủ đề cha. |
| 24 | `GET /api/grammar-sub-topics/level/:levelCode` | Public | Param: `levelCode` (N5, N4, N3) | `GrammarSubTopic[]` | Lấy danh sách chủ đề con ngữ pháp theo trình độ JLPT. |

---

## 5. GRAMMAR PATTERNS CONTROLLER (`/api/grammar-patterns`)
*Tập tin*: [src/modules/grammar-patterns/grammar-patterns.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/grammar-patterns/grammar-patterns.controller.ts)

| # | Phương thức & Đường dẫn | Quyền truy cập | Request Payload | Response Data | Mô tả nghiệp vụ & Ghi chú |
|---|---|---|---|---|---|
| 25 | `GET /api/grammar-patterns` | Public | Query: `grammar_sub_topic_slug` (optional) | `GrammarPattern[]` | Lấy danh sách các mẫu ngữ pháp. *(Mặc định trống nếu chưa sinh bằng AI)*. |
| 26 | `GET /api/grammar-patterns/:slug` | Public | Param: `slug` | `GrammarPattern` | Lấy thông tin chi tiết một mẫu ngữ pháp theo slug. |
| 27 | `GET /api/grammar-patterns/sub-topic/:grammarSubTopicSlug` | Public | Param: `grammarSubTopicSlug` | `GrammarPattern[]` | Lấy danh sách mẫu ngữ pháp theo chủ đề con. |
| 28 | `POST /api/grammar-patterns/generate` | Public *(Thiếu Guard)* | Body: `GenerateGrammarDto`<br>- `grammar_sub_topic_slug`: string<br>- `count`: number (mặc định 3) | `GrammarPattern[]` | Gọi Google Gemini AI tự động sinh cấu trúc ngữ pháp, giải thích, và câu ví dụ, sau đó lưu vào DB. |

---

## 6. VOCABULARY ITEMS CONTROLLER (`/api/vocabulary-items`)
*Tập tin*: [src/modules/vocabulary-items/vocabulary-items.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/vocabulary-items/vocabulary-items.controller.ts)

| # | Phương thức & Đường dẫn | Quyền truy cập | Request Payload | Response Data | Mô tả nghiệp vụ & Ghi chú |
|---|---|---|---|---|---|
| 29 | `GET /api/vocabulary-items` | Public | Query: `topic_id` (UUID, optional) | `VocabularyItem[]` | Lấy danh sách từ vựng. Hỗ trợ lọc theo `topic_id`. |
| 30 | `GET /api/vocabulary-items/sets/all` | Public | None | `Array<{ topic, items_count, items }>` | Lấy toàn bộ từ vựng gom nhóm theo từng topic. |
| 31 | `GET /api/vocabulary-items/:slug` | Public | Param: `slug` | `VocabularyItem` | Lấy chi tiết từ vựng theo slug (Romaji, Kanji, Kana, nghĩa vi/en/jp, ví dụ). |
| 32 | `POST /api/vocabulary-items/generate` | Public *(Thiếu Guard)* | Body: `GenerateVocabularyDto`<br>- `topic_id`: UUID<br>- `count`: number (mặc định 10) | `VocabularyItem[]` | Gọi AI sinh một bộ từ vựng theo topic, tự động tạo `VocabularySet` và các `VocabularyItem`. |

---

## 7. VOCABULARY SETS CONTROLLER (`/api/vocabulary-sets`)
*Tập tin*: [src/modules/vocabulary-sets/vocabulary-sets.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/vocabulary-sets/vocabulary-sets.controller.ts)

| # | Phương thức & Đường dẫn | Quyền truy cập | Request Payload | Response Data | Mô tả nghiệp vụ & Ghi chú |
|---|---|---|---|---|---|
| 33 | `GET /api/vocabulary-sets` | Public | None | `VocabularySet[]` | Lấy danh sách tất cả các bộ từ vựng. |
| 34 | `GET /api/vocabulary-sets/by-topic/:topicId` | Public | Param: `topicId` (UUID) | `Array<{ id, slug, title, description, items_count, created_at }>` | Lấy danh sách bộ từ vựng thuộc topic kèm số lượng từ vựng bên trong. |
| 35 | `GET /api/vocabulary-sets/:id` | Public | Param: `id` (UUID) | `VocabularySet & { vocabulary_items }` | Lấy chi tiết 1 bộ từ vựng kèm toàn bộ từ vựng bên trong. |
| 36 | `POST /api/vocabulary-sets` | Public *(Thiếu Guard)* | Body: `CreateVocabularySetDto` (`topic_id`, `title`, `description`, `order`) | `VocabularySet` | Tạo thủ công một bộ từ vựng mới. |

---

## 8. FLASHCARD FOLDERS CONTROLLER (`/api/flashcard-folders`)
*Tập tin*: [src/modules/flashcard-folders/flashcard-folders.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/flashcard-folders/flashcard-folders.controller.ts)

| # | Phương thức & Đường dẫn | Quyền truy cập | Request Payload | Response Data | Mô tả nghiệp vụ & Ghi chú |
|---|---|---|---|---|---|
| 37 | `GET /api/flashcard-folders` | `JwtAuthGuard` | None | `FlashcardFolder[]` | Lấy danh sách các thư mục flashcard. *(Toàn cục, không phân biệt user)*. |
| 38 | `GET /api/flashcard-folders/:idOrSlug` | `JwtAuthGuard` | Param: `idOrSlug` (UUID hoặc slug) | `FlashcardFolder` | Lấy thông tin chi tiết thư mục flashcard. |
| 39 | `POST /api/flashcard-folders` | `JwtAuthGuard` | Body: `CreateFlashcardFolderDto` (`name`, `description`, `order`) | `FlashcardFolder` | Tạo thư mục flashcard mới (tự sinh slug từ tên). |
| 40 | `PUT /api/flashcard-folders/:idOrSlug` | `JwtAuthGuard` | Param: `idOrSlug`<br>Body: `UpdateFlashcardFolderDto` | `FlashcardFolder` | Cập nhật thư mục flashcard. |
| 41 | `DELETE /api/flashcard-folders/:idOrSlug` | `JwtAuthGuard` | Param: `idOrSlug` | `{ message: string }` | Xóa thư mục flashcard (Cascade xóa toàn bộ set và card bên trong). |

---

## 9. FLASHCARDS CONTROLLER (`/api/flashcards`)
*Tập tin*: [src/modules/flashcards/flashcards.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/flashcards/flashcards.controller.ts)

| # | Phương thức & Đường dẫn | Quyền truy cập | Request Payload | Response Data | Mô tả nghiệp vụ & Ghi chú |
|---|---|---|---|---|---|
| 42 | `POST /api/flashcards` | `JwtAuthGuard` | Body: `BulkCreateFlashcardsDto` (`folder_id`, `set_name`, `cards: [{ front, back, order }]`) | `BulkCreateResponseDto` | Tạo đồng thời 1 FlashcardSet và toàn bộ danh sách thẻ con bên trong. |
| 43 | `POST /api/flashcards/generate` | `JwtAuthGuard` | Body: `GenerateFlashcardsDto` (`folder_id`, `set_name`, `topic`, `count`, `level_code`) | `BulkCreateResponseDto` | Dùng AI sinh bộ thẻ flashcard tự động kèm ví dụ và nghĩa, sau đó lưu vào DB. |
| 44 | `PUT /api/flashcards/bulk` | `JwtAuthGuard` | Body: `BulkUpdateFlashcardsDto` (`set_id`, `set_name`, `cards`) | `BulkUpdateResponseDto` | Cập nhật hàng loạt thẻ trong set (vừa update thẻ cũ, tạo thẻ mới, xóa thẻ bị lược bỏ). |
| 45 | `GET /api/flashcards/sets` | `JwtAuthGuard` | Query: `folderId` (UUID bắt buộc) | `Array<{ id, name, folder_id, order, card_count }>` | Lấy danh sách các bộ thẻ flashcard trong một thư mục kèm số lượng thẻ. |
| 46 | `GET /api/flashcards/sets/:setId/cards` | `JwtAuthGuard` | Param: `setId` (UUID) | `Flashcard[]` | Lấy toàn bộ các thẻ flashcard trong một set. |
| 47 | `DELETE /api/flashcards/sets/:setId` | `JwtAuthGuard` | Param: `setId` (UUID) | `{ message: string }` | Xóa bộ thẻ flashcard (xóa cascade toàn bộ thẻ con). |

---

## 10. PRACTICE CONTROLLER (`/api/practice`)
*Tập tin*: [src/modules/practice/practice.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/practice/practice.controller.ts)

| # | Phương thức & Đường dẫn | Quyền truy cập | Request Payload | Response Data | Mô tả nghiệp vụ & Ghi chú |
|---|---|---|---|---|---|
| 48 | `POST /api/practice/fill-blank` | `JwtAuthGuard` | Body: `GenerateFillBlankDto` (`topic_id`, `exercise_count`: mặc định 10) | `{ session_id, exercises: [...] }` | AI đọc từ vựng và ngữ pháp của topic để sinh bài tập điền từ, tạo phiên luyện tập. |
| 49 | `POST /api/practice/multiple-choice` | `JwtAuthGuard` | Body: `GenerateMultipleChoiceDto` (`topic_id`, `exercise_count`: mặc định 10) | `{ session_id, exercises: [...] }` | AI đọc từ vựng và ngữ pháp của topic để sinh bài tập trắc nghiệm 4 đáp án. |
| 50 | `GET /api/practice/sets` | `JwtAuthGuard` | Query: `topic_id`, `exercise_type`, `status` (`in_progress` \| `completed`) | `PracticeSession[]` | Lấy lịch sử các bài tập đã tạo của user hiện tại. |
| 51 | `GET /api/practice/sets/:id` | `JwtAuthGuard` | Param: `id` (Session UUID) | `PracticeSession & { exercises }` | Lấy chi tiết bài tập kèm danh sách câu hỏi. |
| 52 | `POST /api/practice/submit` | `JwtAuthGuard` | Body: `SubmitPracticeDto`<br>- `session_id`: UUID<br>- `answers`: `Array<{ exercise_id, user_answer }>` | `{ session_id, score, correct_count, total_count, results: [...] }` | Nộp bài, server chấm điểm tự động, cập nhật trạng thái session thành `completed`. |

---

## 11. LEARNING STREAKS CONTROLLER (`/api/learning-streaks`)
*Tập tin*: [src/modules/learning-streaks/learning-streaks.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/learning-streaks/learning-streaks.controller.ts)

| # | Phương thức & Đường dẫn | Quyền truy cập | Request Payload | Response Data | Mô tả nghiệp vụ & Ghi chú |
|---|---|---|---|---|---|
| 53 | `GET /api/learning-streaks` | `JwtAuthGuard` | None | `StreakResponseDto`<br>`{ current_streak, longest_streak, last_learned_date, total_learning_days }` | Lấy thông tin chuỗi ngày học liên tiếp của user hiện tại. |
| 54 | `POST /api/learning-streaks/activity` | `JwtAuthGuard` | Body: `RecordActivityDto`<br>- `activity_type`: string<br>- `activity_count`: number (mặc định 1) | `ActivityRecordedResponseDto` | Ghi nhận hoạt động học hôm nay. Nếu là ngày mới liên tiếp thì tăng streak, nếu bị ngắt thì reset về 1. |
| 55 | `GET /api/learning-streaks/calendar` | `JwtAuthGuard` | Query: `year` (number), `month` (1-12) | `CalendarResponseDto`<br>`{ year, month, total_days, learning_days: [{ date, activity_count }] }` | Lấy dữ liệu lịch học trong tháng phục vụ hiển thị Heatmap/Lịch học tập trên app Android. |

---

## 12. ENTITY SYNC CONTROLLER (`/api/entity-sync`)
*Tập tin*: [src/modules/entity-sync/entity-sync.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/entity-sync/entity-sync.controller.ts)

| # | Phương thức & Đường dẫn | Quyền truy cập | Request Payload | Response Data | Mô tả nghiệp vụ & Ghi chú |
|---|---|---|---|---|---|
| 56 | `POST /api/entity-sync/check` | Public | Body: `CheckSyncDto`<br>- `entityKind`: `topic` \| `level`<br>- `levelCode`: optional<br>- `etags`: `Array<{ entity_key, etag }>` | `SyncResponseDto`<br>`{ changed: [...], deleted: [...], unchanged: [...] }` | Kiểm tra đồng bộ dữ liệu ngoại tuyến (Offline Sync). Server so sánh ETag để báo danh sách cần tải mới. |
| 57 | `GET /api/entity-sync/:entityKind/:entityKey` | Public | Param: `entityKind`, `entityKey`<br>Header: `If-None-Match` (optional) | Entity Data (kèm Header `ETag`) hoặc `HTTP 304 Not Modified` | Lấy chi tiết entity đơn lẻ. Nếu ETag phía client trùng với server thì trả về 304 không kèm nội dung. |

---

## 13. AI CONTROLLER (`/api/ai`)
*Tập tin*: [src/modules/ai/ai.controller.ts](file:///c:/Users/Ngoc%20Anh/Desktop/CETA/nihonix-server-dev/src/modules/ai/ai.controller.ts)

| # | Phương thức & Đường dẫn | Quyền truy cập | Request Payload | Response Data | Mô tả nghiệp vụ & Ghi chú |
|---|---|---|---|---|---|
| 58 | `GET /api/ai/health` | Public | None | `{ status: "ok" \| "error", configured: boolean }` | Kiểm tra trạng thái cấu hình của dịch vụ AI. |

