<a id="readme-top"></a>

<!-- PROJECT LOGO -->
<br />
<div align="center">
  <a href="">
    <img src="hcmut.png" alt="HCMUT Logo" width="160" height="160">
  </a>

  <h3 align="center">Discord-like Chat Application</h3>

  <p align="center">
    Dự án này là phần frontend dựa trên React cho một ứng dụng trò chuyện giống Discord dựa trên mô hình hybird giữa Client-Server và Peer-to-Peer. Nó cung cấp giao diện hiện đại cho nhắn tin thời gian thực, với các tính năng bao gồm quản lý máy chủ, tổ chức kênh và xác thực người dùng.
  </p>
</div>



### Công Nghệ Sử Dụng

- WebRTC
- RestApi
- Websocket

### Tính Năng

- Xác thực người dùng (đăng nhập/đăng ký)
- Điều hướng thanh bên máy chủ
- Quản lý kênh
- Nhắn tin thời gian thực
- Xem danh sách thành viên
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
