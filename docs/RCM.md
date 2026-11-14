@@ -0,0 +1,418 @@
# API Recommendations - Đề xuất API cần bổ sung

## 📊 Tổng quan API hiện có

### ✅ Đã có đầy đủ

#### 1. Authentication (`/api/auth`)
- ✅ `POST /auth/register` - Đăng ký
- ✅ `POST /auth/login` - Đăng nhập
- ✅ `POST /auth/refresh` - Refresh token
- ✅ `POST /auth/logout` - Đăng xuất
- ✅ `POST /auth/me` - Lấy profile hiện tại
- ✅ `POST /auth/forgot-password` - Quên mật khẩu
- ✅ `POST /auth/verify-reset-code` - Xác minh code reset
- ✅ `POST /auth/reset-password` - Reset mật khẩu
- ✅ `POST /auth/resend-code` - Gửi lại code

#### 2. Users (`/api/users`)
- ✅ `GET /users` - Lấy tất cả users (Admin)
- ✅ `GET /users/:id` - Lấy user theo ID
- ✅ `PUT /users/:id` - Cập nhật user
- ✅ `DELETE /users/:id` - Xóa user
- ✅ `PATCH /users/me/level` - Cập nhật level của user hiện tại
- ✅ `POST /users/me/avatar` - Upload avatar

#### 3. Topics (`/api/topics`)
- ✅ `GET /topics` - Lấy tất cả topics (có filter level_code)
- ✅ `GET /topics/:slug` - Lấy topic theo slug
- ✅ `POST /topics` - Tạo topic mới
- ✅ `POST /topics/seed` - Seed data

#### 4. Vocabulary Items (`/api/vocabulary-items`)
- ✅ `GET /vocabulary-items` - Lấy tất cả vocabulary items
- ✅ `GET /vocabulary-items/:slug` - Lấy vocabulary item theo slug
- ✅ `GET /vocabulary-items/topic/:topicSlug` - Lấy vocabulary items theo topic
- ✅ `POST /vocabulary-items/generate` - Generate vocabulary bằng AI

#### 5. Grammar Patterns (`/api/grammar-patterns`)
- ✅ `GET /grammar-patterns` - Lấy tất cả grammar patterns
- ✅ `GET /grammar-patterns/:slug` - Lấy grammar pattern theo slug
- ✅ `GET /grammar-patterns/sub-topic/:grammarSubTopicSlug` - Lấy grammar patterns theo sub-topic
- ✅ `POST /grammar-patterns/generate` - Generate grammar bằng AI

#### 6. Grammar Sub-Topics (`/api/grammar-sub-topics`)
- ✅ `GET /grammar-sub-topics` - Lấy tất cả grammar sub-topics
- ✅ `GET /grammar-sub-topics/:slug` - Lấy grammar sub-topic theo slug
- ✅ `GET /grammar-sub-topics/topic/:topicSlug` - Lấy grammar sub-topics theo topic
- ✅ `GET /grammar-sub-topics/level/:levelCode` - Lấy grammar sub-topics theo level

#### 7. Flashcards (`/api/flashcards`)
- ✅ `GET /flashcards` - Lấy tất cả flashcards
- ✅ `GET /flashcards/:idOrSlug` - Lấy flashcard theo ID/slug
- ✅ `GET /flashcards/folder/:folderIdOrSlug` - Lấy flashcards theo folder
- ✅ `POST /flashcards` - Tạo flashcard mới
- ✅ `PUT /flashcards/:idOrSlug` - Cập nhật flashcard
- ✅ `DELETE /flashcards/:idOrSlug` - Xóa flashcard

#### 8. Flashcard Folders (`/api/flashcard-folders`)
- ✅ `GET /flashcard-folders` - Lấy tất cả folders
- ✅ `GET /flashcard-folders/:idOrSlug` - Lấy folder theo ID/slug
- ✅ `POST /flashcard-folders` - Tạo folder mới
- ✅ `PUT /flashcard-folders/:idOrSlug` - Cập nhật folder
- ✅ `DELETE /flashcard-folders/:idOrSlug` - Xóa folder

#### 9. Entity Sync (`/api/entity-sync`)
- ✅ `POST /entity-sync/check` - Kiểm tra sync status
- ✅ `GET /entity-sync/:entityKind/:entityKey` - Lấy entity với ETag

#### 10. AI (`/api/ai`)
- ✅ `GET /ai/health` - Health check AI service

---

## 🚨 API cần bổ sung - Ưu tiên cao

### 1. **Levels API** (`/api/levels`) - ⚠️ THIẾU HOÀN TOÀN
**Lý do:** Có entity Level nhưng không có controller/service/API

