/**
 * Format number / BigDecimal string to VND currency
 * Ví dụ: 525000 -> 525.000 ₫
 */
export const formatVND = (
    value?: number | string | null
): string => {
    if (value === null || value === undefined) return "0 ₫";

    const numberValue =
        typeof value === "string" ? Number(value) : value;

    if (isNaN(numberValue)) return "0 ₫";

    return numberValue.toLocaleString("vi-VN", {
        style: "currency",
        currency: "VND",
        maximumFractionDigits: 0
    });
};
