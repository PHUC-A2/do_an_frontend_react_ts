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

export type SlotStatus = "PAST" | "FREE" | "PENDING" | "BOOKED" | "BOOKED_BY_OTHER";
