import type { AssetUsageStatus, AssetUsageType } from '../../types/assetUsage';

export const ASSET_USAGE_STATUS_META: Record<AssetUsageStatus, { label: string; color: string }> = {
    PENDING: { label: 'Chờ duyệt', color: 'default' },
    APPROVED: { label: 'Đã duyệt', color: 'success' },
    REJECTED: { label: 'Từ chối', color: 'error' },
    IN_PROGRESS: { label: 'Đang dùng', color: 'processing' },
    COMPLETED: { label: 'Hoàn thành', color: 'blue' },
    CANCELLED: { label: 'Hủy', color: 'default' },
};

export const ASSET_USAGE_TYPE_META: Record<AssetUsageType, { label: string; color: string }> = {
    RENT: { label: 'Thuê (có phí)', color: 'gold' },
    BORROW: { label: 'Mượn (0đ)', color: 'cyan' },
};

export const ASSET_USAGE_STATUS_OPTIONS = (Object.keys(ASSET_USAGE_STATUS_META) as AssetUsageStatus[]).map((v) => ({
    value: v,
    label: ASSET_USAGE_STATUS_META[v].label,
}));

export const ASSET_USAGE_TYPE_OPTIONS = (Object.keys(ASSET_USAGE_TYPE_META) as AssetUsageType[]).map((v) => ({
    value: v,
    label: ASSET_USAGE_TYPE_META[v].label,
}));
