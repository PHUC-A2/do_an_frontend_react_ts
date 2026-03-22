
// /utils/permission.utils.ts
import type { PermissionKey } from "../../types/permission";
import type { PermissionAction } from "./permission-ui.constants";

export const splitPermission = (
    key: PermissionKey
):
    | { resource: "ADMIN"; action: "ALL" }
    | { resource: string; action: PermissionAction } => {
    if (key === "ALL") {
        return {
            resource: "ADMIN",
            action: "ALL",
        };
    }

    /** Hậu tố dài trước để {@code DEVICE_CATALOG_VIEW_LIST} → resource DEVICE_CATALOG, không phải DEVICE + CATALOG_VIEW_LIST. */
    const suffixes: { suffix: string; action: PermissionAction }[] = [
        { suffix: "_VIEW_DETAIL", action: "VIEW_DETAIL" },
        { suffix: "_VIEW_LIST", action: "VIEW_LIST" },
        { suffix: "_ASSIGN_PERMISSION", action: "ASSIGN_PERMISSION" },
        { suffix: "_ASSIGN_ROLE", action: "ASSIGN_ROLE" },
        { suffix: "_CHAT_ADMIN", action: "CHAT_ADMIN" },
        { suffix: "_VIEW", action: "VIEW" },
        { suffix: "_UPDATE", action: "UPDATE" },
        { suffix: "_CREATE", action: "CREATE" },
        { suffix: "_DELETE", action: "DELETE" },
    ];

    for (const { suffix, action } of suffixes) {
        if (key.endsWith(suffix)) {
            return {
                resource: key.slice(0, -suffix.length),
                action,
            };
        }
    }

    return {
        resource: key,
        action: "VIEW_LIST",
    };
};
