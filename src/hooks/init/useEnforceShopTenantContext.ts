import { useEffect } from 'react';
import { setCurrentTenantId } from '../../redux/features/tenantSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';

/**
 * Set currentTenantId từ auth.tenantId trong multi-tenant nghiêm ngặt.
 */
export const useEnforceShopTenantContext = () => {
    const dispatch = useAppDispatch();
    const tenantId = useAppSelector((s) => s.auth.tenantId);

    useEffect(() => {
        if (tenantId != null) {
            dispatch(setCurrentTenantId(tenantId));
        }
    }, [dispatch, tenantId]);
};
