# 🎓 EnglishAI — Frontend

> Giao diện học tiếng Anh thông minh xây dựng bằng **React 19 + Vite**, thiết kế theo kiến trúc **Component-Driven** với layout 3 cột: Sidebar – Canvas trung tâm – AI Chatbot Panel.  
> Sử dụng **Tailwind CSS v4**, **Zustand** cho state management, và **Lucide React** cho icon system.

---

## 📋 Mục lục

- [Kiến trúc Tổng quan](#-kiến-trúc-tổng-quan)
- [Công nghệ Sử dụng](#-công-nghệ-sử-dụng)
- [Cấu trúc Thư mục](#-cấu-trúc-thư-mục)
- [Cài đặt & Chạy](#-cài-đặt--chạy)
- [Biến Môi trường](#-biến-môi-trường)
- [Kiến trúc Giao diện](#-kiến-trúc-giao-diện)
- [Components Chi tiết](#-components-chi-tiết)
- [State Management (Zustand)](#-state-management-zustand)
- [Services & Hooks](#-services--hooks)
- [Luồng Hoạt động](#-luồng-hoạt-động)

---

## 🏗 Kiến trúc Tổng quan

```
┌─────────────────────────────────────────────────────────┐
│                    React SPA (Vite)                      │
│                                                          │
│  ┌──────────┐  ┌──────────────────┐  ┌───────────────┐  │
│  │ Sidebar  │  │  Main Canvas     │  │ Chatbot Panel │  │
│  │          │  │  (Feature Views) │  │               │  │
│  │ NavItems │  │  ┌────────────┐  │  │  Chat History │  │
│  │          │  │  │ Vocab View │  │  │  Input Bar    │  │
│  │          │  │  │ Quiz View  │  │  │               │  │
│  │          │  │  │ Listen View│  │  │               │  │
│  │          │  │  │ Games View │  │  │               │  │
│  │          │  │  │ Progress   │  │  │               │  │
│  │          │  │  └────────────┘  │  │               │  │
│  └──────────┘  └──────────────────┘  └───────────────┘  │
│                                                          │
│  Zustand Stores ◄──── Axios ────► Backend API (REST)     │
└─────────────────────────────────────────────────────────┘
```

**Luồng dữ liệu:**

1. User tương tác trên UI → Component gọi action từ Zustand store
2. Zustand store gọi API qua Axios instance (`services/api.js`)
3. Backend trả response → Store cập nhật state → React re-render

---

## 🛠 Công nghệ Sử dụng

| Thư viện                   | Phiên bản | Mục đích                                  |
| --------------------------- | --------- | ----------------------------------------- |
| **react**                   | ^19.2.6   | UI framework chính                         |
| **react-dom**               | ^19.2.6   | DOM rendering                              |
| **vite**                    | ^8.0.12   | Build tool + Dev server (HMR)              |
| **@vitejs/plugin-react**    | ^6.0.1    | React plugin cho Vite                      |
| **tailwindcss**             | ^4.3.0    | Utility-first CSS framework               |
| **@tailwindcss/vite**       | ^4.3.0    | Tailwind CSS integration cho Vite          |
| **zustand**                 | ^5.0.13   | Lightweight state management               |
| **axios**                   | ^1.16.1   | HTTP client gọi Backend API               |
| **lucide-react**            | ^1.16.0   | Icon library (SVG-based)                   |
| **sonner**                  | ^2.0.7    | Toast notifications (dark theme)           |
| **react-markdown**          | ^10.1.0   | Render Markdown (AI chatbot responses)     |
| **clsx**                    | ^2.1.1    | Conditional className utility              |
| **tailwind-merge**          | ^3.6.0    | Merge Tailwind classes thông minh          |

---

## 📂 Cấu trúc Thư mục

```
frontend/
├── public/                          # Static assets
│
├── src/
│   ├── components/
│   │   ├── layout/                  # Layout components (khung giao diện chính)
│   │   │   ├── MainLayout.jsx       # Layout 3 cột: Sidebar + Canvas + Chatbot
│   │   │   ├── MainLayout.css       # Styles cho layout chính
│   │   │   ├── Sidebar.jsx          # Thanh điều hướng bên trái
│   │   │   ├── Sidebar.css          # Styles cho sidebar
│   │   │   ├── ChatbotPanel.jsx     # Panel AI Chatbot bên phải
│   │   │   └── ChatbotPanel.css     # Styles cho chatbot panel
│   │   │
│   │   └── features/               # Feature components (từng chức năng)
│   │       ├── auth/
│   │       │   └── AuthPage.jsx     # Trang đăng nhập / đăng ký
│   │       │
│   │       ├── vocab/               # Quản lý từ vựng
│   │       │   ├── VocabSetCreator.jsx  # Tạo & quản lý bộ từ vựng
│   │       │   ├── VocabList.jsx        # Danh sách từ vựng trong bộ
│   │       │   ├── PdfImportZone.jsx    # Kéo thả PDF → import từ vựng
│   │       │   ├── FlashcardStudy.jsx   # Học từ vựng dạng flashcard
│   │       │   └── SmartStudy.jsx       # Học thông minh (spaced repetition)
│   │       │
│   │       ├── quiz/                # Bài kiểm tra
│   │       │   ├── QuizContainer.jsx    # Container quản lý flow làm bài
│   │       │   ├── MultipleChoice.jsx   # Quiz trắc nghiệm (Anh ↔ Việt)
│   │       │   ├── FillInBlank.jsx      # Quiz điền từ vào chỗ trống
│   │       │   ├── MatchingGame.jsx     # Quiz ghép nối từ
│   │       │   └── CustomQuizRunner.jsx # Quiz tùy chỉnh (chọn set + loại)
│   │       │
│   │       ├── listening/           # Luyện nghe
│   │       │   ├── ListeningContainer.jsx  # Container quản lý bài tập nghe
│   │       │   ├── AudioQuiz.jsx           # Nghe → chọn đáp án trắc nghiệm
│   │       │   └── SentenceComplete.jsx    # Nghe → gõ hoàn thành câu
│   │       │
│   │       ├── games/               # Mini games luyện từ vựng
│   │       │   ├── GamesContainer.jsx   # Container quản lý danh sách games
│   │       │   ├── WordleGame.jsx       # Game Wordle (đoán từ)
│   │       │   ├── MatchingGame.jsx     # Game ghép nối tốc độ
│   │       │   └── ScrambleGame.jsx     # Game sắp xếp chữ cái
│   │       │
│   │       └── progress/
│   │           └── ProgressView.jsx     # Trang thống kê tiến độ học tập
│   │
│   ├── hooks/
│   │   └── useAudio.js              # Custom hook: quản lý TTS / phát audio
│   │
│   ├── services/
│   │   └── api.js                   # Axios instance + interceptors
│   │
│   ├── store/                       # Zustand stores (state management)
│   │   ├── useAppStore.js           # App-level state (active view, UI flags)
│   │   ├── useAuthStore.js          # Auth state (user, token, login/logout)
│   │   ├── useVocabStore.js         # Vocabulary state (sets, items, CRUD)
│   │   ├── useQuizStore.js          # Quiz state (questions, answers, score)
│   │   ├── useListeningStore.js     # Listening state (tasks, sentences)
│   │   └── useChatStore.js          # Chatbot state (messages, send/receive)
│   │
│   ├── assets/                      # Static assets (images, etc.)
│   ├── App.jsx                      # Root component (auth routing)
│   ├── main.jsx                     # React DOM entry point
│   └── index.css                    # Global styles + Tailwind directives
│
├── dist/                            # Build output (production)
├── index.html                       # HTML template (Vite entry)
├── vite.config.js                   # Vite configuration
├── eslint.config.js                 # ESLint configuration
├── .env                             # Environment variables (không commit)
├── .env.example                     # Template biến môi trường
└── package.json
```

---

## 🚀 Cài đặt & Chạy

### Yêu cầu hệ thống

- **Node.js** >= 18.x
- **npm** >= 9.x
- Backend server đang chạy tại `http://localhost:5000`

### Các bước cài đặt

```bash
# 1. Di chuyển vào thư mục frontend
cd frontend

# 2. Cài đặt dependencies
npm install

# 3. Tạo file .env
cp .env.example .env

# 4. Chạy development server
npm run dev
```

Mở trình duyệt tại **http://localhost:5173**.

### Scripts có sẵn

| Lệnh             | Mô tả                              |
| ----------------- | ----------------------------------- |
| `npm run dev`     | Khởi chạy Vite dev server (HMR)    |
| `npm run build`   | Build production bundle vào `dist/` |
| `npm run preview` | Preview production build locally    |
| `npm run lint`    | Chạy ESLint kiểm tra code          |

---

## 🔐 Biến Môi trường

Tạo file `.env` từ `.env.example`:

```env
# URL của backend API
# Development: http://localhost:5000/api
# Production:  https://your-backend-domain.com/api
VITE_API_URL=http://localhost:5000/api
```

> **Lưu ý:** Tất cả biến môi trường phải có prefix `VITE_` để Vite inject vào client code.

---

## 🎨 Kiến trúc Giao diện

### Layout 3 cột bất đối xứng

```
┌──────────────────────────────────────────────────────────────┐
│                        MAIN LAYOUT                            │
├────────────┬──────────────────────────────┬───────────────────┤
│            │                              │                   │
│  SIDEBAR   │      CANVAS TRUNG TÂM        │   AI CHATBOT     │
│  (240px)   │      (flex: 1, co giãn)      │   PANEL (360px)  │
│            │                              │                   │
│  ┌──────┐  │  Nội dung thay đổi theo      │  ┌─────────────┐ │
│  │ 📚   │  │  activeView từ Sidebar:      │  │ Lịch sử     │ │
│  │ Vocab │  │                              │  │ chat cuộn   │ │
│  ├──────┤  │  • VocabSetCreator           │  │ tự động     │ │
│  │ 📝   │  │  • QuizContainer             │  │             │ │
│  │ Quiz  │  │  • ListeningContainer       │  ├─────────────┤ │
│  ├──────┤  │  • GamesContainer            │  │ 💬 Input    │ │
│  │ 🎧   │  │  • ProgressView             │  │ + Send btn  │ │
│  │ Listen│  │                              │  └─────────────┘ │
│  ├──────┤  │                              │                   │
│  │ 🎮   │  │                              │                   │
│  │ Games │  │                              │                   │
│  ├──────┤  │                              │                   │
│  │ 📊   │  │                              │                   │
│  │ Stats │  │                              │                   │
│  └──────┘  │                              │                   │
│            │                              │                   │
├────────────┴──────────────────────────────┴───────────────────┤
│                       Sonner Toaster (bottom-right)           │
└──────────────────────────────────────────────────────────────┘
```

### Luồng điều hướng

- **Chưa đăng nhập** → Hiển thị `AuthPage` (login / register form)
- **Đã đăng nhập** → Hiển thị `MainLayout` với 3 cột
- Sidebar chuyển đổi view qua `useAppStore.activeView`
- Chatbot Panel luôn hiển thị cố định bên phải

---

## 🧩 Components Chi tiết

### Layout Components

| Component          | File                    | Mô tả                                        |
| ------------------- | ----------------------- | --------------------------------------------- |
| **MainLayout**      | `layout/MainLayout.jsx` | Khung 3 cột chính, điều phối render theo view |
| **Sidebar**         | `layout/Sidebar.jsx`    | Thanh nav dọc bên trái, điều hướng chức năng  |
| **ChatbotPanel**    | `layout/ChatbotPanel.jsx`| Panel AI chat cố định bên phải               |

### Feature Components

#### 🔐 Auth

| Component     | Mô tả                                                      |
| -------------- | ----------------------------------------------------------- |
| **AuthPage**   | Form đăng nhập / đăng ký với toggle animation               |

#### 📚 Vocabulary

| Component           | Mô tả                                                         |
| -------------------- | -------------------------------------------------------------- |
| **VocabSetCreator**  | Tạo bộ từ mới, hiển thị grid các bộ từ hiện có                 |
| **VocabList**        | Danh sách từ vựng trong bộ, hỗ trợ CRUD, merge/split          |
| **PdfImportZone**    | Drag & drop upload PDF → tự động parse từ vựng                 |
| **FlashcardStudy**   | Học flashcard: lật thẻ, đánh dấu đã biết / chưa biết          |
| **SmartStudy**       | Học thông minh: ưu tiên từ yếu, spaced repetition              |

#### 📝 Quiz

| Component            | Mô tả                                                        |
| --------------------- | ------------------------------------------------------------- |
| **QuizContainer**     | Container điều phối: chọn bộ từ → chọn loại quiz → làm bài   |
| **MultipleChoice**    | Quiz 4 đáp án: English ↔ Vietnamese                          |
| **FillInBlank**       | Điền từ English vào chỗ trống, kèm gợi ý nghĩa Việt          |
| **MatchingGame**      | Ghép nối từ English — nghĩa Việt (kéo thả / click)           |
| **CustomQuizRunner**  | Quiz tùy chỉnh: chọn nhiều bộ từ, số câu, loại câu hỏi       |

#### 🎧 Listening

| Component              | Mô tả                                                      |
| ----------------------- | ----------------------------------------------------------- |
| **ListeningContainer**  | Nhập đoạn văn → tạo task → chọn dạng bài tập               |
| **AudioQuiz**           | Nghe câu → chọn đáp án trắc nghiệm đúng                   |
| **SentenceComplete**    | Nghe câu → gõ lại hoàn chỉnh câu đã nghe                  |

#### 🎮 Games

| Component          | Mô tả                                                      |
| ------------------- | ----------------------------------------------------------- |
| **GamesContainer**  | Hub chọn game, hiển thị danh sách mini games                |
| **WordleGame**      | Đoán từ English theo phong cách Wordle                      |
| **MatchingGame**    | Ghép nối từ — nghĩa tốc độ cao, tính điểm                  |
| **ScrambleGame**    | Sắp xếp chữ cái bị xáo trộn thành từ đúng                 |

#### 📊 Progress

| Component        | Mô tả                                                       |
| ----------------- | ------------------------------------------------------------ |
| **ProgressView**  | Dashboard thống kê: điểm theo thời gian, tỷ lệ đúng, biểu đồ |

---

## 🗃 State Management (Zustand)

Ứng dụng sử dụng **Zustand** — thư viện state management nhẹ, không boilerplate. Mỗi domain có store riêng biệt.

### Danh sách Stores

| Store                  | File                     | Mục đích                                        |
| ----------------------- | ------------------------ | ------------------------------------------------ |
| **useAppStore**         | `store/useAppStore.js`   | State UI: active view, sidebar collapse, flags   |
| **useAuthStore**        | `store/useAuthStore.js`  | User info, JWT token, login/logout/register      |
| **useVocabStore**       | `store/useVocabStore.js` | Bộ từ vựng, CRUD items, upload PDF, merge/split  |
| **useQuizStore**        | `store/useQuizStore.js`  | Quiz data, câu hỏi, câu trả lời, điểm số       |
| **useListeningStore**   | `store/useListeningStore.js` | Listening tasks, sentences, CRUD             |
| **useChatStore**        | `store/useChatStore.js`  | Mảng messages, gửi/nhận tin nhắn AI chatbot      |

### Cách sử dụng

```jsx
// Lấy state
const user = useAuthStore((state) => state.user);
const vocabSets = useVocabStore((state) => state.vocabSets);

// Gọi action
const login = useAuthStore((state) => state.login);
await login({ email, password });

// Chuyển view
const setActiveView = useAppStore((state) => state.setActiveView);
setActiveView('quiz');
```

---

## 🔌 Services & Hooks

### `services/api.js` — Axios Instance

Cấu hình Axios client tập trung:

- **Base URL**: lấy từ `VITE_API_URL` (env variable)
- **Request Interceptor**: Tự động gắn `Authorization: Bearer <token>` vào mọi request
- **Response Interceptor**: Xử lý lỗi 401 → tự động logout

```js
// Sử dụng
import api from '@/services/api';

const { data } = await api.get('/vocabulary/sets');
const { data } = await api.post('/quiz/submit', payload);
```

### `hooks/useAudio.js` — Custom Hook TTS

Hook quản lý Text-to-Speech sử dụng **Web Speech API** của trình duyệt:

- `speak(text)` — Phát giọng đọc tiếng Anh cho text
- `stop()` — Dừng phát audio
- `isSpeaking` — State đang phát hay không

```jsx
const { speak, stop, isSpeaking } = useAudio();

<button onClick={() => speak("Hello world")}>
  {isSpeaking ? "⏹ Stop" : "🔊 Play"}
</button>
```

---

## 🔄 Luồng Hoạt động

### 1. Đăng nhập / Đăng ký

```
AuthPage → useAuthStore.login() → POST /api/auth/login
    ↓
Token lưu vào store + localStorage → App render MainLayout
```

### 2. Tạo & Học Từ vựng

```
VocabSetCreator → useVocabStore.createSet()       → POST /api/vocabulary/sets
PdfImportZone   → useVocabStore.uploadPdf()        → POST /api/vocabulary/upload-pdf
VocabList       → useVocabStore.fetchVocabularies() → GET  /api/vocabulary/sets/:id
FlashcardStudy  → Học offline (không gọi API, dùng state local)
```

### 3. Làm Quiz

```
QuizContainer  → useQuizStore.generateQuiz()  → GET  /api/quiz/generate/:setId?type=...
MultipleChoice → User chọn đáp án → state cập nhật local
FillInBlank    → User gõ đáp án   → state cập nhật local
               → useQuizStore.submitQuiz()    → POST /api/quiz/submit
```

### 4. Luyện Nghe

```
ListeningContainer → useListeningStore.processParagraph() → POST /api/listening/process-paragraph
AudioQuiz          → useAudio.speak(sentence)             → Web Speech API (client-side)
SentenceComplete   → User gõ câu → so sánh local
```

### 5. Chat với AI

```
ChatbotPanel → useChatStore.sendMessage() → POST /api/ai/chat
    ↓
AI response (Markdown) → react-markdown render → hiển thị trong panel
```

---

## 🎨 Design System

### Typography

- **Font chính**: [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts) — weights: 400, 500, 600, 700, 800
- Fallback: system-ui, sans-serif

### Theme

- **Dark mode** mặc định
- Toast notifications: `sonner` với `theme="dark"`, position `bottom-right`, rich colors enabled

### Path Alias

```js
// vite.config.js
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}

// Sử dụng
import api from '@/services/api';
import useAuthStore from '@/store/useAuthStore';
```

---

## 📌 Ghi chú Phát triển

- **Module system**: ESM (`import/export`) — `"type": "module"` trong package.json
- **React version**: 19.x (hỗ trợ concurrent features)
- **Tailwind CSS v4**: Sử dụng `@tailwindcss/vite` plugin (không cần PostCSS config riêng)
- **No React Router**: Điều hướng dựa trên state (`useAppStore.activeView`), không dùng URL routing
- **Styling**: Kết hợp Tailwind utility classes + CSS modules riêng cho layout components

---

## 📄 License

Private
