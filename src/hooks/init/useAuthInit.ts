import { useEffect } from "react";
import { useAppDispatch } from "../../redux/hooks";
import { setToken, setLogout } from "../../redux/features/authSlice";
import { getRefreshToken } from "../../config/Api";

export const useAuthInit = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const initAuth = async () => {
            try {
                const res = await getRefreshToken();
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
