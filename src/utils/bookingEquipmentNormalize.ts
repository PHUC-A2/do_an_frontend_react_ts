import type { IBookingEquipment, IEquipmentBorrowLog } from "../types/bookingEquipment";

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
    const pickBool = (camel: string, snake: string): boolean | undefined => {
        const a = r[camel];
        const b = r[snake];
        if (typeof a === "boolean") return a;
        if (typeof b === "boolean") return b;
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
        borrowConditionAcknowledged:
            pickBool("borrowConditionAcknowledged", "borrow_condition_acknowledged") ?? base.borrowConditionAcknowledged,
        borrowReportPrintOptIn:
            pickBool("borrowReportPrintOptIn", "borrow_report_print_opt_in") ?? base.borrowReportPrintOptIn,
        returnerNameSnapshot:
            pickStr("returnerNameSnapshot", "returner_name_snapshot") ?? base.returnerNameSnapshot,
        returnerPhoneSnapshot:
            pickStr("returnerPhoneSnapshot", "returner_phone_snapshot") ?? base.returnerPhoneSnapshot,
        returnReportPrintOptIn:
            pickBool("returnReportPrintOptIn", "return_report_print_opt_in") ?? base.returnReportPrintOptIn ?? null,
        receiverNameSnapshot:
            pickStr("receiverNameSnapshot", "receiver_name_snapshot") ?? base.receiverNameSnapshot,
        receiverPhoneSnapshot:
            pickStr("receiverPhoneSnapshot", "receiver_phone_snapshot") ?? base.receiverPhoneSnapshot,
        returnAdminConfirmed:
            pickBool("returnAdminConfirmed", "return_admin_confirmed") ?? base.returnAdminConfirmed,
        returnAdminConfirmedAt:
            pickStr("returnAdminConfirmedAt", "return_admin_confirmed_at") ?? base.returnAdminConfirmedAt,
        returnAdminConfirmedBy:
            pickStr("returnAdminConfirmedBy", "return_admin_confirmed_by") ?? base.returnAdminConfirmedBy,
    };
}

export function normalizeBookingEquipmentListFromApi(list: unknown): IBookingEquipment[] {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeBookingEquipmentFromApi);
}

export function normalizeEquipmentBorrowLogFromApi(raw: unknown): IEquipmentBorrowLog {
    const r = (raw ?? {}) as Record<string, unknown>;
    const pickStr = (camel: string, snake: string): string | null | undefined => {
        const a = r[camel];
        const b = r[snake];
        if (typeof a === "string") return a;
        if (typeof b === "string") return b;
        return undefined;
    };
    const pickBool = (camel: string, snake: string): boolean | null | undefined => {
        const a = r[camel];
        const b = r[snake];
        if (typeof a === "boolean") return a;
        if (typeof b === "boolean") return b;
        return null;
    };
    const base = { ...r } as unknown as IEquipmentBorrowLog;
    return {
        ...base,
        bookingUserName: pickStr("bookingUserName", "booking_user_name") ?? base.bookingUserName,
        bookingUserPhone: pickStr("bookingUserPhone", "booking_user_phone") ?? base.bookingUserPhone,
        pitchName: pickStr("pitchName", "pitch_name") ?? base.pitchName,
        actorName: pickStr("actorName", "actor_name") ?? base.actorName,
        actorPhone: pickStr("actorPhone", "actor_phone") ?? base.actorPhone,
        borrowConditionAcknowledged:
            pickBool("borrowConditionAcknowledged", "borrow_condition_acknowledged") ?? base.borrowConditionAcknowledged,
        borrowReportPrintOptIn:
            pickBool("borrowReportPrintOptIn", "borrow_report_print_opt_in") ?? base.borrowReportPrintOptIn,
        returnerNameSnapshot:
            pickStr("returnerNameSnapshot", "returner_name_snapshot") ?? base.returnerNameSnapshot,
        returnerPhoneSnapshot:
            pickStr("returnerPhoneSnapshot", "returner_phone_snapshot") ?? base.returnerPhoneSnapshot,
        returnReportPrintOptIn:
            pickBool("returnReportPrintOptIn", "return_report_print_opt_in") ?? base.returnReportPrintOptIn,
        receiverNameSnapshot:
            pickStr("receiverNameSnapshot", "receiver_name_snapshot") ?? base.receiverNameSnapshot,
        receiverPhoneSnapshot:
            pickStr("receiverPhoneSnapshot", "receiver_phone_snapshot") ?? base.receiverPhoneSnapshot,
        returnAdminConfirmed:
            pickBool("returnAdminConfirmed", "return_admin_confirmed") ?? base.returnAdminConfirmed,
    };
}

export function normalizeEquipmentBorrowLogListFromApi(list: unknown): IEquipmentBorrowLog[] {
    if (!Array.isArray(list)) return [];
    return list.map(normalizeEquipmentBorrowLogFromApi);
}
