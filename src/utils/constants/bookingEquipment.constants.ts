import type { BookingEquipmentStatusEnum } from '../../types/bookingEquipment';

export const BOOKING_EQUIPMENT_STATUS_META: Record<BookingEquipmentStatusEnum, { label: string; color: string; description?: string }> = {
    BORROWED: { label: 'Đang mượn', color: 'blue' },
    RETURNED: { label: 'Đã trả', color: 'green' },
    LOST: { label: 'Mất', color: 'red', description: 'Thiết bị bị mất — phải đền tiền theo đơn giá' },
    DAMAGED: { label: 'Hỏng', color: 'orange', description: 'Thiết bị bị hỏng — thiết bị bị loại khỏi kho' },
};

export const BOOKING_EQUIPMENT_STATUS_OPTIONS: { value: BookingEquipmentStatusEnum; label: string; danger?: boolean }[] = [
    { value: 'RETURNED', label: 'Đã trả' },
    { value: 'LOST', label: 'Báo mất (phải đền tiền)', danger: true },
    { value: 'DAMAGED', label: 'Báo hỏng', danger: true },
];
