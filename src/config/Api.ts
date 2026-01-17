/* api auth  */

import type { IRegister } from "../types/auth";
import type { IBackendRes, IModelPaginate } from "../types/common";
import type { IUser } from "../types/user";
import instance from "./customAxios";

export const register = (data: IRegister) => instance.post("/api/v1/auth/register", data);
export const login = (username: string, password: string) => instance.post("/api/v1/auth/login", { username, password });
export const logout = () => instance.post("/api/v1/auth/logout");
export const getAccount = () => instance.get("/api/v1/auth/account");
export const getRefreshToken = () => instance.get("/api/v1/auth/refresh");

/* api user */
export const getAllUsers = (query: string) => instance.get<IBackendRes<IModelPaginate<IUser>>>(`/api/v1/users?${query}`);