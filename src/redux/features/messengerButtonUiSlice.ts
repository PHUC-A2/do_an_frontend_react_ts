import { createSlice, type PayloadAction } from "@reduxjs/toolkit";

interface MessengerButtonUIState {
    hidden: boolean;
}

const initialState: MessengerButtonUIState = {
    hidden: false,
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
    },
});

export const {
    hideMessengerButton,
    showMessengerButton,
    setMessengerButtonHidden,
} = messengerButtonUiSlice.actions;

export default messengerButtonUiSlice.reducer;
