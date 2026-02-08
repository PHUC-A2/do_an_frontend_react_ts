import { createAsyncThunk, createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IAccount } from "../../types/account";
import { setLogout } from "./authSlice";
import { getAccount } from "../../config/Api";

interface AccountState {
    account: IAccount | null;
    loading: boolean;
    error?: string;
}

const initialState: AccountState = {
    account: null,
    loading: true,
};

export const fetchAccount = createAsyncThunk<
    IAccount | null,
    void,
    { rejectValue: string }
>(
    "account/fetchAccount",
    async (_, { rejectWithValue }) => {
        try {
            const res = await getAccount();

            if (res.data?.statusCode === 200 && res.data.data?.user) {
                return res.data.data.user as IAccount;
            }

            return rejectWithValue("Không lấy được thông tin tài khoản");
        } catch (error: any) {
            return rejectWithValue(
                error?.response?.data?.message || "Lỗi hệ thống"
            );
        }
    }
);


const accountSlice = createSlice({
    name: "account",
    initialState,
    reducers: {
        setAccount(state, action: PayloadAction<IAccount>) {
            state.account = action.payload;
            state.loading = false;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAccount.pending, (state) => {
                state.loading = true;
            })
            .addCase(fetchAccount.fulfilled, (state, action) => {
                state.account = action.payload;
                state.loading = false;
            })
            .addCase(fetchAccount.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload;
            })
            .addCase(setLogout, (state) => {
                state.account = null;
                state.loading = false;
            });
    },
});

export const { setAccount } = accountSlice.actions;
export default accountSlice.reducer;

