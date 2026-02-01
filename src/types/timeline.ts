// timeline.ts
export interface IPitchTimeline {
    openTime: string;
    closeTime: string;
    slotMinutes: number;
    slots: {
        start: string;
        end: string;
        status: SlotStatus;
    }[];
}

export type SlotStatus = "FREE" | "BUSY";
