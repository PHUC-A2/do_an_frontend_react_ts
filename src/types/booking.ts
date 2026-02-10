export type ShirtOptionEnum = "WITH_PITCH_SHIRT" | "WITHOUT_PITCH_SHIRT";
export type BookingStatusEnum = "ACTIVE" | "PAID" | "CANCELLED";
export interface IBooking {
    id: number;
    userId: number;
    userName: string;
    pitchId: number;
    pitchName: string;
    startDateTime: string;
    endDateTime: string;
    shirtOption: ShirtOptionEnum;
    contactPhone: string;
    durationMinutes: number;
    totalPrice: number;
    status: BookingStatusEnum;
    deletedByUser: boolean;
    createdAt: string;
    updatedAt: string | null;
    createdBy: string;
    updatedBy: string | null;
}

export interface ICreateBookingReq {
    userId: number;
    pitchId: number;
    startDateTime: string;
    endDateTime: string;
    shirtOption: ShirtOptionEnum;
    contactPhone?: string;
}

export interface IUpdateBookingReq {
    pitchId: number;
    startDateTime: string;
    endDateTime: string;
    shirtOption: ShirtOptionEnum;
    contactPhone?: string;
}

export interface ICreateBookingClientReq {
    pitchId: number;
    shirtOption: ShirtOptionEnum;
    contactPhone?: string;
    startDateTime: string;
    endDateTime: string;
}

export interface IUpdateBookingClientReq {
    pitchId: number;
    shirtOption: ShirtOptionEnum;
    contactPhone?: string;
    startDateTime: string;
    endDateTime: string;
}