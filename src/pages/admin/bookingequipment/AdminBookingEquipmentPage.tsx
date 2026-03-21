import { Table, Tag, Space, Card, Input, Tabs, Modal, Typography, Empty, InputNumber, Tooltip, Button } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { SearchOutlined, PrinterOutlined, ToolOutlined } from '@ant-design/icons';
import RBButton from 'react-bootstrap/Button';
import { FaCheck } from 'react-icons/fa6';
import { MdOutlineHandyman } from 'react-icons/md';
import { TbAlertTriangle } from 'react-icons/tb';
import { formatVND } from '../../../utils/format/price';
import { formatDateTime } from '../../../utils/format/localdatetime';
import type { IBookingEquipment, IEquipmentBorrowLog, IEquipmentUsageStats, IUpdateBookingEquipmentStatusReq } from '../../../types/bookingEquipment';
import { BOOKING_EQUIPMENT_STATUS_META } from '../../../utils/constants/bookingEquipment.constants';
import { normalizeBookingEquipmentFromApi, normalizeBookingEquipmentListFromApi } from '../../../utils/bookingEquipmentNormalize';
import {
    getAllBookingEquipments,
    getBookingById,
    updateBookingEquipmentStatus,
    adminGetEquipmentBorrowLogs,
    adminGetEquipmentUsageStats,
} from '../../../config/Api';
import {
    createFallbackBookingForHandover,
    openBookingEquipmentHandoverPrint,
} from '../../../utils/bookingEquipmentHandoverPrint';
import AdminWrapper from '../../../components/wrapper/AdminWrapper';
import { useAppDispatch } from '../../../redux/hooks';
import { fetchEquipments } from '../../../redux/features/equipmentSlice';
import PermissionWrapper from '../../../components/wrapper/PermissionWrapper';
import { usePermission } from '../../../hooks/common/usePermission';

const { Text, Title } = Typography;

