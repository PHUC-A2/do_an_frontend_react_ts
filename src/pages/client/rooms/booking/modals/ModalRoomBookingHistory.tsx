import {
    Button,
    Checkbox,
    Col,
    Collapse,
    Drawer,
    Divider,
    Empty,
    Input,
    InputNumber,
    Modal,
    Popconfirm,
    Row,
    Select,
    Space,
    Spin,
    Tabs,
    Typography,
    theme,
    type CollapseProps,
    type PopconfirmProps,
} from 'antd';
import {
    ClockCircleOutlined,
    CloseCircleOutlined,
    DeleteOutlined,
    DollarCircleOutlined,
    EditOutlined,
    EnvironmentOutlined,
    ExclamationCircleOutlined,
    HistoryOutlined,
    PhoneOutlined,
    PrinterOutlined,
    ToolOutlined,
    UserOutlined,
} from '@ant-design/icons';
import dayjs from 'dayjs';
import { motion } from 'framer-motion';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';

import { formatDateTimeRange, formatInstant } from '../../../../../utils/format/localdatetime';

import {
    cancelClientRoomBooking,
    createClientRoomBookingCheckout,
    createClientRoomBookingIssue,
    createClientRoomBookingReturn,
    getAllClientRoomBookings,
    getClientRoomBookingCheckout,
    getClientRoomBookingReturn,
    getPublicAssetDevices,
    getPublicAssetById,
    deleteClientRoomBooking,
} from '../../../../../config/Api';
import type { IAssetUsage } from '../../../../../types/assetUsage';
import type { ICheckout } from '../../../../../types/checkout';
import type { IDevice } from '../../../../../types/device';
import type { IDeviceReturn } from '../../../../../types/deviceReturn';
import { ASSET_ROOM_FEE_MODE_META, resolveUsageBookingFeeMode } from '../../../../../utils/constants/asset.constants';
import { DEVICE_CONDITION_META } from '../../../../../utils/constants/deviceReturn.constants';
import { openAssetUsagePaperPrint } from '../../../../../utils/assetUsagePaperPrint';

interface IProps {
    open: boolean;
    onClose: () => void;
}

const { Text } = Typography;

/** Parse borrowDevicesJson thành dòng — layout thẻ giống ModalBookingHistory (đặt sân). */
const parseBorrowDeviceLines = (borrowDevicesJson?: string | null): Array<{ name: string; qty: number }> => {
    if (!borrowDevicesJson) return [];
    try {
        const arr = JSON.parse(borrowDevicesJson);
        if (!Array.isArray(arr)) return [];
        return arr
            .filter((x: any) => Number(x?.quantity ?? 0) > 0)
            .map((x: any) => ({
                name:
                    (typeof x?.deviceName === 'string' && x.deviceName.trim()) ||
                    (x?.deviceId != null ? `Thiết bị #${x.deviceId}` : 'Thiết bị'),
                qty: Number(x.quantity),
            }));
    } catch {
        return [];
    }
};

