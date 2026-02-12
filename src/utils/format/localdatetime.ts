import dayjs from "dayjs";

/**
 * Backend trả LocalDateTime (KHÔNG UTC)
 */
//  dùng trong table ...
export const formatDateTime = (
    value?: string | null,
    format = "HH:mm DD/MM/YYYY"
): string => {
    if (!value) return "N/A";
    return dayjs(value).format(format);
};

// Hàm format khoảng thời gian ( dùng cho booking)
// ví dụ như trong modal details...
export const formatDateTimeRange = (
    start?: string | null,
    end?: string | null,
    format = "HH:mm DD/MM/YYYY"
): string => {
    if (!start || !end) return "N/A";

    return `${dayjs(start).format(format)} → ${dayjs(end).format(format)}`;
};

export const toUnix = (value?: string | null): number =>
    value ? dayjs(value).unix() : 0;

export const formatInstant = (
    value?: string | null,
    format = "HH:mm:ss DD/MM/YYYY"
): string => {
    if (!value) return "N/A";
    return dayjs(value).format(format);
};

// Format LocalDate (yyyy-MM-dd) -> DD/MM/YYYY
export const formatLocalDate = (
    value?: string | null,
    format = "DD/MM/YYYY"
): string => {
    if (!value) return "N/A";
    return dayjs(value).format(format);
};
