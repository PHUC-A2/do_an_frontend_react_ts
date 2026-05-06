import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface AuthState {
    access_token: string | null;
    tenantId: number | null;
    isAuthenticated: boolean;
}

const initialState: AuthState = {
    access_token: null,
    tenantId: null,
    isAuthenticated: false,
};

const decodeToken = (token: string) => {
    try {
        const payload = JSON.parse(atob(token.split('.')[1]));
        return payload;
    } catch {
        return null;
    }
};

const authSlice = createSlice({
    name: "auth",
    initialState,
    reducers: {
        setToken(state, action: PayloadAction<string | null>) {
            state.access_token = action.payload;
            state.isAuthenticated = !!action.payload;
            if (action.payload) {
                const payload = decodeToken(action.payload);
                state.tenantId = payload?.tenantId || null;
            } else {
                state.tenantId = null;
            }
        },
        setLogout(state) {
            state.access_token = null;
            state.tenantId = null;
            state.isAuthenticated = false;
        }
    }
});

export const { setToken, setLogout } = authSlice.actions;
export default authSlice.reducer;
