/** Tham số sort của Spring Data: lặp `sort=field,direction`. */
export type SpringSortItem = { property: string; direction: "asc" | "desc" };

export type BuildSpringListQueryOptions = {
    page: number;
    pageSize: number;
    /** Chuỗi filter turkraft/spring-filter (query param `filter`). */
    filter?: string;
    sort?: SpringSortItem[];
};

/** Query string: page, pageSize, optional filter, optional sort (Spring Pageable). */
export function buildSpringListQuery(options: BuildSpringListQueryOptions): string {
    const params = new URLSearchParams();
    params.set("page", String(options.page));
    params.set("pageSize", String(options.pageSize));
    const f = options.filter?.trim();
    if (f) {
        params.set("filter", f);
    }
    for (const s of options.sort ?? []) {
        if (s.property) {
            params.append("sort", `${s.property},${s.direction}`);
        }
    }
    return params.toString();
}

/** Chỉ phân trang (tương thích code cũ). */
export function buildSpringPageQuery(page: number, pageSize: number): string {
    return buildSpringListQuery({ page, pageSize });
}

/** Một cặp sort trên URL client: `sort=name,asc`. */
export function parseSpringSortParam(param: string | null): SpringSortItem[] {
    if (!param?.trim()) return [];
    const [prop, dir] = param.split(",");
    const p = prop?.trim();
    const d = dir?.trim().toLowerCase();
    if (!p || (d !== "asc" && d !== "desc")) return [];
    return [{ property: p, direction: d }];
}

export function serializeSpringSortParam(items: SpringSortItem[]): string | undefined {
    const first = items[0];
    if (!first?.property) return undefined;
    return `${first.property},${first.direction}`;
}
