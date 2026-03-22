import { createSlice } from "@reduxjs/toolkit";
import type { RootState } from "../../store";
import type { IRoomScheduleV2 } from "../../../types/v2/roomSchedule";

interface RoomScheduleV2State {
    schedules: IRoomScheduleV2[];
    currentSchedule: IRoomScheduleV2 | null;
    loading: boolean;
}

const initialState: RoomScheduleV2State = {
    schedules: [],
    currentSchedule: null,
    loading: false,
};

export const roomScheduleSlice = createSlice({
    name: "roomScheduleV2",
    initialState,
    reducers: {
        setSchedule: (state, action: { payload: IRoomScheduleV2 | null }) => {
            state.currentSchedule = action.payload;
        },
        clearSchedule: (state) => {
            state.currentSchedule = null;
        },
        setRoomScheduleLoading: (state, action: { payload: boolean }) => {
            state.loading = action.payload;
        },
    },
});

export const { setSchedule, clearSchedule, setRoomScheduleLoading } = roomScheduleSlice.actions;

export const selectRoomScheduleCurrent = (state: RootState) => state.roomScheduleV2.currentSchedule;
export const selectRoomScheduleLoading = (state: RootState) => state.roomScheduleV2.loading;

export default roomScheduleSlice.reducer;
