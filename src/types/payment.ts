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
    paidAt?: string | null;
    createdAt: string;
}

export interface ICreatePaymentReq {
    bookingId: number;
    method: PaymentMethodEnum; // "BANK_TRANSFER" | "CASH"
}

export interface IPaymentRes {
    paymentCode: string;
    bankCode: string;
    accountNo: string;
    accountName: string;
    amount: number;
    content: string;
    vietQrUrl: string;
}
