import type { IAccount } from "../types/account";
import type { PermissionKey } from "../types/permission";
import { isSystemAllAccount } from "./role";

export const hasPermission = (
    account: IAccount | null,
    required: PermissionKey | PermissionKey[]
): boolean => {
    if (!account) return false;

    const requiredPerms = Array.isArray(required) ? required : [required];

    if (isSystemAllAccount(account)) return true;

    const fromApi = account.effectivePermissionNames;
    if (Array.isArray(fromApi) && fromApi.length > 0) {
        if (fromApi.includes("ALL")) return true;
        return requiredPerms.some((p) => fromApi!.includes(p as string));
    }

    const userPermissions = new Set<string>();
    account.roles?.forEach(role => {
        role.permissions?.forEach(perm => {
            userPermissions.add(perm.name);
        });
    });

    return requiredPerms.some(p => userPermissions.has(p as string));
};
