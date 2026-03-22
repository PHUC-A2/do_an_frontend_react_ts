/** Chuẩn hóa meta phân trang từ backend (Long/string → number) cho Ant Design Table. */
export function normalizePaginationMeta(raw: unknown): {
    page: number;
    pageSize: number;
    pages: number;
    total: number;
} {
    const m = raw && typeof raw === "object" ? (raw as Record<string, unknown>) : {};
    return {
        page: Math.max(1, Number(m.page) || 1),
        pageSize: Math.max(1, Number(m.pageSize) || 10),
        pages: Math.max(0, Number(m.pages) || 0),
        total: Math.max(0, Number(m.total) || 0),
    };
}
