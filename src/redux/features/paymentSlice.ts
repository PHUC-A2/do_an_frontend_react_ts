// paymentSlice.ts
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../store";
import { getAllPayments } from "../../config/Api";
import type { IPayment } from "../../types/payment";

interface PaymentState {
    loading: boolean;
    error?: string;
    result: IPayment[];
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: PaymentState = {
    result: [],
    loading: false,
    meta: {
        page: 1,
        pageSize: 10,
        pages: 0,
        total: 0,
    },
};

/* =========================
 * THUNK: FETCH PAYMENTS
 * ========================= */
export const fetchPayments = createAsyncThunk<
    { result: IPayment[]; meta: PaymentState["meta"] },
    string,
    { rejectValue: string }
>(
    "payment/fetchPayments",
    async (query, { rejectWithValue }) => {
        try {
            const res = await getAllPayments(query);

            if (res.data.statusCode === 200 && res.data.data) {
                return {
                    result: res.data.data.result,
                    meta: res.data.data.meta,
                };
            }

            return rejectWithValue(
                res.data.message || "Lấy danh sách payment thất bại"
            );
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message || "Lỗi hệ thống"
            );
        }
    }
);

/* =========================
 * SLICE
 * ========================= */
export const paymentSlice = createSlice({
    name: "payment",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPayments.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchPayments.fulfilled, (state, action) => {
                state.loading = false;
                state.result = action.payload.result;
                state.meta = action.payload.meta;
            })
            .addCase(fetchPayments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

/* =========================
 * SELECTORS
 * ========================= */
export const selectPayments = (state: RootState) => state.payment.result;
export const selectPaymentMeta = (state: RootState) => state.payment.meta;
export const selectPaymentLoading = (state: RootState) => state.payment.loading;
export const selectPaymentError = (state: RootState) => state.payment.error;

export default paymentSlice.reducer;