const AdminBookingEquipmentPage = () => {
    const dispatch = useAppDispatch();
    const [allList, setAllList] = useState<IBookingEquipment[]>([]);
    const [logs, setLogs] = useState<IEquipmentBorrowLog[]>([]);
    const [stats, setStats] = useState<IEquipmentUsageStats | null>(null);
    const [loading, setLoading] = useState(false);
    const [logsLoading, setLogsLoading] = useState(false);
    const [statsLoading, setStatsLoading] = useState(false);
    const [updatingId, setUpdatingId] = useState<number | null>(null);
    const [searchId, setSearchId] = useState('');
    const [returnTarget, setReturnTarget] = useState<IBookingEquipment | null>(null);
    const [returnNote, setReturnNote] = useState('');
    const [returnQtyGood, setReturnQtyGood] = useState(0);
    const [returnQtyLost, setReturnQtyLost] = useState(0);
    const [returnQtyDamaged, setReturnQtyDamaged] = useState(0);
    const [borrowerSign, setBorrowerSign] = useState('');
    const [staffSign, setStaffSign] = useState('');
    const [printLoadingRowId, setPrintLoadingRowId] = useState<number | null>(null);
    const canView = usePermission('BOOKING_EQUIPMENT_VIEW');

    /** Giống client: một biên bản / booking — meta đầy đủ + bảng 10 cột + ký tên; gồm mọi dòng thiết bị cùng booking. */
    const handlePrintHandover = useCallback(
        async (record: IBookingEquipment) => {
            const lines = allList.filter(e => e.bookingId === record.bookingId && !e.deletedByClient);
            setPrintLoadingRowId(record.id);
            try {
                try {
                    const res = await getBookingById(record.bookingId);
                    const booking = res.data.data;
                    if (booking && Number(res.data.statusCode) === 200) {
                        const ok = openBookingEquipmentHandoverPrint(booking, lines);
                        if (!ok) toast.error('Trình duyệt đã chặn cửa sổ mới — không thể in.');
                        return;
                    }
                } catch {
                    /* fallback */
                }
                toast.warning('Không tải đủ thông tin booking — in biên bản với phần định danh tối thiểu.');
                const ok = openBookingEquipmentHandoverPrint(createFallbackBookingForHandover(record.bookingId), lines);
                if (!ok) toast.error('Trình duyệt đã chặn cửa sổ mới — không thể in.');
            } finally {
                setPrintLoadingRowId(null);
            }
        },
        [allList]
    );

    const openReturnModal = useCallback((record: IBookingEquipment, preset: 'full' | 'lost' | 'damaged') => {
        setReturnTarget(record);
        setReturnNote('');
        const q = record.quantity;
        if (preset === 'full') {
            setReturnQtyGood(q);
            setReturnQtyLost(0);
            setReturnQtyDamaged(0);
        } else if (preset === 'lost') {
            setReturnQtyGood(0);
            setReturnQtyLost(q);
            setReturnQtyDamaged(0);
        } else {
            setReturnQtyGood(0);
            setReturnQtyLost(0);
            setReturnQtyDamaged(q);
        }
        setBorrowerSign('');
        setStaffSign('');
    }, []);

    const reloadBorrowList = useCallback(async () => {
        const res = await getAllBookingEquipments();
        setAllList(normalizeBookingEquipmentListFromApi(res.data.data ?? []));
    }, []);

    const reloadLogs = useCallback(async () => {
        setLogsLoading(true);
        try {
            const res = await adminGetEquipmentBorrowLogs();
            if (res.data.statusCode === 200) setLogs(res.data.data ?? []);
        } catch {
            toast.error('Không tải được nhật ký');
        } finally {
            setLogsLoading(false);
        }
    }, []);

    const reloadStats = useCallback(async () => {
        setStatsLoading(true);
        try {
            const res = await adminGetEquipmentUsageStats();
            if (res.data.statusCode === 200) setStats(res.data.data ?? null);
        } catch {
            toast.error('Không tải được thống kê');
        } finally {
            setStatsLoading(false);
        }
    }, []);

    useEffect(() => {
        if (!canView) return;
        setLoading(true);
        Promise.all([reloadBorrowList(), reloadLogs(), reloadStats()])
            .catch(() => toast.error('Không tải được dữ liệu'))
            .finally(() => setLoading(false));
    }, [canView, reloadBorrowList, reloadLogs, reloadStats]);

    const list = useMemo(() => {
        const trimmed = searchId.trim();
        if (!trimmed) return allList;
        return allList.filter(item => String(item.bookingId) === trimmed);
    }, [allList, searchId]);

    const handleUpdateStatus = async (id: number, body: IUpdateBookingEquipmentStatusReq) => {
        setUpdatingId(id);
        try {
            const res = await updateBookingEquipmentStatus(id, body);
            if (Number(res.data.statusCode) === 200) {
                toast.success('Cập nhật trạng thái thành công');
                const updated = res.data.data != null ? normalizeBookingEquipmentFromApi(res.data.data) : null;
                setAllList(prev =>
                    prev.map(item => (item.id === id && updated ? { ...item, ...updated } : item))
                );
                if (
                    updated?.status === 'LOST' ||
                    updated?.status === 'DAMAGED' ||
                    (updated?.quantityLost ?? 0) > 0 ||
                    (updated?.quantityDamaged ?? 0) > 0
                ) {
                    dispatch(fetchEquipments(''));
                }
                await reloadLogs();
                await reloadStats();
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không xác định');
        } finally {
            setUpdatingId(null);
        }
    };

    const confirmReturn = async () => {
        if (!returnTarget) return;
        const q = returnTarget.quantity;
        const g = returnQtyGood;
        const l = returnQtyLost;
        const d = returnQtyDamaged;
        if (g + l + d !== q) {
            toast.error(`Tổng (trả tốt + mất + hỏng) phải bằng ${q}.`);
            return;
        }
        if (l + d > 0 && (!borrowerSign.trim() || !staffSign.trim())) {
            toast.error('Khi có mất hoặc hỏng, vui lòng nhập họ tên người mượn và nhân viên ký xác nhận.');
            return;
        }
        await handleUpdateStatus(returnTarget.id, {
            status: 'RETURNED',
            returnConditionNote: returnNote.trim() || null,
            quantityReturnedGood: g,
            quantityLost: l,
            quantityDamaged: d,
            borrowerSignName: l + d > 0 ? borrowerSign.trim() : null,
            staffSignName: l + d > 0 ? staffSign.trim() : null,
        });
        setReturnTarget(null);
        setReturnNote('');
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
            width: 100,
            align: 'center' as const,
            sorter: (a, b) => a.bookingId - b.bookingId,
        },
        {
            title: 'Thiết bị',
            dataIndex: 'equipmentName',
            key: 'equipmentName',
        },
        {
            title: 'Loại',
            key: 'mobility',
            width: 110,
            align: 'center' as const,
            render: (_: unknown, record: IBookingEquipment) => {
                const m = record.equipmentMobility;
                if (!m) return <Text type="secondary">—</Text>;
                return <Tag color={m === 'MOVABLE' ? 'blue' : 'geekblue'}>{m === 'MOVABLE' ? 'Lưu động' : 'Cố định'}</Tag>;
            },
        },
        {
            title: 'SL',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 56,
            align: 'center' as const,
            sorter: (a, b) => a.quantity - b.quantity,
        },
        {
            title: 'Trả tốt',
            key: 'qtyG',
            width: 56,
            align: 'center' as const,
            render: (_: unknown, r: IBookingEquipment) =>
                r.status === 'BORROWED' ? <Text type="secondary">—</Text> : (r.quantityReturnedGood ?? 0),
        },
        {
            title: 'Mất',
            key: 'qtyL',
            width: 48,
            align: 'center' as const,
            render: (_: unknown, r: IBookingEquipment) =>
                r.status === 'BORROWED' ? <Text type="secondary">—</Text> : (r.quantityLost ?? 0),
        },
        {
            title: 'Hỏng',
            key: 'qtyD',
            width: 48,
            align: 'center' as const,
            render: (_: unknown, r: IBookingEquipment) =>
                r.status === 'BORROWED' ? <Text type="secondary">—</Text> : (r.quantityDamaged ?? 0),
        },
        {
            title: 'Ghi chú mượn',
            dataIndex: 'borrowConditionNote',
            key: 'borrowConditionNote',
            width: 160,
            ellipsis: true,
            render: (t: string | null | undefined) => t || <Text type="secondary">—</Text>,
        },
        {
            title: 'Ghi chú trả',
            dataIndex: 'returnConditionNote',
            key: 'returnConditionNote',
            width: 160,
            ellipsis: true,
            render: (t: string | null | undefined) => t || <Text type="secondary">—</Text>,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 130,
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
            width: 360,
            align: 'center' as const,
            render: (_: unknown, record: IBookingEquipment) => (
                <Space
                    size={6}
                    wrap={false}
                    styles={{ item: { display: 'inline-flex', alignItems: 'center' } }}
                    style={{ flexWrap: 'nowrap', justifyContent: 'center', width: '100%' }}
                >
                    <Tooltip title="In biên bản đủ thông tin (giống client — theo cả booking)">
                        <RBButton
                            size="sm"
                            variant="outline-info"
                            disabled={printLoadingRowId === record.id}
                            onClick={() => void handlePrintHandover(record)}
                            style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                        >
                            <PrinterOutlined /> {printLoadingRowId === record.id ? '…' : 'In'}
                        </RBButton>
                    </Tooltip>
                    {record.status === 'BORROWED' ? (
                        <PermissionWrapper
                            required="BOOKING_EQUIPMENT_UPDATE"
                            fallback={<Text type="secondary">Không có quyền</Text>}
                        >
                            <div
                                style={{
                                    display: 'inline-flex',
                                    flexDirection: 'row',
                                    flexWrap: 'nowrap',
                                    alignItems: 'center',
                                    gap: 6,
                                }}
                            >
                                <Tooltip title="Hoàn tất trả — kiểm đếm & biên bản">
                                    <RBButton
                                        size="sm"
                                        variant="outline-warning"
                                        disabled={updatingId === record.id}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                                        onClick={() => openReturnModal(record, 'full')}
                                    >
                                        <FaCheck /> Trả
                                    </RBButton>
                                </Tooltip>
                                <Tooltip title="Báo hỏng toàn bộ SL mượn">
                                    <RBButton
                                        size="sm"
                                        variant="outline-secondary"
                                        disabled={updatingId === record.id}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                                        onClick={() => openReturnModal(record, 'damaged')}
                                    >
                                        <MdOutlineHandyman /> Hỏng
                                    </RBButton>
                                </Tooltip>
                                <Tooltip title="Báo mất toàn bộ SL mượn">
                                    <RBButton
                                        size="sm"
                                        variant="outline-danger"
                                        disabled={updatingId === record.id}
                                        style={{ display: 'inline-flex', alignItems: 'center', gap: 4, whiteSpace: 'nowrap' }}
                                        onClick={() => openReturnModal(record, 'lost')}
                                    >
                                        <TbAlertTriangle /> Mất
                                    </RBButton>
                                </Tooltip>
                            </div>
                        </PermissionWrapper>
                    ) : (
                        <Text type="secondary">—</Text>
                    )}
                </Space>
            ),
        },
    ];

    const logColumns: ColumnsType<IEquipmentBorrowLog> = [
        { title: 'Thời điểm', dataIndex: 'createdAt', key: 'createdAt', width: 160, render: t => formatDateTime(t, 'DD/MM/YYYY HH:mm') },
        { title: 'Loại', dataIndex: 'logType', key: 'logType', width: 90, render: t => (t === 'BORROW' ? <Tag color="blue">Mượn</Tag> : <Tag color="green">Trả</Tag>) },
        { title: 'Booking', dataIndex: 'bookingId', key: 'bookingId', width: 88 },
        { title: 'Thiết bị', dataIndex: 'equipmentName', key: 'equipmentName' },
        { title: 'Ghi chú', dataIndex: 'notes', key: 'notes', ellipsis: true, render: t => t || '—' },
        { title: 'Người thao tác', dataIndex: 'createdBy', key: 'createdBy', width: 120, ellipsis: true },
    ];

    const usageColumns: ColumnsType<{ id: number; name: string; borrowCount: number }> = [
        { title: 'Tên', dataIndex: 'name', key: 'name' },
        { title: 'Lượt mượn', dataIndex: 'borrowCount', key: 'borrowCount', width: 110, align: 'center' as const },
    ];

    return (
        <AdminWrapper>
            <Card
                style={{ borderRadius: 10, boxShadow: '0 2px 12px rgba(0,0,0,0.07)' }}
                styles={{ body: { padding: '0 24px 24px' } }}
                title={
                    <Space>
                        <ToolOutlined style={{ color: '#faad14' }} />
                        <Title level={4} style={{ margin: 0 }}>
                            Quản lý mượn / trả thiết bị
                        </Title>
                    </Space>
                }
                extra={
                    <Button
                        size="small"
                        loading={loading}
                        onClick={() => {
                            setLoading(true);
                            Promise.all([reloadBorrowList(), reloadLogs(), reloadStats()])
                                .catch(() => toast.error('Không tải được dữ liệu'))
                                .finally(() => setLoading(false));
                        }}
                    >
                        Làm mới
                    </Button>
                }
            >
                <PermissionWrapper
                    required="BOOKING_EQUIPMENT_VIEW"
                    fallback={<Empty description="Bạn không có quyền xem danh sách mượn thiết bị" />}
                >
                    <Tabs
                        items={[
                            {
                                key: 'borrow',
                                label: 'Theo booking',
                                children: (
                                    <>
                                        <div
                                            style={{
                                                marginBottom: 16,
                                                marginTop: 8,
                                                display: 'flex',
                                                flexWrap: 'wrap',
                                                gap: 12,
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                            }}
                                        >
                                            <Text type="secondary" style={{ fontSize: 13 }}>
                                                In biên bản: đủ thông tin như phía khách — theo từng booking (mọi thiết bị trên một tờ).
                                            </Text>
                                            <Input
                                                allowClear
                                                prefix={<SearchOutlined />}
                                                placeholder="Lọc theo Booking ID"
                                                style={{ width: 240, maxWidth: '100%' }}
                                                value={searchId}
                                                onChange={e => setSearchId(e.target.value)}
                                            />
                                        </div>
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
                                                showTotal: total => `Tổng ${total} bản ghi`,
                                            }}
                                            locale={{ emptyText: 'Không có dữ liệu' }}
                                            scroll={{ x: 'max-content' }}
                                        />
                                    </>
                                ),
                            },
                            {
                                key: 'logs',
                                label: 'Nhật ký mượn / trả',
                                children: (
                                    <div style={{ marginTop: 8 }}>
                                    <Table<IEquipmentBorrowLog>
                                        columns={logColumns}
                                        dataSource={logs}
                                        rowKey="id"
                                        loading={logsLoading}
                                        size="small"
                                        bordered
                                        pagination={{ pageSize: 15, showTotal: t => `Tổng ${t} bản ghi` }}
                                        locale={{ emptyText: 'Chưa có nhật ký' }}
                                        scroll={{ x: 'max-content' }}
                                    />
                                    </div>
                                ),
                            },
                            {
                                key: 'stats',
                                label: 'Thống kê sử dụng',
                                children: (
                                    <div
                                        style={{
                                            marginTop: 8,
                                            display: 'grid',
                                            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
                                            gap: 16,
                                        }}
                                    >
                                        <Card size="small" title="Theo thiết bị" loading={statsLoading}>
                                            <Table
                                                columns={usageColumns}
                                                dataSource={stats?.byEquipment ?? []}
                                                rowKey="id"
                                                size="small"
                                                pagination={false}
                                                locale={{ emptyText: 'Không có dữ liệu' }}
                                            />
                                        </Card>
                                        <Card size="small" title="Theo sân (tài sản)" loading={statsLoading}>
                                            <Table
                                                columns={usageColumns}
                                                dataSource={stats?.byPitch ?? []}
                                                rowKey="id"
                                                size="small"
                                                pagination={false}
                                                locale={{ emptyText: 'Không có dữ liệu' }}
                                            />
                                        </Card>
                                    </div>
                                ),
                            },
                        ]}
                    />
                </PermissionWrapper>
            </Card>

            <Modal
                title="Hoàn tất trả & biên bản"
                width={520}
                open={!!returnTarget}
                onCancel={() => {
                    setReturnTarget(null);
                    setReturnNote('');
                }}
                onOk={confirmReturn}
                okText="Xác Nhận"
                cancelText="Hủy"
                confirmLoading={returnTarget != null && updatingId === returnTarget.id}
            >
                {returnTarget && (
                    <>
                        <p style={{ marginBottom: 12 }}>
                            <strong>{returnTarget.equipmentName}</strong> × {returnTarget.quantity} — Booking{' '}
                            {returnTarget.bookingId}
                        </p>
                        <Text type="secondary">Kiểm đếm (tổng phải bằng {returnTarget.quantity})</Text>
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(3, 1fr)',
                                gap: 10,
                                marginTop: 8,
                                marginBottom: 12,
                            }}
                        >
                            <div>
                                <div style={{ fontSize: 12, marginBottom: 4 }}>Trả tốt</div>
                                <InputNumber
                                    min={0}
                                    max={returnTarget.quantity}
                                    style={{ width: '100%' }}
                                    value={returnQtyGood}
                                    onChange={v => setReturnQtyGood(v ?? 0)}
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: 12, marginBottom: 4 }}>Mất</div>
                                <InputNumber
                                    min={0}
                                    max={returnTarget.quantity}
                                    style={{ width: '100%' }}
                                    value={returnQtyLost}
                                    onChange={v => setReturnQtyLost(v ?? 0)}
                                />
                            </div>
                            <div>
                                <div style={{ fontSize: 12, marginBottom: 4 }}>Hỏng</div>
                                <InputNumber
                                    min={0}
                                    max={returnTarget.quantity}
                                    style={{ width: '100%' }}
                                    value={returnQtyDamaged}
                                    onChange={v => setReturnQtyDamaged(v ?? 0)}
                                />
                            </div>
                        </div>
                        {returnQtyLost + returnQtyDamaged > 0 && (
                            <>
                                <Text type="secondary">Ký xác nhận khi có mất / hỏng (in biên bản)</Text>
                                <Input
                                    placeholder="Họ tên người mượn"
                                    value={borrowerSign}
                                    onChange={e => setBorrowerSign(e.target.value)}
                                    style={{ marginTop: 6, marginBottom: 8 }}
                                />
                                <Input
                                    placeholder="Họ tên nhân viên / bên giao nhận"
                                    value={staffSign}
                                    onChange={e => setStaffSign(e.target.value)}
                                    style={{ marginBottom: 12 }}
                                />
                            </>
                        )}
                        <Text type="secondary">Ghi chú biên bản lúc trả (tình trạng khi nhận lại)</Text>
                        <Input.TextArea
                            rows={3}
                            value={returnNote}
                            onChange={e => setReturnNote(e.target.value)}
                            placeholder="Ví dụ: đủ phụ kiện, có trầy nhẹ…"
                            style={{ marginTop: 8 }}
                        />
                    </>
                )}
            </Modal>
        </AdminWrapper>
    );
};

export default AdminBookingEquipmentPage;
