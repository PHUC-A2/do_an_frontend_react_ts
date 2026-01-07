import { useEffect } from "react";
import { useAppDispatch } from "../../redux/hooks";
import { setToken } from "../../redux/features/authSlice";

export const useAuthInit = () => {
    const dispatch = useAppDispatch();

    useEffect(() => {
        const token = localStorage.getItem('access_token');
        if (token) {
            dispatch(setToken(token));
        }
    }, [dispatch]);
}
