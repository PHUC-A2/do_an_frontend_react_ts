// utils/constants/permission-ui.constants.ts
export type PermissionAction =
    | "VIEW_LIST"
    | "VIEW_DETAIL"
    | "VIEW"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "ASSIGN_ROLE"
    | "ASSIGN_PERMISSION"
    | "CHAT_ADMIN";

export const PERMISSION_ACTION_COLOR: Record<PermissionAction, string> = {
    VIEW_LIST: "blue",
    VIEW_DETAIL: "cyan",
    VIEW: "geekblue",
    CREATE: "green",
    UPDATE: "gold",
    DELETE: "red",
    ASSIGN_ROLE: "purple",
    ASSIGN_PERMISSION: "magenta",
    CHAT_ADMIN: "volcano",
};