#### Đề xuất:
```
GET    /api/levels                    - Lấy tất cả levels
GET    /api/levels/:code              - Lấy level theo code (N5, N4, N3, N2, N1)
GET    /api/levels/:code/topics       - Lấy tất cả topics của level
GET    /api/levels/:code/stats        - Thống kê level (số topics, vocabulary, grammar patterns)
POST   /api/levels                    - Tạo level mới (Admin only)
PUT    /api/levels/:code              - Cập nhật level (Admin only)
DELETE /api/levels/:code              - Xóa level (Admin only)
```

**Priority:** 🔴 **CRITICAL** - Level là entity cốt lõi, cần có API để quản lý

---

### 2. **User Progress Tracking** (`/api/user-progress`) - ⚠️ THIẾU HOÀN TOÀN
**Lý do:** Ứng dụng học cần track tiến độ học tập của user

#### Đề xuất:
```
GET    /api/user-progress/me                    - Lấy tiến độ học tập của user hiện tại
GET    /api/user-progress/me/level/:levelCode   - Lấy tiến độ theo level
GET    /api/user-progress/me/topic/:topicSlug   - Lấy tiến độ theo topic
POST   /api/user-progress/me/topic/:topicSlug   - Đánh dấu topic đã học
POST   /api/user-progress/me/vocabulary/:slug   - Đánh dấu vocabulary đã học
POST   /api/user-progress/me/grammar/:slug      - Đánh dấu grammar pattern đã học
GET    /api/user-progress/me/stats              - Thống kê tiến độ (tổng quan)
GET    /api/user-progress/me/streak             - Chuỗi ngày học liên tiếp
```

**Cần tạo bảng:** `user_progress`, `user_learning_sessions`

**Priority:** 🔴 **HIGH** - Core feature cho app học tập

---

### 3. **User Statistics & Analytics** (`/api/users/me/stats`) - ⚠️ THIẾU
**Lý do:** User cần xem thống kê học tập

#### Đề xuất:
```
GET    /api/users/me/stats                      - Thống kê tổng quan
GET    /api/users/me/stats/level/:levelCode     - Thống kê theo level
GET    /api/users/me/stats/vocabulary           - Thống kê vocabulary đã học
GET    /api/users/me/stats/grammar              - Thống kê grammar đã học
GET    /api/users/me/stats/time-spent           - Thời gian học tập
GET    /api/users/me/stats/achievements         - Thành tích đạt được
```

**Priority:** 🟡 **MEDIUM** - Tăng engagement

---

### 4. **Study Sessions** (`/api/study-sessions`) - ⚠️ THIẾU HOÀN TOÀN
**Lý do:** Track các buổi học của user

#### Đề xuất:
```
GET    /api/study-sessions/me                   - Lấy lịch sử study sessions
POST   /api/study-sessions/me/start             - Bắt đầu study session
POST   /api/study-sessions/me/:id/end           - Kết thúc study session
GET    /api/study-sessions/me/today             - Study sessions hôm nay
GET    /api/study-sessions/me/week              - Study sessions tuần này
GET    /api/study-sessions/me/month             - Study sessions tháng này
```

**Cần tạo bảng:** `study_sessions`

**Priority:** 🟡 **MEDIUM** - Useful for analytics

---

### 5. **Bookmarks/Favorites** (`/api/bookmarks`) - ⚠️ THIẾU HOÀN TOÀN
**Lý do:** User cần bookmark vocabulary/grammar để ôn lại

#### Đề xuất:
```
GET    /api/bookmarks/me                        - Lấy tất cả bookmarks
POST   /api/bookmarks/me/vocabulary/:slug       - Bookmark vocabulary
POST   /api/bookmarks/me/grammar/:slug          - Bookmark grammar pattern
DELETE /api/bookmarks/me/vocabulary/:slug       - Bỏ bookmark vocabulary
DELETE /api/bookmarks/me/grammar/:slug          - Bỏ bookmark grammar
GET    /api/bookmarks/me/vocabulary             - Lấy bookmarked vocabulary
GET    /api/bookmarks/me/grammar                - Lấy bookmarked grammar
```

**Cần tạo bảng:** `bookmarks` (polymorphic: vocabulary_item_slug, grammar_pattern_slug)

**Priority:** 🟡 **MEDIUM** - Common feature

---

### 6. **Practice/Quiz** (`/api/practice`) - ⚠️ THIẾU HOÀN TOÀN
**Lý do:** User cần practice vocabulary/grammar

