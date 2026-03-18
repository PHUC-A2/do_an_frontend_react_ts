import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface MessengerButtonUIState {
    hidden: boolean;
    adminChatOpen: boolean;
    clientChatOpen: boolean;
}

const initialState: MessengerButtonUIState = {
    hidden: false,
    adminChatOpen: false,
    clientChatOpen: false,
};

const messengerButtonUiSlice = createSlice({
    name: "messengerButtonUi",
    initialState,
    reducers: {
        hideMessengerButton(state) {
            state.hidden = true;
        },
        showMessengerButton(state) {
            state.hidden = false;
        },
        setMessengerButtonHidden(state, action: PayloadAction<boolean>) {
            state.hidden = action.payload;
        },
        setAdminChatOpen(state, action: PayloadAction<boolean>) {
            state.adminChatOpen = action.payload;
        },
        setClientChatOpen(state, action: PayloadAction<boolean>) {
            state.clientChatOpen = action.payload;
        },
    },
});

export const {
    hideMessengerButton,
    showMessengerButton,
    setMessengerButtonHidden,
    setAdminChatOpen,
    setClientChatOpen,
} = messengerButtonUiSlice.actions;

export default messengerButtonUiSlice.reducer;
