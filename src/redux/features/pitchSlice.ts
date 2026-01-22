import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getAllPitches } from '../../config/Api';
import type { IPitch } from '../../types/pitch';

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
    { result: IPitch[]; meta: PitchState["meta"] },
    string,
    { rejectValue: string }
>(
    'pitch/fetchPitches',
    async (query, { rejectWithValue }) => {
        try {
            const res = await getAllPitches(query);

            if (res.data.statusCode === 200 && res.data.data) {
                return {
                    result: res.data.data.result,
                    meta: res.data.data.meta,
                };
            }

            return rejectWithValue(res.data.message || "Lấy danh sách sân thất bại");
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message || "Lỗi hệ thống"
            );
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
            })
            .addCase(fetchPitches.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            });
    },
});

export const selectPitches = (state: RootState) => state.pitch.result;
export const selectPitchMeta = (state: RootState) => state.pitch.meta;
export const selectPitchLoading = (state: RootState) => state.pitch.loading;

export default pitchSlice.reducer;
