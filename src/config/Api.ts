/* api auth  */

import type { IUpdateAccountReq, IUpdateAccountRes } from "../types/account";
import type { IRegister, IResendOtpReq, IVerifyEmailReq } from "../types/auth";
import type { IBooking, ICreateBookingClientReq, ICreateBookingReq, IUpdateBookingClientReq, IUpdateBookingReq } from "../types/booking";
import type { IBookingEquipment, ICreateBookingEquipmentReq, IEquipmentBorrowLog, IEquipmentUsageStats, IUpdateBookingEquipmentStatusReq } from "../types/bookingEquipment";
import type { IBackendRes, IModelPaginate } from "../types/common";
import type { IEquipment, ICreateEquipmentReq, IUpdateEquipmentReq } from "../types/equipment";
import type { ICreatePaymentReq, IPayment, IPaymentRes } from "../types/payment";
import type { ICreatePermissionReq, IPermission, IUpdatePermissionReq } from "../types/permission";
import type { ICreatePitchReq, IPitch, IUpdatePitchReq } from "../types/pitch";
import type { IEquipmentPitchAssignment, IPitchEquipment, IUpsertPitchEquipmentReq } from "../types/pitchEquipment";
import type { IRevenueRes } from "../types/revenue";
import type { IAssignPermissionReq, ICreateRoleReq, IRole, IUpdateRoleReq } from "../types/role";
import type { INotification } from "../types/notification";
import type { IPitchTimeline } from "../types/timeline";
import type { IGetUploadResponse } from "../types/upload";
import type { IAssignRoleReq, ICreateUserReq, IUpdateUserReq, IUser, IUpdateUserStatusReq, IUpdateUserStatusRes } from "../types/user";
import type { IAsset, ICreateAssetReq, IUpdateAssetReq } from "../types/asset";
import type { ICreateDeviceReq, IDevice, IUpdateDeviceReq } from "../types/device";
import instance from "./customAxios";

export const register = (data: IRegister) => instance.post("/api/v1/auth/register", data);
export const login = (username: string, password: string) => instance.post("/api/v1/auth/login", { username, password });
export const verifyEmail = (data: IVerifyEmailReq) => instance.post("/api/v1/auth/verify-email", data);
export const resendOtp = (data: IResendOtpReq) => instance.post("/api/v1/auth/resend-otp", data);
// export const logout = () => instance.post("/api/v1/auth/logout");
export const logout = async () => {
    try {
        const res = await instance.post("/api/v1/auth/logout");
        return res;
    } finally {
        localStorage.removeItem("access_token");
        // store.dispatch(setLogout());
    }
};
export const getAccount = () => instance.get("/api/v1/auth/account");
export const updateAccount = (data: IUpdateAccountReq) => instance.patch<IBackendRes<IUpdateAccountRes>>("/api/v1/auth/account/me", data);
export const getRefreshToken = () => instance.get("/api/v1/auth/refresh");
export const forgetPassword = (email: string) => {
    return instance.post("/api/v1/auth/forgot-password", {
        email,
    });
};

export const resetPassword = (
    email: string,
    otp: string,
    newPassword: string
) => {
    return instance.patch("/api/v1/auth/reset-password", {
        email,
        otp,
        newPassword,
    });
};


/* api user */
export const getAllUsers = (query: string) => instance.get<IBackendRes<IModelPaginate<IUser>>>(`/api/v1/users?${query}`);
export const createUser = (data: ICreateUserReq) => instance.post<IBackendRes<IUser>>(`/api/v1/users`, data);
export const deleteUser = (id: number) => instance.delete<IBackendRes<IUser>>(`/api/v1/users/${id}`);
export const getUserById = (id: number) => instance.get<IBackendRes<IUser>>(`/api/v1/users/${id}`);
export const updateUser = (id: number, data: IUpdateUserReq) => instance.put<IBackendRes<IUser>>(`/api/v1/users/${id}`, data);
export const updateUserStatus = (id: number, data: IUpdateUserStatusReq) => instance.patch<IBackendRes<IUpdateUserStatusRes>>(`/api/v1/users/${id}/status`, data);

