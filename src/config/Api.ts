/* api auth  */

import type { IRegister } from "../types/auth";
import type { IBackendRes, IModelPaginate } from "../types/common";
import type { ICreatePermissionReq, IPermission, IUpdatePermissionReq } from "../types/permission";
import type { ICreatePitchReq, IPitch, IUpdatePitchReq } from "../types/pitch";
import type { IGetUploadResponse } from "../types/upload";
import type { ICreateUserReq, IUpdateUserReq, IUser } from "../types/user";
import instance from "./customAxios";

export const register = (data: IRegister) => instance.post("/api/v1/auth/register", data);
export const login = (username: string, password: string) => instance.post("/api/v1/auth/login", { username, password });
export const logout = () => instance.post("/api/v1/auth/logout");
export const getAccount = () => instance.get("/api/v1/auth/account");
export const getRefreshToken = () => instance.get("/api/v1/auth/refresh");

/* api user */
export const getAllUsers = (query: string) => instance.get<IBackendRes<IModelPaginate<IUser>>>(`/api/v1/users?${query}`);
export const createUser = (data: ICreateUserReq) => instance.post(`/api/v1/users`, data);
export const deleteUser = (id: number) => instance.delete<IBackendRes<IUser>>(`/api/v1/users/${id}`);
export const getUserById = (id: number) => instance.get<IBackendRes<IUser>>(`/api/v1/users/${id}`);
export const updateUser = (id: number, data: IUpdateUserReq) => instance.put<IBackendRes<IUser>>(`/api/v1/users/${id}`, data);

/* api pitch */
export const getAllPitches = (query: string) => instance.get<IBackendRes<IModelPaginate<IPitch>>>(`/api/v1/pitches?${query}`);
export const createPitch = (data: ICreatePitchReq) => instance.post(`/api/v1/pitches`, data);
export const getPitchById = (id: number) => instance.get<IBackendRes<IPitch>>(`/api/v1/pitches/${id}`);
export const updatePitch = (id: number, data: IUpdatePitchReq) => instance.put<IBackendRes<IPitch>>(`/api/v1/pitches/${id}`, data);
export const deletePitch = (id: number) => instance.delete<IBackendRes<IPitch>>(`/api/v1/pitches/${id}`);

/* api permission */
export const getAllPermissions = (query: string) => instance.get<IBackendRes<IModelPaginate<IPermission>>>(`/api/v1/permissions?${query}`);
export const createPermission = (data: ICreatePermissionReq) => instance.post<IBackendRes<IPermission>>(`/api/v1/permissions`, data);
export const updatePermission = (id: number, data: IUpdatePermissionReq) => instance.put<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`, data);
export const getPermissionById = (id: number) => instance.get<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);
export const deletePermission = (id: number) => instance.delete<IBackendRes<IPermission>>(`/api/v1/permissions/${id}`);

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