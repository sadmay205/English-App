# 📚 Web Học Tiếng Anh Thông Minh (EnglishAI) - Phiên bản v4.2

Chào mừng bạn đến với **EnglishAI** - Hệ thống học từ vựng, luyện nghe tích hợp AI Chatbot (sử dụng OpenRouter API). Đây là một ứng dụng full-stack hiện đại được xây dựng nhằm tối ưu hóa trải nghiệm học tập tiếng Anh thông qua phản xạ thông minh và hỗ trợ gia sư ảo thời gian thực.

---

## 🚀 Tính năng nổi bật (Bản cập nhật v4.2)

1. **Quản lý Bộ từ vựng & Nhập từ PDF**: Lưu trữ, phân nhóm từ vựng và tự động bóc tách từ `[Từ vựng - Phiên âm - Nghĩa]` từ các tệp PDF tài liệu học tập.
2. **Học thông minh (Smart Repetition)**: Thuật toán Leitner tự động đưa các từ trả lời sai lặp lại nhiều lần cho đến khi thuộc lòng.
3. **Flashcard lật 3D tích hợp AI**: 
   - Học từ thông qua **định nghĩa tiếng Anh** ở mặt trước và đoán từ ở mặt sau.
   - Biên soạn định nghĩa tiếng Anh tự động bằng AI (`google/gemini-3.5-flash` qua OpenRouter) chỉ bằng một cú click chuột.
   - Hỗ trợ phím tắt học tập nhanh và tối ưu hóa phản xạ.
4. **Luyện nghe đoạn văn**: Tự động phân tách đoạn văn trực tuyến thành từng câu riêng biệt và phát âm giọng đọc để học viên nghe & gõ hoàn chỉnh câu.
5. **Nâng cấp Hệ thống trò chơi Ghép từ (Ghép cặp & Phản xạ)**:
   - **Trò chơi Ghép cặp từ vựng (Tab Trò chơi - Games)**:
     - **Tùy chọn số lượng từ**: Hộp chọn (Dropdown) cho phép thiết lập chơi từ **4 từ (8 thẻ) đến 20 từ (40 thẻ)**.
     - **Giao diện thẻ 3D Glassmorphism**: Thẻ khi úp hiển thị vòng tròn lấp lánh cùng icon phát sáng (`Sparkles`) pulsing động. Thẻ khi lật hiển thị các icon minh họa sinh động (`Zap`, `Compass`, `Star`,...) theo mã màu pastel gradient riêng biệt.
     - **Hiệu ứng âm thanh sinh động (Web Audio API)**: Tích hợp âm thanh khi lật thẻ, nhạc chuông vui tươi khi ghép thành công, âm trầm khi chọn sai và nhạc thắng cuộc.
     - **Nhạc nền BGM du dương**: Nhạc nền Lofi synth 8-bit nhẹ nhàng được tổng hợp hoàn toàn bằng code, có nút bật/tắt (mute) chống làm phiền.
     - **Bố cục lưới Grid tự động**: Sử dụng thuộc tính `auto-fill` căn chỉnh thẻ luôn vuông vức và cân đối trên mọi kích thước màn hình.
   - **Trò chơi Ghép thẻ (Tab Kiểm tra - Quiz)**:
     - Cho phép chọn chính xác số từ muốn kiểm tra từ **4 -> 20 từ** thông qua thanh trượt (slider) và nút bấm tăng/giảm nhanh `-`/`+`.
     - Thẻ nối trực tiếp từ tiếng Anh sang nghĩa tiếng Việt/Định nghĩa tiếng Anh với thiết kế kính mờ, bo góc phát sáng và tích hợp nút loa phát âm độc lập.
6. **AI Chatbot Panel (Cột phải)**: Trợ lý ảo gia sư tiếng Anh luôn sẵn sàng giải thích ngữ pháp, sửa lỗi viết câu và giải đáp thắc mắc mọi lúc.

---

## 🛠️ Kiến trúc dự án

Dự án được chia làm hai phần rõ rệt:

* **Backend (Node.js & Express)**: Thiết kế chuẩn RESTful API, mô hình MVC (Model-View-Controller) kết hợp MongoDB và Mongoose ORM.
* **Frontend (React, Vite & Zustand)**: Ứng dụng SPA tối ưu tốc độ render, sử dụng Tailwind CSS cho giao diện glassmorphic tối hiện đại.

---

## 📋 Yêu cầu hệ thống (Requirements)

* **Node.js** phiên bản 18.0 trở lên.
* **MongoDB** (Local instance hoặc MongoDB Atlas Cloud).
* **OpenRouter API Key** (để sử dụng tính năng Chatbot AI và tự động biên soạn định nghĩa tiếng Anh).

