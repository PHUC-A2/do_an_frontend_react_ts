import type { IBookingEquipment } from "../types/bookingEquipment";

/** Chuẩn hoá JSON từ API (camelCase hoặc snake_case) về field IBookingEquipment. */
export function normalizeBookingEquipmentFromApi(raw: unknown): IBookingEquipment {
    const r = (raw ?? {}) as Record<string, unknown>;
    const pickNum = (camel: string, snake: string): number | undefined => {
        const a = r[camel];
        const b = r[snake];
        if (typeof a === "number" && !Number.isNaN(a)) return a;
        if (typeof b === "number" && !Number.isNaN(b)) return b;
        return undefined;
    };
    const pickStr = (camel: string, snake: string): string | null | undefined => {
        const a = r[camel];
        const b = r[snake];
        if (typeof a === "string") return a;
        if (typeof b === "string") return b;
        return undefined;
    };

    const base = { ...r } as unknown as IBookingEquipment;
    const qg = pickNum("quantityReturnedGood", "quantity_returned_good");
    const ql = pickNum("quantityLost", "quantity_lost");
    const qd = pickNum("quantityDamaged", "quantity_damaged");
    return {
        ...base,
        quantityReturnedGood: qg ?? base.quantityReturnedGood,
        quantityLost: ql ?? base.quantityLost,
        quantityDamaged: qd ?? base.quantityDamaged,
        borrowerSignName: pickStr("borrowerSignName", "borrower_sign_name") ?? base.borrowerSignName,
        staffSignName: pickStr("staffSignName", "staff_sign_name") ?? base.staffSignName,
        bookingBorrowerSnapshot:
            pickStr("bookingBorrowerSnapshot", "booking_borrower_snapshot") ?? base.bookingBorrowerSnapshot,
    };
}

export function normalizeBookingEquipmentListFromApi(list: unknown): IBookingEquipment[] {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeBookingEquipmentFromApi);
}
