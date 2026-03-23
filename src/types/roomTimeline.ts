import type { SlotStatus } from './timeline';

/** Chế độ xem lịch phòng — khớp query backend PERIODS | FLEXIBLE. */
export type RoomTimelineMode = 'PERIODS' | 'FLEXIBLE';

/** Một tiết trong ngày (10 tiết) — trạng thái giống slot đặt sân. */
export interface IRoomPeriodSlot {
    periodIndex: number;
    label: string;
    start: string;
    end: string;
    status: SlotStatus;
}

/** Khoảng thời gian đã có đăng ký (AssetUsage) — chế độ giờ linh hoạt. */
export interface IRoomBusyInterval {
    start: string;
    end: string;
}

/** DTO timeline phòng tin — khớp ResAssetRoomTimelineDTO (Java). */
export interface IAssetRoomTimeline {
    date: string;
    assetId: number;
    mode: RoomTimelineMode;
    periods: IRoomPeriodSlot[];
    flexibleViewStart: string;
    flexibleViewEnd: string;
    busyIntervals: IRoomBusyInterval[];
}
