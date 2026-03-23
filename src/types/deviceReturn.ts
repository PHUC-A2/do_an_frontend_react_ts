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
}

export interface IUpdateDeviceReturnReq {
    returnTime: string;
    deviceStatus: DeviceCondition;
}
