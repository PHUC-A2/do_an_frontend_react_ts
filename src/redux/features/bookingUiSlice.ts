import { createSlice } from "@reduxjs/toolkit";

interface BookingUiState {
    bookingChangedAt: number | null;
}

const initialState: BookingUiState = {
    bookingChangedAt: null,
};

const bookingUiSlice = createSlice({
    name: "bookingUi",
    initialState,
    reducers: {
        notifyBookingChanged(state) {
            state.bookingChangedAt = Date.now();
        },
    },
});

export const { notifyBookingChanged } = bookingUiSlice.actions;
export default bookingUiSlice.reducer;
