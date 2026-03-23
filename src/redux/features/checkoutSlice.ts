import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getAllCheckouts } from '../../config/Api';
import type { ICheckout } from '../../types/checkout';
import type { IBackendRes, IModelPaginate } from '../../types/common';
import { isApiSuccess } from '../../utils/api/isApiSuccess';
import { normalizePaginationMeta } from '../../utils/pagination/normalizePaginationMeta';

interface CheckoutState {
    loading: boolean;
    error?: string;
    result: ICheckout[];
    lastListQuery: string;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: CheckoutState = {
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

export const fetchCheckouts = createAsyncThunk<IModelPaginate<ICheckout>, string, { rejectValue: string }>(
    'checkout/fetchCheckouts',
    async (query, { rejectWithValue }) => {
        try {
            const res = await getAllCheckouts(query);
            const apiResponse: IBackendRes<IModelPaginate<ICheckout>> = res.data;

            if (isApiSuccess(apiResponse.statusCode) && !apiResponse.error && apiResponse.data) {
                return apiResponse.data;
            }

            const errorMessage = apiResponse.error
                ? Array.isArray(apiResponse.error)
                    ? apiResponse.error.join(', ')
                    : apiResponse.error
                : apiResponse.message || 'Lấy danh sách phiếu nhận thất bại';

            return rejectWithValue(errorMessage);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || 'Lỗi hệ thống';
            return rejectWithValue(errorMessage);
        }
    }
);

export const checkoutSlice = createSlice({
    name: 'checkout',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchCheckouts.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchCheckouts.fulfilled, (state, action) => {
                state.loading = false;
                state.result = Array.isArray(action.payload.result) ? action.payload.result : [];
                state.meta = normalizePaginationMeta(action.payload.meta);
                state.lastListQuery = action.meta.arg;
                state.error = undefined;
            })
            .addCase(fetchCheckouts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || 'Lỗi không xác định';
                state.result = [];
            });
    },
});

export const selectCheckouts = (state: RootState) => state.checkout.result;
export const selectCheckoutMeta = (state: RootState) => state.checkout.meta;
export const selectCheckoutLoading = (state: RootState) => state.checkout.loading;
export const selectCheckoutError = (state: RootState) => state.checkout.error;
export const selectCheckoutLastListQuery = (state: RootState) => state.checkout.lastListQuery;

export default checkoutSlice.reducer;
