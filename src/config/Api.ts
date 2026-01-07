/* api auth  */

import instance from "./customAxios";

// export const register = (data: ICreateUserReq) => instance.post("/api/v1/auth/register", data);
export const login = (username: string, password: string) => instance.post("/api/v1/auth/login", { username, password });
export const logout = () => instance.post("/api/v1/auth/logout");
// export const getAccount = () => instance.get("/api/v1/auth/account");
export const getRefreshToken = () => instance.get("/api/v1/auth/refresh");

