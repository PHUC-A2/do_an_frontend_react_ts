// hooks/common/useAdminAccess.ts
import { useAppSelector } from "../../redux/hooks";

export const useAdminAccess = (): boolean => {
    const account = useAppSelector(state => state.account.account);

    if (!account || !account.roles?.length) return false;

    // VIEW luôn bị chặn
    return !account.roles.some(r => r.name === "VIEW");
};
