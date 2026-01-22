export type PitchStatusEnum = "ACTIVE" | "MAINTENANCE";// đang HD, đang bảo trì
export type PitchTypeEnum = "THREE" | "SEVEN"; // 3 hoặc 7

export interface IPitch {
    id: number;
    name?: string | null;
    pitchType: PitchTypeEnum;
    pricePerHour: number;
    pitchUrl?: string | null;
    openTime?: boolean | null;
    closeTime?: boolean | null;
    open24h?: boolean | null;
    status: PitchStatusEnum;
    address?: string | null;
    createdAt: string;
    updatedAt: string | null;
    createdBy: string;
    updatedBy: string | null;
}