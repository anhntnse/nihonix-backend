# Seed Data Guide

## Tài liệu chuẩn JLPT N3-N5

Seed data được tạo dựa trên tài liệu chuẩn JLPT (Japanese Language Proficiency Test) cho các cấp độ N3, N4, và N5.

### Topics (Lessons) - Chủ đề học

#### N5 (25 topics - Sơ cấp):
1. Greetings - Lời chào hỏi
2. Numbers - Số đếm
3. Time - Thời gian
4. Family - Gia đình
5. Food - Đồ ăn
6. Daily Activities - Hoạt động hàng ngày
7. Colors - Màu sắc
8. Body Parts - Bộ phận cơ thể
9. Weather - Thời tiết
10. School - Trường học
11. Transportation - Phương tiện giao thông
12. Clothing - Quần áo
13. Hobbies - Sở thích
14. Shopping - Mua sắm
15. Directions - Phương hướng
16. Health - Sức khỏe
17. Work - Công việc
18. Travel - Du lịch
19. Animals - Động vật
20. Nature - Thiên nhiên
21. Emotions - Cảm xúc
22. Places - Địa điểm
23. Household - Đồ gia dụng
24. Seasons - Mùa
25. Festivals - Lễ hội

#### N4 (15 topics - Sơ trung cấp):
1. Relationships - Mối quan hệ
2. Entertainment - Giải trí
3. Technology - Công nghệ
4. Sports - Thể thao
5. Media - Truyền thông
6. Education - Giáo dục
7. Business - Kinh doanh
8. Communication - Giao tiếp
9. Housing - Nhà ở
10. Cooking - Nấu ăn
11. Shopping Advanced - Mua sắm nâng cao
12. Banking - Ngân hàng
13. Healthcare - Chăm sóc sức khỏe
14. Environment - Môi trường
15. Social Issues - Vấn đề xã hội

#### N3 (10 topics - Trung cấp):
1. Abstract Concepts - Khái niệm trừu tượng
2. Politics - Chính trị
3. Economy - Kinh tế
4. Culture - Văn hóa
5. Science - Khoa học
6. Literature - Văn học
7. History - Lịch sử
8. Philosophy - Triết học
9. Advanced Business - Kinh doanh nâng cao
10. Academic - Học thuật

### Grammar Sub-Topics - Dạng ngữ pháp

#### N5 (8 grammar sub-topics):
1. Basic Patterns - Cấu trúc cơ bản
2. Particles - Trợ từ
3. Verbs - Động từ
4. Adjectives - Tính từ
5. Questions - Câu hỏi
6. Negation - Phủ định
7. Past Tense - Quá khứ
8. Desire - Mong muốn

#### N4 (8 grammar sub-topics):
1. Causative - Thể sai khiến
2. Passive - Thể bị động
3. Potential - Thể khả năng
4. Conditional - Điều kiện
5. Honorifics - Kính ngữ
6. Comparison - So sánh
7. Giving and Receiving - Cho và nhận
8. Progressive - Tiếp diễn

#### N3 (8 grammar sub-topics):
1. Causative-Passive - Thể sai khiến bị động
2. Complex Sentences - Câu phức
3. Formal Expressions - Biểu thức trang trọng
4. Indirect Speech - Lời nói gián tiếp
5. Conjunctions - Liên từ
6. Adverbial Clauses - Mệnh đề trạng ngữ
7. Modality - Tình thái
8. Nominalization - Danh từ hóa

## API Endpoints

### Topics (Lessons) API

#### GET `/topics`
Lấy danh sách tất cả topics
- Query params:
  - `levelCode` (optional): Filter theo level (N5, N4, N3)

**Example:**
```
GET /topics?levelCode=N5
```

#### GET `/topics/:slug`
Lấy chi tiết topic theo slug

**Example:**
```
GET /topics/family
```

#### GET `/topics/level/:levelCode`
Lấy danh sách topics theo level

**Example:**
```
GET /topics/level/N5
```

#### POST `/topics/seed`
Seed data cho topics và grammar sub-topics

**Example:**
```
POST /topics/seed
```

### Grammar Sub-Topics API

#### GET `/grammar-sub-topics`
Lấy danh sách tất cả grammar sub-topics
- Query params:
  - `levelCode` (optional): Filter theo level (N5, N4, N3)
  - `topicSlug` (optional): Filter theo topic slug

**Example:**
```
GET /grammar-sub-topics?levelCode=N5&topicSlug=family
```

#### GET `/grammar-sub-topics/:slug`
Lấy chi tiết grammar sub-topic theo slug

**Example:**
```
GET /grammar-sub-topics/basic-patterns-greetings
```

#### GET `/grammar-sub-topics/topic/:topicSlug`
Lấy danh sách grammar sub-topics theo topic

**Example:**
```
GET /grammar-sub-topics/topic/family
```

#### GET `/grammar-sub-topics/level/:levelCode`
Lấy danh sách grammar sub-topics theo level

**Example:**
```
GET /grammar-sub-topics/level/N5
```

## Seed Data Structure

File seed data nằm tại: `src/modules/topics/services/seed-data.ts`

- `topicsSeedData`: Chứa danh sách topics cho N5, N4, N3
- `grammarSubTopicsSeedData`: Chứa danh sách grammar sub-topics cho N5, N4, N3

## Usage

1. **Seed data:**
```bash
POST /topics/seed
```

2. **Get topics by level:**
```bash
GET /topics/level/N5
```

3. **Get grammar sub-topics by topic:**
```bash
GET /grammar-sub-topics/topic/family
```

