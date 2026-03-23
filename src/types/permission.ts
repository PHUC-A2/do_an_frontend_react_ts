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
    // ASSET
    | "ASSET_VIEW_LIST"
    | "ASSET_VIEW_DETAIL"
    | "ASSET_CREATE"
    | "ASSET_UPDATE"
    | "ASSET_DELETE"
    // DEVICE (thiết bị theo tài sản — devices)
    | "DEVICE_VIEW_LIST"
    | "DEVICE_VIEW_DETAIL"
    | "DEVICE_CREATE"
    | "DEVICE_UPDATE"
    | "DEVICE_DELETE"
    // ASSET_USAGE (thuê/mượn tài sản — asset_usages)
    | "ASSET_USAGE_VIEW_LIST"
    | "ASSET_USAGE_VIEW_DETAIL"
    | "ASSET_USAGE_CREATE"
    | "ASSET_USAGE_UPDATE"
    | "ASSET_USAGE_DELETE"
    // CHECKOUT (nhận tài sản)
    | "CHECKOUT_VIEW_LIST"
    | "CHECKOUT_VIEW_DETAIL"
    | "CHECKOUT_CREATE"
    | "CHECKOUT_UPDATE"
    | "CHECKOUT_DELETE"
    // RETURN (trả tài sản — returns)
    | "RETURN_VIEW_LIST"
    | "RETURN_VIEW_DETAIL"
    | "RETURN_CREATE"
    | "RETURN_UPDATE"
    | "RETURN_DELETE"
    // DEVICE_ISSUE (sự cố thiết bị — device_issues)
    | "DEVICE_ISSUE_VIEW_LIST"
    | "DEVICE_ISSUE_VIEW_DETAIL"
    | "DEVICE_ISSUE_CREATE"
    | "DEVICE_ISSUE_UPDATE"
    | "DEVICE_ISSUE_DELETE"
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
    | "AI_CHAT_ADMIN";

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
