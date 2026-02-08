import type { BookingStatusEnum, ShirtOptionEnum } from "../../types/booking";

export const SHIRT_OPTION_META: Record<
    ShirtOptionEnum,
    { label: string; color: string }
> = {
    WITH_PITCH_SHIRT: {
        label: "Có lấy áo",
        color: "blue",
    },
    WITHOUT_PITCH_SHIRT: {
        label: "Không lấy áo",
        color: "warning",
    },
};

// Select options (dùng cho Form / Select)
export const SHIRT_OPTION_OPTIONS = Object.entries(SHIRT_OPTION_META).map(
    ([value, meta]) => ({
        value: value as ShirtOptionEnum,
        label: meta.label,
    })
);

// Helper lấy meta
export const getShirtOptionMeta = (option: ShirtOptionEnum) =>
    SHIRT_OPTION_META[option];

/**
 * Ví dụ với antd
 * 
import { Tag } from "antd";
import { getShirtOptionMeta } from "@/utils/constants/shirt.constants";

const meta = getShirtOptionMeta(booking.shirtOption);

<Tag color={meta.color}>{meta.label}</Tag>

 * 
 */

export const BOOKING_STATUS_META: Record<
    BookingStatusEnum,
    { label: string; color: string }
> = {
    ACTIVE: {
        label: "Đang hoạt động",
        color: "success",
    },
    CANCELLED: {
        label: "Đã hủy",
        color: "error",
    },
};

export const BOOKING_STATUS_OPTIONS = Object.entries(BOOKING_STATUS_META).map(
    ([value, meta]) => ({
        value: value as BookingStatusEnum,
        label: meta.label,
    })
);

export const getBookingStatusMeta = (status: BookingStatusEnum) =>
    BOOKING_STATUS_META[status];
