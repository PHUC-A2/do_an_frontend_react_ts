import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getAllAssetUsages } from '../../config/Api';
import type { IAssetUsage } from '../../types/assetUsage';
import type { IBackendRes, IModelPaginate } from '../../types/common';
import { isApiSuccess } from '../../utils/api/isApiSuccess';
import { normalizePaginationMeta } from '../../utils/pagination/normalizePaginationMeta';

interface AssetUsageState {
    loading: boolean;
    error?: string;
    result: IAssetUsage[];
    lastListQuery: string;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: AssetUsageState = {
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

export const fetchAssetUsages = createAsyncThunk<IModelPaginate<IAssetUsage>, string, { rejectValue: string }>(
    'assetUsage/fetchAssetUsages',
    async (query, { rejectWithValue }) => {
        try {
            const res = await getAllAssetUsages(query);
            const apiResponse: IBackendRes<IModelPaginate<IAssetUsage>> = res.data;

            if (isApiSuccess(apiResponse.statusCode) && !apiResponse.error && apiResponse.data) {
                return apiResponse.data;
            }

            const errorMessage = apiResponse.error
                ? Array.isArray(apiResponse.error)
                    ? apiResponse.error.join(', ')
                    : apiResponse.error
                : apiResponse.message || 'Lấy danh sách đăng ký tài sản thất bại';

            return rejectWithValue(errorMessage);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi hệ thống';
            return rejectWithValue(errorMessage);
        }
    }
);

export const assetUsageSlice = createSlice({
    name: 'assetUsage',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAssetUsages.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchAssetUsages.fulfilled, (state, action) => {
                state.loading = false;
                state.result = Array.isArray(action.payload.result) ? action.payload.result : [];
                state.meta = normalizePaginationMeta(action.payload.meta);
                state.lastListQuery = action.meta.arg;
                state.error = undefined;
            })
            .addCase(fetchAssetUsages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Lỗi không xác định';
                state.result = [];
            });
    },
});

export const selectAssetUsages = (state: RootState) => state.assetUsage.result;
export const selectAssetUsageMeta = (state: RootState) => state.assetUsage.meta;
export const selectAssetUsageLoading = (state: RootState) => state.assetUsage.loading;
export const selectAssetUsageError = (state: RootState) => state.assetUsage.error;
export const selectAssetUsageLastListQuery = (state: RootState) => state.assetUsage.lastListQuery;

export default assetUsageSlice.reducer;
