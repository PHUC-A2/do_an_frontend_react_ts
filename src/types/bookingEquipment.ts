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
    /** Khách xác nhận đã kiểm tra tình trạng khi mượn */
    borrowConditionAcknowledged?: boolean;
    /** Khách chọn in/lưu biên bản mượn */
    borrowReportPrintOptIn?: boolean;
    /** Người trả thực tế (snapshot sau khi trả) */
    returnerNameSnapshot?: string | null;
    returnerPhoneSnapshot?: string | null;
    returnReportPrintOptIn?: boolean | null;
    /** Người nhận phía sân */
    receiverNameSnapshot?: string | null;
    receiverPhoneSnapshot?: string | null;
    returnAdminConfirmed?: boolean;
    returnAdminConfirmedAt?: string | null;
    returnAdminConfirmedBy?: string | null;
}

export interface ICreateBookingEquipmentReq {
    bookingId: number;
    equipmentId: number;
    quantity: number;
    equipmentMobility: EquipmentMobilityEnum;
    borrowConditionNote?: string | null;
    borrowConditionAcknowledged?: boolean;
    borrowReportPrintOptIn?: boolean;
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
    returnerName?: string | null;
    returnerPhone?: string | null;
    receiverName?: string | null;
    receiverPhone?: string | null;
    returnReportPrintOptIn?: boolean | null;
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
    /** Email tài khoản ghi log (nếu có) */
    createdBy?: string | null;
    bookingUserName?: string | null;
    bookingUserPhone?: string | null;
    pitchName?: string | null;
    actorName?: string | null;
    actorPhone?: string | null;
    borrowConditionAcknowledged?: boolean | null;
    borrowReportPrintOptIn?: boolean | null;
    returnerNameSnapshot?: string | null;
    returnerPhoneSnapshot?: string | null;
    returnReportPrintOptIn?: boolean | null;
    receiverNameSnapshot?: string | null;
    receiverPhoneSnapshot?: string | null;
    returnAdminConfirmed?: boolean | null;
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
