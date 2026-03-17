// payment.ts
export type PaymentStatusEnum = "PENDING" | "PAID" | "CANCELLED";

export type PaymentMethodEnum = "BANK_TRANSFER" | "CASH";

export interface IPayment {
    id: number;
    bookingId: number;
    proofUrl?: string | null;
    paymentCode: string;
    amount: number;
    content: string;
    status: PaymentStatusEnum;
    method: PaymentMethodEnum;
    // user info
    userId?: number | null;
    userName?: string | null;
    userFullName?: string | null;
    userEmail?: string | null;
    userPhone?: string | null;
    userAvatarUrl?: string | null;
    // booking info
    pitchName?: string | null;
    contactPhone?: string | null;
    bookingStart?: string | null;
    bookingEnd?: string | null;
    paidAt?: string | null;
    createdAt: string;
    updatedAt?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
}

export interface ICreatePaymentReq {
    bookingId: number;
    method: PaymentMethodEnum; // "BANK_TRANSFER" | "CASH"
}

export interface IPaymentRes {
    paymentId: number;
    paymentCode: string;
    bankCode: string;
    accountNo: string;
    accountName: string;
    amount: number;
    content: string;
    vietQrUrl: string;
}
