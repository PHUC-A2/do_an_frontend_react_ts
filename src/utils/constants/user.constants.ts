// user.constants.ts
import type { UserEnum } from "../../types/user";

export const USER_STATUS_META: Record<UserEnum, { label: string; color: string }> = {
    ACTIVE: { label: "Đang hoạt động", color: "green" },
    INACTIVE: { label: "Ngừng hoạt động", color: "volcano" },
    PENDING_VERIFICATION: { label: "Chờ xác thực", color: "gold" },
    BANNED: { label: "Bị khóa", color: "red" },
    DELETED: { label: "Đã xóa", color: "gray" },
};

// Select options (dùng cho Form / Select)
export const USER_STATUS_OPTIONS = Object.entries(USER_STATUS_META).map(
    ([value, meta]) => ({
        value: value as UserEnum,
        label: meta.label,
    })
);

export const getUserStatusMeta = (status: UserEnum) =>
    USER_STATUS_META[status];
