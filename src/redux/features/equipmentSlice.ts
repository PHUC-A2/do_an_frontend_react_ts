import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import type { RootState } from '../store';
import { getAllEquipments } from '../../config/Api';
import type { IEquipment } from '../../types/equipment';
import type { IBackendRes, IModelPaginate } from '../../types/common';

interface EquipmentState {
    loading: boolean;
    error?: string;
    result: IEquipment[];
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: EquipmentState = {
    result: [],
    loading: false,
    meta: {
        page: 1,
        pageSize: 10,
        pages: 0,
        total: 0,
    },
};

export const fetchEquipments = createAsyncThunk<
    IModelPaginate<IEquipment>,
    string,
    { rejectValue: string }
>(
    'equipment/fetchEquipments',
    async (query, { rejectWithValue }) => {
        try {
            const res = await getAllEquipments(query);
            const apiResponse: IBackendRes<IModelPaginate<IEquipment>> = res.data;

            if (apiResponse.statusCode === 200 && !apiResponse.error && apiResponse.data) {
                return apiResponse.data;
            }

            const errorMessage = apiResponse.error
                ? (Array.isArray(apiResponse.error) ? apiResponse.error.join(', ') : apiResponse.error)
                : apiResponse.message || "Lấy danh sách thiết bị thất bại";

            return rejectWithValue(errorMessage);
        } catch (error: any) {
            const errorMessage = error?.response?.data?.message || error?.message || "Lỗi hệ thống";
            return rejectWithValue(errorMessage);
        }
    }
);

export const equipmentSlice = createSlice({
    name: 'equipment',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchEquipments.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchEquipments.fulfilled, (state, action) => {
                state.loading = false;
                state.result = action.payload.result;
                state.meta = action.payload.meta;
                state.error = undefined;
            })
            .addCase(fetchEquipments.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Lỗi không xác định";
                state.result = [];
            });
    },
});

export const selectEquipments = (state: RootState) => state.equipment.result;
export const selectEquipmentMeta = (state: RootState) => state.equipment.meta;
export const selectEquipmentLoading = (state: RootState) => state.equipment.loading;
export const selectEquipmentError = (state: RootState) => state.equipment.error;

export default equipmentSlice.reducer;
