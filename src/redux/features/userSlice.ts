import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getAllUsers } from '../../config/Api';
import type { IUser } from '../../types/user';
import { isApiSuccess } from '../../utils/api/isApiSuccess';
import { normalizePaginationMeta } from '../../utils/pagination/normalizePaginationMeta';

interface UserState {
    loading: boolean;
    error?: string;
    result: IUser[];
    lastListQuery: string;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: UserState = {
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

export const fetchUsers = createAsyncThunk<
    { result: IUser[]; meta: UserState["meta"] },
    string,
    { rejectValue: string }
>(
    'user/fetchUsers',
    async (query, { rejectWithValue }) => {
        try {
            const res = await getAllUsers(query);

            if (isApiSuccess(res.data.statusCode) && res.data.data) {
                return {
                    result: Array.isArray(res.data.data.result) ? res.data.data.result : [],
                    meta: normalizePaginationMeta(res.data.data.meta),
                };
            }

            return rejectWithValue(res.data.message || "Lấy người dùng thất bại");
        } catch (error: any) {
            console.log(error);
            return rejectWithValue(
                error?.response?.data?.message || "Lỗi hệ thống"
            );
        }
    }
);

export const userSlice = createSlice({
    name: 'user',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchUsers.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchUsers.fulfilled, (state, action) => {
                state.loading = false;
                state.result = action.payload.result;
                state.meta = action.payload.meta;
                state.lastListQuery = action.meta.arg;
            })
            .addCase(fetchUsers.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const selectUsers = (state: RootState) => state.user.result;
export const selectUserMeta = (state: RootState) => state.user.meta;
export const selectUserLoading = (state: RootState) => state.user.loading;
export const selectUserLastListQuery = (state: RootState) => state.user.lastListQuery;

export default userSlice.reducer;
