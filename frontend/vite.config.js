import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';

export default defineConfig({
  plugins: [react()],
  server: {
    // https: {
    //   key: fs.readFileSync('./ssl/192.168.1.12+1-key.pem'), // Đường dẫn tới key
    //   cert: fs.readFileSync('./ssl/192.168.1.12+1.pem'),    // Đường dẫn tới cert
    // },
    host: '0.0.0.0',  // Cho phép truy cập từ mọi IP trong LAN
    port: 5173,       // Port tùy chọn
  },
});