// components/common/AdminWrapper.tsx
import type { ReactNode } from "react";
import Forbidden from "../../pages/error/Forbbiden";
import { useAdminAccess } from "../../hooks/common/useAdminAccess";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

const AdminWrapper = ({ children, fallback = <Forbidden /> }: Props) => {
    const canAccess = useAdminAccess();

    if (!canAccess) return <>{fallback}</>;
    return <>{children}</>;
};

export default AdminWrapper;
