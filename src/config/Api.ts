/* api auth  */

import type { IRegister } from "../types/auth";
import type { IBooking, ICreateBookingClientReq, ICreateBookingReq, IUpdateBookingClientReq, IUpdateBookingReq } from "../types/booking";
import type { IBackendRes, IModelPaginate } from "../types/common";
import type { ICreatePermissionReq, IPermission, IUpdatePermissionReq } from "../types/permission";
import type { ICreatePitchReq, IPitch, IUpdatePitchReq } from "../types/pitch";
import type { IAssignPermissionReq, ICreateRoleReq, IRole, IUpdateRoleReq } from "../types/role";
import type { IPitchTimeline } from "../types/timeline";
import type { IGetUploadResponse } from "../types/upload";
import type { IAssignRoleReq, ICreateUserReq, IUpdateUserReq, IUser } from "../types/user";
import instance from "./customAxios";

export const register = (data: IRegister) => instance.post("/api/v1/auth/register", data);
export const login = (username: string, password: string) => instance.post("/api/v1/auth/login", { username, password });
export const logout = () => instance.post("/api/v1/auth/logout");
export const getAccount = () => instance.get("/api/v1/auth/account");
export const getRefreshToken = () => instance.get("/api/v1/auth/refresh");

/* api user */
export const getAllUsers = (query: string) => instance.get<IBackendRes<IModelPaginate<IUser>>>(`/api/v1/users?${query}`);
export const createUser = (data: ICreateUserReq) => instance.post<IBackendRes<IUser>>(`/api/v1/users`, data);
export const deleteUser = (id: number) => instance.delete<IBackendRes<IUser>>(`/api/v1/users/${id}`);
export const getUserById = (id: number) => instance.get<IBackendRes<IUser>>(`/api/v1/users/${id}`);
export const updateUser = (id: number, data: IUpdateUserReq) => instance.put<IBackendRes<IUser>>(`/api/v1/users/${id}`, data);

/* api pitch */
export const getAllPitches = (query: string) => instance.get<IBackendRes<IModelPaginate<IPitch>>>(`/api/v1/pitches?${query}`);
export const createPitch = (data: ICreatePitchReq) => instance.post<IBackendRes<IPitch>>(`/api/v1/pitches`, data);
export const getPitchById = (id: number) => instance.get<IBackendRes<IPitch>>(`/api/v1/pitches/${id}`);
export const updatePitch = (id: number, data: IUpdatePitchReq) => instance.put<IBackendRes<IPitch>>(`/api/v1/pitches/${id}`, data);
export const deletePitch = (id: number) => instance.delete<IBackendRes<IPitch>>(`/api/v1/pitches/${id}`);

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