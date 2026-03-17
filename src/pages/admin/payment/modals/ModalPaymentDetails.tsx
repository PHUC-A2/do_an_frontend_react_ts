import { Avatar, Descriptions, Drawer, Image, Spin, Tag } from 'antd';
import { UserOutlined } from '@ant-design/icons';
import type { IPayment } from '../../../../types/payment';
import { PAYMENT_STATUS_META } from '../../../../utils/constants/payment.constanst';
import { formatInstant } from '../../../../utils/format/localdatetime';

interface IProps {
    open: boolean;
    onClose: () => void;
    payment: IPayment | null;
    isLoading?: boolean;
}

const METHOD_LABEL: Record<string, string> = {
    BANK_TRANSFER: 'Chuyển khoản',
    CASH: 'Tiền mặt',
};

const ModalPaymentDetails = ({ open, onClose, payment, isLoading = false }: IProps) => {
    const displayName = payment?.userFullName || payment?.userName || 'N/A';

    return (
        <Drawer
            title="Chi tiết thanh toán"
            placement="right"
            onClose={onClose}
            open={open}
            size="default"
        >
            <Spin spinning={isLoading}>
                <Descriptions bordered column={1} size="small">

                    {/* ── Người thanh toán ── */}
                    <Descriptions.Item label="Avatar">
                        <div style={{ display: 'flex', justifyContent: 'center' }}>
                            <Avatar
                                size={72}
                                src={payment?.userAvatarUrl || undefined}
                                icon={!payment?.userAvatarUrl && <UserOutlined />}
                                style={{ backgroundColor: '#2C3E50' }}
                            />
                        </div>
                    </Descriptions.Item>
                    <Descriptions.Item label="User ID">{payment?.userId ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Tên">{payment?.userName ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Họ và tên">{payment?.userFullName ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Email">{payment?.userEmail ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Số điện thoại">{payment?.userPhone ?? 'N/A'}</Descriptions.Item>

                    {/* ── Thông tin thanh toán ── */}
                    <Descriptions.Item label="Payment ID">{payment?.id}</Descriptions.Item>
                    <Descriptions.Item label="Booking ID">{payment?.bookingId}</Descriptions.Item>
                    <Descriptions.Item label="Sân">{payment?.pitchName ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Thời gian đặt">
                        {payment?.bookingStart && payment?.bookingEnd
                            ? `${formatInstant(payment.bookingStart)} → ${formatInstant(payment.bookingEnd)}`
                            : 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="SĐT liên hệ">{payment?.contactPhone ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Mã thanh toán">{payment?.paymentCode ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Nội dung">{payment?.content ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Phương thức">
                        <Tag color={payment?.method === 'BANK_TRANSFER' ? 'blue' : 'gold'}>
                            {payment?.method ? METHOD_LABEL[payment.method] : 'N/A'}
                        </Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Số tiền">
                        {payment?.amount != null ? payment.amount.toLocaleString('vi-VN') + ' ₫' : 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Trạng thái">
                        {payment?.status ? (
                            <Tag color={PAYMENT_STATUS_META[payment.status].color}>
                                {PAYMENT_STATUS_META[payment.status].label}
                            </Tag>
                        ) : 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Ảnh minh chứng">
                        {payment?.proofUrl ? (
                            <Image
                                width={80}
                                height={80}
                                src={payment.proofUrl}
                                style={{ objectFit: 'cover', borderRadius: 6 }}
                            />
                        ) : (
                            <span style={{ fontStyle: 'italic', color: '#999' }}>Không có</span>
                        )}
                    </Descriptions.Item>
                    <Descriptions.Item label="Thanh toán lúc">{formatInstant(payment?.paidAt)}</Descriptions.Item>
                    <Descriptions.Item label="Ngày tạo">{formatInstant(payment?.createdAt)}</Descriptions.Item>
                    <Descriptions.Item label="Người tạo">{payment?.createdBy ?? 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Cập nhật lúc">{formatInstant(payment?.updatedAt)}</Descriptions.Item>
                    <Descriptions.Item label="Người cập nhật">{payment?.updatedBy ?? 'N/A'}</Descriptions.Item>

                </Descriptions>
            </Spin>
        </Drawer>
    );
};

export default ModalPaymentDetails;
