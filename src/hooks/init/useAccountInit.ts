// import { useEffect } from "react";
// import { useAppDispatch, useAppSelector } from "../../redux/hooks";
// import { getAccount } from "../../config/Api";
// import { setAccount } from "../../redux/features/accountSlice";
// /**
//  * Hook fetch account
//  * - Chỉ chạy khi isAuthenticated === true
//  * - KHÔNG logout
//  * - KHÔNG clear auth
//  */
// export const useAccountInit = () => {
//     const dispatch = useAppDispatch();
//     const isAuthenticated = useAppSelector(
//         state => state.auth.isAuthenticated
//     );

//     useEffect(() => {
//         if (!isAuthenticated) return;

//         const fetchAccount = async () => {
//             try {
//                 const res = await getAccount();
//                 if (res.data?.statusCode === 200) {
//                     dispatch(setAccount(res.data.data.user));
//                 }
//             } catch {
//                 // Chỉ báo lỗi, KHÔNG logout
//                 // vì auth đã được interceptor xử lý
//             }
//         };

//         fetchAccount();
//     }, [dispatch, isAuthenticated]);
// };
import { useEffect } from "react";
import { useAppDispatch, useAppSelector } from "../../redux/hooks";
import { fetchAccount } from "../../redux/features/accountSlice";

export const useAccountInit = () => {
    const dispatch = useAppDispatch();
    const isAuthenticated = useAppSelector(
        state => state.auth.isAuthenticated
    );

    useEffect(() => {
        if (!isAuthenticated) return;

        dispatch(fetchAccount());
    }, [dispatch, isAuthenticated]);
};
