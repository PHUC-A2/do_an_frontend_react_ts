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
import type { IAdminSystemOverview } from "../types/adminDashboardOverview";
import type { IRevenueRes } from "../types/revenue";
import type { ICreateReviewReq, IReview, IReviewMessage, IReviewMessageReq, IUpdateReviewStatusReq } from "../types/review";
import type { IAssignPermissionReq, ICreateRoleReq, IRole, IUpdateRoleReq } from "../types/role";
import type { INotification } from "../types/notification";
import type { IPitchTimeline } from "../types/timeline";
import type { IGetUploadResponse } from "../types/upload";
import type { IAssignRoleReq, ICreateUserReq, IUpdateUserReq, IUser, IUpdateUserStatusReq, IUpdateUserStatusRes } from "../types/user";
import type {
    IAdminBankAccountConfig,
    IAdminEmailSenderConfig,
    IAdminMessengerConfig,
    IPublicMessengerConfig,
    ISecuritySettings,
} from "../types/systemConfig";
import type {
    IReqSupportContact,
    IReqSupportIssueGuide,
    IReqSupportMaintenanceItem,
    IReqSupportResourceLink,
    ISupportContact,
    ISupportIssueGuide,
    ISupportMaintenanceItem,
    ISupportResourceLink,
} from "../types/supportPage";
import instance from "./customAxios";

export const register = (data: IRegister) => instance.post("/api/v1/auth/register", data);
export const login = (username: string, password: string) => instance.post("/api/v1/auth/login", { username, password });
export const verifyEmail = (data: IVerifyEmailReq) => instance.post("/api/v1/auth/verify-email", data);
export const resendOtp = (data: IResendOtpReq) => instance.post("/api/v1/auth/resend-otp", data);
/** Gửi lại OTP xác thực email chỉ cần biết email (tài khoản PENDING_VERIFICATION). */
export const resendOtpByEmail = (email: string) =>
    instance.post("/api/v1/auth/resend-otp-by-email", { email });
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
/** Đặt hoặc đổi PIN 6 số cho xác nhận thanh toán (currentPin khi đã có PIN). */
export const setAccountPaymentPin = (data: { pin: string; currentPin?: string }) =>
    instance.put<IBackendRes<null>>("/api/v1/auth/account/payment-pin", data);
/** Gửi OTP về email đăng nhập để đặt lại PIN (đã từng có PIN). */
export const requestForgotPaymentPinOtp = () =>
    instance.post<IBackendRes<unknown>>("/api/v1/auth/account/payment-pin/forgot-otp");
/** Đặt lại PIN 6 số sau khi nhập OTP từ email. */
export const resetPaymentPinWithOtp = (data: { otp: string; newPin: string; confirmPin: string }) =>
    instance.patch<IBackendRes<unknown>>("/api/v1/auth/account/payment-pin/reset-with-otp", data);
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
export const confirmPayment = (id: number, body?: { pin?: string }) =>
    instance.put<IBackendRes<IPayment>>(`/api/v1/payments/${id}/confirm`, body ?? {});
export const rejectPayment = (id: number) => instance.patch<IBackendRes<void>>(`/api/v1/payments/${id}/reject`);
export const deleteBookingFromPayment = (id: number) => instance.put<IBackendRes<void>>(`/api/v1/payments/${id}/delete-booking`);
export const createPayment = (data: ICreatePaymentReq) => instance.post<IBackendRes<IPaymentRes>>(`/api/v1/client/payments`, data);
export const getQR = (paymentCode: string) => instance.get<IBackendRes<IPaymentRes>>(`/api/v1/client/payments/${paymentCode}/qr`);
/** Lấy QR của payment PENDING theo bookingId (dùng khi tải lại trang). data = null nếu chưa có. */
export const getPendingPaymentByBooking = (bookingId: number) =>
    instance.get<IBackendRes<IPaymentRes | null>>(`/api/v1/client/payments/booking/${bookingId}`);
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

