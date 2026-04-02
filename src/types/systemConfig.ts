export interface IAdminEmailSenderConfig {
    id: number;
    email: string;
    passwordMasked: string;
    active: boolean;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface IAdminBankAccountConfig {
    id: number;
    bankCode: string;
    accountNoMasked: string;
    accountNameMasked: string;
    active: boolean;
    createdAt: string | null;
    updatedAt: string | null;
}

export interface IAdminMessengerConfig {
    id: number;
    pageIdMasked: string;
    active: boolean;
    createdAt: string | null;
    updatedAt: string | null;
}

/** Cấu hình bảo mật bổ sung (admin). */
export interface ISecuritySettings {
    paymentConfirmationPinRequired: boolean;
}

export interface IPublicMessengerConfig {
    pageId: string;
}
