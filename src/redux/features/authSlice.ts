import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
    access_token: string | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    access_token: null,
    isAuthenticated: false,
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setToken(state, action: PayloadAction<string | null>) {
            state.access_token = action.payload;
            state.isAuthenticated = !!action.payload;
        },
        setLogout(state) {
            state.access_token = null;
            state.isAuthenticated = false;
            localStorage.removeItem('access_token');
        }
    }
});

export const { setToken, setLogout } = authSlice.actions;
export default authSlice.reducer;
