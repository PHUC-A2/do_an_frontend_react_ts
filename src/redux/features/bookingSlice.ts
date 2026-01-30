import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getAllBookings } from '../../config/Api';
import type { IBooking } from '../../types/booking';

interface BookingState {
    loading: boolean;
    error?: string;
    result: IBooking[];
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: BookingState = {
    result: [],
    loading: false,
    meta: {
        page: 1,
        pageSize: 10,
        pages: 0,
        total: 0,
    },
};

export const fetchBookings = createAsyncThunk<
    { result: IBooking[]; meta: BookingState["meta"] },
    string,
    { rejectValue: string }
>(
    'booking/fetchBookings',
    async (query, { rejectWithValue }) => {
        try {
            const res = await getAllBookings(query);

            if (res.data.statusCode === 200 && res.data.data) {
                return {
                    result: res.data.data.result,
                    meta: res.data.data.meta
                };
            }

            return rejectWithValue(res.data.message || "Lấy đặt lịch thất bại");
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message || "Lỗi hệ thống"
            );
        }
    }
);

export const bookingSlice = createSlice({
    name: 'booking',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchBookings.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchBookings.fulfilled, (state, action) => {
                // console.log(action.payload);
                state.loading = false;
                state.result = action.payload.result;
                state.meta = action.payload.meta;
            })
            .addCase(fetchBookings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const selectBookings = (state: RootState) => state.booking.result;
export const selectBookingMeta = (state: RootState) => state.booking.meta;
export const selectBookingLoading = (state: RootState) => state.booking.loading;

export default bookingSlice.reducer;
