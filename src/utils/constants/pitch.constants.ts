// pitch.constants.ts
import type { PitchStatusEnum } from "../../types/pitch";

export const PITCH_STATUS_META: Record<PitchStatusEnum, { label: string; color: string }> = {
    ACTIVE: { label: "Đang hoạt động", color: "green" },
    MAINTENANCE: { label: "Đang bảo trì", color: "orange" },
};

// Select options
export const PITCH_STATUS_OPTIONS = Object.entries(PITCH_STATUS_META).map(
    ([value, meta]) => ({
        value: value as PitchStatusEnum,
        label: meta.label,
    })
);

export const getPitchStatusMeta = (status: PitchStatusEnum) =>
    PITCH_STATUS_META[status];

export const getPitchTypeLabel = (pitchTypeName?: string | null) =>
    pitchTypeName?.trim() || "Chưa phân loại";
