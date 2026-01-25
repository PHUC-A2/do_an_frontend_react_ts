import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { getAllRoles } from "../../config/Api";
import type { IRole } from "../../types/role";

interface RoleState {
    loading: boolean;
    error?: string;
    result: IRole[];
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: RoleState = {
    result: [],
    loading: false,
    meta: {
        page: 1,
        pageSize: 10,
        pages: 0,
        total: 0,
    },
};
export const fetchRoles = createAsyncThunk<
    { result: IRole[]; meta: RoleState["meta"] },
    string,
    { rejectValue: string }
>(
    "role/fetchRoles",
    async (query, { rejectWithValue }) => {
        try {
            const res = await getAllRoles(query);

            if (res.data.statusCode === 200 && res.data.data) {
                return {
                    result: res.data.data.result,
                    meta: res.data.data.meta,
                };
            }

            return rejectWithValue(
                res.data.message || "Lấy danh sách role thất bại"
            );
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message || "Lỗi hệ thống"
            );
        }
    }
);
export const roleSlice = createSlice({
    name: "role",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRoles.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchRoles.fulfilled, (state, action) => {
                state.loading = false;
                state.result = action.payload.result;
                state.meta = action.payload.meta;
            })
            .addCase(fetchRoles.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});
export const selectRoles = (state: RootState) => state.role.result;
export const selectRoleMeta = (state: RootState) => state.role.meta;
export const selectRoleLoading = (state: RootState) => state.role.loading;
export default roleSlice.reducer;
