export type NotificationTypeEnum =
    | 'BOOKING_CREATED'
    | 'BOOKING_PENDING_CONFIRMATION'
    | 'BOOKING_APPROVED'
    | 'BOOKING_REJECTED'
    | 'PAYMENT_CONFIRMED'
    | 'MATCH_REMINDER';

export interface INotification {
    id: number;
    type: NotificationTypeEnum;
    message: string;
    isRead: boolean;
    deletedByUser: boolean;
    createdAt: string;
}
