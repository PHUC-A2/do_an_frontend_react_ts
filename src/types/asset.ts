/** Khớp enum backend AssetRoomFeeMode. */
export type AssetRoomFeeMode = 'FREE' | 'PAID';

/** Bản ghi tài sản — đồng bộ field với ResAssetListDTO / ResAssetDetailDTO backend */
export interface IAsset {
    id: number;
    assetName: string;
    /** Tên người phụ trách phòng (lấy từ lúc admin tạo tài sản/room). */
    responsibleName?: string | null;
    location?: string | null;
    capacity?: number | null;
    openTime?: string | null;
    closeTime?: string | null;
    open24h?: boolean | null;
    /** Miễn phí / có phí khi đặt phòng — admin cấu hình (AssetRoomFeeMode). */
    roomFeeMode?: AssetRoomFeeMode | null;
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
    /** Tên người phụ trách phòng (tùy chọn). */
    responsibleName?: string | null;
    location?: string | null;
    capacity?: number | null;
    openTime?: string | null;
    closeTime?: string | null;
    open24h?: boolean | null;
    roomFeeMode?: AssetRoomFeeMode | null;
    assetsUrl?: string | null;
}

/** Payload cập nhật — map ReqUpdateAssetDTO */
export interface IUpdateAssetReq {
    assetName: string;
    /** Tên người phụ trách phòng (tùy chọn). */
    responsibleName?: string | null;
    location?: string | null;
    capacity?: number | null;
    openTime?: string | null;
    closeTime?: string | null;
    open24h?: boolean | null;
    roomFeeMode?: AssetRoomFeeMode | null;
    assetsUrl?: string | null;
}
