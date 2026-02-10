// AdminPaymentPage.tsx
import { Table, Tag, Space, Card, Popconfirm, Empty, Typography, Image } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useEffect, useState } from 'react';
import RBButton from 'react-bootstrap/Button';
import { useAppDispatch, useAppSelector } from '../../../redux/hooks';
import { fetchPayments, selectPaymentLoading, selectPaymentMeta, selectPayments } from '../../../redux/features/paymentSlice';
import type { IPayment } from '../../../types/payment';
import { toast } from 'react-toastify';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { FaCheck } from 'react-icons/fa6';
import { PAYMENT_STATUS_META } from '../../../utils/constants/payment.constanst';
import { confirmPayment } from '../../../config/Api';

const { Text } = Typography;

const AdminPaymentPage = () => {
    const dispatch = useAppDispatch();
    const listPayments = useAppSelector(selectPayments);
    const meta = useAppSelector(selectPaymentMeta);
    const loading = useAppSelector(selectPaymentLoading);

    const [confirmingId, setConfirmingId] = useState<number | null>(null);

    const handleConfirmPayment = async (id: number) => {
        try {
            setConfirmingId(id);
            const res = await confirmPayment(id);

            if (res.data.statusCode === 200) {
                toast.success('Xác nhận thanh toán thành công');
                dispatch(fetchPayments(""));
            }
        } catch (error: any) {
            const m = error?.response?.data?.message ?? "Không xác định";
            toast.error(
                <div>
                    <div>Có lỗi xảy ra khi xác nhận thanh toán</div>
                    <div>{m}</div>
                </div>
            );
        } finally {
            setConfirmingId(null);
        }
    };

    const columns: ColumnsType<IPayment> = [
        {
            title: 'STT',
            key: 'stt',
            render: (_: any, __: IPayment, index: number) =>
                (meta.page - 1) * meta.pageSize + index + 1,
        },
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'Booking ID',
            dataIndex: 'bookingId',
            key: 'bookingId',
            sorter: (a, b) => a.bookingId - b.bookingId,
        },
        {
            title: 'Mã thanh toán',
            dataIndex: 'paymentCode',
            key: 'paymentCode',
            render: (code: string) => (
                <Text copyable style={{ fontWeight: 500 }}>
                    {code}
                </Text>
            ),
        },
        {
            title: 'Nội dung',
            dataIndex: 'content',
            key: 'content',
            ellipsis: true,
            render: (text?: string) => text || '-',
        },
        {
            title: 'Phương thức',
            dataIndex: 'method',
            key: 'method',
            render: (method: IPayment['method']) => (
                <Tag color={
                    method === 'BANK_TRANSFER' ? 'blue' : 'gold'
                }>
                    {method === 'BANK_TRANSFER' ? 'Chuyển khoản' : 'Tiền mặt'}
                </Tag>
            ),
        },
        {
            title: 'Số tiền',
            dataIndex: 'amount',
            key: 'amount',
            sorter: (a, b) => a.amount - b.amount,
            render: (amount: number) =>
                amount.toLocaleString('vi-VN') + ' ₫',
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            render: (status: IPayment['status']) => (
                <Tag color={PAYMENT_STATUS_META[status].color}>
                    {PAYMENT_STATUS_META[status].label}
                </Tag>
            ),
        },
        {
            title: 'Ảnh minh chứng',
            dataIndex: 'proofUrl',
            key: 'proofUrl',
            align: 'center',
            render: (url?: string | null) =>
                url ? (
                    <Image
                        width={48}
                        height={48}
                        src={url}
                        style={{
                            objectFit: 'cover',
                            borderRadius: 6,
                            cursor: 'pointer',
                        }}
                        preview={{
                            mask: (
                                <div
                                    style={{
                                        color: '#fff',
                                        fontSize: 12,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                    }}
                                >
                                    Xem ảnh
                                </div>
                            ),
                        }}
                    />
                ) : (
                    <Text type="secondary" italic>
                        Không có
                    </Text>
                ),
        },
        {
            title: 'Đã thanh toán lúc',
            dataIndex: 'paidAt',
            key: 'paidAt',
            render: (date?: string | null) =>
                date ? new Date(date).toLocaleString('vi-VN') : '-',
        },
        {
            title: 'Ngày tạo',
            dataIndex: 'createdAt',
            key: 'createdAt',
            sorter: (a, b) =>
                new Date(a.createdAt).getTime() -
                new Date(b.createdAt).getTime(),
            render: (date: string) =>
                new Date(date).toLocaleString('vi-VN'),
        },
        {
            title: 'Hành động',
            key: 'actions',
            render: (_: any, record: IPayment) => (
                <Space align="center" style={{ justifyContent: "center", width: "100%" }}>
                    <Popconfirm
                        title="Xác nhận thanh toán"
                        description="Bạn có chắc chắn muốn xác nhận thanh toán này không?"
                        onConfirm={() => handleConfirmPayment(record.id)}
                        okText="Xác nhận"
                        cancelText="Hủy"
                        placement="topLeft"
                        okButtonProps={{
                            loading: confirmingId === record.id
                        }}
                        disabled={record.status === 'PAID'}
                    >
                        <RBButton
                            size='sm'
                            variant="outline-success"
                            disabled={record.status === 'PAID'}
                        >
                            <FaCheck />
                        </RBButton>
                    </Popconfirm>
                </Space>
            ),
        },
    ];


    useEffect(() => {
        dispatch(fetchPayments(""));
    }, [dispatch]);

    return (
        <>
            <AdminWrapper>
                <Card
                    size='small'
                    title="Quản lý thanh toán (payment)"
                    hoverable={false}
                    style={{
                        width: '100%',
                        overflowX: 'auto',
                        borderRadius: 8,
                        boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                    }}
                >
                    {listPayments.length === 0 ? (
                        <Empty description="Không có dữ liệu thanh toán" />
                    ) : (
                        <Table<IPayment>
                            columns={columns}
                            dataSource={listPayments}
                            rowKey="id"
                            loading={loading}
                            size='small'
                            pagination={{
                                current: meta.page,
                                pageSize: meta.pageSize,
                                total: meta.total,
                                showSizeChanger: true,
                                onChange: (page, pageSize) => {
                                    dispatch(fetchPayments(`page=${page}&pageSize=${pageSize}`));
                                },
                            }}
                            bordered
                            scroll={{ x: 'max-content' }}
                        />
                    )}
                </Card>
            </AdminWrapper>
        </>
    );
};

export default AdminPaymentPage;
