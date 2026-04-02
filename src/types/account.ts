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
    roles?: {
        id: number;
        name: string;
        description?: string;
        permissions?: {
            id: number;
            name: string;
            description?: string;
        }[];
    }[];
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