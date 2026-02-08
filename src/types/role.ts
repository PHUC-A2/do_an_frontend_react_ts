// types/role.ts
export type RoleKey =
    | "ADMIN"
    | "VIEW";
    // | "STAFF";
    // có thể thêm nếu có thêm role

export interface IRole {
    id: number;
    name: string;
    description?: string | null;
    createdAt: string;
    updatedAt: string | null;
    createdBy: string;
    updatedBy: string | null;
    permissions?: {
        id: number;
        name: string;
        description?: string;
    }[];
}

export interface ICreateRoleReq {
    name: string;
    description?: string | null;
}

export interface IUpdateRoleReq {
    name: string;
    description?: string | null;
}

export interface IAssignPermissionReq {
    permissionIds: number[];
}