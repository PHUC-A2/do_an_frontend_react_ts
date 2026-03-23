import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getAllDeviceIssues } from '../../config/Api';
import type { IDeviceIssue } from '../../types/deviceIssue';
import type { IBackendRes, IModelPaginate } from '../../types/common';
import { isApiSuccess } from '../../utils/api/isApiSuccess';
import { normalizePaginationMeta } from '../../utils/pagination/normalizePaginationMeta';

interface DeviceIssueState {
    loading: boolean;
    error?: string;
    result: IDeviceIssue[];
    lastListQuery: string;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: DeviceIssueState = {
    result: [],
    loading: false,
    lastListQuery: '',
    meta: {
        page: 1,
        pageSize: 10,
        pages: 0,
        total: 0,
    },
};

export const fetchDeviceIssues = createAsyncThunk<
    IModelPaginate<IDeviceIssue>,
    string,
    { rejectValue: string }
>('deviceIssue/fetchDeviceIssues', async (query, { rejectWithValue }) => {
    try {
        const res = await getAllDeviceIssues(query);
        const apiResponse: IBackendRes<IModelPaginate<IDeviceIssue>> = res.data;

        if (isApiSuccess(apiResponse.statusCode) && !apiResponse.error && apiResponse.data) {
            return apiResponse.data;
        }

        const errorMessage = apiResponse.error
            ? Array.isArray(apiResponse.error)
                ? apiResponse.error.join(', ')
                : apiResponse.error
            : apiResponse.message || 'Lấy danh sách sự cố thiết bị thất bại';

        return rejectWithValue(errorMessage);
    } catch (error: any) {
        const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi hệ thống';
        return rejectWithValue(errorMessage);
    }
});

export const deviceIssueSlice = createSlice({
    name: 'deviceIssue',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDeviceIssues.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchDeviceIssues.fulfilled, (state, action) => {
                state.loading = false;
                state.result = Array.isArray(action.payload.result) ? action.payload.result : [];
                state.meta = normalizePaginationMeta(action.payload.meta);
                state.lastListQuery = action.meta.arg;
                state.error = undefined;
            })
            .addCase(fetchDeviceIssues.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Lỗi không xác định';
                state.result = [];
            });
    },
});

export const selectDeviceIssues = (state: RootState) => state.deviceIssue.result;
export const selectDeviceIssueMeta = (state: RootState) => state.deviceIssue.meta;
export const selectDeviceIssueLoading = (state: RootState) => state.deviceIssue.loading;
export const selectDeviceIssueError = (state: RootState) => state.deviceIssue.error;
export const selectDeviceIssueLastListQuery = (state: RootState) => state.deviceIssue.lastListQuery;

export default deviceIssueSlice.reducer;
