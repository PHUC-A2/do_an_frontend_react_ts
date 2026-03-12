import axios, { type InternalAxiosRequestConfig } from "axios";
import { setLogout } from "../redux/features/authSlice";
import { store } from "../redux/store";
import { topProgress } from "../hooks/common/useTopProgress";

type TrackedAxiosConfig = InternalAxiosRequestConfig & {
    _retry?: boolean;
    __topProgressSettled?: boolean;
};

const instance = axios.create({
    baseURL: import.meta.env.VITE_BACKEND_URL,
    // baseURL: "/",
    withCredentials: true, // gửi cookie refresh_token
});

// ======================
// Request interceptor
// Tự động gắn access token vào header
// ======================
instance.interceptors.request.use((config) => {
    const trackedConfig = config as TrackedAxiosConfig;

    trackedConfig.__topProgressSettled = false;
    topProgress.start();

    const token = localStorage.getItem("access_token");
    if (token) {
        trackedConfig.headers.Authorization = `Bearer ${token}`;
    }

    return trackedConfig;
});

// ======================
// Response interceptor
// Xử lý khi access token hết hạn (401)
// ======================
let isLoggingOut = false;
instance.interceptors.response.use(
    (response) => {
        const trackedConfig = response.config as TrackedAxiosConfig;

        if (!trackedConfig.__topProgressSettled) {
            trackedConfig.__topProgressSettled = true;
            topProgress.done();
        }

        return response;
    },
    async (error) => {
        const originalRequest = error.config as TrackedAxiosConfig | undefined;

        const settleAsDone = () => {
            if (!originalRequest || originalRequest.__topProgressSettled) {
                return;
            }

            originalRequest.__topProgressSettled = true;
            topProgress.done();
        };

        const settleAsError = () => {
            if (!originalRequest || originalRequest.__topProgressSettled) {
                return;
            }

            originalRequest.__topProgressSettled = true;
            topProgress.error();
        };

        // Chỉ xử lý khi API trả 401 và request chưa retry
        if (originalRequest &&
            error.response?.status === 401 &&
            !originalRequest._retry &&
            localStorage.getItem("access_token")
        ) {
            // Không refresh khi login fail
            if (originalRequest.url?.includes("/auth/login")) {
                settleAsError();
                return Promise.reject(error);
            }

            // KHÔNG refresh cho refresh (FIX LOOP)
            if (originalRequest.url?.includes("/auth/refresh")) {
                settleAsError();
                logout();
                return Promise.reject(error);
            }

            settleAsDone();
            originalRequest._retry = true;

            try {
                // Gọi API refresh token
                const res = await instance.get("/api/v1/auth/refresh");

                // Trường hợp refresh FAIL:
                // - backend trả 204 (không có refresh token)
                // - hoặc không trả access_token
                const newToken = res.data?.data?.access_token;
                if (!newToken) {
                    logout();
                    return Promise.reject(error);
                }

                // Refresh thành công
                localStorage.setItem("access_token", newToken);
                originalRequest.headers.Authorization = `Bearer ${newToken}`;
                originalRequest.__topProgressSettled = false;

                // Retry lại request ban đầu
                return instance(originalRequest);

            } catch {
                // Trường hợp refresh trả 401 / lỗi network
                logout();
                return Promise.reject(error);
            }
        }

        // Các lỗi khác không xử lý
        settleAsError();
        return Promise.reject(error);
    }
);

// ======================
// Logout: xóa access token và redirect login
// ======================
function logout() {

    // Chặn logout bị gọi NHIỀU LẦN cùng lúc
    if (isLoggingOut) return;
    isLoggingOut = true;

    localStorage.removeItem("access_token");
    store.dispatch(setLogout());
    window.location.href = "/login";
}

export default instance;
