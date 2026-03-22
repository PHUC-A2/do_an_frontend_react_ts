/** Cấu hình lịch tiết phòng (API v2). */
export interface ISlotPreviewV2 {
    slotNumber: number;
    startTime: string;
    endTime: string;
}

export interface IRoomScheduleV2 {
    id: number;
    roomId: number;
    totalSlots: number;
    slotDuration: number;
    breakDuration: number;
    /** Nghỉ sau từng tiết (sáng); null/undefined = đồng đều theo breakDuration */
    morningGapBreaks?: number[] | null;
    afternoonGapBreaks?: number[] | null;
    morningStart: string;
    morningEnd: string;
    afternoonStart: string;
    afternoonEnd: string;
    isActive: boolean;
    createdAt?: string;
    updatedAt?: string;
    slots?: ISlotPreviewV2[];
}

export interface ICreateScheduleRequestV2 {
    totalSlots: number;
    slotDuration: number;
    breakDuration: number;
    morningStart: string;
    morningEnd: string;
    afternoonStart: string;
    afternoonEnd: string;
    morningGapBreaks?: number[];
    afternoonGapBreaks?: number[];
}

export type IUpdateScheduleRequestV2 = ICreateScheduleRequestV2;
