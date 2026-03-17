export type NotificationTypeEnum = 'BOOKING_CREATED' | 'PAYMENT_CONFIRMED' | 'MATCH_REMINDER';

export interface INotification {
    id: number;
    type: NotificationTypeEnum;
    message: string;
    isRead: boolean;
    deletedByUser: boolean;
    createdAt: string;
}
