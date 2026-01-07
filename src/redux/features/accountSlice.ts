// redux/features/accountSlice.ts
import { createSlice, type PayloadAction } from "@reduxjs/toolkit";
import type { IAccount } from "../../types/account";

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
        setClearAccount(state) {
            state.account = null;
        }
    }
});

export const { setAccount, setClearAccount } = accountSlice.actions;
export default accountSlice.reducer;
