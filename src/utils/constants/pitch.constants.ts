// pitch.constants.ts

import type { PitchStatusEnum, PitchTypeEnum } from "../../types/pitch";

export const PITCH_STATUS_META: Record<
    PitchStatusEnum,
    { label: string; color: string }
> = {
    ACTIVE: {
        label: "Đang hoạt động",
        color: "green",
    },
    MAINTENANCE: {
        label: "Đang bảo trì",
        color: "orange",
    },
};

export const PITCH_TYPE_META: Record<
    PitchTypeEnum,
    { label: string }
> = {
    THREE: { label: "Sân 3 người" },
    SEVEN: { label: "Sân 7 người" },
};

// Select options
export const PITCH_STATUS_OPTIONS = Object.entries(PITCH_STATUS_META).map(
    ([value, meta]) => ({
        value: value as PitchStatusEnum,
        label: meta.label,
    })
);

export const PITCH_TYPE_OPTIONS = Object.entries(PITCH_TYPE_META).map(
    ([value, meta]) => ({
        value: value as PitchTypeEnum,
        label: meta.label,
    })
);

export const getPitchStatusMeta = (status: PitchStatusEnum) =>
    PITCH_STATUS_META[status];

export const getPitchTypeLabel = (type: PitchTypeEnum) =>
    PITCH_TYPE_META[type].label;

