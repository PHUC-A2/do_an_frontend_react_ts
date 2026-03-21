import type { BookingStatusEnum } from "../../types/booking";

export const BOOKING_STATUS_META = {
    PENDING: {
        label: "Chờ xác nhận",
        color: "gold",
    },
    ACTIVE: {
        label: "Đang hoạt động",
        color: "processing",
    },
    PAID: {
        label: "Đã thanh toán",
        color: "green",
    },
    CANCELLED: {
        label: "Đã hủy",
        color: "error",
    },
} as const;

export const BOOKING_STATUS_OPTIONS = Object.entries(BOOKING_STATUS_META).map(
    ([value, meta]) => ({
        value: value as BookingStatusEnum,
        label: meta.label,
    })
);

export const getBookingStatusMeta = (status: BookingStatusEnum) =>
    BOOKING_STATUS_META[status];
