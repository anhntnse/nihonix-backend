# 🇯🇵 Nihonix Server

Backend API cho ứng dụng học tiếng Nhật.

[Sprint07 AI/quota/practice handoff](SPRINT_07.md): atomic quota ledger, validated generation, private practice/grading and explicit flashcard previews.

## 🛠️ Tech Stack

- **NestJS** - Backend framework
- **TypeORM** - Database ORM
- **PostgreSQL** - Database
- **JWT** - Authentication
- **Swagger** - API Documentation

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Setup Environment
Tạo file `.env.develop`:
```env
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USERNAME=postgres
DATABASE_PASSWORD=your_password
DATABASE_NAME=nihonix_db

JWT_SECRET=your-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
```

### 3. Run Development
```bash
npm run start:dev
```

Server chạy tại: `http://localhost:3000`

## 📚 API Documentation

Swagger UI: `http://localhost:3000/api-docs`

## 🔐 Authentication

API sử dụng JWT tokens:
1. Register/Login tại `/api/auth/register` hoặc `/api/auth/login`
2. Nhận `accessToken` và `refreshToken`
3. Thêm header: `Authorization: Bearer <accessToken>`

## 📦 Production

```bash
# Build
npm run build

# Start
npm run start:prod
```

## 🗂️ Project Structure

```
src/
├── modules/
│   ├── auth/         # Authentication
│   └── users/        # User management
├── common/           # Shared utilities
├── database/         # Database config
└── main.ts          # App entry
```

## 🔧 Available Scripts

```bash
npm run start:dev     # Development
npm run build         # Build production
npm run start:prod    # Production
npm run lint          # Lint code
npm run test          # Run tests
```

## Sprint 06 — Private flashcards

See [SPRINT_06.md](SPRINT_06.md) for owner-safe CRUD, atomic bulk writes, UUID receipt/delta synchronization and legacy-data preservation. Run `npm run test:sprint06` against local PostgreSQL; it creates/removes an isolated schema and stubs external providers. Shared deployment and AI/quota integration remain separate.

## 📝 Database

Database tự động tạo tables khi start (TypeORM synchronize).

---

Made with ❤️