/** Thống kê tổng quan toàn hệ thống (dashboard admin). */
export const getAdminSystemOverview = () =>
    instance.get<IBackendRes<IAdminSystemOverview>>(`/api/v1/admin/dashboard/system-overview`);


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

export const adminGetEmailSenderConfigs = () =>
    instance.get<IBackendRes<IAdminEmailSenderConfig[]>>('/api/v1/admin/system-config/email-senders');
export const adminCreateEmailSenderConfig = (data: { email: string; password: string; active?: boolean }) =>
    instance.post<IBackendRes<IAdminEmailSenderConfig>>('/api/v1/admin/system-config/email-senders', data);
export const adminUpdateEmailSenderConfig = (id: number, data: { email: string; password: string; active?: boolean }) =>
    instance.put<IBackendRes<IAdminEmailSenderConfig>>(`/api/v1/admin/system-config/email-senders/${id}`, data);
export const adminDeleteEmailSenderConfig = (id: number) =>
    instance.delete<IBackendRes<void>>(`/api/v1/admin/system-config/email-senders/${id}`);

export const adminGetBankAccountConfigs = () =>
    instance.get<IBackendRes<IAdminBankAccountConfig[]>>('/api/v1/admin/system-config/bank-accounts');
export const adminCreateBankAccountConfig = (data: { bankCode: string; accountNo: string; accountName: string; active?: boolean }) =>
    instance.post<IBackendRes<IAdminBankAccountConfig>>('/api/v1/admin/system-config/bank-accounts', data);
export const adminUpdateBankAccountConfig = (id: number, data: { bankCode: string; accountNo: string; accountName: string; active?: boolean }) =>
    instance.put<IBackendRes<IAdminBankAccountConfig>>(`/api/v1/admin/system-config/bank-accounts/${id}`, data);
export const adminDeleteBankAccountConfig = (id: number) =>
    instance.delete<IBackendRes<void>>(`/api/v1/admin/system-config/bank-accounts/${id}`);

export const adminGetMessengerConfigs = () =>
    instance.get<IBackendRes<IAdminMessengerConfig[]>>('/api/v1/admin/system-config/messenger');
export const adminCreateMessengerConfig = (data: { pageId: string; active?: boolean }) =>
    instance.post<IBackendRes<IAdminMessengerConfig>>('/api/v1/admin/system-config/messenger', data);
export const adminUpdateMessengerConfig = (id: number, data: { pageId: string; active?: boolean }) =>
    instance.put<IBackendRes<IAdminMessengerConfig>>(`/api/v1/admin/system-config/messenger/${id}`, data);
export const adminDeleteMessengerConfig = (id: number) =>
    instance.delete<IBackendRes<void>>(`/api/v1/admin/system-config/messenger/${id}`);
export const adminGetSecuritySettings = () =>
    instance.get<IBackendRes<ISecuritySettings>>("/api/v1/admin/system-config/security");
export const adminPatchSecuritySettings = (data: { paymentConfirmationPinRequired: boolean }) =>
    instance.patch<IBackendRes<ISecuritySettings>>("/api/v1/admin/system-config/security", data);
export const getPublicMessengerConfig = () =>
    instance.get<IBackendRes<IPublicMessengerConfig>>('/api/v1/client/public/system-config/messenger');

/* api admin — trang Hỗ trợ & Bảo trì */
export const adminGetSupportContacts = () =>
    instance.get<IBackendRes<ISupportContact[]>>('/api/v1/admin/support/contacts');
export const adminCreateSupportContact = (data: IReqSupportContact) =>
    instance.post<IBackendRes<ISupportContact>>('/api/v1/admin/support/contacts', data);
export const adminUpdateSupportContact = (id: number, data: IReqSupportContact) =>
    instance.put<IBackendRes<ISupportContact>>(`/api/v1/admin/support/contacts/${id}`, data);
