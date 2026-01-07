import axios from "axios";

const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    withCredentials: true, // gửi cookie (refresh_token)
});

// Request interceptor: tự động gắn token
instance.interceptors.request.use((config) => {
    const token = localStorage.getItem("access_token");
    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

// Response interceptor: xử lý khi token hết hạn
instance.interceptors.response.use(
    (response) => response,
    async (error) => {
        const originalRequest = error.config;

        // Nếu API trả về 401 và chưa retry
        if (error.response?.status === 401 && !originalRequest._retry) {

            // 1 Bỏ qua request login để toast lỗi hiển thị
            if (originalRequest.url?.includes("/auth/login")) {
                // không retry, trả về reject để login page catch lỗi
                return Promise.reject(error);
            }

            // 2 Các request khác: thử refresh token
            originalRequest._retry = true;
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/refresh`,
                    { withCredentials: true }
                );

                const newToken = res.data?.data?.access_token;
                if (newToken) {
                    // Lưu token mới và retry request cũ
                    localStorage.setItem("access_token", newToken);
                    originalRequest.headers["Authorization"] = `Bearer ${newToken}`;
                    return instance(originalRequest);
                }
            } catch (err) {
                // Nếu refresh fail → logout
                console.error("Refresh token failed", err);
                localStorage.removeItem("access_token");
                window.location.href = "/login";
            }
        }

        // Reject tất cả lỗi còn lại
        return Promise.reject(error);
    }
);


export default instance;
