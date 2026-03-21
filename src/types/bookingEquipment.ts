import type { EquipmentMobilityEnum } from "./pitchEquipment";

export type BookingEquipmentStatusEnum = "BORROWED" | "RETURNED" | "LOST" | "DAMAGED";

export interface IBookingEquipment {
    id: number;
    bookingId: number;
    equipmentId: number;
    equipmentName: string;
    equipmentImageUrl?: string | null;
    quantity: number;
    status: BookingEquipmentStatusEnum;
    penaltyAmount: number;
    equipmentPrice: number;
    deletedByClient: boolean;
    equipmentMobility?: EquipmentMobilityEnum | null;
    borrowConditionNote?: string | null;
    returnConditionNote?: string | null;
    /** Sau khi hoàn tất trả — đồng bộ với biên bản in */
    quantityReturnedGood?: number;
    quantityLost?: number;
    quantityDamaged?: number;
    borrowerSignName?: string | null;
    staffSignName?: string | null;
    /** Họ tên người đặt (snapshot khi hoàn tất trả) — backend lưu, dùng khi in biên bản */
    bookingBorrowerSnapshot?: string | null;
}

export interface ICreateBookingEquipmentReq {
    bookingId: number;
    equipmentId: number;
    quantity: number;
    equipmentMobility: EquipmentMobilityEnum;
    borrowConditionNote?: string | null;
}

export interface IUpdateBookingEquipmentStatusReq {
    status: BookingEquipmentStatusEnum;
    returnConditionNote?: string | null;
    /** Nếu gửi ít nhất một trường — backend kiểm đếm chi tiết (tổng = SL mượn). */
    quantityReturnedGood?: number;
    quantityLost?: number;
    quantityDamaged?: number;
    borrowerSignName?: string | null;
    staffSignName?: string | null;
}

export interface IEquipmentBorrowLog {
    id: number;
    bookingEquipmentId: number;
    bookingId: number;
    equipmentId: number;
    equipmentName: string;
    logType: "BORROW" | "RETURN";
    notes?: string | null;
    createdAt: string;
    createdBy: string;
}

export interface IEquipmentUsageRow {
    id: number;
    name: string;
    borrowCount: number;
}

export interface IEquipmentUsageStats {
    byEquipment: IEquipmentUsageRow[];
    byPitch: IEquipmentUsageRow[];
}
