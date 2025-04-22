# MMT-ASS1
Bài tập lớn 1 Mạng máy tính - HK242

# Discord-like Chat Application Frontend

Dự án này là phần frontend dựa trên React cho một ứng dụng trò chuyện giống Discord. Nó cung cấp giao diện hiện đại cho nhắn tin thời gian thực, với các tính năng bao gồm quản lý máy chủ, tổ chức kênh và xác thực người dùng.

### Công Nghệ Sử Dụng

- React 19
- React Router v7
- Vite
- Tailwind CSS
- Axios để gọi API
- Xác thực JWT
- WebRTC

### Tính Năng

- Xác thực người dùng (đăng nhập/đăng ký)
- Điều hướng thanh bên máy chủ
- Quản lý kênh
- Nhắn tin thời gian thực
- Xem danh sách thành viên
- Thiết kế responsive
- Video Call
- LiveStream

### Bắt Đầu

#### Yêu Cầu Hệ Thống

- Node.js (khuyến nghị phiên bản LTS)
- npm

#### Cài Đặt

1. Clone repository
2. Cài đặt các dependencies:

   ```bash
   npm install
   ```

3. Tạo file `.env` trong thư mục gốc với các biến môi trường cần thiết:

   ```
   VITE_API_URL=url_api_backend_của_bạn
   VITE_SOCKET_URL=url_api_backend_của_bạn
   ```

4. Khởi động máy chủ phát triển:

   ```bash
   npm run dev
   ```

5. Mở trình duyệt và truy cập `http://localhost:5173`
