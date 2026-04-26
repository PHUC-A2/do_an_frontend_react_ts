export interface IAccount {
    id: number;
    name?: string | null;
    fullName?: string | null;
    email: string;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    /** Bật/tắt chuông thông báo (lưu server, đồng bộ tài khoản). */
    notificationSoundEnabled?: boolean | null;
    /** Kiểu chuông: DEFAULT | SOFT | ALERT. */
    notificationSoundPreset?: 'DEFAULT' | 'SOFT' | 'ALERT' | string | null;
    /** Đã lưu PIN xác nhận thanh toán trên server (không trả giá trị PIN). */
    paymentPinConfigured?: boolean | null;
    /** Hệ thống có bắt buộc PIN khi xác nhận thanh toán hay không. */
    paymentConfirmationPinRequiredBySystem?: boolean | null;
    /** Quyền hiệu lực (JWT / gói theo tenant), ưu tiên trước gộp từ roles. */
    effectivePermissionNames?: string[] | null;
    currentPlan?: string | null;
    subscriptionEndAt?: string | null;
    /** false khi thuê bao hết hạn (tenant > 1). */
    subscriptionActive?: boolean | null;
    roles?: {
        id: number;
        /** null/undefined: role toàn hệ thống; số: thuộc shop (đặt sân thuê). */
        tenantId?: number | null;
        name: string;
        description?: string;
        permissions?: {
            id: number;
            name: string;
            description?: string;
        }[];
    }[];
    /** Số tenant đang gắn; &gt;0 thì mở /admin dù global role là VIEW. */
    linkedTenantCount?: number | null;
}

export interface IUpdateAccountReq {
    name?: string | null;
    fullName?: string | null;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    notificationSoundEnabled?: boolean | null;
    notificationSoundPreset?: 'DEFAULT' | 'SOFT' | 'ALERT' | string | null;
}

export interface IUpdateAccountRes {
    user: {
        id: number;
        name?: string | null;
        fullName?: string | null;
        email: string;
        phoneNumber?: string | null;
        avatarUrl?: string | null;
        notificationSoundEnabled?: boolean | null;
        notificationSoundPreset?: 'DEFAULT' | 'SOFT' | 'ALERT' | string | null;
    }

}