import type { ReactNode } from "react";
import type { PermissionKey } from "../../types/permission";
import { usePermission } from "../../hooks/common/usePermission";

interface Props {
    required: PermissionKey | PermissionKey[];
    children: ReactNode;
    fallback?: ReactNode; // optional
}

const PermissionWrapper = ({ required, children, fallback = null }: Props) => {
    const can = usePermission(required);

    if (!can) return <>{fallback}</>;
    return <>{children}</>;
};

export default PermissionWrapper;