export const adminDeleteSupportContact = (id: number) =>
    instance.delete<IBackendRes<void>>(`/api/v1/admin/support/contacts/${id}`);

export const adminGetSupportIssueGuides = () =>
    instance.get<IBackendRes<ISupportIssueGuide[]>>('/api/v1/admin/support/issue-guides');
export const adminCreateSupportIssueGuide = (data: IReqSupportIssueGuide) =>
    instance.post<IBackendRes<ISupportIssueGuide>>('/api/v1/admin/support/issue-guides', data);
export const adminUpdateSupportIssueGuide = (id: number, data: IReqSupportIssueGuide) =>
    instance.put<IBackendRes<ISupportIssueGuide>>(`/api/v1/admin/support/issue-guides/${id}`, data);
export const adminDeleteSupportIssueGuide = (id: number) =>
    instance.delete<IBackendRes<void>>(`/api/v1/admin/support/issue-guides/${id}`);

export const adminGetSupportResourceLinks = () =>
    instance.get<IBackendRes<ISupportResourceLink[]>>('/api/v1/admin/support/resource-links');
export const adminCreateSupportResourceLink = (data: IReqSupportResourceLink) =>
    instance.post<IBackendRes<ISupportResourceLink>>('/api/v1/admin/support/resource-links', data);
export const adminUpdateSupportResourceLink = (id: number, data: IReqSupportResourceLink) =>
    instance.put<IBackendRes<ISupportResourceLink>>(`/api/v1/admin/support/resource-links/${id}`, data);
export const adminDeleteSupportResourceLink = (id: number) =>
    instance.delete<IBackendRes<void>>(`/api/v1/admin/support/resource-links/${id}`);

export const adminGetSupportMaintenanceItems = () =>
    instance.get<IBackendRes<ISupportMaintenanceItem[]>>('/api/v1/admin/support/maintenance-items');
export const adminCreateSupportMaintenanceItem = (data: IReqSupportMaintenanceItem) =>
    instance.post<IBackendRes<ISupportMaintenanceItem>>('/api/v1/admin/support/maintenance-items', data);
export const adminUpdateSupportMaintenanceItem = (id: number, data: IReqSupportMaintenanceItem) =>
    instance.put<IBackendRes<ISupportMaintenanceItem>>(`/api/v1/admin/support/maintenance-items/${id}`, data);
export const adminDeleteSupportMaintenanceItem = (id: number) =>
    instance.delete<IBackendRes<void>>(`/api/v1/admin/support/maintenance-items/${id}`);

/* api review */
export const clientCreateReview = (data: ICreateReviewReq) =>
    instance.post<IBackendRes<IReview>>('/api/v1/client/reviews', data);
export const clientGetMyReviews = () =>
    instance.get<IBackendRes<IReview[]>>('/api/v1/client/reviews/my');
export const clientGetReviewMessages = (reviewId: number) =>
    instance.get<IBackendRes<IReviewMessage[]>>(`/api/v1/client/reviews/${reviewId}/messages`);
export const clientSendReviewMessage = (reviewId: number, data: IReviewMessageReq) =>
    instance.post<IBackendRes<IReviewMessage>>(`/api/v1/client/reviews/${reviewId}/messages`, data);

export const adminGetReviews = (query: string) =>
    instance.get<IBackendRes<IModelPaginate<IReview>>>(`/api/v1/reviews?${query}`);
export const adminUpdateReviewStatus = (reviewId: number, data: IUpdateReviewStatusReq) =>
    instance.patch<IBackendRes<IReview>>(`/api/v1/reviews/${reviewId}/status`, data);
export const adminGetReviewMessages = (reviewId: number) =>
    instance.get<IBackendRes<IReviewMessage[]>>(`/api/v1/reviews/${reviewId}/messages`);
export const adminSendReviewMessage = (reviewId: number, data: IReviewMessageReq) =>
    instance.post<IBackendRes<IReviewMessage>>(`/api/v1/reviews/${reviewId}/messages`, data);