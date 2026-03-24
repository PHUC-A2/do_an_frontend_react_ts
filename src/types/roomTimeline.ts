import type { SlotStatus } from './timeline';
import type { AssetUsageStatus } from './assetUsage';

/** Chế độ xem lịch phòng — khớp query backend PERIODS | FLEXIBLE. */
export type RoomTimelineMode = 'PERIODS' | 'FLEXIBLE';

/** Một tiết trong ngày (10 tiết) — trạng thái giống slot đặt sân. */
export interface IRoomPeriodSlot {
    periodIndex: number;
    label: string;
    start: string;
    end: string;
    status: SlotStatus;
    busyUsageStatus?: AssetUsageStatus | null;
}

export interface IRoomFlexibleSlot {
    start: string;
    end: string;
    status: SlotStatus;
    busyUsageStatus?: AssetUsageStatus | null;
}

/** Khoảng thời gian đã có đăng ký (AssetUsage) — chế độ giờ linh hoạt. */
export interface IRoomBusyInterval {
    start: string;
    end: string;
    status?: AssetUsageStatus | null;
}

/** DTO timeline phòng tin — khớp ResAssetRoomTimelineDTO (Java). */
export interface IAssetRoomTimeline {
    date: string;
    assetId: number;
    mode: RoomTimelineMode;
    openTime: string;
    closeTime: string;
    slotMinutes: number;
    periods: IRoomPeriodSlot[];
    slots: IRoomFlexibleSlot[];
    flexibleViewStart: string;
    flexibleViewEnd: string;
    busyIntervals: IRoomBusyInterval[];
}
