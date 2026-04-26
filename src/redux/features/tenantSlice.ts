import { createSlice, type PayloadAction } from '@reduxjs/toolkit';

const LS = {
    plan: 'tenant_effective_plan',
    perms: 'tenant_effective_permissions',
    subActive: 'tenant_subscription_active',
    subEnd: 'tenant_subscription_end_at',
} as const;

function readJson<T>(key: string, fallback: T): T {
    try {
        const raw = localStorage.getItem(key);
        if (raw == null || raw === '') return fallback;
        return JSON.parse(raw) as T;
    } catch {
        return fallback;
    }
}

export interface ITenantInfo {
    id: number;
    slug: string;
    name: string;
    /** PENDING | APPROVED | REJECTED */
    status?: string;
}

export interface ISubscriptionContext {
    plan: string | null;
    permissions: string[];
    subscriptionActive: boolean;
    subscriptionEndAt: string | null;
}

interface TenantState {
    currentTenantId: number | null;
    currentTenant: ITenantInfo | null;
    tenants: ITenantInfo[];
    plan: string | null;
    permissions: string[];
    subscriptionActive: boolean;
    subscriptionEndAt: string | null;
}

const initialState: TenantState = {
    currentTenantId: (() => {
        const s = localStorage.getItem('current_tenant_id');
        if (s == null || s === '') return null;
        const n = Number(s);
        return Number.isFinite(n) && n > 0 ? n : null;
    })(),
    currentTenant: null,
    tenants: [],
    plan: (() => {
        const s = localStorage.getItem(LS.plan);
        return s == null || s === '' || s === 'null' ? null : s;
    })(),
    permissions: readJson<string[]>(LS.perms, []),
    subscriptionActive: (() => {
        const s = localStorage.getItem(LS.subActive);
        if (s == null) return true;
        return s === '1' || s === 'true';
    })(),
    subscriptionEndAt: localStorage.getItem(LS.subEnd) || null,
};

function persistContext(
    plan: string | null,
    permissions: string[],
    subscriptionActive: boolean,
    subscriptionEndAt: string | null,
) {
    if (plan == null) localStorage.removeItem(LS.plan);
    else localStorage.setItem(LS.plan, plan);
    localStorage.setItem(LS.perms, JSON.stringify(permissions));
    localStorage.setItem(LS.subActive, subscriptionActive ? '1' : '0');
    if (subscriptionEndAt == null || subscriptionEndAt === '') {
        localStorage.removeItem(LS.subEnd);
    } else {
        localStorage.setItem(LS.subEnd, subscriptionEndAt);
    }
}

const tenantSlice = createSlice({
    name: 'tenant',
    initialState,
    reducers: {
        setCurrentTenantId(state, action: PayloadAction<number | null>) {
            state.currentTenantId = action.payload;
            if (action.payload == null) {
                localStorage.removeItem('current_tenant_id');
            } else {
                localStorage.setItem('current_tenant_id', String(action.payload));
            }
        },
        setCurrentTenantInfo(state, action: PayloadAction<ITenantInfo | null>) {
            state.currentTenant = action.payload;
        },
        setTenantsList(state, action: PayloadAction<ITenantInfo[]>) {
            state.tenants = action.payload;
        },
        setSubscriptionContext(state, action: PayloadAction<Partial<ISubscriptionContext> | ISubscriptionContext>) {
            const p = action.payload;
            if (p.plan !== undefined) state.plan = p.plan;
            if (p.permissions !== undefined) state.permissions = p.permissions;
            if (p.subscriptionActive !== undefined) state.subscriptionActive = p.subscriptionActive;
            if (p.subscriptionEndAt !== undefined) state.subscriptionEndAt = p.subscriptionEndAt;
            persistContext(state.plan, state.permissions, state.subscriptionActive, state.subscriptionEndAt);
        },
        clearTenant(state) {
            state.currentTenantId = null;
            state.currentTenant = null;
            state.tenants = [];
            state.plan = null;
            state.permissions = [];
            state.subscriptionActive = true;
            state.subscriptionEndAt = null;
            localStorage.removeItem('current_tenant_id');
            localStorage.removeItem(LS.plan);
            localStorage.removeItem(LS.perms);
            localStorage.removeItem(LS.subActive);
            localStorage.removeItem(LS.subEnd);
        },
    },
});

export const { setCurrentTenantId, setCurrentTenantInfo, setTenantsList, setSubscriptionContext, clearTenant } =
    tenantSlice.actions;
export default tenantSlice.reducer;
