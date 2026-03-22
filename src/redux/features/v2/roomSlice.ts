import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../store";
import { getAllRooms } from "../../../config/Api";
import type { IRoom } from "../../../types/v2/room";
import type { IBackendRes, IModelPaginate } from "../../../types/common";
import { isApiSuccess } from "../../../utils/api/isApiSuccess";
import { normalizePaginationMeta } from "../../../utils/pagination/normalizePaginationMeta";

interface RoomState {
    loading: boolean;
    error?: string;
    result: IRoom[];
    lastListQuery: string;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: RoomState = {
    result: [],
    loading: false,
    lastListQuery: "",
    meta: {
        page: 1,
        pageSize: 10,
        pages: 0,
        total: 0,
    },
};

export const fetchRooms = createAsyncThunk<
    IModelPaginate<IRoom>,
    string,
    { rejectValue: string }
>("room/fetchRooms", async (query, { rejectWithValue }) => {
    try {
        const res = await getAllRooms(query);
        const apiResponse: IBackendRes<IModelPaginate<IRoom>> = res.data;

        if (isApiSuccess(apiResponse.statusCode) && !apiResponse.error && apiResponse.data) {
            return apiResponse.data;
        }

        const errorMessage = apiResponse.error
            ? Array.isArray(apiResponse.error)
                ? apiResponse.error.join(", ")
                : apiResponse.error
            : apiResponse.message || "Lấy danh sách phòng thất bại";

        return rejectWithValue(errorMessage);
    } catch (error: any) {
        const errorMessage =
            error?.response?.data?.message || error?.message || "Lỗi hệ thống";
        return rejectWithValue(errorMessage);
    }
});

export const roomSlice = createSlice({
    name: "room",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchRooms.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchRooms.fulfilled, (state, action) => {
                state.loading = false;
                state.result = Array.isArray(action.payload.result) ? action.payload.result : [];
                state.meta = normalizePaginationMeta(action.payload.meta);
                state.lastListQuery = action.meta.arg;
                state.error = undefined;
            })
            .addCase(fetchRooms.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Lỗi không xác định";
                state.result = [];
            });
    },
});

export const selectRooms = (state: RootState) => state.room.result;
export const selectRoomMeta = (state: RootState) => state.room.meta;
export const selectRoomLoading = (state: RootState) => state.room.loading;
export const selectRoomError = (state: RootState) => state.room.error;
export const selectRoomLastListQuery = (state: RootState) => state.room.lastListQuery;

export default roomSlice.reducer;
