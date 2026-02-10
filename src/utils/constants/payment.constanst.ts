// payment.constanst.ts
import type { PaymentMethodEnum, PaymentStatusEnum } from "../../types/payment";

/* =========================
 * PAYMENT STATUS
 * ========================= */
export const PAYMENT_STATUS_META = {
    PENDING: {
        label: "Chờ xác nhận",
        color: "processing", // xanh nhạt – đang xử lý
    },
    PAID: {
        label: "Đã thanh toán",
        color: "green", // hoàn tất
    },
    CANCELLED: {
        label: "Đã hủy",
        color: "error",
    },
} as const;

// dùng cho Select / Filter
export const PAYMENT_STATUS_OPTIONS = Object.entries(PAYMENT_STATUS_META).map(
    ([value, meta]) => ({
        value: value as PaymentStatusEnum,
        label: meta.label,
    })
);

// helper
export const getPaymentStatusMeta = (status: PaymentStatusEnum) =>
    PAYMENT_STATUS_META[status];


/* =========================
 * PAYMENT METHOD
 * ========================= */
export const PAYMENT_METHOD_META = {
    BANK_TRANSFER: {
        label: "Chuyển khoản ngân hàng",
        color: "blue",
    },
    CASH: {
        label: "Tiền mặt",
        color: "gold",
    },
} as const;

// dùng cho Form Select
export const PAYMENT_METHOD_OPTIONS = Object.entries(PAYMENT_METHOD_META).map(
    ([value, meta]) => ({
        value: value as PaymentMethodEnum,
        label: meta.label,
    })
);

// helper
export const getPaymentMethodMeta = (method: PaymentMethodEnum) =>
    PAYMENT_METHOD_META[method];