#### Đề xuất:
```
POST   /api/practice/vocabulary/start           - Bắt đầu practice vocabulary
POST   /api/practice/grammar/start              - Bắt đầu practice grammar
POST   /api/practice/vocabulary/submit          - Submit answer vocabulary
POST   /api/practice/grammar/submit             - Submit answer grammar
GET    /api/practice/vocabulary/history         - Lịch sử practice vocabulary
GET    /api/practice/grammar/history            - Lịch sử practice grammar
GET    /api/practice/me/stats                   - Thống kê practice
```

**Cần tạo bảng:** `practice_sessions`, `practice_answers`

**Priority:** 🟡 **MEDIUM** - Core learning feature

---

### 7. **Search** (`/api/search`) - ⚠️ THIẾU HOÀN TOÀN
**Lý do:** User cần search vocabulary/grammar

#### Đề xuất:
```
GET    /api/search?q=:query&type=:type          - Search tổng quát
GET    /api/search/vocabulary?q=:query          - Search vocabulary
GET    /api/search/grammar?q=:query             - Search grammar patterns
GET    /api/search/topics?q=:query              - Search topics
```

**Priority:** 🟢 **LOW** - Nice to have

---

### 8. **User Notes/Annotations** (`/api/notes`) - ⚠️ THIẾU HOÀN TOÀN
**Lý do:** User cần ghi chú cho vocabulary/grammar

#### Đề xuất:
```
GET    /api/notes/me                            - Lấy tất cả notes
GET    /api/notes/me/vocabulary/:slug           - Lấy note của vocabulary
GET    /api/notes/me/grammar/:slug              - Lấy note của grammar
POST   /api/notes/me/vocabulary/:slug           - Tạo/update note cho vocabulary
POST   /api/notes/me/grammar/:slug              - Tạo/update note cho grammar
DELETE /api/notes/me/vocabulary/:slug           - Xóa note vocabulary
DELETE /api/notes/me/grammar/:slug              - Xóa note grammar
```

**Cần tạo bảng:** `user_notes` (polymorphic)

**Priority:** 🟢 **LOW** - Nice to have

---

### 9. **Recommendations** (`/api/recommendations`) - ⚠️ THIẾU HOÀN TOÀN
**Lý do:** Gợi ý nội dung học cho user

#### Đề xuất:
```
GET    /api/recommendations/me                  - Lấy recommendations cho user
GET    /api/recommendations/me/vocabulary       - Gợi ý vocabulary
GET    /api/recommendations/me/grammar          - Gợi ý grammar patterns
GET    /api/recommendations/me/topics           - Gợi ý topics
```

**Priority:** 🟢 **LOW** - Advanced feature

---

### 10. **Notifications** (`/api/notifications`) - ⚠️ THIẾU HOÀN TOÀN
**Lý do:** Thông báo nhắc học, achievements

#### Đề xuất:
```
GET    /api/notifications/me                    - Lấy notifications
POST   /api/notifications/me/read/:id           - Đánh dấu đã đọc
POST   /api/notifications/me/read-all           - Đánh dấu tất cả đã đọc
DELETE /api/notifications/me/:id                - Xóa notification
```

**Cần tạo bảng:** `notifications`

**Priority:** 🟢 **LOW** - Optional

---

### 11. **Achievements/Badges** (`/api/achievements`) - ⚠️ THIẾU HOÀN TOÀN
**Lý do:** Gamification, tăng engagement

#### Đề xuất:
```
GET    /api/achievements/me                     - Lấy achievements của user
GET    /api/achievements/available              - Lấy tất cả achievements có thể
POST   /api/achievements/me/unlock/:id          - Unlock achievement (system)
GET    /api/achievements/me/stats               - Thống kê achievements
```

**Cần tạo bảng:** `achievements`, `user_achievements`

**Priority:** 🟢 **LOW** - Gamification

---

### 12. **User Settings/Preferences** (`/api/users/me/settings`) - ⚠️ THIẾU
**Lý do:** User cần cài đặt preferences

#### Đề xuất:
```
GET    /api/users/me/settings                   - Lấy settings
PUT    /api/users/me/settings                   - Cập nhật settings
GET    /api/users/me/settings/notifications     - Settings notifications
PUT    /api/users/me/settings/notifications     - Cập nhật notification settings
GET    /api/users/me/settings/study             - Settings học tập
PUT    /api/users/me/settings/study             - Cập nhật study settings
```

**Cần tạo bảng:** `user_settings` hoặc thêm vào `users` table

**Priority:** 🟡 **MEDIUM** - User experience

---

