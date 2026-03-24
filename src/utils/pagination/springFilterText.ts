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

    // Hỗ trợ tìm kiếm theo nhiều từ: "Sân 3" sẽ khớp cả "Sân bóng số 3".
    const tokens = safe
        .split(/\s+/)
        .map((token) => token.trim())
        .filter(Boolean);

    if (!tokens.length) return undefined;

    const groups = tokens.map((token) => {
        const fieldsOr = fields.map((f) => `${f} ~~ '*${token}*'`);
        return `(${fieldsOr.join(" or ")})`;
    });

    // Mỗi token phải xuất hiện ở ít nhất một field.
    return `(${groups.join(" and ")})`;
}
