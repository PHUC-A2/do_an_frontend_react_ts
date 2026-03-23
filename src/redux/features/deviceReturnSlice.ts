import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getAllDeviceReturns } from '../../config/Api';
import type { IDeviceReturn } from '../../types/deviceReturn';
import type { IBackendRes, IModelPaginate } from '../../types/common';
import { isApiSuccess } from '../../utils/api/isApiSuccess';
import { normalizePaginationMeta } from '../../utils/pagination/normalizePaginationMeta';

interface DeviceReturnState {
    loading: boolean;
    error?: string;
    result: IDeviceReturn[];
    lastListQuery: string;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: DeviceReturnState = {
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

export const fetchDeviceReturns = createAsyncThunk<IModelPaginate<IDeviceReturn>, string, { rejectValue: string }>(
    'deviceReturn/fetchDeviceReturns',
    async (query, { rejectWithValue }) => {
        try {
            const res = await getAllDeviceReturns(query);
            const apiResponse: IBackendRes<IModelPaginate<IDeviceReturn>> = res.data;

            if (isApiSuccess(apiResponse.statusCode) && !apiResponse.error && apiResponse.data) {
                return apiResponse.data;
            }

            const errorMessage = apiResponse.error
                ? Array.isArray(apiResponse.error)
                    ? apiResponse.error.join(', ')
                    : apiResponse.error
                : apiResponse.message || 'Lấy danh sách phiếu trả thất bại';

            return rejectWithValue(errorMessage);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi hệ thống';
            return rejectWithValue(errorMessage);
        }
    }
);

export const deviceReturnSlice = createSlice({
    name: 'deviceReturn',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDeviceReturns.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchDeviceReturns.fulfilled, (state, action) => {
                state.loading = false;
                state.result = Array.isArray(action.payload.result) ? action.payload.result : [];
                state.meta = normalizePaginationMeta(action.payload.meta);
                state.lastListQuery = action.meta.arg;
                state.error = undefined;
            })
            .addCase(fetchDeviceReturns.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Lỗi không xác định';
                state.result = [];
            });
    },
});

export const selectDeviceReturns = (state: RootState) => state.deviceReturn.result;
export const selectDeviceReturnMeta = (state: RootState) => state.deviceReturn.meta;
export const selectDeviceReturnLoading = (state: RootState) => state.deviceReturn.loading;
export const selectDeviceReturnError = (state: RootState) => state.deviceReturn.error;
export const selectDeviceReturnLastListQuery = (state: RootState) => state.deviceReturn.lastListQuery;

export default deviceReturnSlice.reducer;
