import type { AssetUsageStatus, AssetUsageType } from './assetUsage';

/** Phiếu nhận tài sản — map bảng checkouts + thông tin AssetUsage kèm list/detail. */
export interface ICheckout {
    id: number;
    assetUsageId: number;
    userId?: number | null;
    userName?: string | null;
    userEmail?: string | null;
    assetId?: number | null;
    assetName?: string | null;
    usageType?: AssetUsageType;
    usageDate?: string;
    startTime?: string;
    endTime?: string;
    subject?: string | null;
    assetUsageStatus?: AssetUsageStatus;
    receiveTime: string;
    conditionNote?: string | null;
    createdAt: string;
    updatedAt?: string | null;
    createdBy: string;
    updatedBy?: string | null;
}

export interface ICreateCheckoutReq {
    assetUsageId: number;
    receiveTime?: string | null;
    conditionNote?: string | null;
}

export interface IUpdateCheckoutReq {
    receiveTime: string;
    conditionNote?: string | null;
}
