export type BookingEquipmentStatusEnum = "BORROWED" | "RETURNED" | "LOST" | "DAMAGED";

export interface IBookingEquipment {
    id: number;
    bookingId: number;
    equipmentId: number;
    equipmentName: string;
    equipmentImageUrl?: string | null;
    quantity: number;
    status: BookingEquipmentStatusEnum;
    penaltyAmount: number;   // tiền đền khi mất (0 nếu không phải LOST)
    equipmentPrice: number;  // đơn giá thiết bị
    deletedByClient: boolean;
}

export interface ICreateBookingEquipmentReq {
    bookingId: number;
    equipmentId: number;
    quantity: number;
}

export interface IUpdateBookingEquipmentStatusReq {
    status: BookingEquipmentStatusEnum;
}
