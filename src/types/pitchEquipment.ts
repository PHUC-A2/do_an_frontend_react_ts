export type EquipmentMobilityEnum = "FIXED" | "MOVABLE";

export interface IPitchEquipment {
    id: number;
    pitchId: number;
    equipmentId: number;
    equipmentName: string;
    equipmentImageUrl?: string | null;
    quantity: number;
    specification?: string | null;
    note?: string | null;
    equipmentMobility: EquipmentMobilityEnum;
    equipmentAvailableQuantity?: number | null;
    equipmentStatus?: string | null;
    equipmentConditionNote?: string | null;
}

/** Một sân đang gắn thiết bị (API GET /equipments/:id/pitch-assignments). */
export interface IEquipmentPitchAssignment {
    pitchEquipmentId: number;
    pitchId: number;
    pitchName: string;
    quantity: number;
    equipmentMobility: EquipmentMobilityEnum;
    specification?: string | null;
    note?: string | null;
}

export interface IUpsertPitchEquipmentReq {
    equipmentId: number;
    quantity: number;
    specification?: string | null;
    note?: string | null;
    equipmentMobility?: EquipmentMobilityEnum;
}
