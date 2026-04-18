# 🧠 NeuroLearn AI - Hệ Sinh Thái Học Tập Thích Ứng Cá Nhân Hóa

![NeuroLearn AI Banner](https://i.ytimg.com/vi/bQq9UFUfrRA/maxresdefault.jpg)

**NeuroLearn AI** là một nền tảng học tập đột phá được hỗ trợ bởi trí tuệ nhân tạo (AI), cho phép người dùng tự kiến tạo lộ trình tri thức của riêng mình. Thay vì học theo các giáo trình cố định, NeuroLearn AI biến mọi chủ đề hoặc tài liệu thô thành các khóa học sinh động, cá nhân hóa hoàn toàn cho từng cá nhân.

---

## ✨ Tính Năng Nổi Bật

*   **🚀 AI Course Generator:** Tạo lộ trình học tập toàn diện (gồm các chương và bài học chi tiết) chỉ từ một từ khóa hoặc ý tưởng.
*   **📄 Document-to-Course:** Tải lên tệp PDF hoặc hình ảnh bài giảng để AI tự động chuyển đổi thành nội dung học tập có cấu trúc.
*   **🤖 Neuro AI Tutor:** Gia sư ảo trực tuyến 24/7, sẵn sàng giải đáp mọi thắc mắc và giải thích các khái niệm phức tạp trong bài học.
*   **🎮 Gamification:** Hệ thống theo dõi Streak (chuỗi ngày học), tích lũy XP và điểm thưởng để duy trì động lực học tập mỗi ngày.
*   **📱 Mobile-First Design:** Giao diện hiện đại, mượt mà, tối ưu hóa cho trải nghiệm trên thiết bị di động với hỗ trợ Chế độ tối (Dark Mode).

---

## 🛠️ Công Nghệ Sử Dụng

*   **Frontend:** React 19, TypeScript, Tailwind CSS.
*   **Build Tool:** Vite.
*   **AI Engine:** Google Gemini API (`@google/genai`).
*   **Icons:** Lucide React.
*   **Animations:** Framer Motion.

---

## 🚀 Hướng Dẫn Cài Đặt & Triển Khai (Deployment)

### 1. Yêu Cầu Hệ Thống
*   Node.js (v18.x trở lên)
*   NPM hoặc Yarn

### 2. Cài Đặt
Tải mã nguồn về máy và cài đặt các thư viện phụ thuộc:
```bash
npm install
```

### 3. Cấu Hình Biến Môi Trường
Tạo tệp `.env` tại thư mục gốc và thêm khóa API của Google Gemini:
```env
VITE_GEMINI_API_KEY=YOUR_GEMINI_API_KEY_HERE
```
*Lưu ý: Bạn có thể lấy API Key miễn phí tại [Google AI Studio](https://aistudio.google.com/).*

### 4. Chạy Ở Chế Độ Phát Triển (Development)
```bash
npm run dev
```
Ứng dụng sẽ chạy tại địa chỉ: `http://localhost:3000`

### 5. Đóng Gói & Triển Khai (Production)
Để tạo bản build tối ưu cho môi trường thực tế:
```bash
npm run build
```
Các tệp tin tĩnh sẽ được tạo trong thư mục `dist/`. Bạn có thể triển khai thư mục này lên các nền tảng như:
*   **Vercel / Netlify:** Chỉ cần kết nối với kho lưu trữ GitHub.
*   **Cloud Run / Docker:** Sử dụng Dockerfile để đóng gói và chạy trên Google Cloud.

---

