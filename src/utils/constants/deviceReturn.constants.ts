import type { DeviceCondition } from '../../types/deviceReturn';

export const DEVICE_CONDITION_META: Record<DeviceCondition, { label: string; color: string }> = {
    GOOD: { label: 'Bình thường', color: 'success' },
    DAMAGED: { label: 'Hư nhẹ', color: 'warning' },
    BROKEN: { label: 'Hỏng', color: 'error' },
    LOST: { label: 'Mất', color: 'default' },
};

export const DEVICE_CONDITION_OPTIONS = (Object.keys(DEVICE_CONDITION_META) as DeviceCondition[]).map((v) => ({
    value: v,
    label: DEVICE_CONDITION_META[v].label,
}));
