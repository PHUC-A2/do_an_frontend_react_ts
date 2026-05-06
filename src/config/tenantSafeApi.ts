import instance from "./customAxios";

export interface CreateBookingPayload {
    pitchId: number;
    startDateTime: string;
    endDateTime: string;
    contactPhone: string;
}

export interface BookingItem {
    id: number;
    pitchId: number;
    status: string;
    totalPrice: number;
    startDateTime: string;
    endDateTime: string;
}

export const createBooking = (payload: CreateBookingPayload) => {
    return instance.post<{ data: { id: number } }>("/api/v1/bookings", payload);
};

export const getBookings = (page = 1, size = 20) => {
    return instance.get<{ data: { result: BookingItem[] } }>(`/api/v1/bookings?page=${page}&size=${size}`);
};

export const getPitches = () => {
    return instance.get<{ data: { result: unknown[] } }>("/api/v1/pitches");
};

// Tenant Management APIs
export const getTenantStats = (tenantId: number) => {
    return instance.get(`/api/v1/tenants/${tenantId}/stats`);
};

export const getTenantUsers = (tenantId: number) => {
    return instance.get(`/api/v1/tenants/${tenantId}/users`);
};

export const inviteUserToTenant = (tenantId: number, email: string, role: string) => {
    return instance.post(`/api/v1/tenants/${tenantId}/users/invite`, { email, role });
};

export const getTenantRoles = (tenantId: number) => {
    return instance.get(`/api/v1/tenants/${tenantId}/roles`);
};

export const createTenantRole = (tenantId: number, roleData: any) => {
    return instance.post(`/api/v1/tenants/${tenantId}/roles`, roleData);
};

export const updateTenantRole = (tenantId: number, roleId: number, roleData: any) => {
    return instance.put(`/api/v1/tenants/${tenantId}/roles/${roleId}`, roleData);
};

export const getTenantSettings = (tenantId: number) => {
    return instance.get(`/api/v1/tenants/${tenantId}/settings`);
};

export const updateTenantSettings = (tenantId: number, settings: any) => {
    return instance.put(`/api/v1/tenants/${tenantId}/settings`, settings);
};

export const getTenantSubscriptions = (tenantId: number) => {
    return instance.get(`/api/v1/tenants/${tenantId}/subscriptions`);
};

export const getAvailablePlans = () => {
    return instance.get('/api/v1/plans');
};

export const subscribeToPlan = (tenantId: number, planId: number) => {
    return instance.post(`/api/v1/tenants/${tenantId}/subscriptions`, { planId });
};
