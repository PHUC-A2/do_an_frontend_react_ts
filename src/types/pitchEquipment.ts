export interface IPitchEquipment {
    id: number;
    pitchId: number;
    equipmentId: number;
    equipmentName: string;
    equipmentImageUrl?: string | null;
    quantity: number;
    specification?: string | null;
    note?: string | null;
}

export interface IUpsertPitchEquipmentReq {
    equipmentId: number;
    quantity: number;
    specification?: string | null;
    note?: string | null;
}
