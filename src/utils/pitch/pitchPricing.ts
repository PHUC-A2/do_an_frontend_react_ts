import type { Dayjs } from "dayjs";
import type { IPitch, IPitchHourlyPrice } from "../../types/pitch";

// Chuyển chuỗi "HH:mm" / "HH:mm:ss" thành tổng phút từ 00:00
const toMinutesOfDay = (timeStr: string | null | undefined): number => {
    // Nếu không có dữ liệu thời gian thì trả về -1 để không match
    if (!timeStr) return -1;
    const parts = timeStr.split(":");
    const hh = Number(parts[0] ?? 0);
    const mm = Number(parts[1] ?? 0);
    if (!Number.isFinite(hh) || !Number.isFinite(mm)) return -1;
    return hh * 60 + mm;
};

// Chuẩn hóa nhãn giờ về HH:mm để UI nhất quán
const formatTimeLabel = (timeStr: string | null | undefined): string => {
    if (!timeStr) return "--:--";
    const parts = timeStr.split(":");
    const hh = String(Number(parts[0] ?? 0)).padStart(2, "0");
    const mm = String(Number(parts[1] ?? 0)).padStart(2, "0");
    return `${hh}:${mm}`;
};

// Kiểm tra TOD (minutes trong ngày) có nằm trong rule không (end-exclusive)
const isTimeInRule = (todMinutes: number, rule: IPitchHourlyPrice): boolean => {
    const startMin = toMinutesOfDay(rule.startTime);
    const endMin = toMinutesOfDay(rule.endTime);
    if (startMin < 0 || endMin < 0) return false;
    if (startMin === endMin) return false; // khoảng 0 phút là không hợp lệ

    if (startMin < endMin) {
        // Không qua nửa đêm: [start, end)
        return (todMinutes === startMin || todMinutes > startMin) && todMinutes < endMin;
    }

    // Qua nửa đêm: [start, 24h) U [00:00, end)
    return todMinutes >= startMin || todMinutes < endMin;
};

// Làm tròn nửa lên cho số dương (giống BigDecimal scale/ROUND_HALF_UP)
const roundHalfUp = (value: number, decimals: number): number => {
    const factor = 10 ** decimals;
    return Math.round(value * factor) / factor;
};

// Tính tổng tiền theo backend: basePricePerHour * durationMinutes / 60 + chênh lệch từ hourlyPrices
export const calculatePitchTotalPrice = (
    pitch: IPitch | null,
    start: Dayjs,
    end: Dayjs
): number => {
    if (!pitch) return 0;
    const durationMinutes = end.diff(start, "minute");
    if (!Number.isFinite(durationMinutes) || durationMinutes <= 0) return 0;

    const basePricePerHour = pitch.pricePerHour ?? 0;
    if (!Number.isFinite(basePricePerHour) || basePricePerHour <= 0) return 0;

    // Tính phần base theo đúng format trước (nhiều UI đang dùng số nguyên VND)
    let total = roundHalfUp((basePricePerHour * durationMinutes) / 60, 2);

    const rules = pitch.hourlyPrices ?? [];
    if (rules.length === 0) return total;

    // Đếm phút mà booking rơi vào từng rule
    const minutesByRuleIndex = new Array<number>(rules.length).fill(0);
    for (let i = 0; i < durationMinutes; i++) {
        const t = start.add(i, "minute");
        const todMinutes = t.hour() * 60 + t.minute();
        let matchedIndex = -1;
        for (let idx = 0; idx < rules.length; idx++) {
            if (isTimeInRule(todMinutes, rules[idx])) {
                matchedIndex = idx;
                break;
            }
        }
        if (matchedIndex >= 0) {
            minutesByRuleIndex[matchedIndex]++;
        }
    }

    // Cộng chênh lệch từng rule: (rulePrice - basePrice) * ruleMinutes / 60
    for (let idx = 0; idx < rules.length; idx++) {
        const ruleMinutes = minutesByRuleIndex[idx] ?? 0;
        if (ruleMinutes <= 0) continue;

        const rulePricePerHour = rules[idx]?.pricePerHour ?? 0;
        if (!Number.isFinite(rulePricePerHour) || rulePricePerHour <= 0) continue;

        const deltaPerHour = rulePricePerHour - basePricePerHour;
        const delta = roundHalfUp((deltaPerHour * ruleMinutes) / 60, 2);
        total += delta;
    }

    // UI đang hiển thị dạng VND nguyên nên làm tròn về số nguyên
    return Math.round(total);
};

// Tính khoảng giá tối thiểu/tối đa để hiển thị thay cho một con số cố định
export const getPitchPriceRange = (pitch: IPitch | null): { min: number; max: number } | null => {
    if (!pitch) return null;
    const base = pitch.pricePerHour ?? 0;
    if (!Number.isFinite(base) || base <= 0) return null;

    const prices: number[] = [base];
    for (const r of pitch.hourlyPrices ?? []) {
        if (r?.pricePerHour && Number.isFinite(r.pricePerHour) && r.pricePerHour > 0) {
            prices.push(r.pricePerHour);
        }
    }
    if (prices.length === 0) return null;

    const min = Math.min(...prices);
    const max = Math.max(...prices);
    return { min, max };
};

// Gắn nhãn khung giờ để UI hiển thị thân thiện (Sáng/Chiều/Tối/Đêm)
export const getPitchPricingDisplayLines = (pitch: IPitch | null): string[] => {
    if (!pitch) return [];
    const rules = [...(pitch.hourlyPrices ?? [])];
    if (rules.length === 0) {
        return [];
    }

    const normalized = rules
        .filter((r) => Number.isFinite(r.pricePerHour) && r.pricePerHour > 0)
        .map((r) => ({
            ...r,
            startMin: toMinutesOfDay(r.startTime),
            endMin: toMinutesOfDay(r.endTime),
        }))
        .filter((r) => r.startMin >= 0 && r.endMin >= 0)
        .sort((a, b) => a.startMin - b.startMin);

    const resolveLabel = (startMin: number): string => {
        if (startMin >= 300 && startMin < 720) return "Sáng";
        if (startMin >= 720 && startMin < 1080) return "Chiều";
        if (startMin >= 1080 && startMin < 1320) return "Tối";
        return "Đêm";
    };

    return normalized.map((r, idx) => {
        const label = resolveLabel(r.startMin);
        const suffix = normalized.filter((x) => resolveLabel(x.startMin) === label).length > 1 ? ` ${idx + 1}` : "";
        return `${label}${suffix}: ${formatTimeLabel(r.startTime)}-${formatTimeLabel(r.endTime)} · ${r.pricePerHour.toLocaleString("vi-VN")} đ/h`;
    });
};

