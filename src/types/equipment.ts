export type EquipmentStatusEnum = "ACTIVE" | "MAINTENANCE" | "INACTIVE" | "BROKEN" | "LOST";

export interface IEquipment {
    id: number;
    name: string;
    description?: string | null;
    totalQuantity: number;
    availableQuantity: number;
    price: number;
    imageUrl?: string | null;
    status: EquipmentStatusEnum;
    conditionNote?: string | null;
    createdAt: string;
    updatedAt: string | null;
    createdBy: string;
    updatedBy: string | null;
}

export interface ICreateEquipmentReq {
    name: string;
    description?: string | null;
    totalQuantity: number;
    price: number;
    imageUrl?: string | null;
    status?: EquipmentStatusEnum;
    conditionNote?: string | null;
}

export interface IUpdateEquipmentReq {
    name: string;
    description?: string | null;
    totalQuantity: number;
    price: number;
    imageUrl?: string | null;
    status: EquipmentStatusEnum;
    conditionNote?: string | null;
}