/* api asset (tài sản) */
export const getAllAssets = (query: string) => instance.get<IBackendRes<IModelPaginate<IAsset>>>(`/api/v1/assets?${query}`);
export const createAsset = (data: ICreateAssetReq) => instance.post<IBackendRes<IAsset>>(`/api/v1/assets`, data);
export const deleteAsset = (id: number) => instance.delete<IBackendRes<IAsset>>(`/api/v1/assets/${id}`);
export const getAssetById = (id: number) => instance.get<IBackendRes<IAsset>>(`/api/v1/assets/${id}`);
export const updateAsset = (id: number, data: IUpdateAssetReq) => instance.put<IBackendRes<IAsset>>(`/api/v1/assets/${id}`, data);

/** Tài sản — public (không cần JWT), cùng pattern client/public/equipments */
export const getPublicAssets = (query: string) =>
    instance.get<IBackendRes<IModelPaginate<IAsset>>>(`/api/v1/client/public/assets?${query}`);
export const getPublicAssetById = (id: number) =>
    instance.get<IBackendRes<IAsset>>(`/api/v1/client/public/assets/${id}`);

/* api device — thiết bị theo tài sản (bảng devices) */
export const getAllDevices = (query: string) =>
    instance.get<IBackendRes<IModelPaginate<IDevice>>>(`/api/v1/devices?${query}`);
export const createDevice = (data: ICreateDeviceReq) =>
    instance.post<IBackendRes<IDevice>>(`/api/v1/devices`, data);
export const deleteDevice = (id: number) => instance.delete<IBackendRes<IDevice>>(`/api/v1/devices/${id}`);
export const getDeviceById = (id: number) => instance.get<IBackendRes<IDevice>>(`/api/v1/devices/${id}`);
export const updateDevice = (id: number, data: IUpdateDeviceReq) =>
    instance.put<IBackendRes<IDevice>>(`/api/v1/devices/${id}`, data);

/* api pitch */
export const getAllPitches = (query: string) => instance.get<IBackendRes<IModelPaginate<IPitch>>>(`/api/v1/pitches?${query}`);
export const createPitch = (data: ICreatePitchReq) => instance.post<IBackendRes<IPitch>>(`/api/v1/pitches`, data);
export const getPitchById = (id: number) => instance.get<IBackendRes<IPitch>>(`/api/v1/pitches/${id}`);
export const updatePitch = (id: number, data: IUpdatePitchReq) => instance.put<IBackendRes<IPitch>>(`/api/v1/pitches/${id}`, data);
export const deletePitch = (id: number) => instance.delete<IBackendRes<IPitch>>(`/api/v1/pitches/${id}`);
export const adminGetPitchEquipments = (pitchId: number) =>
    instance.get<IBackendRes<IPitchEquipment[]>>(`/api/v1/pitches/${pitchId}/pitch-equipments`);
export const adminUpsertPitchEquipment = (pitchId: number, data: IUpsertPitchEquipmentReq) =>
    instance.put<IBackendRes<IPitchEquipment>>(`/api/v1/pitches/${pitchId}/pitch-equipments`, data);
export const adminDeletePitchEquipment = (pitchId: number, equipmentId: number) =>
    instance.delete<IBackendRes<void>>(`/api/v1/pitches/${pitchId}/pitch-equipments/${equipmentId}`);
/** Toàn bộ thiết bị gắn sân (cố định + cho mượn) — trang chi tiết / mô tả sân. */
export const clientGetPitchEquipments = (pitchId: number) =>
    instance.get<IBackendRes<IPitchEquipment[]>>(`/api/v1/client/public/pitches/${pitchId}/pitch-equipments`);
/** Chỉ thiết bị lưu động, ACTIVE, còn hàng — form đặt sân / mượn kèm. */
export const clientGetPitchEquipmentsBorrowable = (pitchId: number) =>
    instance.get<IBackendRes<IPitchEquipment[]>>(`/api/v1/client/public/pitches/${pitchId}/pitch-equipments/borrowable`);

