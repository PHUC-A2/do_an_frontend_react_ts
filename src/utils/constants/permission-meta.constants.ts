import type { PermissionKey } from "../../types/permission";

export interface PermissionMeta {
    name: PermissionKey;
    description: string;
}

export interface PermissionGroup {
    group: string;
    items: PermissionMeta[];
}

export const LIST_PERMISSION: PermissionGroup[] = [
    {
        group: "USER",
        items: [
            { name: "USER_VIEW_LIST", description: "Xem danh sách người dùng" },
            { name: "USER_VIEW_DETAIL", description: "Xem chi tiết người dùng" },
            { name: "USER_CREATE", description: "Tạo mới người dùng" },
            { name: "USER_UPDATE", description: "Cập nhật người dùng" },
            { name: "USER_DELETE", description: "Xóa người dùng" },
            { name: "USER_ASSIGN_ROLE", description: "Gán vai trò cho người dùng" },
        ],
    },
    {
        group: "ASSET",
        items: [
            { name: "ASSET_VIEW_LIST", description: "Xem danh sách tài sản" },
            { name: "ASSET_VIEW_DETAIL", description: "Xem chi tiết tài sản" },
            { name: "ASSET_CREATE", description: "Tạo tài sản" },
            { name: "ASSET_UPDATE", description: "Cập nhật tài sản" },
            { name: "ASSET_DELETE", description: "Xóa tài sản" },
        ],
    },
    {
        group: "DEVICE",
        items: [
            { name: "DEVICE_VIEW_LIST", description: "Xem danh sách thiết bị theo tài sản" },
            { name: "DEVICE_VIEW_DETAIL", description: "Xem chi tiết thiết bị theo tài sản" },
            { name: "DEVICE_CREATE", description: "Tạo thiết bị theo tài sản" },
            { name: "DEVICE_UPDATE", description: "Cập nhật thiết bị theo tài sản" },
            { name: "DEVICE_DELETE", description: "Xóa thiết bị theo tài sản" },
        ],
    },
    {
        group: "ROLE",
        items: [
            { name: "ROLE_VIEW_LIST", description: "Xem danh sách vai trò" },
            { name: "ROLE_VIEW_DETAIL", description: "Xem chi tiết vai trò" },
            { name: "ROLE_CREATE", description: "Tạo mới vai trò" },
            { name: "ROLE_UPDATE", description: "Cập nhật vai trò" },
            { name: "ROLE_DELETE", description: "Xóa vai trò" },
            { name: "ROLE_ASSIGN_PERMISSION", description: "Gán quyền cho vai trò" },
        ],
    },
    {
        group: "PERMISSION",
        items: [
            { name: "PERMISSION_VIEW_LIST", description: "Xem danh sách quyền" },
            { name: "PERMISSION_VIEW_DETAIL", description: "Xem chi tiết quyền" },
            { name: "PERMISSION_CREATE", description: "Tạo mới quyền" },
            { name: "PERMISSION_UPDATE", description: "Cập nhật quyền" },
            { name: "PERMISSION_DELETE", description: "Xóa quyền" },
        ],
    },
    {
        group: "PITCH",
        items: [
            { name: "PITCH_VIEW_LIST", description: "Xem danh sách sân" },
            { name: "PITCH_VIEW_DETAIL", description: "Xem chi tiết sân" },
            { name: "PITCH_CREATE", description: "Tạo mới sân" },
            { name: "PITCH_UPDATE", description: "Cập nhật sân" },
            { name: "PITCH_DELETE", description: "Xóa sân" },
        ],
    },
    {
        group: "BOOKING",
        items: [
            { name: "BOOKING_VIEW_LIST", description: "Xem danh sách đặt sân" },
            { name: "BOOKING_VIEW_DETAIL", description: "Xem chi tiết đặt sân" },
            { name: "BOOKING_CREATE", description: "Tạo mới đặt sân" },
            { name: "BOOKING_UPDATE", description: "Cập nhật đặt sân" },
            { name: "BOOKING_DELETE", description: "Hủy đặt sân" },
        ],
    },
    {
        group: "PAYMENT",
        items: [
            { name: "PAYMENT_VIEW_LIST", description: "Danh sách payment chờ xác nhận" },
            { name: "PAYMENT_UPDATE", description: "Admin xác nhận payment đã thanh toán" },
        ],
    },
    {
        group: "REVENUE",
        items: [
            { name: "REVENUE_VIEW_DETAIL", description: "Lấy thống kê doanh thu" },
        ],
    },
];
