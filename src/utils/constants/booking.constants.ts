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
    CONFIRMED: {
        label: "Đã xác nhận",
        color: "cyan",
    },
    PAID: {
        label: "Đã thanh toán",
        color: "green",
    },
    CHECKIN: {
        label: "Đã check-in",
        color: "blue",
    },
    COMPLETED: {
        label: "Hoàn tất",
        color: "success",
    },
    CANCELLED: {
        label: "Đã hủy",
        color: "error",
    },
    NO_SHOW: {
        label: "Vắng mặt",
        color: "default",
    },
} as const satisfies Record<
    BookingStatusEnum,
    { label: string; color: "gold" | "processing" | "cyan" | "green" | "blue" | "success" | "error" | "default" }
>;

export const BOOKING_STATUS_OPTIONS = Object.entries(BOOKING_STATUS_META).map(
    ([value, meta]) => ({
        value: value as BookingStatusEnum,
        label: meta.label,
    })
);

export const getBookingStatusMeta = (status: BookingStatusEnum) =>
    BOOKING_STATUS_META[status];
