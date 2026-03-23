/** Trạng thái / loại — khớp enum Java device (bảng devices) */
export type DeviceStatus = 'AVAILABLE' | 'IN_USE' | 'BORROWED' | 'MAINTENANCE' | 'BROKEN' | 'LOST';
export type DeviceType = 'FIXED' | 'MOVABLE';

export interface IDevice {
    id: number;
    assetId: number;
    assetName?: string | null;
    deviceName: string;
    quantity: number;
    status: DeviceStatus;
    deviceType: DeviceType;
    /** Tên file ảnh minh họa thiết bị (tùy chọn) để ghép /storage/device/. */
    imageUrl?: string | null;
    createdAt: string;
    updatedAt?: string | null;
    createdBy: string;
    updatedBy?: string | null;
}

export interface ICreateDeviceReq {
    assetId: number;
    deviceName: string;
    quantity: number;
    status: DeviceStatus;
    deviceType: DeviceType;
    /** Tên file ảnh minh họa thiết bị (tùy chọn). */
    imageUrl?: string | null;
}

export interface IUpdateDeviceReq {
    assetId: number;
    deviceName: string;
    quantity: number;
    status: DeviceStatus;
    deviceType: DeviceType;
    /** Tên file ảnh minh họa thiết bị (tùy chọn). */
    imageUrl?: string | null;
}
