export type BookingStatusEnum = "PENDING" | "ACTIVE" | "CONFIRMED" | "PAID" | "CHECKIN" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
export interface IBooking {
    id: number;
    userId: number;
    userName: string;
    pitchId: number;
    pitchName: string;
    startDateTime: string;
    endDateTime: string;
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
    contactPhone?: string;
}

export interface IUpdateBookingReq {
    pitchId: number;
    startDateTime: string;
    endDateTime: string;
    contactPhone?: string;
}

export interface ICreateBookingClientReq {
    pitchId: number;
    contactPhone?: string;
    startDateTime: string;
    endDateTime: string;
}

export interface IUpdateBookingClientReq {
    pitchId: number;
    contactPhone?: string;
    startDateTime: string;
    endDateTime: string;
}
