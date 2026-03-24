import type { AssetUsageStatus, AssetUsageType } from './assetUsage';

/** Tình trạng sau khi dùng — db.md DeviceCondition */
export type DeviceCondition = 'GOOD' | 'DAMAGED' | 'BROKEN' | 'LOST';

export interface IDeviceReturn {
    id: number;
    checkoutId: number;
    assetUsageId?: number | null;
    userId?: number | null;
    userName?: string | null;
    userEmail?: string | null;
    assetId?: number | null;
    assetName?: string | null;
    usageType?: AssetUsageType;
    usageDate?: string;
    startTime?: string;
    endTime?: string;
    receiveTime?: string | null;
    returnTime: string;
    deviceStatus: DeviceCondition;
    quantityReturnedGood?: number | null;
    quantityLost?: number | null;
    quantityDamaged?: number | null;
    borrowerSignName?: string | null;
    staffSignName?: string | null;
    returnerNameSnapshot?: string | null;
    returnerPhoneSnapshot?: string | null;
    receiverNameSnapshot?: string | null;
    receiverPhoneSnapshot?: string | null;
    returnConditionNote?: string | null;
    returnReportPrintOptIn?: boolean | null;
    createdAt: string;
    updatedAt?: string | null;
    createdBy: string;
    updatedBy?: string | null;
    assetUsageStatus?: AssetUsageStatus;
    subject?: string | null;
    checkoutConditionNote?: string | null;
}

export interface ICreateDeviceReturnReq {
    checkoutId: number;
    returnTime?: string | null;
    deviceStatus: DeviceCondition;
    quantityReturnedGood?: number | null;
    quantityLost?: number | null;
    quantityDamaged?: number | null;
    /** Snapshot tên người trả (ưu tiên input, fallback user ở backend). */
    returnerName?: string | null;
    /** Snapshot SĐT người trả (ưu tiên input, fallback user/contact ở backend). */
    returnerPhone?: string | null;

    /** Họ tên người nhận thiết bị tại sân (bắt buộc theo backend). */
    receiverName: string;
    /** SĐT người nhận thiết bị tại sân (bắt buộc theo backend). */
    receiverPhone: string;

    /** Ghi chú biên bản khi trả phòng. */
    returnConditionNote?: string | null;

    /** Tùy chọn in/lưu biên bản trả phòng. */
    returnReportPrintOptIn?: boolean | null;

    /** Họ tên người mượn ký xác nhận khi có mất/hỏng. */
    borrowerSignName?: string | null;
    /** Họ tên nhân viên / bên giao nhận ký xác nhận khi có mất/hỏng. */
    staffSignName?: string | null;
}

export interface IUpdateDeviceReturnReq {
    returnTime: string;
    deviceStatus: DeviceCondition;
}
