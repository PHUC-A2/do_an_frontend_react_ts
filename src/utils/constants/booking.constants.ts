import type { BookingStatusEnum } from "../../types/booking";

export const BOOKING_STATUS_META = {
    PENDING: {
        label: "Chờ xác nhận",
        color: "gold",
    },
    CONFIRMED: {
        label: "Đã xác nhận",
        color: "blue",
    },
    ACTIVE: {
        label: "Đang hoạt động",
        color: "processing",
    },
    CHECKIN: {
        label: "Đã check-in",
        color: "cyan",
    },
    PAID: {
        label: "Đã thanh toán",
        color: "green",
    },
    COMPLETED: {
        label: "Hoàn thành",
        color: "default",
    },
    NO_SHOW: {
        label: "Không đến",
        color: "default",
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