---

## ⚙️ Hướng dẫn cài đặt và khởi chạy

### 1. Cấu hình biến môi trường (.env)

#### Backend (`/backend/.env`):
Tạo file `.env` trong thư mục `backend/` với các giá trị sau:
```env
PORT=5000
MONGO_URI=mongodb+srv://...  # Thay bằng URI MongoDB của bạn
JWT_SECRET=your_super_secret_jwt_key
OPENROUTER_API_KEY=your_openrouter_api_key_here
```

#### Frontend (`/frontend/.env`):
Tạo file `.env` trong thư mục `frontend/` với các giá trị sau:
```env
VITE_API_URL=http://localhost:5000/api
```

---

### 2. Khởi chạy Backend (Server)

1. Di chuyển vào thư mục backend:
   ```bash
   cd backend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy server ở chế độ dev (sử dụng nodemon tự động restart):
   ```bash
   npm run dev
   ```
   *Server sẽ chạy tại cổng `http://localhost:5000`*

---

### 3. Khởi chạy Frontend (Client)

1. Di chuyển vào thư mục frontend:
   ```bash
   cd frontend
   ```
2. Cài đặt các gói phụ thuộc:
   ```bash
   npm install
   ```
3. Khởi chạy dev server:
   ```bash
   npm run dev
   ```
   *Frontend sẽ chạy tại `http://localhost:5173`*

4. Để build sản phẩm cho môi trường production:
   ```cmd
   npm run build
   ```

---

## 🧪 Chiến lược Kiểm thử (Testing)

Dự án này áp dụng phương châm **"Chất lượng hơn Số lượng" (Quality over Quantity)**. Thay vì viết hàng trăm bài test kiểm tra các hàm đơn giản (getter/setter), chúng tôi tập trung viết các bài test sâu cho các thuật toán lõi phức tạp, đảm bảo hệ thống vận hành trơn tru ở các góc khuất quan trọng.

### Kiểm thử Unit Test (Backend)
Chúng tôi sử dụng **Node.js Native Test Runner** (tích hợp sẵn từ Node 18, không cần thư viện bên thứ ba, chạy cực nhanh và nhẹ).

1. **Mục tiêu chính**: Thuật toán phân tách đoạn văn trực tuyến (`utils/textSplitter.js`). Đảm bảo phân tách chính xác câu dựa trên ngữ cảnh dấu câu, đồng thời bỏ qua các chữ viết tắt thông dụng như `Mr.`, `Dr.`, `e.g.` ngay cả khi nằm trong ngoặc đơn hoặc dấu ngoặc kép.
2. **Cách chạy test**:
   Di chuyển vào thư mục `backend/` và chạy:
   ```bash
   npm test
   ```
3. **Kết quả mong đợi**:
   ```text
   TAP version 13
   # Subtest: textSplitter - basic splitting on sentence punctuation (. ! ?)
   ok 1 - textSplitter - basic splitting on sentence punctuation (. ! ?)
   # Subtest: textSplitter - handles abbreviations (Dr., Mr., e.g.) to avoid incorrect splits
   ok 2 - textSplitter - handles abbreviations (Dr., Mr., e.g.) to avoid incorrect splits
   # Subtest: textSplitter - handles empty and null inputs safely
   ok 3 - textSplitter - handles empty and null inputs safely
   1..3
   # tests 3
   # pass 3
   # fail 0
   ```

### Kiểm thử thủ công (Manual Verification)
1. **Kiểm tra lật thẻ 3D & Phím tắt**:
   - Sử dụng phím `[Space]` để lật qua lại giữa định nghĩa (mặt trước) và từ vựng (mặt sau).
   - Sử dụng `[Arrow Left / 1]` và `[Arrow Right / 2]` để đánh giá thẻ. Đảm bảo thẻ chưa thuộc được xoay vòng lặp lại ở cuối hàng đợi học.
2. **Kiểm tra tải PDF**:
   - Tải lên tệp PDF từ vựng mẫu (ví dụ tệp PDF SQL đính kèm ở thư mục gốc). Đảm bảo dữ liệu được bóc tách chính xác thành từ vựng, phiên âm và nghĩa.
3. **Kiểm tra Custom Quiz & Game**:
   - Vào mục "Kiểm tra", chọn "Kiểm tra Tùy chỉnh".
   - Chọn bộ từ vựng và số lượng câu trắc nghiệm/điền từ/ghép từ và kiểm tra âm thanh lật/chuông đúng sai của game.
