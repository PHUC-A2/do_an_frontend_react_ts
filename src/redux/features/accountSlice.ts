import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IAccount } from "../../types/account";
import { setLogout } from "./authSlice";

interface AccountState {
    account: IAccount | null;
}

const initialState: AccountState = {
    account: null,
};

const accountSlice = createSlice({
    name: "account",
    initialState,
    reducers: {
        setAccount(state, action: PayloadAction<IAccount>) {
            state.account = action.payload;
        },
    },
    extraReducers: (builder) => {
        builder.addCase(setLogout, (state) => {
            state.account = null;
        });
    },
});

export const { setAccount } = accountSlice.actions;
export default accountSlice.reducer;
