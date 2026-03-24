import type { AssetRoomFeeMode } from '../../types/asset';

/** Lựa chọn form admin — đồng bộ ReqCreate/Update Asset. */
export const ASSET_ROOM_FEE_MODE_OPTIONS: { value: AssetRoomFeeMode; label: string }[] = [
    { value: 'FREE', label: 'Miễn phí' },
    { value: 'PAID', label: 'Có phí' },
];

/** Nhãn hiển thị client đặt phòng / lịch sử (tiếng Việt). */
export const ASSET_ROOM_FEE_MODE_META: Record<
    AssetRoomFeeMode,
    { estimateLine: string; footerLine: string; popconfirmShort: string; historyTotal: string }
> = {
    FREE: {
        estimateLine: '💰 Tạm tính: Miễn phí',
        footerLine: 'Miễn phí / buổi',
        popconfirmShort: 'Miễn phí',
        historyTotal: 'Miễn phí',
    },
    PAID: {
        estimateLine: '💰 Tạm tính: Có phí (theo quy định)',
        footerLine: 'Có phí / buổi',
        popconfirmShort: 'Có phí',
        historyTotal: 'Có phí (theo quy định)',
    },
};

/** API cũ / null → coi như miễn phí. */
export const resolveAssetRoomFeeMode = (v: AssetRoomFeeMode | null | undefined): AssetRoomFeeMode =>
    v === 'PAID' ? 'PAID' : 'FREE';

/** Đăng ký sử dụng: ưu tiên phí lưu trên AssetUsage, sau đó mới tới cấu hình phòng. */
export const resolveUsageBookingFeeMode = (row: {
    usageFeeMode?: AssetRoomFeeMode | null;
    assetRoomFeeMode?: AssetRoomFeeMode | null;
}): AssetRoomFeeMode => resolveAssetRoomFeeMode(row.usageFeeMode ?? row.assetRoomFeeMode);
