/** Trạng thái / loại — khớp enum Java AssetUsage (bảng asset_usages), khác booking sân. */
export type AssetUsageStatus =
    | 'PENDING'
    | 'APPROVED'
    | 'REJECTED'
    | 'IN_PROGRESS'
    | 'COMPLETED'
    | 'CANCELLED';

export type AssetUsageType = 'RENT' | 'BORROW';

export interface IAssetUsage {
    id: number;
    userId: number;
    userName?: string | null;
    userEmail?: string | null;
    assetId: number;
    assetName?: string | null;
    usageType: AssetUsageType;
    date: string;
    startTime: string;
    endTime: string;
    subject: string;
    status: AssetUsageStatus;
    createdAt: string;
    updatedAt?: string | null;
    createdBy: string;
    updatedBy?: string | null;
}

export interface ICreateAssetUsageReq {
    userId: number;
    assetId: number;
    usageType: AssetUsageType;
    date: string;
    startTime: string;
    endTime: string;
    subject: string;
    status?: AssetUsageStatus;
}

export interface IUpdateAssetUsageReq {
    userId: number;
    assetId: number;
    usageType: AssetUsageType;
    date: string;
    startTime: string;
    endTime: string;
    subject: string;
    status: AssetUsageStatus;
}
