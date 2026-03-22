import { Table, Tag, Space, Card, Input, Tabs, Modal, Typography, Empty, InputNumber, Tooltip, Button, Row, Col, Statistic, Descriptions, Checkbox } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useState, useEffect, useMemo, useCallback } from 'react';
import { toast } from 'react-toastify';
import { SearchOutlined, PrinterOutlined, ToolOutlined, BarChartOutlined, FileTextOutlined, CheckCircleOutlined } from '@ant-design/icons';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import RBButton from 'react-bootstrap/Button';
import { FaCheck, FaArrowsToEye } from 'react-icons/fa6';
import { MdOutlineHandyman } from 'react-icons/md';
import { TbAlertTriangle } from 'react-icons/tb';
import { formatVND } from '../../../utils/format/price';
import { formatDateTime } from '../../../utils/format/localdatetime';
import type { IBookingEquipment, IEquipmentBorrowLog, IEquipmentUsageStats, IUpdateBookingEquipmentStatusReq } from '../../../types/bookingEquipment';
import { BOOKING_EQUIPMENT_STATUS_META } from '../../../utils/constants/bookingEquipment.constants';
import {
    normalizeBookingEquipmentFromApi,
    normalizeBookingEquipmentListFromApi,
    normalizeEquipmentBorrowLogListFromApi,
} from '../../../utils/bookingEquipmentNormalize';
import {
    getAllBookingEquipments,
    getBookingById,
    updateBookingEquipmentStatus,
    adminConfirmBookingEquipmentReturn,
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
    const [returnerName, setReturnerName] = useState('');
    const [returnerPhone, setReturnerPhone] = useState('');
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');
    const [returnReportPrintOptIn, setReturnReportPrintOptIn] = useState(false);
    const [printLoadingRowId, setPrintLoadingRowId] = useState<number | null>(null);
    const [logDetail, setLogDetail] = useState<IEquipmentBorrowLog | null>(null);
    const [borrowRowDetail, setBorrowRowDetail] = useState<IBookingEquipment | null>(null);
    const [reportDetailRecord, setReportDetailRecord] = useState<IBookingEquipment | null>(null);
    const [confirmingId, setConfirmingId] = useState<number | null>(null);
    const canView = usePermission('BOOKING_EQUIPMENT_VIEW');

    const isDark = typeof document !== 'undefined' && document.body.classList.contains('dark');
    const chartAxis = isDark ? 'rgba(255,255,255,0.55)' : 'rgba(0,0,0,0.55)';
    const chartSplit = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)';

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
        setReturnerName('');
        setReturnerPhone('');
        setReceiverName('');
        setReceiverPhone('');
        setReturnReportPrintOptIn(false);
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
            if (res.data.statusCode === 200) setLogs(normalizeEquipmentBorrowLogListFromApi(res.data.data ?? []));
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
        if (!receiverName.trim() || !receiverPhone.trim()) {
            toast.error('Vui lòng nhập họ tên và số điện thoại người nhận thiết bị (bên sân).');
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
            returnerName: returnerName.trim() || null,
            returnerPhone: returnerPhone.trim() || null,
            receiverName: receiverName.trim(),
            receiverPhone: receiverPhone.trim(),
            returnReportPrintOptIn,
        });
        setReturnTarget(null);
        setReturnNote('');
        setReturnerName('');
        setReturnerPhone('');
        setReceiverName('');
        setReceiverPhone('');
        setReturnReportPrintOptIn(false);
    };

    const handleAdminConfirmReturn = async (id: number) => {
        setConfirmingId(id);
        try {
            const res = await adminConfirmBookingEquipmentReturn(id);
            if (Number(res.data.statusCode) === 200) {
                toast.success('Đã xác nhận biên bản trả');
                const u = res.data.data != null ? normalizeBookingEquipmentFromApi(res.data.data) : null;
                if (u) {
                    setAllList(prev => prev.map(x => (x.id === id ? { ...x, ...u } : x)));
                }
                await reloadLogs();
            }
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không xác nhận được');
        } finally {
            setConfirmingId(null);
        }
    };

    const statsSummary = useMemo(() => {
        const eq = stats?.byEquipment ?? [];
        const pi = stats?.byPitch ?? [];
        const sumEq = eq.reduce((s, r) => s + (r.borrowCount ?? 0), 0);
        const sumPitch = pi.reduce((s, r) => s + (r.borrowCount ?? 0), 0);
        return { sumEq, sumPitch, nEq: eq.length, nPitch: pi.length };
    }, [stats]);

    const equipmentBarOption = useMemo(() => {
        const rows = stats?.byEquipment ?? [];
        if (rows.length === 0) return undefined;
        const sorted = [...rows].sort((a, b) => b.borrowCount - a.borrowCount).slice(0, 16);
        return {
            tooltip: { trigger: 'axis' as const },
            grid: { left: 12, right: 24, top: 16, bottom: 8, containLabel: true },
            xAxis: {
                type: 'value' as const,
                axisLabel: { color: chartAxis },
                splitLine: { lineStyle: { color: chartSplit } },
            },
            yAxis: {
                type: 'category' as const,
                data: sorted.map(r => r.name),
                inverse: true,
                axisLabel: { color: chartAxis, width: 100, overflow: 'truncate' },
            },
            series: [
                {
                    type: 'bar' as const,
                    data: sorted.map(r => r.borrowCount),
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                            { offset: 0, color: '#69c0ff' },
                            { offset: 1, color: '#1890ff' },
                        ]),
                    },
                },
            ],
        };
    }, [stats, chartAxis, chartSplit]);

    const pitchBarOption = useMemo(() => {
        const rows = stats?.byPitch ?? [];
        if (rows.length === 0) return undefined;
        const sorted = [...rows].sort((a, b) => b.borrowCount - a.borrowCount).slice(0, 16);
        return {
            tooltip: { trigger: 'axis' as const },
            grid: { left: 12, right: 24, top: 16, bottom: 8, containLabel: true },
            xAxis: {
                type: 'value' as const,
                axisLabel: { color: chartAxis },
                splitLine: { lineStyle: { color: chartSplit } },
            },
            yAxis: {
                type: 'category' as const,
                data: sorted.map(r => r.name),
                inverse: true,
                axisLabel: { color: chartAxis },
            },
            series: [
                {
                    type: 'bar' as const,
                    data: sorted.map(r => r.borrowCount),
                    itemStyle: {
                        color: new echarts.graphic.LinearGradient(1, 0, 0, 0, [
                            { offset: 0, color: '#95de64' },
                            { offset: 1, color: '#52c41a' },
                        ]),
                    },
                },
            ],
        };
    }, [stats, chartAxis, chartSplit]);

    /** Bảng gọn — chi tiết đầy đủ trong modal (đồng bộ nút với Quản lý người dùng: RBButton + Tooltip + icon). */
    const borrowSummaryColumns: ColumnsType<IBookingEquipment> = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 58,
            align: 'center' as const,
            sorter: (a, b) => a.id - b.id,
        },
        {
            title: 'Booking',
            dataIndex: 'bookingId',
            key: 'bookingId',
            width: 88,
            align: 'center' as const,
            sorter: (a, b) => a.bookingId - b.bookingId,
        },
        {
            title: 'Thiết bị',
            dataIndex: 'equipmentName',
            key: 'equipmentName',
            ellipsis: true,
        },
        {
            title: 'SL',
            dataIndex: 'quantity',
            key: 'quantity',
            width: 52,
            align: 'center' as const,
            sorter: (a, b) => a.quantity - b.quantity,
        },
        {
            title: 'Trạng thái',
            dataIndex: 'status',
            key: 'status',
            width: 118,
            align: 'center' as const,
            render: (status: IBookingEquipment['status'], record: IBookingEquipment) => (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                    <Tag color={BOOKING_EQUIPMENT_STATUS_META[status].color} style={{ margin: 0 }}>
                        {BOOKING_EQUIPMENT_STATUS_META[status].label}
                    </Tag>
                    {status === 'LOST' && record.penaltyAmount > 0 && (
                        <Text type="danger" style={{ fontSize: 10 }}>
                            {formatVND(record.penaltyAmount)}
                        </Text>
                    )}
                </div>
            ),
        },
        {
            title: 'BP trả',
            key: 'returnAdmin',
            width: 96,
            align: 'center' as const,
            render: (_: unknown, r: IBookingEquipment) =>
                r.status === 'BORROWED' ? (
                    <Text type="secondary">—</Text>
                ) : r.returnAdminConfirmed ? (
                    <Tag color="success" style={{ margin: 0 }}>
                        OK
                    </Tag>
                ) : (
                    <Tag color="warning" style={{ margin: 0 }}>
                        Chờ
                    </Tag>
                ),
        },
        {
            title: 'Hành động',
            key: 'actions',
            width: 220,
            align: 'center' as const,
            render: (_: unknown, record: IBookingEquipment) => (
                <Space size={4} wrap style={{ justifyContent: 'center' }}>
                    <Tooltip title="Xem chi tiết">
                        <RBButton variant="outline-info" size="sm" onClick={() => setBorrowRowDetail(record)}>
                            <FaArrowsToEye />
                        </RBButton>
                    </Tooltip>
                    <Tooltip title="In biên bản (theo booking)">
                        <RBButton
                            variant="outline-secondary"
                            size="sm"
                            disabled={printLoadingRowId === record.id}
                            onClick={() => void handlePrintHandover(record)}
                        >
                            <PrinterOutlined />
                        </RBButton>
                    </Tooltip>
                    {record.status === 'BORROWED' ? (
                        <PermissionWrapper required="BOOKING_EQUIPMENT_UPDATE" fallback={null}>
                            <Tooltip title="Trả">
                                <RBButton
                                    variant="outline-warning"
                                    size="sm"
                                    disabled={updatingId === record.id}
                                    onClick={() => openReturnModal(record, 'full')}
                                >
                                    <FaCheck />
                                </RBButton>
                            </Tooltip>
                            <Tooltip title="Hỏng">
                                <RBButton
                                    variant="outline-secondary"
                                    size="sm"
                                    disabled={updatingId === record.id}
                                    onClick={() => openReturnModal(record, 'damaged')}
                                >
                                    <MdOutlineHandyman />
                                </RBButton>
                            </Tooltip>
                            <Tooltip title="Mất">
                                <RBButton
                                    variant="outline-danger"
                                    size="sm"
                                    disabled={updatingId === record.id}
                                    onClick={() => openReturnModal(record, 'lost')}
                                >
                                    <TbAlertTriangle />
                                </RBButton>
                            </Tooltip>
                        </PermissionWrapper>
                    ) : (
                        <>
                            <Tooltip title="Biên bản trả">
                                <RBButton variant="outline-secondary" size="sm" onClick={() => setReportDetailRecord(record)}>
                                    <FileTextOutlined />
                                </RBButton>
                            </Tooltip>
                            {!record.returnAdminConfirmed && (
                                <PermissionWrapper required="BOOKING_EQUIPMENT_UPDATE" fallback={null}>
                                    <Tooltip title="Xác nhận biên bản trả">
                                        <RBButton
                                            variant="outline-success"
                                            size="sm"
                                            disabled={confirmingId === record.id}
                                            onClick={() => void handleAdminConfirmReturn(record.id)}
                                        >
                                            <CheckCircleOutlined />
                                        </RBButton>
                                    </Tooltip>
                                </PermissionWrapper>
                            )}
                        </>
                    )}
                </Space>
            ),
        },
    ];

    const logSummaryColumns: ColumnsType<IEquipmentBorrowLog> = [
        {
            title: 'Thời điểm',
            dataIndex: 'createdAt',
            key: 'createdAt',
            width: 138,
            render: t => formatDateTime(t, 'DD/MM/YYYY HH:mm'),
        },
        {
            title: 'Loại',
            dataIndex: 'logType',
            key: 'logType',
            width: 72,
            align: 'center' as const,
            render: t => (t === 'BORROW' ? <Tag color="blue">Mượn</Tag> : <Tag color="green">Trả</Tag>),
        },
        { title: 'Booking', dataIndex: 'bookingId', key: 'bookingId', width: 76, align: 'center' as const },
        {
            title: 'Sân',
            dataIndex: 'pitchName',
            key: 'pitchName',
            width: 110,
            ellipsis: true,
            render: (t: string | null | undefined) => t || <Text type="secondary">—</Text>,
        },
        { title: 'Thiết bị', dataIndex: 'equipmentName', key: 'equipmentName', ellipsis: true },
        {
            title: 'Hành động',
            key: 'detail',
            width: 88,
            align: 'center' as const,
            fixed: 'right' as const,
            render: (_: unknown, row: IEquipmentBorrowLog) => (
                <Tooltip title="Xem chi tiết">
                    <RBButton variant="outline-info" size="sm" onClick={() => setLogDetail(row)}>
                        <FaArrowsToEye />
                    </RBButton>
                </Tooltip>
            ),
        },
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
                                                Bảng hiển thị tóm tắt — bấm <strong>icon mắt</strong> (giống Quản lý người dùng) để xem đầy đủ
                                                ghi chú, kiểm đếm, người trả / nhận. Sau khi khách trả: cột <strong>BP trả</strong> = Chờ cho
                                                đến khi admin xác nhận biên bản.
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
                                            columns={borrowSummaryColumns}
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
                                        <Text type="secondary" style={{ fontSize: 13, display: 'block', marginBottom: 10 }}>
                                            Bảng gọn — người đặt, người ghi nhận và ghi chú đầy đủ nằm trong <strong>Xem chi tiết</strong>{' '}
                                            (icon mắt).
                                        </Text>
                                        <Table<IEquipmentBorrowLog>
                                            columns={logSummaryColumns}
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
                                    <div style={{ marginTop: 8 }}>
                                        <Row gutter={[16, 16]}>
                                            <Col xs={24} sm={12} md={6}>
                                                <Card size="small" loading={statsLoading}>
                                                    <Statistic
                                                        title="Lượt mượn (tổng theo thiết bị)"
                                                        value={statsSummary.sumEq}
                                                        prefix={<BarChartOutlined />}
                                                    />
                                                </Card>
                                            </Col>
                                            <Col xs={24} sm={12} md={6}>
                                                <Card size="small" loading={statsLoading}>
                                                    <Statistic
                                                        title="Lượt mượn (tổng theo sân)"
                                                        value={statsSummary.sumPitch}
                                                        prefix={<BarChartOutlined />}
                                                    />
                                                </Card>
                                            </Col>
                                            <Col xs={24} sm={12} md={6}>
                                                <Card size="small" loading={statsLoading}>
                                                    <Statistic title="Số loại thiết bị (có phát sinh)" value={statsSummary.nEq} />
                                                </Card>
                                            </Col>
                                            <Col xs={24} sm={12} md={6}>
                                                <Card size="small" loading={statsLoading}>
                                                    <Statistic title="Số sân (có phát sinh)" value={statsSummary.nPitch} />
                                                </Card>
                                            </Col>
                                        </Row>
                                        <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                                            <Col xs={24} lg={12}>
                                                <Card
                                                    size="small"
                                                    title="Biểu đồ — theo thiết bị"
                                                    loading={statsLoading}
                                                    styles={{ body: { minHeight: 280 } }}
                                                >
                                                    {equipmentBarOption ? (
                                                        <ReactECharts option={equipmentBarOption} style={{ height: 300 }} notMerge lazyUpdate />
                                                    ) : (
                                                        <Empty description="Không có dữ liệu" />
                                                    )}
                                                </Card>
                                            </Col>
                                            <Col xs={24} lg={12}>
                                                <Card
                                                    size="small"
                                                    title="Biểu đồ — theo sân (tài sản)"
                                                    loading={statsLoading}
                                                    styles={{ body: { minHeight: 280 } }}
                                                >
                                                    {pitchBarOption ? (
                                                        <ReactECharts option={pitchBarOption} style={{ height: 300 }} notMerge lazyUpdate />
                                                    ) : (
                                                        <Empty description="Không có dữ liệu" />
                                                    )}
                                                </Card>
                                            </Col>
                                        </Row>
                                        <Row gutter={[16, 16]} style={{ marginTop: 8 }}>
                                            <Col xs={24} lg={12}>
                                                <Card size="small" title="Bảng — theo thiết bị" loading={statsLoading}>
                                                    <Table
                                                        columns={usageColumns}
                                                        dataSource={stats?.byEquipment ?? []}
                                                        rowKey="id"
                                                        size="small"
                                                        pagination={false}
                                                        locale={{ emptyText: 'Không có dữ liệu' }}
                                                    />
                                                </Card>
                                            </Col>
                                            <Col xs={24} lg={12}>
                                                <Card size="small" title="Bảng — theo sân (tài sản)" loading={statsLoading}>
                                                    <Table
                                                        columns={usageColumns}
                                                        dataSource={stats?.byPitch ?? []}
                                                        rowKey="id"
                                                        size="small"
                                                        pagination={false}
                                                        locale={{ emptyText: 'Không có dữ liệu' }}
                                                    />
                                                </Card>
                                            </Col>
                                        </Row>
                                    </div>
                                ),
                            },
                        ]}
                    />
                </PermissionWrapper>
            </Card>

            <Modal
                title="Hoàn tất trả & biên bản"
                width={560}
                open={!!returnTarget}
                onCancel={() => {
                    setReturnTarget(null);
                    setReturnNote('');
                    setReturnerName('');
                    setReturnerPhone('');
                    setReceiverName('');
                    setReceiverPhone('');
                    setReturnReportPrintOptIn(false);
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
                        <Text type="secondary">Người trả thực tế (khác người đặt nếu có)</Text>
                        <Input
                            placeholder="Họ tên người giao trả"
                            value={returnerName}
                            onChange={e => setReturnerName(e.target.value)}
                            style={{ marginTop: 6, marginBottom: 8 }}
                        />
                        <Input
                            placeholder="Số điện thoại người trả"
                            value={returnerPhone}
                            onChange={e => setReturnerPhone(e.target.value)}
                            style={{ marginBottom: 8 }}
                        />
                        <Text type="secondary">Người nhận thiết bị tại sân (bắt buộc)</Text>
                        <Input
                            placeholder="Họ tên người nhận"
                            value={receiverName}
                            onChange={e => setReceiverName(e.target.value)}
                            style={{ marginTop: 6, marginBottom: 8 }}
                        />
                        <Input
                            placeholder="Số điện thoại người nhận"
                            value={receiverPhone}
                            onChange={e => setReceiverPhone(e.target.value)}
                            style={{ marginBottom: 12 }}
                        />
                        <Text type="secondary">Ghi chú biên bản lúc trả (tình trạng khi nhận lại)</Text>
                        <Input.TextArea
                            rows={3}
                            value={returnNote}
                            onChange={e => setReturnNote(e.target.value)}
                            placeholder="Ví dụ: đủ phụ kiện, có trầy nhẹ…"
                            style={{ marginTop: 8, marginBottom: 8 }}
                        />
                        <Checkbox checked={returnReportPrintOptIn} onChange={e => setReturnReportPrintOptIn(e.target.checked)}>
                            Ghi nhận in / lưu biên bản trả (chữ ký chủ sân)
                        </Checkbox>
                    </>
                )}
            </Modal>

            <Modal
                title="Chi tiết mượn / trả (theo dòng)"
                open={!!borrowRowDetail}
                onCancel={() => setBorrowRowDetail(null)}
                width={560}
                footer={
                    <Space>
                        <Button onClick={() => setBorrowRowDetail(null)}>Đóng</Button>
                        <Button
                            type="primary"
                            icon={<PrinterOutlined />}
                            loading={borrowRowDetail != null && printLoadingRowId === borrowRowDetail.id}
                            onClick={() => borrowRowDetail && void handlePrintHandover(borrowRowDetail)}
                        >
                            In biên bản (booking)
                        </Button>
                    </Space>
                }
            >
                {borrowRowDetail && (
                    <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="ID dòng">{borrowRowDetail.id}</Descriptions.Item>
                        <Descriptions.Item label="Booking ID">{borrowRowDetail.bookingId}</Descriptions.Item>
                        <Descriptions.Item label="Thiết bị">
                            {borrowRowDetail.equipmentName}
                            <span style={{ marginLeft: 8, opacity: 0.75, fontSize: 12 }}>
                                (equipmentId: {borrowRowDetail.equipmentId})
                            </span>
                        </Descriptions.Item>
                        <Descriptions.Item label="Số lượng">{borrowRowDetail.quantity}</Descriptions.Item>
                        <Descriptions.Item label="Di động / cố định">
                            {borrowRowDetail.equipmentMobility ?? '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái">
                            <Tag color={BOOKING_EQUIPMENT_STATUS_META[borrowRowDetail.status].color}>
                                {BOOKING_EQUIPMENT_STATUS_META[borrowRowDetail.status].label}
                            </Tag>
                            {borrowRowDetail.deletedByClient ? (
                                <Tag color="default" style={{ marginLeft: 6 }}>
                                    Khách đã xóa dòng
                                </Tag>
                            ) : null}
                        </Descriptions.Item>
                        <Descriptions.Item label="Phạt (mất)">
                            {borrowRowDetail.penaltyAmount > 0 ? formatVND(borrowRowDetail.penaltyAmount) : '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người đặt (snapshot)">
                            {borrowRowDetail.bookingBorrowerSnapshot || '—'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ghi chú mượn">{borrowRowDetail.borrowConditionNote || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Xác nhận tình trạng khi mượn">
                            {borrowRowDetail.borrowConditionAcknowledged == null
                                ? '—'
                                : borrowRowDetail.borrowConditionAcknowledged
                                  ? 'Có'
                                  : 'Không'}
                        </Descriptions.Item>
                        <Descriptions.Item label="In biên bản mượn">
                            {borrowRowDetail.borrowReportPrintOptIn == null
                                ? '—'
                                : borrowRowDetail.borrowReportPrintOptIn
                                  ? 'Có'
                                  : 'Không'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Kiểm đếm trả">
                            {borrowRowDetail.status === 'BORROWED'
                                ? '—'
                                : `Trả tốt: ${borrowRowDetail.quantityReturnedGood ?? 0} — Mất: ${borrowRowDetail.quantityLost ?? 0} — Hỏng: ${borrowRowDetail.quantityDamaged ?? 0}`}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ghi chú trả">{borrowRowDetail.returnConditionNote || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Người trả (thực tế)">
                            {(borrowRowDetail.returnerNameSnapshot || '—') +
                                (borrowRowDetail.returnerPhoneSnapshot ? ` — ${borrowRowDetail.returnerPhoneSnapshot}` : '')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người nhận tại sân">
                            {(borrowRowDetail.receiverNameSnapshot || '—') +
                                (borrowRowDetail.receiverPhoneSnapshot ? ` — ${borrowRowDetail.receiverPhoneSnapshot}` : '')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ký khi mất / hỏng">
                            {(borrowRowDetail.borrowerSignName || '—') + ' / ' + (borrowRowDetail.staffSignName || '—')}
                        </Descriptions.Item>
                        <Descriptions.Item label="In biên bản trả">
                            {borrowRowDetail.returnReportPrintOptIn == null
                                ? '—'
                                : borrowRowDetail.returnReportPrintOptIn
                                  ? 'Có'
                                  : 'Không'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Admin xác nhận biên bản trả">
                            {borrowRowDetail.returnAdminConfirmed ? (
                                <Tag color="success">Đã xác nhận</Tag>
                            ) : borrowRowDetail.status === 'BORROWED' ? (
                                '—'
                            ) : (
                                <Tag color="warning">Chờ xác nhận</Tag>
                            )}
                            {borrowRowDetail.returnAdminConfirmedAt ? (
                                <span style={{ marginLeft: 8, fontSize: 12 }}>
                                    {formatDateTime(borrowRowDetail.returnAdminConfirmedAt, 'DD/MM/YYYY HH:mm')}
                                    {borrowRowDetail.returnAdminConfirmedBy ? ` — ${borrowRowDetail.returnAdminConfirmedBy}` : ''}
                                </span>
                            ) : null}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            <Modal
                title="Chi tiết nhật ký mượn / trả"
                open={!!logDetail}
                onCancel={() => setLogDetail(null)}
                footer={
                    <Button type="primary" onClick={() => setLogDetail(null)}>
                        Đóng
                    </Button>
                }
                width={560}
            >
                {logDetail && (
                    <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="Thời điểm">
                            {formatDateTime(logDetail.createdAt, 'DD/MM/YYYY HH:mm')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Loại">
                            {logDetail.logType === 'BORROW' ? 'Mượn' : 'Trả'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Booking ID">{logDetail.bookingId}</Descriptions.Item>
                        <Descriptions.Item label="Sân">{logDetail.pitchName || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Thiết bị">{logDetail.equipmentName}</Descriptions.Item>
                        <Descriptions.Item label="Người đặt (booking)">
                            {(logDetail.bookingUserName || '—') +
                                (logDetail.bookingUserPhone ? ` — ${logDetail.bookingUserPhone}` : '')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người ghi nhận (mượn/trả)">
                            {(logDetail.actorName || '—') + (logDetail.actorPhone ? ` — ${logDetail.actorPhone}` : '')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Tài khoản hệ thống (nếu có)">{logDetail.createdBy || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Biên bản mượn — đã xác nhận">
                            {logDetail.borrowConditionAcknowledged == null
                                ? '—'
                                : logDetail.borrowConditionAcknowledged
                                  ? 'Có'
                                  : 'Không'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Biên bản mượn — in">
                            {logDetail.borrowReportPrintOptIn == null ? '—' : logDetail.borrowReportPrintOptIn ? 'Có' : 'Không'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người trả (snapshot sau trả)">
                            {(logDetail.returnerNameSnapshot || '—') +
                                (logDetail.returnerPhoneSnapshot ? ` — ${logDetail.returnerPhoneSnapshot}` : '')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người nhận tại sân (snapshot)">
                            {(logDetail.receiverNameSnapshot || '—') +
                                (logDetail.receiverPhoneSnapshot ? ` — ${logDetail.receiverPhoneSnapshot}` : '')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Biên bản trả — in">
                            {logDetail.returnReportPrintOptIn == null ? '—' : logDetail.returnReportPrintOptIn ? 'Có' : 'Không'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Admin xác nhận biên bản trả">
                            {logDetail.returnAdminConfirmed == null
                                ? '—'
                                : logDetail.returnAdminConfirmed
                                  ? 'Đã xác nhận'
                                  : 'Chờ xác nhận'}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ghi chú log">{logDetail.notes || '—'}</Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>

            <Modal
                title="Chi tiết biên bản mượn / trả"
                open={!!reportDetailRecord}
                onCancel={() => setReportDetailRecord(null)}
                width={520}
                footer={
                    <Button type="primary" onClick={() => setReportDetailRecord(null)}>
                        Đóng
                    </Button>
                }
            >
                {reportDetailRecord && (
                    <Descriptions column={1} size="small" bordered>
                        <Descriptions.Item label="Booking ID">{reportDetailRecord.bookingId}</Descriptions.Item>
                        <Descriptions.Item label="Thiết bị">{reportDetailRecord.equipmentName}</Descriptions.Item>
                        <Descriptions.Item label="Người đặt (booking)">{reportDetailRecord.bookingBorrowerSnapshot || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Ghi chú mượn">{reportDetailRecord.borrowConditionNote || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Kiểm đếm trả">
                            {`Trả tốt: ${reportDetailRecord.quantityReturnedGood ?? 0} — Mất: ${reportDetailRecord.quantityLost ?? 0} — Hỏng: ${reportDetailRecord.quantityDamaged ?? 0}`}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ghi chú trả">{reportDetailRecord.returnConditionNote || '—'}</Descriptions.Item>
                        <Descriptions.Item label="Người trả (thực tế)">
                            {(reportDetailRecord.returnerNameSnapshot || '—') +
                                (reportDetailRecord.returnerPhoneSnapshot ? ` — ${reportDetailRecord.returnerPhoneSnapshot}` : '')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Người nhận tại sân">
                            {(reportDetailRecord.receiverNameSnapshot || '—') +
                                (reportDetailRecord.receiverPhoneSnapshot ? ` — ${reportDetailRecord.receiverPhoneSnapshot}` : '')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Ký khi mất/hỏng">
                            {(reportDetailRecord.borrowerSignName || '—') + ' / ' + (reportDetailRecord.staffSignName || '—')}
                        </Descriptions.Item>
                        <Descriptions.Item label="Trạng thái xác nhận admin">
                            {reportDetailRecord.returnAdminConfirmed ? (
                                <Tag color="success">Đã xác nhận</Tag>
                            ) : (
                                <Tag color="warning">Chờ xác nhận</Tag>
                            )}
                            {reportDetailRecord.returnAdminConfirmedAt ? (
                                <span style={{ marginLeft: 8, fontSize: 12 }}>
                                    {formatDateTime(reportDetailRecord.returnAdminConfirmedAt, 'DD/MM/YYYY HH:mm')}
                                    {reportDetailRecord.returnAdminConfirmedBy
                                        ? ` — ${reportDetailRecord.returnAdminConfirmedBy}`
                                        : ''}
                                </span>
                            ) : null}
                        </Descriptions.Item>
                    </Descriptions>
                )}
            </Modal>
        </AdminWrapper>
    );
};

export default AdminBookingEquipmentPage;
