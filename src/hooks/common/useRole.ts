// hooks/common/useRole.ts
import { useAppSelector } from "../../redux/hooks";
import type { RoleKey } from "../../types/role";
import { hasRole } from "../../utils/role";

export const useRole = (
    required: RoleKey | RoleKey[]
): boolean => {
    const account = useAppSelector(state => state.account.account);
    return hasRole(account, required);
};
