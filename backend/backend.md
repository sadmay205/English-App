# 📡 EnglishAI — Backend API

> RESTful API server cho ứng dụng **EnglishAI** — nền tảng học tiếng Anh thông minh tích hợp AI Chatbot.  
> Xây dựng trên **Node.js / Express** theo mô hình **MVC**, kết nối **MongoDB** qua Mongoose và tích hợp **OpenRouter API**.

---

## 📋 Mục lục

- [Kiến trúc Tổng quan](#-kiến-trúc-tổng-quan)
- [Công nghệ Sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc Thư mục](#-cấu-trúc-thư-mục)
- [Cài đặt & Chạy](#-cài-đặt--chạy)
- [Biến Môi trường](#-biến-môi-trường)
- [API Endpoints](#-api-endpoints)
- [Database Schemas](#-database-schemas)
- [Middleware](#-middleware)
- [Utilities](#-utilities)
- [Scripts](#-scripts)
- [Testing](#-testing)

---

## 🏗 Kiến trúc Tổng quan

```
Client (React SPA)  ──HTTP/JSON──▶  Express Server  ──Mongoose──▶  MongoDB
                                          │
                                          ├── JWT Auth Middleware
                                          ├── Rate Limiting (brute-force protection)
                                          └── OpenRouter API (AI Chatbot)
```

Server tuân thủ mô hình **MVC** nghiêm ngặt:

| Lớp            | Vai trò                                           |
| --------------- | ------------------------------------------------- |
| **Routes**      | Định tuyến request đến đúng controller             |
| **Controllers** | Xử lý business logic, trả response                |
| **Models**      | Định nghĩa schema MongoDB qua Mongoose            |
| **Middleware**   | Xác thực JWT, xử lý lỗi tập trung                |
| **Utils**       | Tiện ích hỗ trợ: parse PDF, tách câu đoạn văn    |
| **Config**      | Kết nối DB, cấu hình OpenRouter client             |

---

## 🛠 Công nghệ Sử dụng

| Thư viện               | Phiên bản | Mục đích                                    |
| ----------------------- | --------- | ------------------------------------------- |
| **express**             | ^5.2.1    | Web framework chính                          |
| **mongoose**            | ^9.6.2    | ORM cho MongoDB                              |
| **jsonwebtoken**        | ^9.0.3    | Tạo & xác thực JWT Token                    |
| **bcryptjs**            | ^3.0.3    | Hash mật khẩu người dùng                    |
| **axios**               | ^1.16.1   | HTTP client gọi OpenRouter API               |
| **multer**              | ^2.1.1    | Upload file PDF (multipart/form-data)        |
| **pdf-parse**           | ^1.1.1    | Đọc và trích xuất text từ file PDF           |
| **cors**                | ^2.8.6    | Cross-Origin Resource Sharing                |
| **express-rate-limit**  | ^8.5.2    | Chống brute-force tấn công                   |
| **dotenv**              | ^17.4.2   | Quản lý biến môi trường                     |
| **nodemon** *(dev)*     | ^3.1.14   | Hot-reload khi phát triển                    |

---

## 📂 Cấu trúc Thư mục

```
backend/
├── config/
│   ├── db.js                    # Kết nối MongoDB (Mongoose)
│   └── openrouter.js            # Cấu hình Axios client cho OpenRouter API
│
├── controllers/
│   ├── authController.js        # Đăng ký, đăng nhập, tạo JWT
│   ├── vocabController.js       # CRUD bộ từ vựng, upload PDF, merge/split sets, AI definitions
│   ├── quizController.js        # Sinh quiz (trắc nghiệm, điền từ, matching), chấm điểm, custom quiz
│   ├── listeningController.js   # Xử lý đoạn văn → tách câu, CRUD listening tasks
│   └── aiController.js          # Proxy hội thoại đến OpenRouter (AI English Tutor)
│
├── middleware/
│   ├── authMiddleware.js        # Xác thực JWT Token (protect routes)
│   └── errorMiddleware.js       # Global Error Handler (404 + 500)
│
├── models/
│   ├── User.js                  # Schema người dùng
│   ├── VocabSet.js              # Schema bộ từ vựng (topic/folder)
│   ├── Vocabulary.js            # Schema từ vựng chi tiết
│   ├── ListeningTask.js         # Schema bài tập nghe (đoạn văn + mảng câu)
│   └── Progress.js              # Schema lịch sử điểm số học tập
│
├── routes/
│   ├── authRoutes.js            # /api/auth/*
│   ├── vocabRoutes.js           # /api/vocabulary/*
│   ├── quizRoutes.js            # /api/quiz/*
│   ├── listeningRoutes.js       # /api/listening/*
│   └── aiRoutes.js              # /api/ai/*
│
├── utils/
│   ├── pdfParser.js             # Đọc PDF → trích xuất [Từ | Phiên âm | Nghĩa]
│   └── textSplitter.js          # Tách đoạn văn thành mảng câu (regex-based)
│
├── scripts/
│   └── migrate-passwords.js     # Script migration: hash lại password dữ liệu cũ
│
├── tests/
│   └── textSplitter.test.js     # Unit test cho textSplitter utility
│
├── .env                         # Biến môi trường (không commit)
├── server.js                    # Entry point — khởi tạo Express app
└── package.json
```

---

## 🚀 Cài đặt & Chạy

### Yêu cầu hệ thống

- **Node.js** >= 18.x
- **MongoDB** đang chạy (local hoặc Atlas)
- **npm** >= 9.x

### Các bước cài đặt

```bash
# 1. Di chuyển vào thư mục backend
cd backend

# 2. Cài đặt dependencies
npm install

# 3. Tạo file .env (xem mục Biến Môi trường bên dưới)
cp .env.example .env   # hoặc tạo thủ công

# 4. Chạy development server (hot-reload)
npm run dev

# 5. Hoặc chạy production
npm start
```

### Scripts có sẵn

| Lệnh           | Mô tả                                    |
| --------------- | ----------------------------------------- |
| `npm run dev`   | Khởi chạy server với nodemon (hot-reload) |
| `npm start`     | Khởi chạy server production               |
| `npm test`      | Chạy test suite (Node.js built-in runner)  |

---

## 🔐 Biến Môi trường

Tạo file `.env` trong thư mục `backend/` với các biến sau:

```env
# Server
PORT=5000

# MongoDB
MONGO_URI=mongodb://localhost:27017/english-app

# JWT Secret (chuỗi bí mật bất kỳ, đủ dài)
JWT_SECRET=your_super_secret_key_here

# OpenRouter API
OPENROUTER_API_KEY=sk-or-v1-xxxxxxxxxxxxxxxx
```

> ⚠️ **Lưu ý:** File `.env` chứa thông tin nhạy cảm, **KHÔNG** được commit lên Git.

---

## 📡 API Endpoints

Tất cả endpoints đều có prefix `/api`. Server chạy mặc định tại `http://localhost:5000`.

### Health Check

| Method | Endpoint       | Mô tả                    | Auth |
| ------ | -------------- | ------------------------- | ---- |
| GET    | `/api/health`  | Kiểm tra server hoạt động | ❌   |

---

### 🔑 Authentication — `/api/auth`

> Rate limit: Tối đa **20 requests / 15 phút** (chống brute-force).

| Method | Endpoint              | Mô tả                                    | Auth |
| ------ | --------------------- | ----------------------------------------- | ---- |
| POST   | `/api/auth/register`  | Đăng ký tài khoản mới                     | ❌   |
| POST   | `/api/auth/login`     | Đăng nhập, nhận JWT Token + thông tin user | ❌   |

**Register — Request Body:**

```json
{
  "username": "student01",
  "email": "student01@example.com",
  "password": "secureP@ss123"
}
```

**Login — Response:**

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "665a...",
    "username": "student01",
    "email": "student01@example.com"
  }
}
```

---

### 📚 Vocabulary — `/api/vocabulary`

> 🔒 Tất cả routes yêu cầu **JWT Token** trong header `Authorization: Bearer <token>`.

| Method | Endpoint                                        | Mô tả                                          |
| ------ | ------------------------------------------------ | ----------------------------------------------- |
| GET    | `/api/vocabulary/sets`                           | Lấy tất cả bộ từ vựng của user                  |
| POST   | `/api/vocabulary/sets`                           | Tạo bộ từ vựng mới                              |
| GET    | `/api/vocabulary/sets/:id`                       | Lấy chi tiết 1 bộ từ kèm danh sách từ vựng      |
| PUT    | `/api/vocabulary/sets/:id`                       | Cập nhật thông tin bộ từ vựng                    |
| DELETE | `/api/vocabulary/sets/:id`                       | Xóa bộ từ vựng                                  |
| POST   | `/api/vocabulary/item`                           | Thêm 1 từ vựng vào bộ                           |
| PUT    | `/api/vocabulary/item/:id`                       | Cập nhật 1 từ vựng                               |
| DELETE | `/api/vocabulary/item/:id`                       | Xóa 1 từ vựng                                   |
| POST   | `/api/vocabulary/upload-pdf`                     | Upload PDF → tự động parse và lưu từ vựng        |
| POST   | `/api/vocabulary/sets/:setId/generate-definitions`| Dùng AI sinh định nghĩa tiếng Anh cho từ vựng   |
| POST   | `/api/vocabulary/merge`                          | Gộp 2 bộ từ vựng thành 1                        |
| POST   | `/api/vocabulary/split`                          | Tách từ đã chọn ra bộ mới                       |

**Upload PDF — multipart/form-data:**

```
POST /api/vocabulary/upload-pdf
Content-Type: multipart/form-data

Field: pdf (file)        — File PDF chứa từ vựng
Field: vocabSetId (text) — ID bộ từ vựng đích
```

> PDF nên có format: `Từ vựng /phiên_âm/ (loại từ): Nghĩa tiếng Việt`  
> Ví dụ: `Abundant /əˈbʌndənt/ (adj): Nhiều, phong phú, dồi dào`

---

### 📝 Quiz — `/api/quiz`

> 🔒 Yêu cầu JWT Token.

| Method | Endpoint                           | Mô tả                                          |
| ------ | ---------------------------------- | ----------------------------------------------- |
| GET    | `/api/quiz/generate/:setId`        | Sinh quiz từ bộ từ vựng (query `?type=...`)     |
| POST   | `/api/quiz/generate-custom`        | Sinh quiz tùy chỉnh (chọn nhiều sets, số câu)   |
| POST   | `/api/quiz/submit`                 | Gửi kết quả → chấm điểm & lưu Progress          |
| GET    | `/api/quiz/progress`               | Lấy lịch sử điểm số học tập                     |

**Các loại quiz** (query parameter `type`):

| Giá trị                | Mô tả                                                |
| ----------------------- | ----------------------------------------------------- |
| `multiple-choice-vie`   | Trắc nghiệm: hiển thị từ English → chọn nghĩa Việt  |
| `multiple-choice-en`    | Trắc nghiệm: hiển thị nghĩa Việt → chọn từ English  |
| `fill-blank`            | Điền từ tiếng Anh vào chỗ trống                      |
| `matching`              | Ghép nối từ English — nghĩa Việt                     |

---

### 🎧 Listening — `/api/listening`

> 🔒 Yêu cầu JWT Token.

| Method | Endpoint                              | Mô tả                                         |
| ------ | ------------------------------------- | ---------------------------------------------- |
| POST   | `/api/listening/process-paragraph`    | Gửi đoạn văn → tách thành mảng câu & lưu DB    |
| GET    | `/api/listening/tasks`                | Lấy tất cả listening tasks của user             |
| GET    | `/api/listening/tasks/:id`            | Lấy chi tiết 1 listening task                   |
| DELETE | `/api/listening/tasks/:id`            | Xóa 1 listening task                            |

**Process Paragraph — Request Body:**

```json
{
  "title": "The Solar System",
  "paragraphText": "The solar system consists of the Sun. It has eight planets. Each planet has unique features."
}
```

**Response:**

```json
{
  "_id": "665b...",
  "title": "The Solar System",
  "paragraphText": "The solar system consists of the Sun. It has eight planets. Each planet has unique features.",
  "sentences": [
    { "text": "The solar system consists of the Sun.", "audioUrl": "" },
    { "text": "It has eight planets.", "audioUrl": "" },
    { "text": "Each planet has unique features.", "audioUrl": "" }
  ]
}
```

---

### 🤖 AI Chatbot — `/api/ai`

> 🔒 Yêu cầu JWT Token.

| Method | Endpoint        | Mô tả                                           |
| ------ | --------------- | ------------------------------------------------ |
| POST   | `/api/ai/chat`  | Gửi lịch sử hội thoại → nhận phản hồi từ AI    |

**Request Body:**

```json
{
  "messages": [
    { "role": "user", "content": "How do I use 'have been' correctly?" }
  ]
}
```

AI được cấu hình với **System Prompt** đóng vai giáo viên tiếng Anh chuyên nghiệp, hỗ trợ học sinh Việt Nam. Mô hình xử lý qua **OpenRouter API**.

---

## 🗄 Database Schemas

### User (`users`)

| Trường      | Kiểu     | Bắt buộc | Ghi chú              |
| ----------- | -------- | --------- | -------------------- |
| `username`  | String   | ✅        | Unique, trim         |
| `email`     | String   | ✅        | Unique, lowercase    |
| `password`  | String   | ✅        | Đã hash bằng bcrypt  |
| `createdAt` | Date     | —         | Mặc định: `Date.now` |

### VocabSet (`vocabsets`)

| Trường          | Kiểu     | Bắt buộc | Ghi chú                       |
| --------------- | -------- | --------- | ------------------------------ |
| `user`          | ObjectId | ✅        | Ref → `User`, indexed         |
| `title`         | String   | ✅        | Tên bộ từ vựng                 |
| `description`   | String   | —         | Mô tả bộ từ                   |
| `lastStudiedAt` | Date     | —         | Lần học gần nhất               |
| `createdAt`     | Date     | —         | Mặc định: `Date.now`          |

### Vocabulary (`vocabularies`)

| Trường              | Kiểu     | Bắt buộc | Ghi chú                        |
| ------------------- | -------- | --------- | ------------------------------- |
| `vocabSet`          | ObjectId | ✅        | Ref → `VocabSet`               |
| `word`              | String   | ✅        | Từ vựng tiếng Anh              |
| `phonetic`          | String   | —         | Phiên âm IPA                   |
| `meaningVi`         | String   | ✅        | Nghĩa tiếng Việt              |
| `exampleSentence`   | String   | —         | Câu ví dụ tiếng Anh            |
| `exampleMeaningVi`  | String   | —         | Nghĩa tiếng Việt câu ví dụ    |
| `englishDefinition` | String   | —         | Định nghĩa tiếng Anh (AI sinh) |

### ListeningTask (`listeningtasks`)

| Trường          | Kiểu       | Bắt buộc | Ghi chú                       |
| --------------- | ---------- | --------- | ------------------------------ |
| `user`          | ObjectId   | ✅        | Ref → `User`, indexed         |
| `title`         | String     | ✅        | Tiêu đề bài tập               |
| `paragraphText` | String     | ✅        | Đoạn văn bản gốc              |
| `sentences`     | `[Object]` | —         | Mảng `{ text, audioUrl }`      |
| `createdAt`     | Date       | —         | Mặc định: `Date.now`          |

### Progress (`progresses`)

| Trường            | Kiểu     | Bắt buộc | Ghi chú                                                             |
| ----------------- | -------- | --------- | -------------------------------------------------------------------- |
| `user`            | ObjectId | —         | Ref → `User`, indexed                                               |
| `vocabSetId`      | ObjectId | —         | Ref → `VocabSet`                                                    |
| `listeningTaskId` | ObjectId | —         | Ref → `ListeningTask`                                               |
| `quizType`        | String   | ✅        | Enum: `multiple-choice-vie`, `fill-blank`, `matching`, `custom`,... |
| `score`           | Number   | ✅        | Số câu đúng                                                         |
| `totalQuestions`  | Number   | ✅        | Tổng số câu hỏi                                                     |
| `completedAt`     | Date     | —         | Mặc định: `Date.now`                                                |

---

## 🛡 Middleware

### `authMiddleware.js` — JWT Protection

- Trích xuất token từ header `Authorization: Bearer <token>`.
- Xác thực token bằng `jsonwebtoken` với `JWT_SECRET`.
- Gắn `req.user` chứa thông tin người dùng đã giải mã.
- Trả `401 Unauthorized` nếu token thiếu hoặc hết hạn.

### `errorMiddleware.js` — Global Error Handler

- **`notFound`**: Bắt tất cả route không tồn tại → trả `404`.
- **`errorHandler`**: Xử lý tập trung mọi lỗi → trả JSON `{ message, stack }` (stack chỉ hiển thị trong development).

### Rate Limiter (trong `server.js`)

- Áp dụng cho `/api/auth/*` routes.
- Giới hạn: **20 requests / 15 phút** mỗi IP.
- Trả message tiếng Việt khi vượt quá giới hạn.

---

## 🔧 Utilities

### `pdfParser.js` — Trích xuất Từ vựng từ PDF

Sử dụng thư viện `pdf-parse` để đọc file PDF từ buffer (memory upload qua Multer).
Quét từng dòng text và trích xuất cấu trúc:

```
Từ vựng /phiên_âm/ (loại từ): Nghĩa tiếng Việt
```

→ Output: mảng `[{ word, phonetic, meaningVi }]`

### `textSplitter.js` — Tách Đoạn văn thành Câu

Sử dụng Regular Expression chuyên sâu để phân tách đoạn văn dài thành mảng câu riêng lẻ. Xử lý các edge case:
- Dấu chấm câu: `.`, `!`, `?`
- Chữ viết tắt: `Mr.`, `Dr.`, `e.g.`, `i.e.`
- Loại bỏ khoảng trắng thừa

---

## 📜 Scripts

### `migrate-passwords.js`

Script migration dùng một lần để hash lại mật khẩu dữ liệu cũ (plaintext → bcrypt).

```bash
node scripts/migrate-passwords.js
```

---

## 🧪 Testing

```bash
# Chạy tất cả test
npm test
```

Test suite hiện tại:
- `tests/textSplitter.test.js` — Unit test cho hàm tách câu

---

## 📌 Ghi chú Phát triển

- **CORS**: Chấp nhận origin từ `http://localhost:5173` (Vite dev) và `http://localhost:3000`.
- **Body size limit**: JSON payload tối đa `10MB` (hỗ trợ upload dữ liệu lớn).
- **PDF upload limit**: File tối đa `10MB`, chỉ chấp nhận MIME type `application/pdf`.
- **Module system**: Sử dụng `CommonJS` (`require/module.exports`).

---

## 📄 License

ISC
