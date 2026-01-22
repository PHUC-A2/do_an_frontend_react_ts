// utils/constants/permission-ui.constants.ts
export type PermissionAction =
    | "VIEW_LIST"
    | "VIEW_DETAIL"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "ASSIGN_ROLE"
    | "ASSIGN_PERMISSION";

export const PERMISSION_ACTION_COLOR: Record<PermissionAction, string> = {
    VIEW_LIST: "blue",
    VIEW_DETAIL: "cyan",
    CREATE: "green",
    UPDATE: "gold",
    DELETE: "red",
    ASSIGN_ROLE: "purple",
    ASSIGN_PERMISSION: "magenta",
};
