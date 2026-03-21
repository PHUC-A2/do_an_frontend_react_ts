/** Trạng thái vận hành phòng (khớp enum RoomStatusEnum phía backend). */
export type IRoomStatus = "ACTIVE" | "INACTIVE" | "MAINTENANCE";

export interface IRoom {
    id: number;
    /** Tên phòng hiển thị, ví dụ: Phòng A411 */
    roomName: string;
    building: string;
    floor: number;
    roomNumber: number;
    capacity: number;
    description?: string | null;
    status: IRoomStatus;
    roomUrl?: string | null;
    contactPerson?: string | null;
    contactPhone?: string | null;
    keyLocation?: string | null;
    notes?: string | null;
    createdAt?: string | null;
    updatedAt?: string | null;
    createdBy?: string | null;
    updatedBy?: string | null;
}

export interface ICreateRoomRequest {
    roomName: string;
    building: string;
    floor: number;
    roomNumber: number;
    capacity: number;
    description?: string | null;
    status?: IRoomStatus;
    roomUrl?: string | null;
    contactPerson?: string | null;
    contactPhone?: string | null;
    keyLocation?: string | null;
    notes?: string | null;
}

export interface IUpdateRoomRequest {
    roomName: string;
    building: string;
    floor: number;
    roomNumber: number;
    capacity: number;
    description?: string | null;
    status: IRoomStatus;
    roomUrl?: string | null;
    contactPerson?: string | null;
    contactPhone?: string | null;
    keyLocation?: string | null;
    notes?: string | null;
}
