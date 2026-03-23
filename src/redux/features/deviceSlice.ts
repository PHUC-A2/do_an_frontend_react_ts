import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getAllDevices } from '../../config/Api';
import type { IDevice } from '../../types/device';
import type { IBackendRes, IModelPaginate } from '../../types/common';
import { isApiSuccess } from '../../utils/api/isApiSuccess';
import { normalizePaginationMeta } from '../../utils/pagination/normalizePaginationMeta';

interface DeviceState {
    loading: boolean;
    error?: string;
    result: IDevice[];
    lastListQuery: string;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: DeviceState = {
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

export const fetchDevices = createAsyncThunk<IModelPaginate<IDevice>, string, { rejectValue: string }>(
    'device/fetchDevices',
    async (query, { rejectWithValue }) => {
        try {
            const res = await getAllDevices(query);
            const apiResponse: IBackendRes<IModelPaginate<IDevice>> = res.data;

            if (isApiSuccess(apiResponse.statusCode) && !apiResponse.error && apiResponse.data) {
                return apiResponse.data;
            }

            const errorMessage = apiResponse.error
                ? Array.isArray(apiResponse.error)
                    ? apiResponse.error.join(', ')
                    : apiResponse.error
                : apiResponse.message || 'Lấy danh sách thiết bị thất bại';

            return rejectWithValue(errorMessage);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi hệ thống';
            return rejectWithValue(errorMessage);
        }
    }
);

export const deviceSlice = createSlice({
    name: 'device',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDevices.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchDevices.fulfilled, (state, action) => {
                state.loading = false;
                state.result = Array.isArray(action.payload.result) ? action.payload.result : [];
                state.meta = normalizePaginationMeta(action.payload.meta);
                state.lastListQuery = action.meta.arg;
                state.error = undefined;
            })
            .addCase(fetchDevices.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Lỗi không xác định';
                state.result = [];
            });
    },
});

export const selectDevices = (state: RootState) => state.device.result;
export const selectDeviceMeta = (state: RootState) => state.device.meta;
export const selectDeviceLoading = (state: RootState) => state.device.loading;
export const selectDeviceError = (state: RootState) => state.device.error;
export const selectDeviceLastListQuery = (state: RootState) => state.device.lastListQuery;

export default deviceSlice.reducer;
