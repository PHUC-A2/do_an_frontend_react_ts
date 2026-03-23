import {  Button, Checkbox, Collapse, Drawer, Empty, Input, Modal, Popconfirm, Select, Space, Spin, Tabs, Tag, Typography, type CollapseProps, type PopconfirmProps } from 'antd';
import { ClockCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, HistoryOutlined, PrinterOutlined, ToolOutlined } from '@ant-design/icons';
import dayjs from 'dayjs';
import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';
import { toast } from 'react-toastify';

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
import { ASSET_USAGE_STATUS_META } from '../../../../../utils/constants/assetUsage.constants';
import { DEVICE_CONDITION_META } from '../../../../../utils/constants/deviceReturn.constants';
import { openAssetUsagePaperPrint } from '../../../../../utils/assetUsagePaperPrint';

interface IProps {
    open: boolean;
    onClose: () => void;
}

const { Text } = Typography;

const ModalRoomBookingHistory = ({ open, onClose }: IProps) => {
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
    const [returnPrintOptIn, setReturnPrintOptIn] = useState(false);
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
        setReturnPrintOptIn(false);
        setOpenReturnModal(true);
    };

    const handleCreateReturn = async () => {
        if (!returnUsage) return;
        const usage = returnUsage;
        setSubmittingId(usage.id);
        try {
            await createClientRoomBookingReturn(usage.id, {
                deviceStatus: returnStatus,
                returnTime: dayjs().toISOString(),
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
            // Điều kiện giống luồng booking sân: chỉ cho phép xóa khỏi lịch sử khi đã kết thúc/hủy/từ chối.
            const canDelete =
                usage.status === 'COMPLETED' || usage.status === 'CANCELLED' || usage.status === 'REJECTED';
            return {
                key: usage.id,
                label: (
                    <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%' }}>
                        <Space>
                            <ClockCircleOutlined />
                            <Text strong>{usage.assetName}</Text>
                        </Space>
                        <Tag color={ASSET_USAGE_STATUS_META[usage.status].color}>
                            {ASSET_USAGE_STATUS_META[usage.status].label}
                        </Tag>
                    </div>
                ),
                children: (
                    <Space orientation="vertical" style={{ width: '100%' }}>
                        <Text>
                            Người đặt: <Text strong>{usage.userName || usage.userEmail || 'Không xác định'}</Text>
                        </Text>
                        <Text>
                            Thời gian: {usage.startTime} - {usage.endTime} ngày {dayjs(usage.date).format('DD/MM/YYYY')}
                        </Text>
                        <Text>Mục đích: {usage.subject}</Text>
                        <Text>
                            Trạng thái:{' '}
                            <Tag color={ASSET_USAGE_STATUS_META[usage.status].color}>
                                {ASSET_USAGE_STATUS_META[usage.status].label}
                            </Tag>
                        </Text>
                        <Space wrap>
                            <Button
                                size="small"
                                onClick={() => {
                                    onClose();
                                    navigate(`/rooms/${usage.assetId}`);
                                }}
                            >
                                Xem phòng
                            </Button>
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
                                    okText="Có"
                                    cancelText="Không"
                                    onCancel={cancel}
                                    okButtonProps={{ danger: true, loading: submittingId === usage.id }}
                                >
                                    <Button size="small" danger icon={<DeleteOutlined />}>
                                        Hủy
                                    </Button>
                                </Popconfirm>
                            ) : null}
                            {canDelete ? (
                                <Popconfirm
                                    title="Xóa lịch sử?"
                                    okText="Có"
                                    cancelText="Không"
                                    onCancel={cancel}
                                    placement="topLeft"
                                    okButtonProps={{ loading: deletingId === usage.id }}
                                    onConfirm={() => handleDelete(usage.id)}
                                >
                                    <Button size="small" type="text" danger icon={<DeleteOutlined />}>
                                        Xóa
                                    </Button>
                                </Popconfirm>
                            ) : null}
                            {canCheckout ? (
                                <Button
                                    size="small"
                                    loading={submittingId === usage.id}
                                    onClick={() => handleOpenCheckoutModal(usage)}
                                >
                                    Nhận phòng
                                </Button>
                            ) : null}
                            {canReturn ? (
                                <Button
                                    size="small"
                                    loading={submittingId === usage.id}
                                    onClick={() => handleOpenReturnModal(usage)}
                                >
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
                        <Space style={{ justifyContent: 'space-between', width: '100%' }}>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                Tạo: {dayjs(usage.createdAt).format('HH:mm DD/MM/YYYY')}
                            </Text>
                            <Text type="secondary" style={{ fontSize: 11 }}>
                                Cập nhật: {usage.updatedAt ? dayjs(usage.updatedAt).format('HH:mm DD/MM/YYYY') : '-'}
                            </Text>
                        </Space>
                    </Space>
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
                        <HistoryOutlined />
                        <span>Quản lý lịch đặt phòng</span>
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
                                        <BadgeCount count={upcoming.length} color="#1677ff" />
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
                                        <BadgeCount count={roomDeviceHistory.length} color="#faad14" />
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
                    onChange={(v) => setReturnStatus(v)}
                    options={[
                        { label: DEVICE_CONDITION_META.GOOD.label, value: 'GOOD' },
                        { label: DEVICE_CONDITION_META.DAMAGED.label, value: 'DAMAGED' },
                        { label: DEVICE_CONDITION_META.BROKEN.label, value: 'BROKEN' },
                        { label: DEVICE_CONDITION_META.LOST.label, value: 'LOST' },
                    ]}
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
