import { useAppSelector } from '../redux/hooks';

export const useTenantId = () => {
    return useAppSelector((state) => state.auth.tenantId);
};