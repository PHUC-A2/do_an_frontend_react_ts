// utils/role.ts
import type { IAccount } from "../types/account";
import type { RoleKey } from "../types/role";

export const hasRole = (
    account: IAccount | null,
    required: RoleKey | RoleKey[]
): boolean => {
    if (!account || !account.roles?.length) return false;

    const requiredRoles = Array.isArray(required) ? required : [required];

    const userRoles = new Set(account.roles.map(r => r.name));

    // chỉ cần có 1 role là đủ
    return requiredRoles.some(role => userRoles.has(role));
};
