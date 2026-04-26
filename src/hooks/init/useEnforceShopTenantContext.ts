import { useEffect, useRef } from 'react';
import { getMyTenants, switchTenant } from '../../config/Api';
import { setToken } from '../../redux/features/authSlice';
import { setCurrentTenantId } from '../../redux/features/tenantSlice';
import { useAppDispatch, useAppSelector } from '../../redux/hooks';
import { isSystemAllAccount } from '../../utils/role';

/**
 * Chủ cửa hàng (không có ALL) không dùng ngữ cảnh tenant 1: nếu LS/X-Tenant còn 1
 * nhưng user có shop — tự gọi switch sang cửa hàng đầu tiên rồi reload để đồng bộ JWT.
 */
export const useEnforceShopTenantContext = () => {
    const dispatch = useAppDispatch();
    const account = useAppSelector((s) => s.account.account);
    const isAuthenticated = useAppSelector((s) => s.auth.isAuthenticated);
    const busy = useRef(false);

    useEffect(() => {
        if (!isAuthenticated || !account) {
            return;
        }
        if (isSystemAllAccount(account)) {
            return;
        }
        const ls = typeof window !== 'undefined' ? localStorage.getItem('current_tenant_id') : null;
        if (ls && ls !== '1' && ls.trim() !== '') {
            return;
        }
        if (busy.current) {
            return;
        }
        busy.current = true;
        void getMyTenants()
            .then((tr) => {
                const list = tr.data?.data ?? [];
                const shop = list.find((t) => t.id > 1);
                if (!shop) {
                    busy.current = false;
                    return;
                }
                return switchTenant(shop.id)
                    .then((res) => {
                        const d = res.data?.data as
                            | { access_token?: string; currentTenantId?: number }
                            | undefined;
                        if (d?.access_token) {
                            localStorage.setItem('access_token', d.access_token);
                            dispatch(setToken(d.access_token));
                        }
                        if (d?.currentTenantId != null) {
                            dispatch(setCurrentTenantId(d.currentTenantId));
                        } else {
                            dispatch(setCurrentTenantId(shop.id));
                        }
                        window.location.reload();
                    })
                    .catch(() => {
                        busy.current = false;
                    });
            })
            .catch(() => {
                busy.current = false;
            });
    }, [isAuthenticated, account, dispatch]);
};
