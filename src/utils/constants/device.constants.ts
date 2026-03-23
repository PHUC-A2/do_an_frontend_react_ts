import type { DeviceStatus, DeviceType } from '../../types/device';

/** Nhãn trạng thái thiết bị theo tài sản (bảng devices) */
export const DEVICE_STATUS_META: Record<
    DeviceStatus,
    { label: string; color: string }
> = {
    AVAILABLE: { label: 'Sẵn sàng', color: 'success' },
    IN_USE: { label: 'Đang sử dụng', color: 'processing' },
    BORROWED: { label: 'Đang mượn', color: 'blue' },
    MAINTENANCE: { label: 'Bảo trì', color: 'warning' },
    BROKEN: { label: 'Hỏng', color: 'error' },
    LOST: { label: 'Mất', color: 'default' },
};

export const DEVICE_TYPE_META: Record<DeviceType, { label: string; color: string }> = {
    FIXED: { label: 'Cố định theo TS', color: 'default' },
    MOVABLE: { label: 'Lưu động', color: 'cyan' },
};

export const DEVICE_STATUS_OPTIONS = (Object.keys(DEVICE_STATUS_META) as DeviceStatus[]).map((v) => ({
    value: v,
    label: DEVICE_STATUS_META[v].label,
}));

export const DEVICE_TYPE_OPTIONS = (Object.keys(DEVICE_TYPE_META) as DeviceType[]).map((v) => ({
    value: v,
    label: DEVICE_TYPE_META[v].label,
}));
