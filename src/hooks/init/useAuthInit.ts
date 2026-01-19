import { useEffect } from "react";
import { useAppDispatch } from "../../redux/hooks";
import { setToken, setLogout } from "../../redux/features/authSlice";
import { getRefreshToken } from "../../config/Api";

/**
 * Hook chạy 1 lần khi app load
 * - Dùng refresh_token (cookie) để lấy access_token mới
 * - Giữ trạng thái login khi F5 / reload
 */
export const useAuthInit = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const initAuth = async () => {
            try {
                // Gọi API refresh (cookie tự gửi)
                const res = await getRefreshToken();

                const token = res.data?.data?.access_token;

                // Nếu refresh OK → set lại access_token vào Redux
                if (token) {
                    dispatch(setToken(token));
                } else {
                    // Refresh trả về nhưng không có token → coi như logout
                    
                    localStorage.removeItem("access_token");
                    dispatch(setLogout());
                }
            } catch (error) {
                // Refresh token hết hạn / không hợp lệ
                localStorage.removeItem("access_token");
                dispatch(setLogout());
            }
        };

        initAuth();
    }, [dispatch]);
};
