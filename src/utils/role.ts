// utils/role.ts
import type { IAccount } from "../types/account";
import type { RoleKey } from "../types/role";

/** Quản trị hệ thống: JWT ALL hoặc role ADMIN toàn hệ thống (không thuộc shop). */
export const isSystemAllAccount = (account: IAccount | null | undefined): boolean => {
    if (!account) return false;
    if (account.effectivePermissionNames?.includes("ALL")) {
        return true;
    }
    return (
        account.roles?.some(
            (r) => r.name === "ADMIN" && (r.tenantId == null || r.tenantId === undefined)
        ) ?? false
    );
};

export const hasRole = (
    account: IAccount | null,
    required: RoleKey | RoleKey[]
): boolean => {
    if (!account) return false;

    const requiredRoles = Array.isArray(required) ? required : [required];
    const userRoles = new Set((account.roles ?? []).map((r) => r.name));

    return requiredRoles.some((role) => {
        if (role === "ADMIN") {
            return isSystemAllAccount(account);
        }
        return userRoles.has(role);
    });
};
