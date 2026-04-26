import { useAppSelector } from "../../redux/hooks";

export const useAdminAccess = () => {
    const account = useAppSelector(state => state.account.account);
    const loading = useAppSelector(state => state.account.loading);

    if (loading) return { loading: true, canAccess: false };

    if (!account || !account.roles?.length)
        return { loading: false, canAccess: false };

    const hasNonViewRole = account.roles.some((r) => r.name !== "VIEW");
    const linkedToAtLeastOneTenant = (account.linkedTenantCount ?? 0) > 0;
    const canAccess = hasNonViewRole || linkedToAtLeastOneTenant;
    return { loading: false, canAccess };
};