/* api permission */
export const getAllPermissions = (query: string) => instance.get<IBackendRes<IModelPaginate<IPermission>>>(`/api/v1/permissions?${query}`);
export const createPermission = (data: ICreatePermissionReq) => instance.post<IBackendRes<IPermission>>(`/api/v1/permissions`, data);
export const updatePermission = (id: number, data: IUpdatePermissionReq) => instance.put<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`, data);
export const getPermissionById = (id: number) => instance.get<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
export const deletePermission = (id: number) => instance.delete<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);

/* api role */
export const getAllRoles = (query: string) => instance.get<IBackendRes<IModelPaginate<IRole>>>(`/api/v1/roles?${query}`);
export const createRole = (data: ICreateRoleReq) => instance.post<IBackendRes<IRole>>(`/api/v1/roles`, data);
export const updateRole = (id: number, data: IUpdateRoleReq) => instance.put<IBackendRes<IRole>>(`/api/v1/roles/${id}`, data);
export const getRoleById = (id: number) => instance.get<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
export const deleteRole = (id: number) => instance.delete<IBackendRes<IRole>>(`/api/v1/roles/${id}`);
/* api gắn permission cho role */
// /api/v1/roles/roleId/assign-permissions
export const assignPermission = (id: number, data: IAssignPermissionReq) => instance.put<IBackendRes<IRole>>(`/api/v1/roles/${id}/assign-permissions`, data);

/* api gắn role cho user */
// /api/v1/users/userId/assign-roles
export const assignRole = (id: number, data: IAssignRoleReq) => instance.put<IBackendRes<IUser>>(`/api/v1/users/${id}/assign-roles`, data);


/* api booking */
export const getAllBookings = (query: string) => instance.get<IBackendRes<IModelPaginate<IBooking>>>(`/api/v1/bookings?${query}`);
export const createBooking = (data: ICreateBookingReq) => instance.post<IBackendRes<IBooking>>(`/api/v1/bookings`, data);
export const updateBooking = (id: number, data: IUpdateBookingReq) => instance.put<IBackendRes<IBooking>>(`/api/v1/bookings/${id}`, data);
export const getBookingById = (id: number) => instance.get<IBackendRes<IBooking>>(`/api/v1/bookings/${id}`);
export const deleteBooking = (id: number) => instance.delete<IBackendRes<IBooking>>(`/api/v1/bookings/${id}`);
export const approveBooking = (id: number) => instance.patch<IBackendRes<void>>(`/api/v1/bookings/${id}/approve`);
export const rejectBooking = (id: number) => instance.patch<IBackendRes<void>>(`/api/v1/bookings/${id}/reject`);

/* api payment */
export const getAllPayments = (query: string) => instance.get<IBackendRes<IModelPaginate<IPayment>>>(`/api/v1/payments?${query}`);
export const confirmPayment = (id: number) => instance.put<IBackendRes<IPayment>>(`/api/v1/payments/${id}/confirm`);
export const createPayment = (data: ICreatePaymentReq) => instance.post<IBackendRes<IPaymentRes>>(`/api/v1/client/payments`, data);
export const getQR = (paymentCode: string) => instance.get<IBackendRes<IPaymentRes>>(`/api/v1/client/payments/${paymentCode}/qr`);
// gắn ảnh minh chứng cho payment
export const attachPaymentProof = (paymentId: number, proofUrl: string) =>
    instance.patch<IBackendRes<void>>(
        `/api/v1/client/payments/${paymentId}/proof`,
        null,
        {
            params: { proofUrl }
        }
    );


// client
export const createBookingClient = (data: ICreateBookingClientReq) => instance.post<IBackendRes<IBooking>>(`/api/v1/bookings`, data);
export const updateBookingClient = (id: number, data: IUpdateBookingClientReq) => instance.put<IBackendRes<IBooking>>(`/api/v1/client/bookings/${id}`, data);
export const getAllBookingsClient = (query: string) => instance.get<IBackendRes<IModelPaginate<IBooking>>>(`/api/v1/client/bookings?${query}`);
export const deleteBookingClient = (id: number) => instance.delete<IBackendRes<IBooking>>(`/api/v1/client/bookings/${id}`);
export const cancelBookingClient = (id: number) => instance.patch<IBackendRes<IBooking>>(`/api/v1/client/bookings/${id}/cancel`);
// http://127.0.0.1:8080/api/v1/client/bookings/{id}/cancel

/* api get timeline */
// http://localhost:8080/api/v1/client/public/pitches/5/timeline?date=2026-02-01
export const getTimeline = (pitchId: number, params: string) => instance.get<IBackendRes<IPitchTimeline>>(`/api/v1/client/public/pitches/${pitchId}/timeline?date=${params}`);

/* api revenue */
// export const getRevenue = () => instance.get<IBackendRes<IRevenueRes>>(`/api/v1/revenues`);
export const getRevenue = (from?: string, to?: string) =>
    instance.get<IBackendRes<IRevenueRes>>(`/api/v1/revenues`, {
        params: {
            from,
            to,
        },
    });


// upload avatar
export const uploadImageAvatar = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "avatar");

    const { data } = await instance.post<IGetUploadResponse>(
        "/api/v1/files/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
    );

    return data; //  trả về đúng cấu trúc JSON từ backend
};

// upload ảnh tài sản (admin) — cùng API file, folder riêng
export const uploadImageAsset = async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('folder', 'assets');

    const { data } = await instance.post<IGetUploadResponse>(
        '/api/v1/files/upload',
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
    );

    return data;
};

// upload pitch image
export const uploadImagePitch = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "pitch"); // folder riêng cho sân

    const { data } = await instance.post<IGetUploadResponse>(
        "/api/v1/files/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
    );

    return data;
};

/* api equipment */
export const getAllEquipments = (query: string) => instance.get<IBackendRes<IModelPaginate<IEquipment>>>(`/api/v1/equipments?${query}`);
export const createEquipment = (data: ICreateEquipmentReq) => instance.post<IBackendRes<IEquipment>>(`/api/v1/equipments`, data);
export const getEquipmentById = (id: number) => instance.get<IBackendRes<IEquipment>>(`/api/v1/equipments/${id}`);
export const adminGetEquipmentPitchAssignments = (equipmentId: number) =>
    instance.get<IBackendRes<IEquipmentPitchAssignment[]>>(`/api/v1/equipments/${equipmentId}/pitch-assignments`);
export const updateEquipment = (id: number, data: IUpdateEquipmentReq) => instance.put<IBackendRes<IEquipment>>(`/api/v1/equipments/${id}`, data);
export const deleteEquipment = (id: number) => instance.delete<IBackendRes<IEquipment>>(`/api/v1/equipments/${id}`);

/* api booking equipment — admin */
export const getAllBookingEquipments = () => instance.get<IBackendRes<IBookingEquipment[]>>(`/api/v1/booking-equipments`);
export const getBookingEquipmentsByBookingId = (bookingId: number) => instance.get<IBackendRes<IBookingEquipment[]>>(`/api/v1/booking-equipments/booking/${bookingId}`);
export const updateBookingEquipmentStatus = (id: number, data: IUpdateBookingEquipmentStatusReq) => instance.patch<IBackendRes<IBookingEquipment>>(`/api/v1/booking-equipments/${id}/status`, data);
export const adminConfirmBookingEquipmentReturn = (id: number) =>
    instance.post<IBackendRes<IBookingEquipment>>(`/api/v1/booking-equipments/${id}/confirm-return`);
export const adminGetEquipmentBorrowLogs = () =>
    instance.get<IBackendRes<IEquipmentBorrowLog[]>>(`/api/v1/equipment-borrow-logs`);
export const adminGetEquipmentUsageStats = () =>
    instance.get<IBackendRes<IEquipmentUsageStats>>(`/api/v1/equipment-usage-stats`);

/* api booking equipment — client */
export const clientBorrowEquipment = (data: ICreateBookingEquipmentReq) => instance.post<IBackendRes<IBookingEquipment>>(`/api/v1/client/booking-equipments`, data);
export const clientGetAllMyEquipments = () => instance.get<IBackendRes<IBookingEquipment[]>>(`/api/v1/client/booking-equipments`);
export const clientGetBookingEquipments = (bookingId: number) => instance.get<IBackendRes<IBookingEquipment[]>>(`/api/v1/client/booking-equipments/booking/${bookingId}`);
export const clientUpdateBookingEquipmentStatus = (id: number, data: IUpdateBookingEquipmentStatusReq) => instance.patch<IBackendRes<IBookingEquipment>>(`/api/v1/client/booking-equipments/${id}/status`, data);
export const clientSoftDeleteBookingEquipment = (id: number) => instance.delete<IBackendRes<null>>(`/api/v1/client/booking-equipments/${id}`);

/* notifications */
export const clientGetNotifications = () => instance.get<IBackendRes<INotification[]>>('/api/v1/client/notifications');
export const clientMarkAllNotificationsRead = () => instance.patch<IBackendRes<null>>('/api/v1/client/notifications/read-all');
export const clientMarkNotificationRead = (id: number) => instance.patch<IBackendRes<null>>(`/api/v1/client/notifications/${id}/read`);
export const clientDeleteNotification = (id: number) => instance.delete<IBackendRes<null>>(`/api/v1/client/notifications/${id}`);
export const clientDeleteAllNotifications = () => instance.delete<IBackendRes<null>>('/api/v1/client/notifications/clear');
export const registerFcmToken = (token: string) => instance.post<IBackendRes<null>>('/api/v1/client/notifications/fcm-token', { token });

/* api public equipments — client (không cần đăng nhập) */
export const getPublicEquipments = () => instance.get<IBackendRes<IEquipment[]>>(`/api/v1/client/public/equipments`);

// upload equipment image
export const uploadImageEquipment = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "equipment");

    const { data } = await instance.post<IGetUploadResponse>(
        "/api/v1/files/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
    );

    return data;
};

// upload payment image
export const uploadImagePayment = async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", "payment"); // folder riêng cho payment

    const { data } = await instance.post<IGetUploadResponse>(
        "/api/v1/files/upload",
        formData,
        { headers: { "Content-Type": "multipart/form-data" } }
    );

    return data;
};

// AI Chat
export const clientAiChat = (data: { message: string; history?: { role: string; content: string }[] }) =>
    instance.post<IBackendRes<{ reply: string; provider: string; offTopic: boolean; remainingMessages: number }>>(
        '/api/v1/client/ai/chat',
        data
    );

export const adminAiChat = (data: { message: string; history?: { role: string; content: string }[] }) =>
    instance.post<IBackendRes<{ reply: string; provider: string; offTopic: boolean; remainingMessages: number }>>(
        '/api/v1/admin/ai/chat',
        data
    );

// AI Key Management
export type AiProvider = 'GROQ' | 'GEMINI' | 'CLOUDFLARE';
export interface IAiKey {
    id: number;
    provider: AiProvider;
    label: string | null;
    apiKeyMasked: string;
    active: boolean;
    usageCount: number;
    lastUsedAt: string | null;
    createdAt: string | null;
}
export const adminGetAiKeys = () => instance.get<IBackendRes<IAiKey[]>>('/api/v1/admin/ai/keys');
export const adminAddAiKey = (data: { provider: AiProvider; apiKey: string; label?: string }) =>
    instance.post<IBackendRes<IAiKey>>('/api/v1/admin/ai/keys', data);
export const adminToggleAiKey = (id: number) =>
    instance.patch<IBackendRes<IAiKey>>(`/api/v1/admin/ai/keys/${id}/toggle`);
export const adminDeleteAiKey = (id: number) =>
    instance.delete<IBackendRes<void>>(`/api/v1/admin/ai/keys/${id}`);