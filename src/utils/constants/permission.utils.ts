
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

    const [resource, ...rest] = key.split("_");

    return {
        resource,
        action: rest.join("_") as PermissionAction,
    };
};
