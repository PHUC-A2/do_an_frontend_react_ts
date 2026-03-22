export type PermissionKey =
    | "ALL"
    // USER
    | "USER_VIEW_LIST"
    | "USER_VIEW_DETAIL"
    | "USER_CREATE"
    | "USER_UPDATE"
    | "USER_DELETE"
    | "USER_ASSIGN_ROLE"
    // ROLE
    | "ROLE_VIEW_LIST"
    | "ROLE_VIEW_DETAIL"
    | "ROLE_CREATE"
    | "ROLE_UPDATE"
    | "ROLE_DELETE"
    | "ROLE_ASSIGN_PERMISSION"
    // PERMISSION
    | "PERMISSION_VIEW_LIST"
    | "PERMISSION_VIEW_DETAIL"
    | "PERMISSION_CREATE"
    | "PERMISSION_UPDATE"
    | "PERMISSION_DELETE"
    // PITCH
    | "PITCH_VIEW_LIST"
    | "PITCH_VIEW_DETAIL"
    | "PITCH_CREATE"
    | "PITCH_UPDATE"
    | "PITCH_DELETE"
    // BOOKING
    | "BOOKING_VIEW_LIST"
    | "BOOKING_VIEW_DETAIL"
    | "BOOKING_CREATE"
    | "BOOKING_UPDATE"
    | "BOOKING_DELETE"
    // PAYMENT
    | "PAYMENT_VIEW_LIST"
    | "PAYMENT_UPDATE"
    // REVENUE
    | "REVENUE_VIEW_DETAIL"
    // EQUIPMENT
    | "EQUIPMENT_VIEW_LIST"
    | "EQUIPMENT_VIEW_DETAIL"
    | "EQUIPMENT_CREATE"
    | "EQUIPMENT_UPDATE"
    | "EQUIPMENT_DELETE"
    // BOOKING_EQUIPMENT
    | "BOOKING_EQUIPMENT_VIEW"
    | "BOOKING_EQUIPMENT_CREATE"
    | "BOOKING_EQUIPMENT_UPDATE"
    // AI keys
    | "AI_VIEW_LIST"
    | "AI_CREATE"
    | "AI_UPDATE"
    | "AI_DELETE"
    // AI chat
    | "AI_CHAT_ADMIN"
    // Phòng tin học (REST /api/v2)
    | "ROOM_CREATE"
    | "ROOM_VIEW_LIST"
    | "ROOM_VIEW_DETAIL"
    | "ROOM_UPDATE"
    | "ROOM_DELETE"
    // Danh mục thiết bị phòng (/api/v2/admin/device-catalog)
    | "DEVICE_CATALOG_VIEW_LIST"
    | "DEVICE_CATALOG_VIEW_DETAIL"
    | "DEVICE_CATALOG_CREATE"
    | "DEVICE_CATALOG_UPDATE"
    | "DEVICE_CATALOG_DELETE";

export interface IPermission {
    id: number;
    name: PermissionKey;
    description?: string | null;
    createdAt: string;
    updatedAt: string | null;
    createdBy: string;
    updatedBy: string | null;
}

export interface ICreatePermissionReq {
    name: PermissionKey;
    description?: string | null;
}

export interface IUpdatePermissionReq {
    name: PermissionKey;
    description?: string | null;
}
