import dayjs, { type Dayjs } from "dayjs";

/**
 * Lịch tiết ĐH tham chiếu (50 phút/tiết; nghỉ 5 phút, giữa tiết 2–3 và 7–8 nghỉ 10 phút).
 * Khớp bảng “SÁNG / CHIỀU” phổ biến (07:00–11:35 sáng, 13:00–17:35 chiều).
 */
export const UTB_DH_REFERENCE_PERIODS: ReadonlyArray<{
    slotNumber: number;
    session: "Sáng" | "Chiều";
    start: string;
    end: string;
}> = [
    { slotNumber: 1, session: "Sáng", start: "07:00", end: "07:50" },
    { slotNumber: 2, session: "Sáng", start: "07:55", end: "08:45" },
    { slotNumber: 3, session: "Sáng", start: "08:55", end: "09:45" },
    { slotNumber: 4, session: "Sáng", start: "09:50", end: "10:40" },
    { slotNumber: 5, session: "Sáng", start: "10:45", end: "11:35" },
    { slotNumber: 6, session: "Chiều", start: "13:00", end: "13:50" },
    { slotNumber: 7, session: "Chiều", start: "13:55", end: "14:45" },
    { slotNumber: 8, session: "Chiều", start: "14:55", end: "15:45" },
    { slotNumber: 9, session: "Chiều", start: "15:50", end: "16:40" },
    { slotNumber: 10, session: "Chiều", start: "16:45", end: "17:35" },
];

/** Phút nghỉ sau tiết 1…4 (sáng) / sau tiết 6…9 (chiều). */
export const UTB_DH_MORNING_GAP_BREAKS: readonly number[] = [5, 10, 5, 5];
export const UTB_DH_AFTERNOON_GAP_BREAKS: readonly number[] = [5, 10, 5, 5];

export type UtbDhFormShape = {
    useFlexibleBreaks: boolean;
    totalSlots: number;
    slotDuration: number;
    breakDuration: number;
    morningStart: Dayjs;
    morningEnd: Dayjs;
    afternoonStart: Dayjs;
    afternoonEnd: Dayjs;
    morningGapBreaks: number[];
    afternoonGapBreaks: number[];
};

/** Giá trị form mặc định khi tạo mới — trùng bảng tham chiếu. */
export function buildUtbDhOfficialFormValues(): UtbDhFormShape {
    return {
        useFlexibleBreaks: true,
        totalSlots: 10,
        slotDuration: 50,
        breakDuration: 5,
        morningStart: dayjs("07:00", "HH:mm"),
        morningEnd: dayjs("11:35", "HH:mm"),
        afternoonStart: dayjs("13:00", "HH:mm"),
        afternoonEnd: dayjs("17:35", "HH:mm"),
        morningGapBreaks: [...UTB_DH_MORNING_GAP_BREAKS],
        afternoonGapBreaks: [...UTB_DH_AFTERNOON_GAP_BREAKS],
    };
}
