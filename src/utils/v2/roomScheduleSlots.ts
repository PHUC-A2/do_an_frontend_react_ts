import type { ICreateScheduleRequestV2, ISlotPreviewV2 } from "../../types/v2/roomSchedule";

function parseHm(s: string): number {
    const [h, m] = s.split(":").map((x) => Number(x));
    return h * 60 + m;
}

function fmtMin(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

type SlotRange = { start: number; end: number };

function gapMinutes(gapIndex: number, gapOverrides: number[] | null | undefined, uniformBreak: number): number {
    if (gapOverrides == null || gapOverrides.length === 0) {
        return uniformBreak;
    }
    if (gapIndex < gapOverrides.length) {
        return gapOverrides[gapIndex] as number;
    }
    return uniformBreak;
}

/** Xếp tối đa tiết trong khung; nghỉ sau tiết i dùng gapOverrides[i] hoặc nghỉ đồng đều. */
export function buildSlotsInWindow(
    windowStart: number,
    windowEnd: number,
    slotDuration: number,
    uniformBreak: number,
    gapOverrides: number[] | null | undefined
): SlotRange[] {
    const list: SlotRange[] = [];
    let t = windowStart;
    while (true) {
        const endSlot = t + slotDuration;
        if (endSlot > windowEnd) {
            break;
        }
        list.push({ start: t, end: endSlot });
        const gapAfter = gapMinutes(list.length - 1, gapOverrides, uniformBreak);
        t = endSlot + gapAfter;
    }
    return list;
}

/** Số ô nhập nghỉ (theo biên trên từ lịch nghỉ đồng đều) — đủ cho mọi lịch linh hoạt trong khung. */
export function countGapInputsUniform(input: ICreateScheduleRequestV2): { morning: number; afternoon: number } {
    const {
        slotDuration,
        breakDuration,
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
    } = input;
    const ms = parseHm(morningStart);
    const me = parseHm(morningEnd);
    const as = parseHm(afternoonStart);
    const ae = parseHm(afternoonEnd);
    const mSlots = buildSlotsInWindow(ms, me, slotDuration, breakDuration, null);
    const aSlots = buildSlotsInWindow(as, ae, slotDuration, breakDuration, null);
    return {
        morning: Math.max(0, mSlots.length - 1),
        afternoon: Math.max(0, aSlots.length - 1),
    };
}

/**
 * Đồng bộ logic với {@code RoomScheduleService#calculateSlots} (BE): ưu tiên buổi sáng trước.
 * Nếu có {@link ICreateScheduleRequestV2.morningGapBreaks} / {@link afternoonGapBreaks} (mảng không rỗng) thì dùng nghỉ linh hoạt.
 */
export function calculateSlotsPreview(input: ICreateScheduleRequestV2): ISlotPreviewV2[] {
    const {
        totalSlots,
        slotDuration,
        breakDuration,
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
        morningGapBreaks,
        afternoonGapBreaks,
    } = input;

    const ms = parseHm(morningStart);
    const me = parseHm(morningEnd);
    const as = parseHm(afternoonStart);
    const ae = parseHm(afternoonEnd);

    if (!(ms < me)) {
        return [];
    }
    if (!(as < ae)) {
        return [];
    }

    const mGaps = morningGapBreaks && morningGapBreaks.length > 0 ? morningGapBreaks : null;
    const aGaps = afternoonGapBreaks && afternoonGapBreaks.length > 0 ? afternoonGapBreaks : null;

    const morningSlots = buildSlotsInWindow(ms, me, slotDuration, breakDuration, mGaps);
    const afternoonSlots = buildSlotsInWindow(as, ae, slotDuration, breakDuration, aGaps);

    const mMax = morningSlots.length;
    const aMax = afternoonSlots.length;
    const lo = Math.max(0, totalSlots - aMax);
    const hi = Math.min(mMax, totalSlots);
    if (lo > hi) {
        return [];
    }
    const morningCount = hi;

    const result: ISlotPreviewV2[] = [];
    let n = 1;
    for (let i = 0; i < morningCount; i++) {
        const s = morningSlots[i];
        result.push({ slotNumber: n++, startTime: fmtMin(s.start), endTime: fmtMin(s.end) });
    }
    const afternoonCount = totalSlots - morningCount;
    for (let j = 0; j < afternoonCount; j++) {
        const s = afternoonSlots[j];
        result.push({ slotNumber: n++, startTime: fmtMin(s.start), endTime: fmtMin(s.end) });
    }
    return result;
}

/**
 * Số tiết gán buổi sáng / chiều (cùng logic {@link calculateSlotsPreview}).
 * Dùng để hiển thị nhãn “Sau tiết N” đúng số tiết cả ngày.
 */
export function splitMorningAfternoonSlotCounts(
    input: ICreateScheduleRequestV2
): { morning: number; afternoon: number } {
    const {
        totalSlots,
        slotDuration,
        breakDuration,
        morningStart,
        morningEnd,
        afternoonStart,
        afternoonEnd,
        morningGapBreaks,
        afternoonGapBreaks,
    } = input;

    const ms = parseHm(morningStart);
    const me = parseHm(morningEnd);
    const as = parseHm(afternoonStart);
    const ae = parseHm(afternoonEnd);

    if (!(ms < me) || !(as < ae)) {
        return { morning: 0, afternoon: 0 };
    }

    const mGaps = morningGapBreaks && morningGapBreaks.length > 0 ? morningGapBreaks : null;
    const aGaps = afternoonGapBreaks && afternoonGapBreaks.length > 0 ? afternoonGapBreaks : null;

    const morningSlots = buildSlotsInWindow(ms, me, slotDuration, breakDuration, mGaps);
    const afternoonSlots = buildSlotsInWindow(as, ae, slotDuration, breakDuration, aGaps);

    const mMax = morningSlots.length;
    const aMax = afternoonSlots.length;
    const lo = Math.max(0, totalSlots - aMax);
    const hi = Math.min(mMax, totalSlots);
    if (lo > hi) {
        return { morning: 0, afternoon: 0 };
    }
    const morning = hi;
    const afternoon = totalSlots - morning;
    return { morning, afternoon };
}