### 13. **Users API bổ sung** - ⚠️ THIẾU
#### Đề xuất:
```
GET    /api/users/me                            - Lấy profile user hiện tại (thay vì /auth/me)
GET    /api/users/me/level                      - Lấy level hiện tại (THIẾU - đã có PATCH nhưng chưa có GET)
PUT    /api/users/me                            - Cập nhật profile user hiện tại
DELETE /api/users/me                            - Xóa tài khoản user hiện tại
GET    /api/users/me/sessions                   - Lấy tất cả sessions (đăng nhập)
DELETE /api/users/me/sessions/:sessionId        - Xóa session cụ thể
POST   /api/users/me/sessions/logout-all        - Logout tất cả sessions
```

**Priority:** 🟡 **MEDIUM** - User management

---

### 14. **Topics API bổ sung** - ⚠️ THIẾU
#### Đề xuất:
```
PUT    /api/topics/:slug                        - Cập nhật topic
DELETE /api/topics/:slug                        - Xóa topic
GET    /api/topics/:slug/vocabulary             - Lấy vocabulary items của topic
GET    /api/topics/:slug/grammar                - Lấy grammar patterns của topic
GET    /api/topics/:slug/grammar-sub-topics     - Lấy grammar sub-topics của topic
GET    /api/topics/:slug/stats                  - Thống kê topic
```

**Priority:** 🟡 **MEDIUM** - CRUD completeness

---

### 15. **Vocabulary Items API bổ sung** - ⚠️ THIẾU
#### Đề xuất:
```
PUT    /api/vocabulary-items/:slug              - Cập nhật vocabulary item
DELETE /api/vocabulary-items/:slug              - Xóa vocabulary item
POST   /api/vocabulary-items                    - Tạo vocabulary item mới
GET    /api/vocabulary-items/level/:levelCode   - Lấy vocabulary items theo level
```

**Priority:** 🟡 **MEDIUM** - CRUD completeness

---

### 16. **Grammar Patterns API bổ sung** - ⚠️ THIẾU
#### Đề xuất:
```
PUT    /api/grammar-patterns/:slug              - Cập nhật grammar pattern
DELETE /api/grammar-patterns/:slug              - Xóa grammar pattern
POST   /api/grammar-patterns                    - Tạo grammar pattern mới
GET    /api/grammar-patterns/level/:levelCode   - Lấy grammar patterns theo level
```

**Priority:** 🟡 **MEDIUM** - CRUD completeness

---

### 17. **Grammar Sub-Topics API bổ sung** - ⚠️ THIẾU
#### Đề xuất:
```
POST   /api/grammar-sub-topics                  - Tạo grammar sub-topic mới
PUT    /api/grammar-sub-topics/:slug            - Cập nhật grammar sub-topic
DELETE /api/grammar-sub-topics/:slug            - Xóa grammar sub-topic
```

**Priority:** 🟡 **MEDIUM** - CRUD completeness

---

## 📋 Tổng kết theo độ ưu tiên

### 🔴 **CRITICAL - Cần làm ngay**
1. **Levels API** - Core entity, cần có API
2. **User Progress Tracking** - Core feature cho app học tập

### 🟡 **HIGH - Nên làm sớm**
3. **User Statistics & Analytics** - Tăng engagement
4. **Users API bổ sung** (GET /users/me/level, GET /users/me, etc.)
5. **Study Sessions** - Track học tập
6. **User Settings/Preferences** - UX

### 🟢 **MEDIUM - Làm sau**
7. **Bookmarks/Favorites** - Common feature
8. **Practice/Quiz** - Core learning feature
9. **CRUD bổ sung** (PUT/DELETE cho Topics, Vocabulary, Grammar)
10. **Search** - Nice to have

### 🔵 **LOW - Optional**
11. **User Notes/Annotations** - Nice to have
12. **Recommendations** - Advanced feature
13. **Notifications** - Optional
14. **Achievements/Badges** - Gamification

---

## 🗄️ Database Tables cần tạo

### Bắt buộc:
1. `user_progress` - Track tiến độ học tập
2. `study_sessions` - Track study sessions
3. `user_settings` - User preferences

### Tùy chọn:
4. `bookmarks` - Bookmarks/Favorites
5. `practice_sessions` - Practice sessions
6. `practice_answers` - Practice answers
7. `user_notes` - User notes
8. `notifications` - Notifications
9. `achievements` - Achievements
10. `user_achievements` - User achievements

---

## 📝 Notes

- Tất cả API đề xuất đều cần authentication (JwtAuthGuard) trừ một số public API
- Admin-only APIs cần RolesGuard với UserRole.ADMIN
- Cần validate input với DTOs
- Cần error handling và response format nhất quán
- Cần pagination cho list APIs
- Cần filtering, sorting, searching
- Cần rate limiting cho các API quan trọng
- Cần caching cho các API thường xuyên được gọi


