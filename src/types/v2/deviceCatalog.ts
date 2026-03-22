export type DeviceCatalogDeviceType =
    | "COMPUTER"
    | "SPEAKER"
    | "MICROPHONE"
    | "PROJECTOR"
    | "WHITEBOARD"
    | "DESK"
    | "CHAIR"
    | "OTHER";

export type DeviceCatalogMobilityType = "FIXED" | "MOVABLE";

export type DeviceCatalogStatus = "ACTIVE" | "INACTIVE";

export interface IDeviceCatalog {
    id: number;
    deviceName: string;
    deviceType: DeviceCatalogDeviceType;
    mobilityType: DeviceCatalogMobilityType;
    description?: string | null;
    imageUrl?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    status: DeviceCatalogStatus;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
}

export interface ICreateDeviceCatalogRequest {
    deviceName: string;
    deviceType: DeviceCatalogDeviceType;
    mobilityType: DeviceCatalogMobilityType;
    description?: string | null;
    imageUrl?: string | null;
    manufacturer?: string | null;
    model?: string | null;
    status: DeviceCatalogStatus;
}

export type IUpdateDeviceCatalogRequest = ICreateDeviceCatalogRequest;
