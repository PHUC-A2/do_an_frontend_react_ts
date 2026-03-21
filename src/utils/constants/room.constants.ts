import type { IRoomStatus } from "../../types/v2/room";

export const ROOM_STATUS_META: Record<
    IRoomStatus,
    { label: string; color: string }
> = {
    ACTIVE: { label: "Hoạt động", color: "green" },
    INACTIVE: { label: "Ngưng", color: "default" },
    MAINTENANCE: { label: "Bảo trì", color: "orange" },
};

export const ROOM_STATUS_OPTIONS: { label: string; value: IRoomStatus }[] = [
    { label: "Hoạt động", value: "ACTIVE" },
    { label: "Ngưng", value: "INACTIVE" },
    { label: "Bảo trì", value: "MAINTENANCE" },
];
