export type NotificationTypeEnum =
    | 'BOOKING_CREATED'
    | 'BOOKING_PENDING_CONFIRMATION'
    | 'BOOKING_APPROVED'
    | 'BOOKING_REJECTED'
    | 'EQUIPMENT_BORROWED'
    | 'EQUIPMENT_RETURNED'
    | 'EQUIPMENT_LOST'
    | 'EQUIPMENT_DAMAGED'
    | 'PAYMENT_REQUESTED'
    | 'PAYMENT_PROOF_UPLOADED'
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
