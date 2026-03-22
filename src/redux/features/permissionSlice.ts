import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import type { IPermission } from "../../types/permission";
import { getAllPermissions } from "../../config/Api";
import { isApiSuccess } from "../../utils/api/isApiSuccess";
import { normalizePaginationMeta } from "../../utils/pagination/normalizePaginationMeta";

interface PermissionState {
    loading: boolean;
    error?: string;
    result: IPermission[];
    lastListQuery: string;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: PermissionState = {
    result: [],
    loading: false,
    lastListQuery: "",
    meta: {
        page: 1,
        pageSize: 10,
        pages: 0,
        total: 0,
    },
};
export const fetchPermissions = createAsyncThunk<
    { result: IPermission[]; meta: PermissionState["meta"] },
    string,
    { rejectValue: string }
>(
    "permission/fetchPermissions",
    async (query, { rejectWithValue }) => {
        try {
            const res = await getAllPermissions(query);

            if (isApiSuccess(res.data.statusCode) && res.data.data) {
                return {
                    result: Array.isArray(res.data.data.result) ? res.data.data.result : [],
                    meta: normalizePaginationMeta(res.data.data.meta),
                };
            }

            return rejectWithValue(
                res.data.message || "Lấy danh sách permission thất bại"
            );
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message || "Lỗi hệ thống"
            );
        }
    }
);
export const permissionSlice = createSlice({
    name: "permission",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPermissions.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchPermissions.fulfilled, (state, action) => {
                state.loading = false;
                state.result = action.payload.result;
                state.meta = action.payload.meta;
                state.lastListQuery = action.meta.arg;
            })
            .addCase(fetchPermissions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});
export const selectPermissions = (state: RootState) => state.permission.result;
export const selectPermissionMeta = (state: RootState) => state.permission.meta;
export const selectPermissionLoading = (state: RootState) => state.permission.loading;
export const selectPermissionLastListQuery = (state: RootState) => state.permission.lastListQuery;
export default permissionSlice.reducer;
