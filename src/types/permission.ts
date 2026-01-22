export type PermissionKey =
    | "ALL"
    | "USER_VIEW_LIST"
    | "USER_VIEW_DETAIL"
    | "USER_CREATE"
    | "USER_UPDATE"
    | "USER_DELETE"
    | "USER_ASSIGN_ROLE"
    | "ROLE_VIEW_LIST"
    | "ROLE_VIEW_DETAIL"
    | "ROLE_CREATE"
    | "ROLE_UPDATE"
    | "ROLE_DELETE"
    | "ROLE_ASSIGN_PERMISSION"
    | "PERMISSION_VIEW_LIST"
    | "PERMISSION_VIEW_DETAIL"
    | "PERMISSION_CREATE"
    | "PERMISSION_UPDATE"
    | "PERMISSION_DELETE"
    | "PITCH_VIEW_LIST"
    | "PITCH_VIEW_DETAIL"
    | "PITCH_CREATE"
    | "PITCH_UPDATE"
    | "PITCH_DELETE"
    | "BOOKING_VIEW_LIST"
    | "BOOKING_VIEW_DETAIL"
    | "BOOKING_CREATE"
    | "BOOKING_UPDATE"
    | "BOOKING_DELETE";

export interface IPermission {
    id: number;
    name: PermissionKey;
    description?: string | null;
    createdAt: string;
    updatedAt: string | null;
    createdBy: string;
    updatedBy: string | null;
}
