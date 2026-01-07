import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { getAccount } from "../../config/Api";
import { setAccount, setClearAccount } from "../../redux/features/accountSlice";
import { toast } from "react-toastify";

export const useAccountInit = () => {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(state => state.auth.isAuthenticated);

    // nếu isAuthenticated còn undefined/null thì chưa chạy
    // fetch account khi login
    useEffect(() => {
        if (!isAuthenticated) return;
        const fetchAccount = async () => {
            try {
                const res = await getAccount();
                if (res.data?.statusCode === 200) {
                    dispatch(setAccount(res.data?.data?.user));
                }
            } catch {
                toast.error('Chưa đăng nhập');
            }
        }
        fetchAccount();
    }, [dispatch, isAuthenticated]);

    // clear account khi logout
    useEffect(() => {
        if (isAuthenticated) return;
        dispatch(setClearAccount());
    }, [dispatch, isAuthenticated]);

}