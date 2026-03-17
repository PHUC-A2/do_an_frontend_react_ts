import type { EquipmentStatusEnum } from '../../types/equipment';

export const EQUIPMENT_STATUS_META: Record<EquipmentStatusEnum, { label: string; color: string }> = {
    ACTIVE: { label: 'Hoạt động', color: 'green' },
    MAINTENANCE: { label: 'Bảo trì', color: 'orange' },
    INACTIVE: { label: 'Ngừng dùng', color: 'red' },
};

export const EQUIPMENT_STATUS_OPTIONS = [
    { value: 'ACTIVE', label: 'Hoạt động' },
    { value: 'MAINTENANCE', label: 'Bảo trì' },
    { value: 'INACTIVE', label: 'Ngừng dùng' },
];
