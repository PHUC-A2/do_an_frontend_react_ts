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
    /** Tên người phụ trách phòng — lấy từ Asset.responsibleName. */
    assetResponsibleName?: string | null;
    /** Ảnh minh họa phòng/tài sản (Asset.assetsUrl). */
    assetAssetsUrl?: string | null;
    usageType: AssetUsageType;
    /** SĐT liên hệ của user (để ghi vào biên bản). */
    contactPhone?: string | null;
    date: string;
    startTime: string;
    endTime: string;
    subject: string;
    /** Ghi chú (ví dụ: Sinh viên lớp K63 CNTT A...) gắn theo booking để in vào biên bản. */
    bookingNote?: string | null;
    /**
     * JSON string lưu các dòng thiết bị được chọn mượn kèm booking.
     * Shape dự kiến: [{deviceId, quantity, deviceType, deviceNote?, deviceImageUrl?}, ...]
     */
    borrowDevicesJson?: string | null;
    /** Xác nhận đã kiểm tra tình trạng thiết bị trước khi gửi yêu cầu. */
    borrowConditionAcknowledged?: boolean | null;
    /** Tùy chọn in/lưu biên bản nhận phòng (đọc xong thì tick). */
    borrowReportPrintOptIn?: boolean | null;
    /** Ghi chú chung tình trạng thiết bị khi mượn. */
    borrowNote?: string | null;
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

/** Payload đặt phòng cho client (backend tự lấy user theo JWT). */
export interface ICreateClientRoomBookingReq {
    assetId: number;
    date: string;
    startTime: string;
    endTime: string;
    subject: string;
    /** SĐT liên hệ để đưa vào biên bản nhận/trả phòng. */
    contactPhone?: string | null;
    /** Ghi chú chung của user (dùng cho biên bản). */
    bookingNote?: string | null;
    /**
     * JSON string lưu thông tin thiết bị user chọn mượn kèm booking.
     * Lưu ở backend để khi tạo checkout/return vẫn in lại đúng.
     */
    borrowDevicesJson?: string | null;
    /** Ghi chú chung tình trạng thiết bị khi mượn. */
    borrowNote?: string | null;
    /** Xác nhận đã kiểm tra tình trạng trước khi gửi yêu cầu mượn. */
    borrowConditionAcknowledged?: boolean | null;
    /** Tùy chọn in biên bản nhận phòng khi user xác nhận. */
    borrowReportPrintOptIn?: boolean | null;
}

/** Payload cập nhật đặt phòng của chính client. */
export interface IUpdateClientRoomBookingReq {
    /** Mục đích sử dụng + mốc thời gian vẫn giống luồng cũ. */
    date: string;
    startTime: string;
    endTime: string;
    subject: string;
    /** Các field mới (tùy chọn) để đồng bộ biên bản mượn/trả. */
    contactPhone?: string | null;
    bookingNote?: string | null;
    borrowDevicesJson?: string | null;
    borrowNote?: string | null;
    borrowConditionAcknowledged?: boolean | null;
    borrowReportPrintOptIn?: boolean | null;
}
