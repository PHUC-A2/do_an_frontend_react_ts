import { Table, Tag, Space, Card, Input, Popconfirm, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { SearchOutlined } from '@ant-design/icons';
import RBButton from 'react-bootstrap/Button';
import { FaCheck } from 'react-icons/fa6';
import { MdOutlineHandyman } from 'react-icons/md';
import { TbAlertTriangle } from 'react-icons/tb';
import { formatVND } from '../../../utils/format/price';
import type { IBookingEquipment } from '../../../types/bookingEquipment';
import { BOOKING_EQUIPMENT_STATUS_META } from '../../../utils/constants/bookingEquipment.constants';
import { getAllBookingEquipments, updateBookingEquipmentStatus } from '../../../config/Api';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { useAppDispatch } from '../../../redux/hooks';
import { fetchEquipments } from '../../../redux/features/equipmentSlice';

const { Text } = Typography;

const AdminBookingEquipmentPage = () => {
    const dispatch = useAppDispatch();
    const [allList, setAllList] = useState<IBookingEquipment[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [searchId, setSearchId] = useState('');

    useEffect(() => {
        setLoading(true);
        getAllBookingEquipments()
            .then(res => setAllList(res.data.data ?? []))
            .catch(() => toast.error('Không tải được danh sách'))
            .finally(() => setLoading(false));
    }, []);

    const list = useMemo(() => {
        const trimmed = searchId.trim();
        if (!trimmed) return allList;
        return allList.filter(item => String(item.bookingId) === trimmed);
    }, [allList, searchId]);

    const handleUpdateStatus = async (id: number, status: string) => {
        setUpdatingId(id);
        try {
            const res = await updateBookingEquipmentStatus(id, { status: status as any });
            if (res.data.statusCode === 200) {
                toast.success('Cập nhật trạng thái thành công');
                const updated = res.data.data;
                setAllList(prev => prev.map(item =>
                    item.id === id
                        ? { ...item, status: status as any, penaltyAmount: updated?.penaltyAmount ?? 0 }
                        : item
                ));
                if (status === 'LOST' || status === 'DAMAGED') {
                    dispatch(fetchEquipments(''));
                }
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không xác định');
        } finally {
            setUpdatingId(null);
        }
    };

    const columns: ColumnsType<IBookingEquipment> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 60,
            align: 'center' as const,
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'Booking ID',
            dataIndex: 'bookingId',
            key: 'bookingId',
            width: 110,
            align: 'center' as const,
            sorter: (a, b) => a.bookingId - b.bookingId,
        },
        {
            title: 'Thiết bị',
            dataIndex: 'equipmentName',
            key: 'equipmentName',
        },
        {
            title: 'Số lượng',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 100,
            align: 'center' as const,
            sorter: (a, b) => a.quantity - b.quantity,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 160,
            align: 'center' as const,
            render: (status: IBookingEquipment['status'], record: IBookingEquipment) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    <Tag color={BOOKING_EQUIPMENT_STATUS_META[status].color}>
                        {BOOKING_EQUIPMENT_STATUS_META[status].label}
                    </Tag>
                    {status === 'LOST' && record.penaltyAmount > 0 && (
                        <Text type="danger" style={{ fontSize: 11 }}>
                            Đền: {formatVND(record.penaltyAmount)}
                        </Text>
                    )}
                </div>
            ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 210,
            align: 'center' as const,
            render: (_: any, record: IBookingEquipment) =>
                record.status === 'BORROWED' ? (
                    <Space size={4}>
                        <Popconfirm
                            title="Xác nhận đã trả?"
                            okText="Đã trả"
                            cancelText="Huỷ"
                            onConfirm={() => handleUpdateStatus(record.id, 'RETURNED')}
                        >
                            <RBButton
                                size="sm"
                                variant="outline-warning"
                                disabled={updatingId === record.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                                <FaCheck /> Trả
                            </RBButton>
                        </Popconfirm>

                        <Popconfirm
                            title="Báo hỏng?"
                            description="Thiết bị sẽ bị loại khỏi kho."
                            okText="Xác nhận"
                            cancelText="Huỷ"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleUpdateStatus(record.id, 'DAMAGED')}
                        >
                            <RBButton
                                size="sm"
                                variant="outline-secondary"
                                disabled={updatingId === record.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                                <MdOutlineHandyman /> Hỏng
                            </RBButton>
                        </Popconfirm>

                        <Popconfirm
                            title="Báo thiết bị bị mất?"
                            description={
                                <span>
                                    Tiền đền:{' '}
                                    <strong style={{ color: '#ff4d4f' }}>
                                        {formatVND(record.quantity * record.equipmentPrice)}
                                    </strong>
                                </span>
                            }
                            okText="Xác nhận mất"
                            cancelText="Huỷ"
                            okButtonProps={{ danger: true }}
                            onConfirm={() => handleUpdateStatus(record.id, 'LOST')}
                        >
                            <RBButton
                                size="sm"
                                variant="outline-danger"
                                disabled={updatingId === record.id}
                                style={{ display: 'flex', alignItems: 'center', gap: 4 }}
                            >
                                <TbAlertTriangle /> Mất
                            </RBButton>
                        </Popconfirm>
                    </Space>
                ) : (
                    <Text type="secondary">—</Text>
                ),
        },
    ];

    return (
        <AdminWrapper>
            <Card
                size="small"
                title="Danh sách thiết bị mượn"
                hoverable={false}
                extra={
                    <Input
                        allowClear
                        prefix={<SearchOutlined />}
                        placeholder="Lọc theo Booking ID"
                        style={{ width: 200 }}
                        value={searchId}
                        onChange={e => setSearchId(e.target.value)}
                    />
                }
                style={{
                    width: '100%',
                    overflowX: 'auto',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
                }}
            >
                <Table<IBookingEquipment>
                    columns={columns}
                    dataSource={list}
                    rowKey="id"
                    loading={loading}
                    size="small"
                    bordered
                    pagination={{
                        pageSize: 20,
                        showSizeChanger: true,
                        showTotal: (total) => `Tổng ${total} bản ghi`,
                    }}
                    locale={{ emptyText: 'Không có dữ liệu' }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>
        </AdminWrapper>
    );
};

export default AdminBookingEquipmentPage;
