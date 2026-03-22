import type { DefaultOptionType } from "antd/es/select";
import type { DeviceCatalogDeviceType, DeviceCatalogMobilityType, DeviceCatalogStatus } from "../../types/v2/deviceCatalog";

export const DEVICE_CATALOG_TYPE_LABEL: Record<DeviceCatalogDeviceType, string> = {
    COMPUTER: "Máy tính",
    SPEAKER: "Loa",
    MICROPHONE: "Micro",
    PROJECTOR: "Máy chiếu",
    WHITEBOARD: "Bảng trắng",
    DESK: "Bàn",
    CHAIR: "Ghế",
    OTHER: "Khác",
};

export const DEVICE_CATALOG_MOBILITY_LABEL: Record<DeviceCatalogMobilityType, string> = {
    FIXED: "Cố định",
    MOVABLE: "Lưu động",
};

export const DEVICE_CATALOG_STATUS_META: Record<
    DeviceCatalogStatus,
    { label: string; color: string }
> = {
    ACTIVE: { label: "Hoạt động", color: "green" },
    INACTIVE: { label: "Ngưng", color: "default" },
};

export const DEVICE_TYPE_SELECT_OPTIONS: DefaultOptionType[] = (
    Object.entries(DEVICE_CATALOG_TYPE_LABEL) as [DeviceCatalogDeviceType, string][]
).map(([value, label]) => ({ value, label }));

export const MOBILITY_TYPE_SELECT_OPTIONS: DefaultOptionType[] = (
    Object.entries(DEVICE_CATALOG_MOBILITY_LABEL) as [DeviceCatalogMobilityType, string][]
).map(([value, label]) => ({ value, label }));

export const STATUS_SELECT_OPTIONS: DefaultOptionType[] = (
    Object.entries(DEVICE_CATALOG_STATUS_META) as [DeviceCatalogStatus, { label: string }][]
).map(([value, meta]) => ({ value, label: meta.label }));

/** Giá trị rỗng = không lọc theo cột đó */
export const FILTER_ALL_VALUE = "__all__";
