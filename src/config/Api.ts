/* api auth  */

import type { IRegister } from "../types/auth";
import type { IBackendRes, IModelPaginate } from "../types/common";
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

// upload
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