const ModalRoomBookingHistory = ({ open, onClose }: IProps) => {
    const { token } = theme.useToken();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [list, setList] = useState<IAssetUsage[]>([]);
    const [activeTab, setActiveTab] = useState('1');
    const [submittingId, setSubmittingId] = useState<number | null>(null);
    const [deletingId, setDeletingId] = useState<number | null>(null);
    const [loadingPaperId, setLoadingPaperId] = useState<number | null>(null);
    const [openReturnModal, setOpenReturnModal] = useState(false);
    const [returnUsage, setReturnUsage] = useState<IAssetUsage | null>(null);
    const [returnStatus, setReturnStatus] = useState<'GOOD' | 'DAMAGED' | 'BROKEN' | 'LOST'>('GOOD');
    const [returnQtyGood, setReturnQtyGood] = useState(0);
    const [returnQtyLost, setReturnQtyLost] = useState(0);
    const [returnQtyDamaged, setReturnQtyDamaged] = useState(0);
    const [returnPrintOptIn, setReturnPrintOptIn] = useState(false);
    const [returnerName, setReturnerName] = useState('');
    const [returnerPhone, setReturnerPhone] = useState('');
    const [receiverName, setReceiverName] = useState('');
    const [receiverPhone, setReceiverPhone] = useState('');
    const [borrowerSign, setBorrowerSign] = useState('');
    const [staffSign, setStaffSign] = useState('');
    const [returnConditionNote, setReturnConditionNote] = useState('');
    const [openCheckoutModal, setOpenCheckoutModal] = useState(false);
    const [checkoutUsage, setCheckoutUsage] = useState<IAssetUsage | null>(null);
    const [checkoutAck, setCheckoutAck] = useState(false);
    const [checkoutPrintOptIn, setCheckoutPrintOptIn] = useState(false);
    const [openIssueModal, setOpenIssueModal] = useState(false);
    const [issueUsage, setIssueUsage] = useState<IAssetUsage | null>(null);
    const [issueDevices, setIssueDevices] = useState<IDevice[]>([]);
    const [issueDeviceId, setIssueDeviceId] = useState<number | undefined>(undefined);
    const [issueDesc, setIssueDesc] = useState('');

    useEffect(() => {
        if (!open) return;
        setLoading(true);
        setActiveTab('1');
        getAllClientRoomBookings('page=1&pageSize=100&sort=id,desc')
            .then((res) => setList(res.data.data?.result ?? []))
            .catch(() => toast.error('Không tải được lịch sử đặt phòng'))
            .finally(() => setLoading(false));
    }, [open]);

    const now = dayjs();
    const { upcoming, history } = useMemo(() => {
        const next: IAssetUsage[] = [];
        const old: IAssetUsage[] = [];
        list.forEach((item) => {
            const isPast = dayjs(`${item.date}T${item.endTime}`).isBefore(now);
            const isDone = item.status === 'COMPLETED' || item.status === 'CANCELLED' || item.status === 'REJECTED';
            if (isPast || isDone) old.push(item);
            else next.push(item);
        });
        return { upcoming: next, history: old };
    }, [list, now]);

    const cancel: PopconfirmProps['onCancel'] = () => toast.info('Đã bỏ chọn');

    const reload = async () => {
        const res = await getAllClientRoomBookings('page=1&pageSize=100&sort=id,desc');
        setList(res.data.data?.result ?? []);
    };

    const handleCancel = async (id: number) => {
        setSubmittingId(id);
        try {
            await cancelClientRoomBooking(id);
            toast.success('Đã hủy đặt phòng');
            await reload();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không thể hủy đặt phòng');
        } finally {
            setSubmittingId(null);
        }
    };

    // --- Soft delete lịch sử đặt phòng (ẩn khỏi user, admin vẫn lưu trữ) ---
    const handleDelete = async (id: number) => {
        setDeletingId(id);
        try {
            await deleteClientRoomBooking(id);
            toast.success('Đã xóa khỏi lịch sử');
            await reload();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không thể xóa khỏi lịch sử');
        } finally {
            setDeletingId(null);
        }
    };

    const handlePrintPaper = async (usage: IAssetUsage, doPrint: boolean = true) => {
        setLoadingPaperId(usage.id);
        try {
            // Trường hợp booking mới tạo nhưng danh sách trả về chưa kịp map `assetResponsibleName`:
            // ta fallback bằng API public của tài sản để lấy đúng "Người phụ trách phòng".
            let usageResolved: IAssetUsage = usage;
            if (!usage.assetResponsibleName && usage.assetId) {
                try {
                    const assetRes = await getPublicAssetById(usage.assetId);
                    usageResolved = {
                        ...usage,
                        assetResponsibleName: assetRes.data.data?.responsibleName ?? null,
                    };
                } catch {
                    // Nếu không fetch được, giữ nguyên giá trị hiện tại để không làm gián đoạn flow in.
                }
            }

            let checkout: ICheckout | null = null;
            let deviceReturn: IDeviceReturn | null = null;
            try {
                const checkoutRes = await getClientRoomBookingCheckout(usage.id);
                checkout = checkoutRes.data.data ?? null;
            } catch {
                checkout = null;
            }
            try {
                const returnRes = await getClientRoomBookingReturn(usage.id);
                deviceReturn = returnRes.data.data ?? null;
            } catch {
                deviceReturn = null;
            }
            openAssetUsagePaperPrint(usageResolved, checkout, deviceReturn, { doPrint });
        } finally {
            setLoadingPaperId(null);
        }
    };

    const usageHasBorrowDevices = (u: IAssetUsage) => {
        if (!u.borrowDevicesJson) return false;
        try {
            const v = JSON.parse(u.borrowDevicesJson);
            if (!Array.isArray(v)) return false;
            return v.some((x: any) => (x?.quantity ?? 0) > 0);
        } catch {
            return false;
        }
    };

    const handleOpenCheckoutModal = (usage: IAssetUsage) => {
        setCheckoutUsage(usage);
        const hasBorrow = usageHasBorrowDevices(usage);
        // Nếu có mượn thiết bị thì bắt buộc phải xác nhận trước khi nhận phòng.
        setCheckoutAck(hasBorrow ? !!usage.borrowConditionAcknowledged : true);
        setCheckoutPrintOptIn(!!usage.borrowReportPrintOptIn);
        setOpenCheckoutModal(true);
    };

    const handleConfirmCheckout = async () => {
        if (!checkoutUsage) return;
        const usage = checkoutUsage;
        const hasBorrow = usageHasBorrowDevices(usage);
        if (hasBorrow && !checkoutAck) {
            toast.error('Vui lòng xác nhận đã kiểm tra tình trạng thiết bị trước khi tạo biên bản nhận phòng.');
            return;
        }

        setSubmittingId(usage.id);
        try {
            const bookingNote = usage.bookingNote?.trim();
            const borrowNote = usage.borrowNote?.trim();
            const parts: string[] = [];
            parts.push(`Client xác nhận nhận phòng lúc ${dayjs().format('HH:mm DD/MM/YYYY')}`);
            if (bookingNote) parts.push(`Ghi chú booking: ${bookingNote}`);
            if (borrowNote) parts.push(`Ghi chú thiết bị: ${borrowNote}`);

            const res = await createClientRoomBookingCheckout(usage.id, {
                conditionNote: parts.join(' · '),
            });

            const checkout = res.data.data ?? null;
            toast.success('Đã tạo biên bản nhận phòng');

            // Nếu user tick in thì in ngay sau khi backend tạo checkout xong.
            if (checkoutPrintOptIn && checkout) {
                openAssetUsagePaperPrint(usage, checkout, null, { doPrint: true });
            }
            await reload();
            setOpenCheckoutModal(false);
            setCheckoutUsage(null);
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không thể tạo biên bản nhận phòng');
        } finally {
            setSubmittingId(null);
        }
    };

    const handleOpenReturnModal = (usage: IAssetUsage) => {
        setReturnUsage(usage);
        setReturnStatus('GOOD');
        const totalBorrowed = (() => {
            try {
                const arr = JSON.parse(usage.borrowDevicesJson ?? '[]');
                if (!Array.isArray(arr)) return 1;
                const total = arr.reduce((s: number, it: any) => s + Number(it?.quantity ?? 0), 0);
                return total > 0 ? total : 1;
            } catch {
                return 1;
            }
        })();
        setReturnQtyGood(totalBorrowed);
        setReturnQtyLost(0);
        setReturnQtyDamaged(0);
        setReturnPrintOptIn(false);
        // Mặc định tên/người nhận lấy từ thông tin booking để giảm thao tác.
        setReturnerName(usage.userName ?? usage.userEmail ?? '');
        setReturnerPhone(usage.contactPhone ?? '');
        setReceiverName(usage.userName ?? usage.userEmail ?? '');
        setReceiverPhone(usage.contactPhone ?? '');
        setBorrowerSign('');
        setStaffSign('');
        setReturnConditionNote('');
        setOpenReturnModal(true);
    };

    const handleCreateReturn = async () => {
        if (!returnUsage) return;
        const usage = returnUsage;
        const qTotal = (() => {
            try {
                const arr = JSON.parse(usage.borrowDevicesJson ?? '[]');
                if (!Array.isArray(arr)) return 1;
                const total = arr.reduce((s: number, it: any) => s + Number(it?.quantity ?? 0), 0);
                return total > 0 ? total : 1;
            } catch {
                return 1;
            }
        })();
        if (returnQtyGood + returnQtyLost + returnQtyDamaged !== qTotal) {
            toast.error(`Tổng (trả tốt + mất + hỏng) phải bằng ${qTotal}.`);
            return;
        }
        if (returnQtyLost + returnQtyDamaged > 0 && (!borrowerSign.trim() || !staffSign.trim())) {
            toast.error('Khi có mất hoặc hỏng, vui lòng nhập họ tên người mượn và nhân viên ký xác nhận.');
            return;
        }
        if (!receiverName.trim() || !receiverPhone.trim()) {
            toast.error('Vui lòng nhập họ tên và số điện thoại người nhận tại phòng.');
            return;
        }
        setSubmittingId(usage.id);
        try {
            await createClientRoomBookingReturn(usage.id, {
                deviceStatus: returnStatus,
                returnTime: dayjs().toISOString(),
                quantityReturnedGood: returnQtyGood,
                quantityLost: returnQtyLost,
                quantityDamaged: returnQtyDamaged,
                returnerName: returnerName.trim() || null,
                returnerPhone: returnerPhone.trim() || null,
                receiverName: receiverName.trim(),
                receiverPhone: receiverPhone.trim(),
                returnConditionNote: returnConditionNote.trim() || null,
                returnReportPrintOptIn: returnPrintOptIn,
                borrowerSignName: returnQtyLost + returnQtyDamaged > 0 ? borrowerSign.trim() || null : null,
                staffSignName: returnQtyLost + returnQtyDamaged > 0 ? staffSign.trim() || null : null,
            });
            toast.success('Đã tạo biên bản trả phòng');
            // Nếu user chọn in thì mở lại giấy in sau khi đã tạo return xong.
            if (returnPrintOptIn) {
                await handlePrintPaper(usage, true);
            }
            setOpenReturnModal(false);
            setReturnUsage(null);
            await reload();
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không thể tạo biên bản trả phòng');
        } finally {
            setSubmittingId(null);
        }
    };

    const handleOpenIssueModal = async (usage: IAssetUsage) => {
        setIssueUsage(usage);
        setIssueDesc('');
        setIssueDeviceId(undefined);
        setOpenIssueModal(true);
        try {
            const res = await getPublicAssetDevices(usage.assetId);
            setIssueDevices(res.data.data ?? []);
        } catch {
            setIssueDevices([]);
        }
    };

    const handleCreateIssue = async () => {
        if (!issueUsage || !issueDeviceId || !issueDesc.trim()) {
            toast.warning('Vui lòng chọn thiết bị và nhập mô tả sự cố');
            return;
        }
        setSubmittingId(issueUsage.id);
        try {
            await createClientRoomBookingIssue(issueUsage.id, {
                deviceId: issueDeviceId,
                description: issueDesc.trim(),
            });
            toast.success('Đã gửi báo cáo sự cố thiết bị phòng');
            setOpenIssueModal(false);
            setIssueUsage(null);
        } catch (error: any) {
            toast.error(error?.response?.data?.message ?? 'Không thể báo sự cố');
        } finally {
            setSubmittingId(null);
        }
    };

    const renderItems = (rows: IAssetUsage[]): CollapseProps['items'] =>
        rows.map((usage) => {
            const canUpdate =
                usage.status === 'PENDING' || usage.status === 'APPROVED' || usage.status === 'IN_PROGRESS';
            const canCancel = usage.status === 'PENDING' || usage.status === 'APPROVED';
            const canCheckout = usage.status === 'APPROVED';
            const canReturn = usage.status === 'IN_PROGRESS';
            const canIssue = usage.status === 'IN_PROGRESS' || usage.status === 'COMPLETED';
            const canDelete =
                usage.status === 'COMPLETED' || usage.status === 'CANCELLED' || usage.status === 'REJECTED';
            const isPending = usage.status === 'PENDING';
            const borrowLines = parseBorrowDeviceLines(usage.borrowDevicesJson);
            const durationMin = dayjs(`${usage.date}T${usage.endTime}`).diff(dayjs(`${usage.date}T${usage.startTime}`), 'minute');
            const roomFeeModeResolved = resolveUsageBookingFeeMode(usage);

            return {
                key: usage.id,
                label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Space>
                            <EnvironmentOutlined style={{ color: token.colorPrimary }} />
                            <Text strong>{usage.assetName}</Text>
                        </Space>
                        <Text type="secondary" style={{ fontSize: 12 }}>
                            {dayjs(`${usage.date}T${usage.startTime}`).format(' HH:mm DD/MM/YYYY')}
                        </Text>
                    </div>
                ),
                children: (
                    <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '4px 0' }}>
                        <Row gutter={[0, 12]}>
                            <Col span={24}>
                                <Space
                                    orientation="vertical"
                                    style={{ width: '100%', background: token.colorFillAlter, padding: 12, borderRadius: 8 }}
                                    size={8}
                                >
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">
                                            <UserOutlined /> Người đặt:
                                        </Text>
                                        <Text strong>{usage.userName || usage.userEmail || 'Không xác định'}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">
                                            <ClockCircleOutlined /> Thời gian:
                                        </Text>
                                        <Text>{formatDateTimeRange(`${usage.date}T${usage.startTime}`, `${usage.date}T${usage.endTime}`)}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">
                                            <ClockCircleOutlined /> Thời lượng:
                                        </Text>
                                        <Text>{Number.isFinite(durationMin) && durationMin >= 0 ? `${durationMin} phút` : '—'}</Text>
                                    </div>
                                    <div style={{ width: '100%' }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                            <Text type="secondary">
                                                <ToolOutlined /> Thiết bị mượn (kèm booking)
                                            </Text>
                                            {borrowLines.length > 0 ? (
                                                <Button
                                                    type="link"
                                                    size="small"
                                                    icon={<PrinterOutlined />}
                                                    onClick={() => handlePrintPaper(usage)}
                                                    style={{ padding: 0, height: 'auto' }}
                                                    loading={loadingPaperId === usage.id}
                                                >
                                                    In
                                                </Button>
                                            ) : null}
                                        </div>
                                        {borrowLines.length === 0 ? (
                                            <Text type="secondary" style={{ fontSize: 12 }}>
                                                Không có thiết bị mượn qua hệ thống
                                            </Text>
                                        ) : (
                                            <Space orientation="vertical" size={6} style={{ width: '100%' }}>
                                                {borrowLines.map((line, idx) => (
                                                    <div
                                                        key={`${line.name}-${idx}`}
                                                        style={{
                                                            fontSize: 12,
                                                            padding: '6px 8px',
                                                            borderRadius: 6,
                                                            background: 'rgba(0,0,0,0.04)',
                                                        }}
                                                    >
                                                        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                                                            <Text strong style={{ fontSize: 12 }}>
                                                                {line.name}
                                                            </Text>
                                                        </div>
                                                        <Text type="secondary" style={{ fontSize: 11 }}>
                                                            SL: {line.qty}
                                                        </Text>
                                                    </div>
                                                ))}
                                            </Space>
                                        )}
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text type="secondary">Mục đích:</Text>
                                        <Text style={{ maxWidth: '62%', textAlign: 'right' }}>{usage.subject}</Text>
                                    </div>
                                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                                        <Text type="secondary">
                                            <PhoneOutlined /> Liên hệ:
                                        </Text>
                                        <Text copyable={!!usage.contactPhone?.trim()}>{usage.contactPhone?.trim() || '—'}</Text>
                                    </div>
                                    <Divider style={{ margin: '4px 0' }} dashed />
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Text type="secondary">
                                            <DollarCircleOutlined /> Tổng tiền:
                                        </Text>
                                        <Text
                                            strong
                                            style={{
                                                color: roomFeeModeResolved === 'PAID' ? token.colorWarning : token.colorSuccess,
                                                fontSize: 16,
                                            }}
                                        >
                                            {ASSET_ROOM_FEE_MODE_META[roomFeeModeResolved].historyTotal}
                                        </Text>
                                    </div>
                                </Space>
                            </Col>

                            <Col span={24}>
                                <Row justify="space-between" align="middle">
                                    <Button
                                        type="link"
                                        size="small"
                                        onClick={() => {
                                            onClose();
                                            navigate(`/rooms/${usage.assetId}`);
                                        }}
                                    >
                                        Xem phòng
                                    </Button>
                                    <Space wrap>
                                        <Button
                                            size="small"
                                            icon={<PrinterOutlined />}
                                            loading={loadingPaperId === usage.id}
                                            onClick={() => handlePrintPaper(usage)}
                                        >
                                            In biên bản
                                        </Button>
                                        {canUpdate ? (
                                            <Button
                                                size="small"
                                                icon={<EditOutlined />}
                                                onClick={() => {
                                                    onClose();
                                                    navigate(`/rooms/booking/${usage.assetId}`, {
                                                        state: { mode: 'UPDATE', roomBookingId: usage.id },
                                                    });
                                                }}
                                            >
                                                Sửa
                                            </Button>
                                        ) : null}
                                        {canCancel ? (
                                            <Popconfirm
                                                title="Hủy đặt phòng?"
                                                onConfirm={() => handleCancel(usage.id)}
                                                okButtonProps={{ danger: true, loading: submittingId === usage.id }}
                                                cancelText="Không"
                                                okText="Có"
                                                placement="topLeft"
                                                onCancel={cancel}
                                            >
                                                <Button size="small" danger icon={<CloseCircleOutlined />}>
                                                    Hủy
                                                </Button>
                                            </Popconfirm>
                                        ) : null}
                                        {canDelete ? (
                                            <Popconfirm
                                                title="Xóa lịch sử?"
                                                onConfirm={() => handleDelete(usage.id)}
                                                okButtonProps={{ loading: deletingId === usage.id }}
                                                cancelText="Không"
                                                okText="Có"
                                                placement="topLeft"
                                                onCancel={cancel}
                                            >
                                                <Button size="small" type="text" danger icon={<DeleteOutlined />}>
                                                    Xóa
                                                </Button>
                                            </Popconfirm>
                                        ) : null}
                                        {canCheckout ? (
                                            <Button size="small" loading={submittingId === usage.id} onClick={() => handleOpenCheckoutModal(usage)}>
                                                Nhận phòng
                                            </Button>
                                        ) : null}
                                        {canReturn ? (
                                            <Button size="small" loading={submittingId === usage.id} onClick={() => handleOpenReturnModal(usage)}>
                                                Trả phòng
                                            </Button>
                                        ) : null}
                                        {canIssue ? (
                                            <Button
                                                size="small"
                                                danger
                                                icon={<ExclamationCircleOutlined />}
                                                loading={submittingId === usage.id}
                                                onClick={() => handleOpenIssueModal(usage)}
                                            >
                                                Báo sự cố thiết bị phòng
                                            </Button>
                                        ) : null}
                                    </Space>
                                </Row>
                                {isPending ? (
                                    <Text type="warning" style={{ fontSize: 12 }}>
                                        ⏳ Đang chờ admin xác nhận
                                    </Text>
                                ) : null}
                            </Col>
                            <Col span={24}>
                                <Row justify="space-between">
                                    <Text type="secondary" style={{ fontSize: 10 }}>
                                        Tạo: {formatInstant(usage.createdAt)}
                                    </Text>
                                    <Text type="secondary" style={{ fontSize: 10 }}>
                                        Cập nhật: {usage.updatedAt ? formatInstant(usage.updatedAt) : 'N/A'}
                                    </Text>
                                </Row>
                            </Col>
                        </Row>
                    </motion.div>
                ),
            };
        });

    const roomDeviceHistory = useMemo(
        () =>
            list
                .filter((item) => item.status === 'IN_PROGRESS' || item.status === 'COMPLETED')
                .sort((a, b) => dayjs(`${b.date}T${b.endTime}`).valueOf() - dayjs(`${a.date}T${a.endTime}`).valueOf()),
        [list]
    );

    return (
        <>
            <Drawer
                title={
                    <Space>
                        <HistoryOutlined style={{ color: token.colorPrimary }} />
                        <span style={{ fontWeight: 700 }}>Quản lý lịch đặt phòng</span>
                    </Space>
                }
                open={open}
                onClose={onClose}
                placement="right"
                size={420}
                styles={{ body: { padding: '0 12px' } }}
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: 24 }}>
                        <Spin />
                    </div>
                ) : list.length === 0 ? (
                    <Empty description="Chưa có lịch sử đặt phòng" />
                ) : (
                    <Tabs
                        centered
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={[
                            {
                                key: '1',
                                label: (
                                    <Space>
                                        <ClockCircleOutlined /> Sắp diễn ra
                                        <BadgeCount count={upcoming.length} color={token.colorPrimary} />
                                    </Space>
                                ),
                                children: (
                                    <div style={{ paddingTop: 12 }}>
                                        {upcoming.length > 0 ? (
                                            <Collapse accordion ghost items={renderItems(upcoming)} />
                                        ) : (
                                            <Empty description="Không có lịch sắp tới" />
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: '2',
                                label: (
                                    <Space>
                                        <HistoryOutlined /> Lịch sử
                                    </Space>
                                ),
                                children: (
                                    <div style={{ paddingTop: 12 }}>
                                        {history.length > 0 ? (
                                            <Collapse accordion ghost items={renderItems(history)} />
                                        ) : (
                                            <Empty description="Chưa có lịch sử" />
                                        )}
                                    </div>
                                ),
                            },
                            {
                                key: '3',
                                label: (
                                    <Space>
                                        <ToolOutlined /> Nhận trả phòng
                                        <BadgeCount count={roomDeviceHistory.length} color={token.colorWarning} />
                                    </Space>
                                ),
                                children: (
                                    <div style={{ paddingTop: 12 }}>
                                        {roomDeviceHistory.length > 0 ? (
                                            <Collapse accordion ghost items={renderItems(roomDeviceHistory)} />
                                        ) : (
                                            <Empty description="Chưa có lịch sử nhận trả phòng" />
                                        )}
                                    </div>
                                ),
                            },
                        ]}
                    />
                )}
            </Drawer>

            <Modal
                title="Tạo biên bản nhận phòng"
                open={openCheckoutModal}
                onCancel={() => {
                    setOpenCheckoutModal(false);
                    setCheckoutUsage(null);
                }}
                onOk={handleConfirmCheckout}
                okText="Xác nhận"
                cancelText="Hủy"
                confirmLoading={checkoutUsage != null && submittingId === checkoutUsage.id}
            >
                {checkoutUsage ? (
                    <>
                        <Text type="secondary" style={{ display: 'block' }}>
                            Xem biên bản nhận phòng trước khi tick chọn “In / lưu”.
                        </Text>

                        <div style={{ marginTop: 12, display: 'flex', gap: 10, flexDirection: 'column' }}>
                            <Checkbox
                                checked={checkoutAck}
                                disabled={!usageHasBorrowDevices(checkoutUsage)}
                                onChange={(e) => setCheckoutAck(e.target.checked)}
                            >
                                Tôi xác nhận đã kiểm tra tình trạng thiết bị trước khi nhận phòng.
                            </Checkbox>

                            <Checkbox
                                checked={checkoutPrintOptIn}
                                onChange={(e) => setCheckoutPrintOptIn(e.target.checked)}
                            >
                                In / lưu biên bản nhận phòng
                            </Checkbox>

                            <Button
                                icon={<PrinterOutlined />}
                                onClick={() => {
                                    void (async () => {
                                        const bookingNote = checkoutUsage.bookingNote?.trim();
                                        const borrowNote = checkoutUsage.borrowNote?.trim();
                                        const parts: string[] = [];
                                        parts.push(`Client xác nhận nhận phòng lúc ${dayjs().format('HH:mm DD/MM/YYYY')}`);
                                        if (bookingNote) parts.push(`Ghi chú booking: ${bookingNote}`);
                                        if (borrowNote) parts.push(`Ghi chú thiết bị: ${borrowNote}`);
                                        const conditionNote = parts.join(' · ');

                                        // Fallback map tên người phụ trách phòng cho preview giấy.
                                        let usageResolved: IAssetUsage = checkoutUsage;
                                        if (!checkoutUsage.assetResponsibleName && checkoutUsage.assetId) {
                                            try {
                                                const assetRes = await getPublicAssetById(checkoutUsage.assetId);
                                                usageResolved = {
                                                    ...checkoutUsage,
                                                    assetResponsibleName: assetRes.data.data?.responsibleName ?? null,
                                                };
                                            } catch {
                                                // Không ảnh hưởng nếu không lấy được tên người phụ trách.
                                            }
                                        }

                                        const previewCheckout: ICheckout = {
                                            id: 0,
                                            assetUsageId: checkoutUsage.id,
                                            receiveTime: dayjs().toISOString(),
                                            conditionNote,
                                            createdAt: dayjs().toISOString(),
                                            createdBy: '',
                                        };

                                        openAssetUsagePaperPrint(usageResolved, previewCheckout, null, { doPrint: false });
                                    })();
                                }}
                            >
                                Xem biên bản (trước khi in)
                            </Button>
                        </div>
                    </>
                ) : (
                    <Empty description="Không có dữ liệu" />
                )}
            </Modal>

            <Modal
                title="Tạo biên bản trả phòng"
                open={openReturnModal}
                onCancel={() => setOpenReturnModal(false)}
                onOk={handleCreateReturn}
                okText="Xác nhận"
                cancelText="Hủy"
                confirmLoading={returnUsage != null && submittingId === returnUsage.id}
            >
                <Text type="secondary">Chọn tình trạng chung khi trả phòng:</Text>
                <Select
                    value={returnStatus}
                    style={{ width: '100%', marginTop: 8 }}
                    // Status tổng quát không được reset breakdown; user có thể nhập linh hoạt tốt/mất/hỏng.
                    onChange={(v) => setReturnStatus(v)}
                    options={[
                        { label: DEVICE_CONDITION_META.GOOD.label, value: 'GOOD' },
                        { label: DEVICE_CONDITION_META.DAMAGED.label, value: 'DAMAGED' },
                        { label: DEVICE_CONDITION_META.BROKEN.label, value: 'BROKEN' },
                        { label: DEVICE_CONDITION_META.LOST.label, value: 'LOST' },
                    ]}
                />

                <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                    Kiểm đếm trả (tổng phải bằng{' '}
                    {(() => {
                        if (!returnUsage) return 1;
                        try {
                            const arr = JSON.parse(returnUsage.borrowDevicesJson ?? '[]');
                            if (!Array.isArray(arr)) return 1;
                            const total = arr.reduce((s: number, it: any) => s + Number(it?.quantity ?? 0), 0);
                            return total > 0 ? total : 1;
                        } catch {
                            return 1;
                        }
                    })()}
                    ):
                </Text>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10, marginTop: 8 }}>
                    <div>
                        <div style={{ fontSize: 12, marginBottom: 4 }}>Trả tốt</div>
                        <InputNumber min={0} style={{ width: '100%' }} value={returnQtyGood} onChange={(v) => setReturnQtyGood(v ?? 0)} />
                    </div>
                    <div>
                        <div style={{ fontSize: 12, marginBottom: 4 }}>Mất</div>
                        <InputNumber min={0} style={{ width: '100%' }} value={returnQtyLost} onChange={(v) => setReturnQtyLost(v ?? 0)} />
                    </div>
                    <div>
                        <div style={{ fontSize: 12, marginBottom: 4 }}>Hỏng</div>
                        <InputNumber min={0} style={{ width: '100%' }} value={returnQtyDamaged} onChange={(v) => setReturnQtyDamaged(v ?? 0)} />
                    </div>
                </div>
                <Text type="secondary" style={{ fontSize: 12, display: 'block', marginTop: 6 }}>
                    Có thể nhập linh hoạt (ví dụ: 9 tốt, 10 hỏng, 1 mất), miễn tổng đúng số lượng mượn.
                </Text>

                <Text type="secondary" style={{ display: 'block', marginTop: 12 }}>
                    Người trả (snapshot):
                </Text>
                <Input
                    placeholder="Tên người trả"
                    value={returnerName}
                    onChange={(e) => setReturnerName(e.target.value)}
                    style={{ marginTop: 8, marginBottom: 8 }}
                />
                <Input
                    placeholder="Số điện thoại người trả"
                    value={returnerPhone}
                    onChange={(e) => setReturnerPhone(e.target.value)}
                    style={{ marginBottom: 8 }}
                />

                <Text type="secondary" style={{ display: 'block', marginTop: 10 }}>
                    Người nhận tại phòng (bắt buộc):
                </Text>
                <Input
                    placeholder="Tên người nhận"
                    value={receiverName}
                    onChange={(e) => setReceiverName(e.target.value)}
                    style={{ marginTop: 8, marginBottom: 8 }}
                />
                <Input
                    placeholder="Số điện thoại người nhận"
                    value={receiverPhone}
                    onChange={(e) => setReceiverPhone(e.target.value)}
                    style={{ marginBottom: 8 }}
                />

                {returnQtyLost + returnQtyDamaged > 0 && (
                    <>
                        <Text type="secondary" style={{ display: 'block', marginTop: 10 }}>
                            Ký xác nhận khi có mất / hỏng:
                        </Text>
                        <Input
                            placeholder="Họ tên người mượn ký xác nhận"
                            value={borrowerSign}
                            onChange={(e) => setBorrowerSign(e.target.value)}
                            style={{ marginTop: 8, marginBottom: 8 }}
                        />
                        <Input
                            placeholder="Họ tên nhân viên / bên giao nhận ký xác nhận"
                            value={staffSign}
                            onChange={(e) => setStaffSign(e.target.value)}
                            style={{ marginBottom: 8 }}
                        />
                    </>
                )}

                <Text type="secondary" style={{ display: 'block', marginTop: 10 }}>
                    Ghi chú biên bản trả phòng:
                </Text>
                <Input.TextArea
                    rows={3}
                    value={returnConditionNote}
                    onChange={(e) => setReturnConditionNote(e.target.value)}
                    placeholder="Ví dụ: đủ phụ kiện, có trầy nhẹ…"
                    style={{ marginTop: 8, marginBottom: 8 }}
                />

                <Checkbox
                    checked={returnPrintOptIn}
                    onChange={(e) => setReturnPrintOptIn(e.target.checked)}
                    style={{ marginTop: 12, display: 'block' }}
                >
                    In / lưu biên bản trả phòng
                </Checkbox>

                <Button
                    icon={<PrinterOutlined />}
                    style={{ marginTop: 10 }}
                    disabled={!returnUsage}
                    onClick={() => {
                        if (!returnUsage) return;
                        void (async () => {
                            try {
                                // Fallback map tên người phụ trách phòng cho preview giấy.
                                let usageResolved: IAssetUsage = returnUsage;
                                if (!returnUsage.assetResponsibleName && returnUsage.assetId) {
                                    try {
                                        const assetRes = await getPublicAssetById(returnUsage.assetId);
                                        usageResolved = {
                                            ...returnUsage,
                                            assetResponsibleName: assetRes.data.data?.responsibleName ?? null,
                                        };
                                    } catch {
                                        // Không ảnh hưởng nếu không lấy được tên người phụ trách.
                                    }
                                }

                                const checkoutRes = await getClientRoomBookingCheckout(returnUsage.id);
                                const checkout = checkoutRes.data.data ?? null;
                                const previewDeviceReturn: IDeviceReturn = {
                                    id: 0,
                                    checkoutId: 0,
                                    assetUsageId: returnUsage.id,
                                    userId: returnUsage.userId,
                                    userName: returnUsage.userName ?? null,
                                    userEmail: returnUsage.userEmail ?? null,
                                    assetId: returnUsage.assetId,
                                    assetName: returnUsage.assetName ?? null,
                                    usageType: returnUsage.usageType,
                                    usageDate: returnUsage.date,
                                    startTime: returnUsage.startTime,
                                    endTime: returnUsage.endTime,
                                    receiveTime: checkout?.receiveTime ?? null,
                                    returnTime: dayjs().toISOString(),
                                    deviceStatus: returnStatus,
                                    quantityReturnedGood: returnQtyGood,
                                    quantityLost: returnQtyLost,
                                    quantityDamaged: returnQtyDamaged,
                                    createdAt: dayjs().toISOString(),
                                    createdBy: '',
                                };
                                openAssetUsagePaperPrint(usageResolved, checkout, previewDeviceReturn, { doPrint: false });
                            } catch {
                                toast.error('Không tải được biên bản để xem trước');
                            }
                        })();
                    }}
                >
                    Xem biên bản (trước khi in)
                </Button>
            </Modal>
            <Modal
                title="Báo sự cố thiết bị phòng"
                open={openIssueModal}
                onCancel={() => setOpenIssueModal(false)}
                onOk={handleCreateIssue}
                okText="Gửi báo cáo"
                cancelText="Hủy"
                confirmLoading={issueUsage != null && submittingId === issueUsage.id}
            >
                <Select
                    placeholder="Chọn thiết bị"
                    value={issueDeviceId}
                    style={{ width: '100%', marginBottom: 12 }}
                    onChange={(v) => setIssueDeviceId(v)}
                    options={issueDevices.map((d) => ({ value: d.id, label: `${d.deviceName} (${d.quantity})` }))}
                />
                <Input.TextArea
                    rows={4}
                    value={issueDesc}
                    onChange={(e) => setIssueDesc(e.target.value)}
                    placeholder="Mô tả sự cố cụ thể..."
                />
            </Modal>
        </>
    );
};

const BadgeCount = ({ count, color }: { count: number; color: string }) => (
    <span
        style={{
            background: color,
            color: '#fff',
            borderRadius: 10,
            padding: '0 6px',
            fontSize: 10,
            height: 16,
            display: 'inline-flex',
            alignItems: 'center',
        }}
    >
        {count}
    </span>
);

export default ModalRoomBookingHistory;
