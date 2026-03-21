import type { EquipmentStatusEnum } from '../../types/equipment';

export const EQUIPMENT_STATUS_META: Record<EquipmentStatusEnum, { label: string; color: string }> = {
    ACTIVE: { label: 'Hoạt động tốt', color: 'green' },
    MAINTENANCE: { label: 'Bảo trì', color: 'orange' },
    INACTIVE: { label: 'Ngừng dùng', color: 'default' },
    BROKEN: { label: 'Hỏng', color: 'red' },
    LOST: { label: 'Đã mất', color: 'magenta' },
};

export const EQUIPMENT_STATUS_OPTIONS = [
    { value: 'ACTIVE' as const, label: 'Hoạt động tốt' },
    { value: 'MAINTENANCE' as const, label: 'Bảo trì' },
    { value: 'INACTIVE' as const, label: 'Ngừng dùng' },
    { value: 'BROKEN' as const, label: 'Hỏng' },
    { value: 'LOST' as const, label: 'Đã mất' },
];
