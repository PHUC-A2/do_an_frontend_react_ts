import { useAppSelector } from "../../redux/hooks";
import type { PermissionKey } from "../../types/permission";
import { hasPermission } from "../../utils/permission";

export const usePermission = (
    required: PermissionKey | PermissionKey[]
): boolean => {
    const account = useAppSelector(state => state.account.account);
    return hasPermission(account, required);
};
