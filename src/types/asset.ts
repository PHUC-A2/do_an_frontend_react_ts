/** Bản ghi tài sản — đồng bộ field với ResAssetListDTO / ResAssetDetailDTO backend */
export interface IAsset {
    id: number;
    assetName: string;
    location?: string | null;
    capacity?: number | null;
    /** URL ảnh tài sản (upload giống avatar user) */
    assetsUrl?: string | null;
    createdAt: string;
    updatedAt?: string | null;
    createdBy: string;
    updatedBy?: string | null;
}

/** Payload tạo mới — map ReqCreateAssetDTO */
export interface ICreateAssetReq {
    assetName: string;
    location?: string | null;
    capacity?: number | null;
    assetsUrl?: string | null;
}

/** Payload cập nhật — map ReqUpdateAssetDTO */
export interface IUpdateAssetReq {
    assetName: string;
    location?: string | null;
    capacity?: number | null;
    assetsUrl?: string | null;
}
