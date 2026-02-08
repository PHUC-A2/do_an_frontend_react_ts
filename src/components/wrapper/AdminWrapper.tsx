// components/common/AdminWrapper.tsx
import type { ReactNode } from "react";
import Forbidden from "../../pages/error/Forbbiden";
import { useAdminAccess } from "../../hooks/common/useAdminAccess";

interface Props {
    children: ReactNode;
    fallback?: ReactNode;
}

import { Spin } from "antd";

const AdminWrapper = ({ children, fallback = <Forbidden /> }: Props) => {
    const { loading, canAccess } = useAdminAccess();

    if (loading)
        return (
            <div style={{ padding: 24, textAlign: "center" }}>
                <Spin />
            </div>
        );

    if (!canAccess) return <>{fallback}</>;
    return <>{children}</>;
};


export default AdminWrapper;
