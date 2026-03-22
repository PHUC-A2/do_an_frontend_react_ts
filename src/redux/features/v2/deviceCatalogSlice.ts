import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../store";
import { getAllDeviceCatalogs } from "../../../config/Api";
import type { IDeviceCatalog } from "../../../types/v2/deviceCatalog";
import type { IBackendRes, IModelPaginate } from "../../../types/common";
import { isApiSuccess } from "../../../utils/api/isApiSuccess";
import { normalizePaginationMeta } from "../../../utils/pagination/normalizePaginationMeta";

interface DeviceCatalogState {
    loading: boolean;
    error?: string;
    result: IDeviceCatalog[];
    lastListQuery: string;
    meta: {
        page: number;
        pageSize: number;
        pages: number;
        total: number;
    };
}

const initialState: DeviceCatalogState = {
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

export const fetchDeviceCatalogs = createAsyncThunk<
    IModelPaginate<IDeviceCatalog>,
    string,
    { rejectValue: string }
>("deviceCatalog/fetchDeviceCatalogs", async (query, { rejectWithValue }) => {
    try {
        const res = await getAllDeviceCatalogs(query);
        const apiResponse: IBackendRes<IModelPaginate<IDeviceCatalog>> = res.data;

        if (isApiSuccess(apiResponse.statusCode) && !apiResponse.error && apiResponse.data) {
            return apiResponse.data;
        }

        const errorMessage = apiResponse.error
            ? Array.isArray(apiResponse.error)
                ? apiResponse.error.join(", ")
                : apiResponse.error
            : apiResponse.message || "Lấy danh sách danh mục thiết bị thất bại";

        return rejectWithValue(errorMessage);
    } catch (error: unknown) {
        const err = error as { response?: { data?: { message?: string } }; message?: string };
        return rejectWithValue(err?.response?.data?.message || err?.message || "Lỗi hệ thống");
    }
});

export const deviceCatalogSlice = createSlice({
    name: "deviceCatalog",
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchDeviceCatalogs.pending, (state) => {
                state.loading = true;
                state.error = undefined;
            })
            .addCase(fetchDeviceCatalogs.fulfilled, (state, action) => {
                state.loading = false;
                state.result = Array.isArray(action.payload.result) ? action.payload.result : [];
                state.meta = normalizePaginationMeta(action.payload.meta);
                state.lastListQuery = action.meta.arg;
                state.error = undefined;
            })
            .addCase(fetchDeviceCatalogs.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload || "Lỗi không xác định";
                state.result = [];
            });
    },
});

export const selectDeviceCatalogs = (state: RootState) => state.deviceCatalog.result;
export const selectDeviceCatalogMeta = (state: RootState) => state.deviceCatalog.meta;
export const selectDeviceCatalogLoading = (state: RootState) => state.deviceCatalog.loading;
export const selectDeviceCatalogLastListQuery = (state: RootState) => state.deviceCatalog.lastListQuery;

export default deviceCatalogSlice.reducer;
