import type { IAccount } from "../types/account";
import type { PermissionKey } from "../types/permission";

export const hasPermission = (
    account: IAccount | null,
    required: PermissionKey | PermissionKey[]
): boolean => {
    if (!account) return false;

    const requiredPerms = Array.isArray(required) ? required : [required];

    // ADMIN = full quyền
    const isAdmin = account.roles?.some(role => role.name === "ADMIN");
    if (isAdmin) return true;

    // Gom permission từ tất cả roles
    const userPermissions = new Set<string>();

    account.roles?.forEach(role => {
        role.permissions?.forEach(p => {
            userPermissions.add(p.name);
        });
    });

    //  Chỉ cần có 1 permission là đủ
    return requiredPerms.some(p => userPermissions.has(p));
};
