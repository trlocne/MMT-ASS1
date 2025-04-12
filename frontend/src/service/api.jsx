import axios from "axios";

// const API_URL = 'http://localhost:8000';
const API_URL = "https://192.168.1.11:8000";

const api = axios.create({
  baseURL: API_URL,
});

// Request interceptor (thêm token, v.v.)
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor (bắt lỗi, refresh token, v.v.)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Có thể redirect về login, hoặc refresh token tại đây
      console.error("Unauthorized - Redirect to login or refresh token");
    }
    return Promise.reject(error);
  }
);

export { api };
