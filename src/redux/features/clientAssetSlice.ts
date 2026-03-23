import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getPublicAssets } from '../../config/Api';
import type { IAsset } from '../../types/asset';
import type { IBackendRes, IModelPaginate } from '../../types/common';
import { isApiSuccess } from '../../utils/api/isApiSuccess';
import { normalizePaginationMeta } from '../../utils/pagination/normalizePaginationMeta';

/** Danh sách tài sản phía client (public API) — structure giống pitchSlice */
interface ClientAssetState {
    loading: boolean;
    error?: string;
    result: IAsset[];
    lastListQuery: string;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: ClientAssetState = {
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

export const fetchPublicAssets = createAsyncThunk<IModelPaginate<IAsset>, string, { rejectValue: string }>(
    'clientAsset/fetchPublicAssets',
    async (query, { rejectWithValue }) => {
        try {
            const res = await getPublicAssets(query);
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

export const clientAssetSlice = createSlice({
    name: 'clientAsset',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPublicAssets.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchPublicAssets.fulfilled, (state, action) => {
                state.loading = false;
                state.result = Array.isArray(action.payload.result) ? action.payload.result : [];
                state.meta = normalizePaginationMeta(action.payload.meta);
                state.lastListQuery = action.meta.arg;
                state.error = undefined;
            })
            .addCase(fetchPublicAssets.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Lỗi không xác định';
                state.result = [];
            });
    },
});

export const selectClientAssets = (state: RootState) => state.clientAsset.result;
export const selectClientAssetMeta = (state: RootState) => state.clientAsset.meta;
export const selectClientAssetLoading = (state: RootState) => state.clientAsset.loading;
export const selectClientAssetError = (state: RootState) => state.clientAsset.error;

export default clientAssetSlice.reducer;
