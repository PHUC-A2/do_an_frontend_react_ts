import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// Vite config
// Mục đích:
// - Local dev chạy bằng Vite
// - Vite proxy sẽ giả lập nginx reverse proxy
// - Khi deploy server, nginx sẽ thay thế phần proxy này
// → Vì vậy code frontend luôn dùng path tương đối: /api , /storage

export default defineConfig({
  plugins: [react()],

  server: {
    open: true,

    proxy: {
      // ===== API Proxy (giống nginx proxy_pass) =====
      // React gọi: /api/*
      // Local: Vite chuyển tới backend Spring Boot :8080
      // Server: nginx sẽ proxy tới backend
      "/api": {
        target: "http://localhost:8080",
        changeOrigin: true
      },

      // ===== File Upload Proxy (giống nginx alias / storage) =====
      // React gọi: /storage/*
      // Local: Vite chuyển tới backend :8080
      // Server: nginx sẽ serve trực tiếp từ thư mục upload
      "/storage": {
        target: "http://localhost:8080",
        changeOrigin: true
      }
    }
  }
});