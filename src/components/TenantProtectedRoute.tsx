import { Navigate } from 'react-router';
import { useAppSelector } from '@/redux/hooks';
import { type ReactNode } from 'react';

interface TenantProtectedRouteProps {
    children: ReactNode;
}

export function TenantProtectedRoute({ children }: TenantProtectedRouteProps) {
    const accessToken = useAppSelector((state) => state.auth.access_token);
    const isAuthenticated = Boolean(accessToken);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return <>{children}</>;
}
