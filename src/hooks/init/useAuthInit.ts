import { useEffect } from "react";
import { useAppDispatch } from "../../redux/hooks";
import { setToken, setLogout } from "../../redux/features/authSlice";
import axios from "axios";

export const useAuthInit = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const initAuth = async () => {
            try {
                const res = await axios.get(
                    `${import.meta.env.VITE_BACKEND_URL}/api/v1/auth/refresh`,
                    { withCredentials: true }
                );

                const token = res.data?.data?.access_token;
                if (token) {
                    dispatch(setToken(token));
                }
            } catch {
                dispatch(setLogout());
            }
        };

        initAuth();
    }, [dispatch]);
};
