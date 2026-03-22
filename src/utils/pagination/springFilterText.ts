/**
 * Ký tự đặc biệt trong literal spring-filter / LIKE — tránh phá cú pháp hoặc wildcard injection.
 */
export function sanitizeLikeAtom(raw: string): string {
    return raw.replace(/\\/g, "").replace(/'/g, "''").replace(/[*%]/g, "");
}

/**
 * OR nhiều field với toán tử ~~ (ILIKE, spring-filter 3.x).
 * Trả undefined nếu không có từ khóa hợp lệ sau sanitize.
 */
export function orFieldsInsensitiveLike(fields: string[], keyword: string): string | undefined {
    const safe = sanitizeLikeAtom(keyword.trim());
    if (!safe) return undefined;
    const parts = fields.map((f) => `${f} ~~ '*${safe}*'`);
    return `(${parts.join(" or ")})`;
}
