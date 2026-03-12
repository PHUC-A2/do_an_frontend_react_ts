import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getAllPitches } from '../../config/Api';
import type { IPitch } from '../../types/pitch';
import type { IBackendRes, IModelPaginate } from '../../types/common';

interface PitchState {
    loading: boolean;
    error?: string;
    result: IPitch[];
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: PitchState = {
    result: [],
    loading: false,
    meta: {
        page: 1,
        pageSize: 10,
        pages: 0,
        total: 0,
    },
};

export const fetchPitches = createAsyncThunk<
    IModelPaginate<IPitch>,
    string,
    { rejectValue: string }
>(
    'pitch/fetchPitches',
    async (query, { rejectWithValue }) => {
        try {
            const res = await getAllPitches(query);
            const apiResponse: IBackendRes<IModelPaginate<IPitch>> = res.data;

            // Check for success: statusCode 200 and no error
            if (apiResponse.statusCode === 200 && !apiResponse.error && apiResponse.data) {
                return apiResponse.data;
            }

            // If error field is set or statusCode is not 200
            const errorMessage = apiResponse.error
                ? (Array.isArray(apiResponse.error) ? apiResponse.error.join(', ') : apiResponse.error)
                : apiResponse.message || "Lấy danh sách sân thất bại";

            return rejectWithValue(errorMessage);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || "Lỗi hệ thống";
            return rejectWithValue(errorMessage);
        }
    }
);

export const pitchSlice = createSlice({
    name: 'pitch',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchPitches.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchPitches.fulfilled, (state, action) => {
                state.loading = false;
                state.result = action.payload.result;
                state.meta = action.payload.meta;
                state.error = undefined;
            })
            .addCase(fetchPitches.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Lỗi không xác định";
                state.result = [];
            });
    },
});

export const selectPitches = (state: RootState) => state.pitch.result;
export const selectPitchMeta = (state: RootState) => state.pitch.meta;
export const selectPitchLoading = (state: RootState) => state.pitch.loading;
export const selectPitchError = (state: RootState) => state.pitch.error;

export default pitchSlice.reducer;
