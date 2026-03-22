import type { SorterResult } from "antd/es/table/interface";
import type { SpringSortItem } from "./buildSpringPageQuery";

/** Ưu tiên column.key (nên đặt = path JPA) rồi mới tới field. */
export function tableSorterToSortItems<T>(
    sorter: SorterResult<T> | SorterResult<T>[] | undefined
): SpringSortItem[] {
    const list = Array.isArray(sorter) ? sorter : sorter ? [sorter] : [];
    const out: SpringSortItem[] = [];
    for (const s of list) {
        if (!s?.order) continue;
        const key =
            (typeof s.columnKey === "string" && s.columnKey) ||
            (typeof s.field === "string" && s.field) ||
            (Array.isArray(s.field) ? s.field.join(".") : null);
        if (!key) continue;
        out.push({
            property: key,
            direction: s.order === "descend" ? "desc" : "asc",
        });
    }
    return out;
}
