export interface IUser {
    id: number;
    name?: string | null;
    fullName?: string | null;
    email: string;
    phoneNumber?: string | null;
    avatarUrl?: string | null;
    status?: UserEnum;
    createdAt: string;         // hoặc Date, tùy backend
    updatedAt: string | null;  // có thể null nếu chưa cập nhật
    createdBy: string;         // email hoặc username
    updatedBy: string | null;  // null nếu chưa ai cập nhật
    roles?: {
        id: number;
        name: string;
        description?: string;
    }[];
}

export type UserEnum = "ACTIVE" | "INACTIVE" | "PENDING_VERIFICATION" | "BANNED" | "DELETED";
