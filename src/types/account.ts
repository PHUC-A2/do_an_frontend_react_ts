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