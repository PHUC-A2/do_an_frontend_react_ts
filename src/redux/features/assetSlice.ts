import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getAllAssets } from '../../config/Api';
import type { IAsset } from '../../types/asset';
import type { IBackendRes, IModelPaginate } from '../../types/common';
import { isApiSuccess } from '../../utils/api/isApiSuccess';
import { normalizePaginationMeta } from '../../utils/pagination/normalizePaginationMeta';

/** State danh sách tài sản — cùng structure pitchSlice */
interface AssetState {
    loading: boolean;
    error?: string;
    result: IAsset[];
    /** Query GET gần nhất thành công — modal refetch giữ filter/sort. */
    lastListQuery: string;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: AssetState = {
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

export const fetchAssets = createAsyncThunk<IModelPaginate<IAsset>, string, { rejectValue: string }>(
    'asset/fetchAssets',
    async (query, { rejectWithValue }) => {
        try {
            const res = await getAllAssets(query);
            const apiResponse: IBackendRes<IModelPaginate<IAsset>> = res.data;

            if (isApiSuccess(apiResponse.statusCode) && !apiResponse.error && apiResponse.data) {
                return apiResponse.data;
            }

            const errorMessage = apiResponse.error
                ? Array.isArray(apiResponse.error)
                    ? apiResponse.error.join(', ')
                    : apiResponse.error
                : apiResponse.message || 'Lấy danh sách tài sản thất bại';

            return rejectWithValue(errorMessage);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi hệ thống';
            return rejectWithValue(errorMessage);
        }
    }
);

export const assetSlice = createSlice({
    name: 'asset',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchAssets.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchAssets.fulfilled, (state, action) => {
                state.loading = false;
                state.result = Array.isArray(action.payload.result) ? action.payload.result : [];
                state.meta = normalizePaginationMeta(action.payload.meta);
                state.lastListQuery = action.meta.arg;
                state.error = undefined;
            })
            .addCase(fetchAssets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Lỗi không xác định';
                state.result = [];
            });
    },
});

export const selectAssets = (state: RootState) => state.asset.result;
export const selectAssetMeta = (state: RootState) => state.asset.meta;
export const selectAssetLoading = (state: RootState) => state.asset.loading;
export const selectAssetError = (state: RootState) => state.asset.error;
export const selectAssetLastListQuery = (state: RootState) => state.asset.lastListQuery;

export default assetSlice.reducer;
