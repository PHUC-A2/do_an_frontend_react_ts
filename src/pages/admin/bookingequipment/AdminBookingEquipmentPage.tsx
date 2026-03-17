import { Table, Tag, Space, Card, Input, Button, Popconfirm, Typography } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState, useEffect, useMemo } from 'react';
import { toast } from 'react-toastify';
import { SearchOutlined } from '@ant-design/icons';
import { formatVND } from '../../../utils/format/price';

const { Text } = Typography;

import type { IBookingEquipment } from '../../../types/bookingEquipment';
import {
    BOOKING_EQUIPMENT_STATUS_META,
} from '../../../utils/constants/bookingEquipment.constants';
import {
    getAllBookingEquipments,
    updateBookingEquipmentStatus,
} from '../../../config/Api';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { useAppDispatch } from '../../../redux/hooks';
import { fetchEquipments } from '../../../redux/features/equipmentSlice';

const AdminBookingEquipmentPage = () => {
    const dispatch = useAppDispatch();
    const [allList, setAllList] = useState<IBookingEquipment[]>([]);
    const [loading, setLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [searchId, setSearchId] = useState('');

    // Load tất cả khi mount
    useEffect(() => {
        setLoading(true);
        getAllBookingEquipments()
            .then(res => setAllList(res.data.data ?? []))
            .catch(() => toast.error('Không tải được danh sách'))
            .finally(() => setLoading(false));
    }, []);

    // Lọc theo booking ID nếu có nhập
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
                    item.id === id ? { ...item, status: status as any, penaltyAmount: updated?.penaltyAmount ?? 0 } : item
                ));
                // Reload danh sách thiết bị để cập nhật totalQuantity/availableQuantity
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
        { title: 'ID', dataIndex: 'id', key: 'id', width: 60 },
        { title: 'Booking ID', dataIndex: 'bookingId', key: 'bookingId', width: 100 },
        { title: 'Thiết bị', dataIndex: 'equipmentName', key: 'equipmentName' },
        { title: 'Số lượng', dataIndex: 'quantity', key: 'quantity', width: 90 },
        {
            title: 'Trạng thái', dataIndex: 'status', key: 'status', width: 130,
            render: (status: IBookingEquipment['status'], record: IBookingEquipment) => (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
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
            title: 'Hành động', key: 'actions',
            render: (_: any, record: IBookingEquipment) => (
                record.status === 'BORROWED' ? (
                    <Space>
                        <Popconfirm title="Xác nhận đã trả?" okText="Đã trả" cancelText="Huỷ"
                            onConfirm={() => handleUpdateStatus(record.id, 'RETURNED')}>
                            <Button size="small" type="primary" loading={updatingId === record.id}>Trả</Button>
                        </Popconfirm>
                        <Popconfirm title="Báo hỏng?" description="Thiết bị sẽ bị loại khỏi kho."
                            okText="Xác nhận" cancelText="Huỷ" okButtonProps={{ danger: true }}
                            onConfirm={() => handleUpdateStatus(record.id, 'DAMAGED')}>
                            <Button size="small" danger loading={updatingId === record.id}>Hỏng</Button>
                        </Popconfirm>
                        <Popconfirm
                            title="Báo thiết bị bị mất?"
                            description={<span>Tiền đền: <strong style={{ color: '#ff4d4f' }}>{formatVND(record.quantity * record.equipmentPrice)}</strong></span>}
                            okText="Xác nhận mất" cancelText="Huỷ" okButtonProps={{ danger: true }}
                            onConfirm={() => handleUpdateStatus(record.id, 'LOST')}>
                            <Button size="small" danger loading={updatingId === record.id}>Mất</Button>
                        </Popconfirm>
                    </Space>
                ) : <span style={{ color: '#888' }}>—</span>
            ),
        },
    ];

    return (
        <AdminWrapper>
            <Card
                size="small"
                title="Danh sách thiết bị mượn"
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
                style={{ borderRadius: 8, boxShadow: '0 2px 8px rgba(0,0,0,0.06)' }}
            >
                <Table<IBookingEquipment>
                    columns={columns}
                    dataSource={list}
                    rowKey="id"
                    loading={loading}
                    size="small"
                    bordered
                    pagination={{ pageSize: 20, showSizeChanger: false }}
                    locale={{ emptyText: 'Không có dữ liệu' }}
                    scroll={{ x: 'max-content' }}
                />
            </Card>
        </AdminWrapper>
    );
};

export default AdminBookingEquipmentPage;
